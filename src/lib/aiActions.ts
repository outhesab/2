import type { DB } from '@/types';
import { formatMoney, genId } from '@/lib/utils-tr';

export type SaveFn = (updater: (prev: DB) => DB) => void;

// ---------------------------------------------------------------------------
// DB İşlem Tipleri
// ---------------------------------------------------------------------------

export interface DBAction {
  type: 'sale' | 'kasa_gelir' | 'kasa_gider' | 'stok_guncelle' | 'cari_tahsilat' | 'urun_ekle' | 'cari_ekle';
  label: string; // kullanıcıya gösterilecek özet
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AI yanıtından ACTION bloğunu parse et
// ---------------------------------------------------------------------------

export function parseActions(text: string): DBAction[] {
  const actions: DBAction[] = [];
  const regex = /```action\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj.type && obj.label) actions.push(obj as DBAction);
    } catch {
      console.warn('aiActions', 'parseActions: malformed action block ignored');
    }
  }
  return actions;
}

// ---------------------------------------------------------------------------
// AI yanıtından ACTION bloklarını temizle (chat'te gösterme)
// ---------------------------------------------------------------------------

export function stripActions(text: string): string {
  return text.replace(/```action\n[\s\S]*?```/g, '').trim();
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

function hasDuplicate(items: Array<{ name: string; deleted?: boolean }>, name: string): boolean {
  return items.some((x) => !x.deleted && x.name.toLowerCase() === name.toLowerCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findBySimpleRef(items: any[], idKey: string, nameKey: string, payload: Record<string, unknown>) {
  const idRef = String(payload[idKey] || '').trim();
  const nameRef = String(payload[nameKey] || '').trim();
  if (idRef) {
    const byId = items.find((x: { id: string }) => x.id === idRef);
    if (byId) return byId;
  }
  if (nameRef) return items.find((x: { name: string }) => x.name === nameRef);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findProduct(products: any[], payload: Record<string, unknown>) {
  return findBySimpleRef(products, 'productId', 'productName', payload);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findCari(cari: any[], payload: Record<string, unknown>) {
  return findBySimpleRef(cari, 'cariId', 'cariName', payload);
}

// ---------------------------------------------------------------------------
// Validasyon — işlemin DB'ye uygulanabilir olup olmadığını kontrol eder
// ---------------------------------------------------------------------------

export function validateAction(prev: DB, action: DBAction): string | null {
  const p = action.payload;

  if (action.type === 'sale') {
    const product = findProduct(prev.products, p);
    if (!product) return `Ürün bulunamadı: ${String(p.productName || p.productId || '')}`;
    const qty = Number(p.quantity);
    const unitPrice = Number(p.unitPrice);
    if (!Number.isFinite(qty) || qty <= 0) return 'Satış miktarı 0 dan büyük olmalı';
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return 'Birim fiyat negatif olamaz';
    if (qty > product.stock) return `${product.name} için yetersiz stok (${product.stock})`;
    return null;
  }

  if (action.type === 'kasa_gelir' || action.type === 'kasa_gider') {
    const amount = Number(p.amount);
    if (!Number.isFinite(amount) || amount <= 0) return 'Kasa tutarı 0 dan büyük olmalı';
    return null;
  }

  if (action.type === 'stok_guncelle') {
    const product = findProduct(prev.products, p);
    if (!product) return `Ürün bulunamadı: ${String(p.productName || p.productId || '')}`;
    const stock = Number(p.stock);
    if (!Number.isFinite(stock) || stock < 0) return 'Yeni stok negatif olamaz';
    return null;
  }

  if (action.type === 'cari_tahsilat') {
    const cari = findCari(prev.cari, p);
    if (!cari) return `Cari bulunamadı: ${String(p.cariName || p.cariId || '')}`;
    const amount = Number(p.amount);
    if (!Number.isFinite(amount) || amount <= 0) return 'Tahsilat tutarı 0 dan büyük olmalı';
    if (amount > cari.balance) return `Tahsilat müşteri bakiyesini aşıyor (${formatMoney(cari.balance)})`;
    return null;
  }

  if (action.type === 'urun_ekle') {
    const name = String(p.name || '').trim();
    if (!name) return 'Ürün adı zorunlu';
    if (hasDuplicate(prev.products, name)) return `Aynı isimde ürün zaten var: ${name}`;
    const cost = Number(p.cost);
    const price = Number(p.price);
    const stock = Number(p.stock);
    if (Number.isFinite(cost) && cost < 0) return 'Alış fiyatı negatif olamaz';
    if (Number.isFinite(price) && price < 0) return 'Satış fiyatı negatif olamaz';
    if (Number.isFinite(stock) && stock < 0) return 'Stok negatif olamaz';
    return null;
  }

  if (action.type === 'cari_ekle') {
    const name = String(p.name || '').trim();
    if (!name) return 'Cari adı zorunlu';
    if (hasDuplicate(prev.cari, name)) return `Aynı isimde cari zaten var: ${name}`;
    const balance = Number(p.balance);
    if (Number.isFinite(balance) && balance < 0) return 'Başlangıç bakiyesi negatif olamaz';
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Referans çözümleyiciler — payload'daki ürün/cari referanslarını DB'de bul
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findByRef(items: any[], idKey: string, nameKey: string, payload: Record<string, unknown>) {
  const idRef = String(payload[idKey] || '').trim();
  const nameRef = String(payload[nameKey] || '').trim();
  if (idRef) {
    const byId = items.find((x) => !x.deleted && x.id === idRef);
    if (byId) return byId;
  }
  if (nameRef) {
    const lowered = nameRef.toLowerCase();
    const exact = items.find((x) => !x.deleted && x.name.toLowerCase() === lowered);
    if (exact) return exact;
    const candidates = items.filter((x) => !x.deleted && x.name.toLowerCase().includes(lowered));
    if (candidates.length === 1) return candidates[0];
  }
  return null;
}

export function findProductByRef(db: DB, payload: Record<string, unknown>) {
  return findByRef(db.products, 'productId', 'productName', payload);
}

export function findCariByRef(db: DB, payload: Record<string, unknown>) {
  return findByRef(db.cari, 'cariId', 'cariName', payload);
}

// ---------------------------------------------------------------------------
// Fallback — validasyon hatası durumunda alternatif aksiyonlar üret
// ---------------------------------------------------------------------------

export function buildFallbackActions(prev: DB, action: DBAction, reason: string): DBAction[] {
  const p = action.payload;

  if (action.type === 'sale') {
    const product = findProductByRef(prev, p);
    if (!product) return [];
    const qty = Number(p.quantity);
    const unitPrice = Number(p.unitPrice);
    const candidates: DBAction[] = [];

    if (String(p.productId || '') !== product.id) {
      candidates.push({
        ...action,
        label: `${action.label} (fallback: ürün eşleştirildi)`,
        payload: { ...p, productId: product.id, productName: product.name },
      });
    }

    if ((reason.includes('yetersiz stok') || (Number.isFinite(qty) && qty > product.stock)) && product.stock > 0) {
      candidates.push({
        ...action,
        label: `${action.label} (fallback: stok kadar)`,
        payload: {
          ...p,
          productId: product.id,
          productName: product.name,
          quantity: product.stock,
        },
      });
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      candidates.push({
        ...action,
        label: `${action.label} (fallback: miktar=1)`,
        payload: {
          ...p,
          productId: product.id,
          productName: product.name,
          quantity: Math.min(Math.max(1, product.stock), 1),
        },
      });
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      candidates.push({
        ...action,
        label: `${action.label} (fallback: birim fiyat düzeltildi)`,
        payload: {
          ...p,
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
        },
      });
    }
    return candidates;
  }

  if (action.type === 'stok_guncelle') {
    const product = findProductByRef(prev, p);
    if (!product) return [];
    const stock = Number(p.stock);
    return [
      {
        ...action,
        label: `${action.label} (fallback: ürün/stok düzeltildi)`,
        payload: {
          ...p,
          productId: product.id,
          productName: product.name,
          stock: Number.isFinite(stock) ? Math.max(0, stock) : product.stock,
        },
      },
    ];
  }

  if (action.type === 'cari_tahsilat') {
    const cari = findCariByRef(prev, p);
    if (!cari) return [];
    const amount = Number(p.amount);
    if (cari.balance <= 0) return [];
    const safeAmount =
      !Number.isFinite(amount) || amount <= 0 ? Math.min(1, cari.balance) : Math.min(amount, cari.balance);
    return [
      {
        ...action,
        label: `${action.label} (fallback: cari/tutar düzeltildi)`,
        payload: {
          ...p,
          cariId: cari.id,
          cariName: cari.name,
          amount: safeAmount,
        },
      },
    ];
  }

  if (action.type === 'kasa_gelir' || action.type === 'kasa_gider') {
    const amount = Number(p.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return [
        {
          ...action,
          label: `${action.label} (fallback: tutar düzeltildi)`,
          payload: { ...p, amount: Math.abs(amount) || 1 },
        },
      ];
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// ActionAttemptResult — uygulama sonucu
// ---------------------------------------------------------------------------

export type ActionAttemptResult = {
  next: DB;
  applied: boolean;
  appliedAction?: DBAction;
  notes: string[];
};

// ---------------------------------------------------------------------------
// applyActionWithFallback — validasyon + fallback döngüsü ile işlem uygula
// ---------------------------------------------------------------------------

export function applyActionWithFallback(prev: DB, action: DBAction): ActionAttemptResult {
  const queue: DBAction[] = [action];
  const seen = new Set<string>();
  const notes: string[] = [];

  while (queue.length > 0 && seen.size < 12) {
    const candidate = queue.shift()!;
    const key = JSON.stringify({
      type: candidate.type,
      payload: candidate.payload,
    });
    if (seen.has(key)) continue;
    seen.add(key);

    const violation = validateAction(prev, candidate);
    if (violation) {
      notes.push(`${candidate.label}: ${violation}`);
      const fallbacks = buildFallbackActions(prev, candidate, violation);
      for (const alt of fallbacks) queue.push(alt);
      continue;
    }

    try {
      const next = applyAction(prev, candidate);
      if (candidate !== action) {
        notes.push(`Fallback uygulandı: ${candidate.label}`);
      }
      return { next, applied: true, appliedAction: candidate, notes };
    } catch (err) {
      const reason = String(err instanceof Error ? err.message : 'İşlem hatası');
      notes.push(`${candidate.label}: ${reason}`);
      const fallbacks = buildFallbackActions(prev, candidate, reason);
      for (const alt of fallbacks) queue.push(alt);
    }
  }

  return { next: prev, applied: false, notes };
}

// ---------------------------------------------------------------------------
// applyAction — DB'ye işlemi uygula (mutasyon)
// ---------------------------------------------------------------------------

export function applyAction(prev: DB, action: DBAction): DB {
  const now = new Date().toISOString();
  const p = action.payload;

  if (action.type === 'sale') {
    const product = findProduct(prev.products, p);
    if (!product) throw new Error(`Ürün bulunamadı: ${p.productName}`);
    const qty = Number(p.quantity) || 1;
    const unitPrice = Number(p.unitPrice) || product.price;
    const discount = Number(p.discount) || 0;
    const total = unitPrice * qty - discount;
    const profit = (unitPrice - product.cost) * qty - discount;
    const payment = (p.payment as string) || 'nakit';
    const cari = findCari(prev.cari, p);

    const sale = {
      id: genId(),
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      cariId: cari?.id,
      cariName: cari?.name,
      quantity: qty,
      unitPrice,
      cost: product.cost,
      discount,
      discountAmount: discount,
      subtotal: unitPrice * qty,
      total,
      profit,
      payment,
      status: 'tamamlandi' as const,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice,
          cost: product.cost,
          total,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const kasaEntry =
      payment !== 'cari'
        ? {
            id: genId(),
            type: 'gelir' as const,
            category: 'satis',
            amount: total,
            kasa: payment === 'nakit' ? 'nakit' : payment === 'pos' ? 'pos' : 'banka',
            description: `AI Satış: ${product.name} x${qty}`,
            relatedId: sale.id,
            createdAt: now,
            updatedAt: now,
          }
        : null;

    const stockMovement = {
      id: genId(),
      productId: product.id,
      productName: product.name,
      type: 'satis' as const,
      amount: -qty,
      before: product.stock,
      after: product.stock - qty,
      note: 'AI Asistan',
      date: now,
    };

    let updatedCari = prev.cari;
    if (payment === 'cari' && cari) {
      updatedCari = prev.cari.map((c) =>
        c.id === cari.id
          ? {
              ...c,
              balance: c.balance + total,
              lastTransaction: now,
              updatedAt: now,
            }
          : c,
      );
    }

    return {
      ...prev,
      sales: [...prev.sales, sale],
      products: prev.products.map((pr) =>
        pr.id === product.id ? { ...pr, stock: pr.stock - qty, updatedAt: now } : pr,
      ),
      kasa: kasaEntry ? [...prev.kasa, kasaEntry] : prev.kasa,
      stockMovements: [...(prev.stockMovements || []), stockMovement],
      cari: updatedCari,
    };
  }

  if (action.type === 'kasa_gelir' || action.type === 'kasa_gider') {
    const entry = {
      id: genId(),
      type: action.type === 'kasa_gelir' ? ('gelir' as const) : ('gider' as const),
      category: (p.category as string) || (action.type === 'kasa_gelir' ? 'diger_gelir' : 'diger_gider'),
      amount: Number(p.amount),
      kasa: (p.kasa as string) || 'nakit',
      description: (p.description as string) || '',
      createdAt: now,
      updatedAt: now,
    };
    return { ...prev, kasa: [...prev.kasa, entry] };
  }

  if (action.type === 'stok_guncelle') {
    const product = findProduct(prev.products, p);
    if (!product) throw new Error(`Ürün bulunamadı: ${p.productName}`);
    const newStock = Number(p.stock);
    const movement = {
      id: genId(),
      productId: product.id,
      productName: product.name,
      type: 'duzeltme' as const,
      amount: newStock - product.stock,
      before: product.stock,
      after: newStock,
      note: (p.note as string) || 'AI Asistan düzeltme',
      date: now,
    };
    return {
      ...prev,
      products: prev.products.map((pr) => (pr.id === product.id ? { ...pr, stock: newStock, updatedAt: now } : pr)),
      stockMovements: [...(prev.stockMovements || []), movement],
    };
  }

  if (action.type === 'cari_tahsilat') {
    const cari = findCari(prev.cari, p);
    if (!cari) throw new Error(`Cari bulunamadı: ${p.cariName}`);
    const amount = Number(p.amount);
    const kasaEntry = {
      id: genId(),
      type: 'gelir' as const,
      category: 'tahsilat',
      amount,
      kasa: (p.kasa as string) || 'nakit',
      description: `Tahsilat: ${cari.name}`,
      cariId: cari.id,
      createdAt: now,
      updatedAt: now,
    };
    return {
      ...prev,
      kasa: [...prev.kasa, kasaEntry],
      cari: prev.cari.map((c) =>
        c.id === cari.id
          ? {
              ...c,
              balance: c.balance - amount,
              lastTransaction: now,
              updatedAt: now,
            }
          : c,
      ),
    };
  }

  if (action.type === 'urun_ekle') {
    const name = String(p.name || '').trim();
    if (!name) throw new Error('Ürün adı zorunlu');
    if (hasDuplicate(prev.products, name)) throw new Error(`Aynı isimde ürün zaten var: ${name}`);
    const product = {
      id: genId(),
      name,
      category: String(p.category || 'soba'),
      brand: String(p.brand || ''),
      cost: Number(p.cost) || 0,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      minStock: Number(p.minStock) || 5,
      createdAt: now,
      updatedAt: now,
    };
    return { ...prev, products: [...prev.products, product] };
  }

  if (action.type === 'cari_ekle') {
    const name = String(p.name || '').trim();
    if (!name) throw new Error('Cari adı zorunlu');
    if (hasDuplicate(prev.cari, name)) throw new Error(`Aynı isimde cari zaten var: ${name}`);
    const cari = {
      id: genId(),
      name,
      type: (p.type === 'tedarikci' ? 'tedarikci' : 'musteri') as 'musteri' | 'tedarikci',
      taxNo: String(p.taxNo || ''),
      phone: String(p.phone || ''),
      email: String(p.email || ''),
      address: String(p.address || ''),
      balance: Number(p.balance) || 0,
      createdAt: now,
      updatedAt: now,
    };
    return { ...prev, cari: [...prev.cari, cari] };
  }

  return prev;
}
