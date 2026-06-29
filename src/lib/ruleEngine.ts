/**
 * PARSPEL — Rule Engine
 * save() çağrısından önce finansal kuralları senkron olarak değerlendirir.
 * İhlal durumunda işlemi engeller (severity: 'block') veya uyarır (severity: 'warn').
 *
 * BFCE ruleRunner pattern'inden uyarlanmıştır.
 * Cloud Functions gerektirmez — tamamen client-side çalışır.
 */

import { logger } from '@/lib/logger';
import type { DB, KasaEntry, RuleViolation } from '@/types';

/** Maksimum tek işlem tutarı (BFCE TRANSACTION_LIMIT uyarlaması — TRY için ölçeklendirildi) */
export const TRANSACTION_LIMIT = 100_000;

/** Mükerrer işlem kontrolü için zaman penceresi (ms) */
const DUPLICATE_WINDOW_MS = 60_000;

/** validateTransaction için maksimum çalışma süresi (ms) */
const RULE_TIMEOUT_MS = 50;

// ─── Kural Arayüzü ────────────────────────────────────────────────────────────

interface Rule {
  id: string;
  name: string;
  severity: 'block' | 'warn';
  evaluate: (prevDB: DB, nextDB: DB) => RuleViolation[];
}

// ─── Yardımcılar ───────────────────────────────────────────────────────────────

function computeSingleKasaBalance(entries: KasaEntry[], kasaId: string): number {
  let balance = 0;
  for (const e of entries) {
    if (e.deleted || e.kasa !== kasaId) continue;
    balance += e.type === 'gelir' ? e.amount : -e.amount;
  }
  return balance;
}

// ─── Kurallar ─────────────────────────────────────────────────────────────────

/**
 * Kural 1: Negatif Stok
 * Herhangi bir ürünün stock değeri 0'ın altına düşecekse engelle.
 */
const negativeStockRule: Rule = {
  id: 'negative_stock',
  name: 'Negatif Stok',
  severity: 'block',
  evaluate: (prevDB: DB, nextDB: DB): RuleViolation[] => {
    const violations: RuleViolation[] = [];
    for (const p of nextDB.products) {
      if (!p.deleted && p.stock < 0) {
        // Eğer prevDB'de zaten negatifse bu kuralı tetikleme (mevcut hataları görmezden gel, yeni hata yaratma)
        const prevP = prevDB.products.find((x) => x.id === p.id);
        if (prevP && prevP.stock < 0) continue;

        violations.push({
          ruleId: 'negative_stock',
          ruleName: 'Negatif Stok',
          message: `"${p.name}" stoğu negatife düştü (${p.stock}). İşlem engellendi.`,
          severity: 'block',
          relatedIds: [p.id],
        });
      }
    }
    return violations;
  },
};

/**
 * Kural 2: Negatif Kasa Bakiyesi
 * Herhangi bir kasanın hesaplanan bakiyesi 0'ın altına düşecekse engelle.
 */
const negativeKasaRule: Rule = {
  id: 'negative_kasa',
  name: 'Negatif Kasa Bakiyesi',
  severity: 'block',
  evaluate: (prevDB: DB, nextDB: DB): RuleViolation[] => {
    const violations: RuleViolation[] = [];

    // Sadece bu işlemle değişen kasaları tespit et
    const prevKasaIds = new Set(prevDB.kasa.map((k) => k.id));
    const affectedKasaIds = new Set<string>();

    for (const k of nextDB.kasa) {
      if (!prevKasaIds.has(k.id) && !k.deleted) {
        affectedKasaIds.add(k.kasa);
      }
    }

    for (const kasaId of affectedKasaIds) {
      const balance = computeSingleKasaBalance(nextDB.kasa, kasaId);
      if (balance < -0.001) {
        violations.push({
          ruleId: 'negative_kasa',
          ruleName: 'Negatif Kasa Bakiyesi',
          message: `"${kasaId}" kasası negatife düştü (${balance.toFixed(2)} ₺). İşlem engellendi.`,
          severity: 'block',
          relatedIds: [kasaId],
        });
      }
    }
    return violations;
  },
};

/**
 * Kural 3: Mükerrer İşlem
 * Aynı cariId + amount + kasa kombinasyonu son 60 saniyede mevcutsa uyar.
 * (severity: 'warn' — işlemi engellemez, sadece uyarır)
 */
const duplicateTransactionRule: Rule = {
  id: 'duplicate_transaction',
  name: 'Mükerrer İşlem',
  severity: 'warn',
  evaluate: (prevDB: DB, nextDB: DB): RuleViolation[] => {
    const violations: RuleViolation[] = [];
    const now = Date.now();
    const windowStart = now - DUPLICATE_WINDOW_MS;

    const prevIds = new Set(prevDB.kasa.map((k) => k.id));
    const newEntries = nextDB.kasa.filter((k) => !prevIds.has(k.id) && !k.deleted);

    for (const newEntry of newEntries) {
      if (!newEntry.cariId || !newEntry.amount) continue;

      const duplicate = prevDB.kasa.find(
        (k) =>
          !k.deleted &&
          k.cariId === newEntry.cariId &&
          k.amount === newEntry.amount &&
          k.kasa === newEntry.kasa &&
          new Date(k.createdAt).getTime() > windowStart,
      );

      if (duplicate) {
        violations.push({
          ruleId: 'duplicate_transaction',
          ruleName: 'Mükerrer İşlem',
          message: `Son 60 saniyede aynı cari (${newEntry.cariId}), tutar (${newEntry.amount} ₺) ve kasa (${newEntry.kasa}) kombinasyonu zaten kaydedildi. Mükerrer işlem olabilir.`,
          severity: 'warn',
          relatedIds: [duplicate.id, newEntry.id],
        });
      }
    }
    return violations;
  },
};

/**
 * Kural 4: Sıfır veya Negatif Tutar
 * KasaEntry.amount <= 0 veya Sale.total <= 0 olan işlemleri engelle.
 */
const zeroAmountRule: Rule = {
  id: 'zero_amount',
  name: 'Sıfır veya Negatif Tutar',
  severity: 'block',
  evaluate: (prevDB: DB, nextDB: DB): RuleViolation[] => {
    const violations: RuleViolation[] = [];
    const prevKasaIds = new Set(prevDB.kasa.map((k) => k.id));
    const prevSaleIds = new Set(prevDB.sales.map((s) => s.id));

    for (const k of nextDB.kasa) {
      if (!prevKasaIds.has(k.id) && !k.deleted && k.amount <= 0) {
        violations.push({
          ruleId: 'zero_amount',
          ruleName: 'Sıfır veya Negatif Tutar',
          message: `Kasa kaydı geçersiz tutar içeriyor (${k.amount} ₺). Tutar 0'dan büyük olmalıdır.`,
          severity: 'block',
          relatedIds: [k.id],
        });
      }
    }

    for (const s of nextDB.sales) {
      if (!prevSaleIds.has(s.id) && !s.deleted && s.total <= 0) {
        violations.push({
          ruleId: 'zero_amount',
          ruleName: 'Sıfır veya Negatif Tutar',
          message: `Satış kaydı geçersiz toplam içeriyor (${s.total} ₺). Toplam 0'dan büyük olmalıdır.`,
          severity: 'block',
          relatedIds: [s.id],
        });
      }
    }
    return violations;
  },
};

/**
 * Kural 5: Minimum Stok
 * Stok minStock değerinin altına düştüğünde uyarı verir (severity: warn).
 */
const minStockRule: Rule = {
  id: 'min_stock',
  name: 'Minimum Stok',
  severity: 'warn',
  evaluate: (_prevDB: DB, nextDB: DB): RuleViolation[] => {
    const violations: RuleViolation[] = [];
    for (const p of nextDB.products) {
      if (!p.deleted && p.minStock > 0 && p.stock > 0 && p.stock <= p.minStock) {
        violations.push({
          ruleId: 'min_stock',
          ruleName: 'Minimum Stok',
          message: `"${p.name}" stoğu minimum seviyenin altında (${p.stock}/${p.minStock}).`,
          severity: 'warn',
          relatedIds: [p.id],
        });
      }
    }
    return violations;
  },
};

export const rules: Rule[] = [
  negativeStockRule,
  negativeKasaRule,
  duplicateTransactionRule,
  zeroAmountRule,
  minStockRule,
];

export function validateTransaction(prevDB: DB, nextDB: DB): RuleViolation[] {
  const startTime = performance.now();

  try {
    const allViolations: RuleViolation[] = [];

    for (const rule of rules) {
      if (performance.now() - startTime > RULE_TIMEOUT_MS) {
        logger.warn('ruleEngine', `Kural değerlendirmesi ${RULE_TIMEOUT_MS}ms sınırını aştı — kalan kurallar atlandı`, {
          completedRules: allViolations.length,
          remainingRules: rules.length,
        });
        break;
      }

      try {
        const violations = rule.evaluate(prevDB, nextDB);
        allViolations.push(...violations);
      } catch (ruleError) {
        logger.warn('ruleEngine', `Kural "${rule.id}" değerlendirme hatası — atlandı`, {
          error: String(ruleError),
        });
      }
    }

    return allViolations;
  } catch (e) {
    logger.warn('ruleEngine', 'validateTransaction beklenmedik hata — kural değerlendirmesi atlandı', {
      error: String(e),
    });
    return [];
  }
}
