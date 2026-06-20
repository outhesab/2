/**
 * SOBA NEXUS AI — VoiceUndoEngine
 * Sesle "son işlemi geri al" vizyonunun çekirdeği.
 *
 * Kullanıcı sadece konuşarak son yapılan işlemi geri alabilmeli:
 *   "son satışı iptal et"     → en son satışı iptal
 *   "son gideri geri al"      → en son kasa giderini ters kayıt
 *   "son tahsilatı geri al"   → en son cari tahsilatı ters
 *   "son işlemi geri al"      → en son ne ise onu geri al
 *   "son eklenen ürünü sil"   → en son eklenen ürünü sil (gelecek)
 *
 * Tasarım:
 * - Saf fonksiyonlar (parseUndoCommand, findLastUndoableAction, buildUndoIntent)
 *   test edilebilir, yan etkisiz.
 * - AIActionLogEntry (status='applied') üzerinden son işlemi tespit eder.
 * - Undo operasyonları mevcut domain servislerini kullanır (cancelSale vb.).
 * - Geri alma da confirmation gateway'den geçer (write aksiyon).
 */

import type { DB, AIActionLogEntry } from "@/types";
import type { Intent } from "@/domain/types";
import { logger } from "@/lib/logger";

// ── Undo komut tipleri ───────────────────────────────────────────────────────

export type UndoTargetType = "sale" | "kasa_gelir" | "kasa_gider" | "cari_tahsilat" | "any" | "unknown";

export interface UndoCommand {
  target: UndoTargetType;
  ack: string;
}

/**
 * Sesli metni UndoCommand'a çevirir.
 * "son satışı iptal et", "son gideri geri al", "son işlemi geri al" vb.
 */
export function parseUndoCommand(text: string): UndoCommand | null {
  const q = text.toLocaleLowerCase("tr-TR").trim();

  // "geri al" / "iptal et" / "geri alalım" / "iade et" içermeli
  const undoVerbs = ["geri al", "geri alalım", "geri alalim", "iptal et", "iptal ettim", "iade et", "sil geri", "geri sil"];
  const hasUndoVerb = undoVerbs.some((v) => q.includes(v));
  if (!hasUndoVerb) return null;

  // "son" kelimesi olmalı (geçmişteki belirli bir işlem)
  if (!q.includes("son")) return null;

  // Hangi hedef?
  if (q.includes("satış") || q.includes("satis")) {
    return { target: "sale", ack: "Son satışı iptal etmek için onaylayın." };
  }
  if (q.includes("gider")) {
    return { target: "kasa_gider", ack: "Son gideri geri almak için onaylayın." };
  }
  if (q.includes("gelir")) {
    return { target: "kasa_gelir", ack: "Son geliri geri almak için onaylayın." };
  }
  if (q.includes("tahsilat")) {
    return { target: "cari_tahsilat", ack: "Son tahsilatı geri almak için onaylayın." };
  }
  if (q.includes("işlem") || q.includes("islem") || q.includes("yaptığım")) {
    return { target: "any", ack: "Son işlemi geri almak için onaylayın." };
  }

  // "son ... geri al" ama hedef belirsiz
  return { target: "unknown", ack: "Hangi işlemi geri almak istiyorsunuz? Satış, gider, gelir veya tahsilat?" };
}

// ── Son undoable işlemi bul ──────────────────────────────────────────────────

/**
 * AIActionLog'da status='applied' olan en son kaydı bulur.
 * undoableActionTypes içindeki actionType'ları filtreler.
 *
 * AIActionLog boşsa veya hiç applied undoable kayıt yoksa null döner.
 */
export function findLastUndoableAction(
  db: DB,
  filter?: UndoTargetType,
): AIActionLogEntry | null {
  const log = db.aiActionLog || [];

  // Undo edilebilir actionType'lar (write, tersi mümkün)
  const undoableActionTypes: Record<string, UndoTargetType> = {
    sale: "sale",
    satis: "sale",
    yeniSatis: "sale",
    kasa_gelir: "kasa_gelir",
    kasa_gider: "kasa_gider",
    cari_tahsilat: "cari_tahsilat",
  };

  // Filter'a göre undoable set
  const allowedTypes = filter && filter !== "any" && filter !== "unknown"
    ? new Set(Object.entries(undoableActionTypes).filter(([, t]) => t === filter).map(([k]) => k))
    : new Set(Object.keys(undoableActionTypes));

  const applied = log
    .filter((e) => e.status === "applied" && allowedTypes.has(e.actionType))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return applied[0] ?? null;
}

// ── Undo Intent üret ─────────────────────────────────────────────────────────

export interface UndoIntentResult {
  ok: boolean;
  intent?: Intent;
  /** Hangi kayıt geri alınacak (bilgi için) */
  targetDescription?: string;
  error?: string;
}

/**
 * Bir AIActionLogEntry için undo Intent'i üretir.
 *
 * - sale/satis/yeniSatis → sale_iptal (affectedIds[0] = saleId)
 * - kasa_gelir → kasa_gider (ters tutar kayıt) — şimdilik not supported, logs-based
 * - kasa_gider → kasa_gelir (ters tutar kayıt)
 * - cari_tahsilat → kasa_gider (ters)
 *
 * Not: Kasa/cari undo için mevcut log entry'de orijinal payload yoksa,
 * DB'den KasaEntry/Cari kaydını bulup ters işlem yapmak gerekir.
 * Bu sürümde sale undo tam desteklenir; kasa/cari "not implemented" döner
 * (ileride domain servislerle genişletilecek).
 */
export function buildUndoIntent(db: DB, logEntry: AIActionLogEntry): UndoIntentResult {
  const actionType = logEntry.actionType;

  if (actionType === "sale" || actionType === "satis" || actionType === "yeniSatis") {
    const saleId = logEntry.affectedIds?.[0];
    if (!saleId) {
      return { ok: false, error: "Geri alınacak satış ID'si log kaydında yok." };
    }
    // Satış DB'de mevcut mu?
    const sale = db.sales.find((s) => s.id === saleId && !s.deleted);
    if (!sale) {
      return { ok: false, error: `${saleId} numaralı satış bulunamadı (zaten silinmiş olabilir).` };
    }
    if (sale.status === "iptal" || sale.status === "iade") {
      return { ok: false, error: "Bu satış zaten iptal edilmiş veya iade edilmiş." };
    }
    return {
      ok: true,
      intent: { type: "sale_iptal", payload: { saleId } },
      targetDescription: `${sale.productName} — ${sale.total.toLocaleString("tr-TR")} TL (${new Date(sale.createdAt).toLocaleDateString("tr-TR")})`,
    };
  }

  if (actionType === "kasa_gelir" || actionType === "kasa_gider") {
    // affectedIds[0] genelde kasa entry ID → DB'de bul, ters kayıt Intent üret
    const kasaId = logEntry.affectedIds?.[0];
    if (!kasaId) {
      return { ok: false, error: "Geri alınacak kasa kaydı ID'si logda yok." };
    }
    const entry = db.kasa.find((k) => k.id === kasaId && !k.deleted);
    if (!entry) {
      return { ok: false, error: "Kasa kaydı bulunamadı (zaten silinmiş olabilir)." };
    }
    // Ters kayıt: gelir→gider, gider→gelir
    const tersType = entry.type === "gelir" ? "kasa_gider" : "kasa_gelir";
    const intent: Intent = {
      type: tersType as "kasa_gelir" | "kasa_gider",
      payload: {
        amount: entry.amount,
        kasa: entry.kasa,
        description: `Geri alma: ${entry.description || logEntry.label}`,
        category: entry.category,
      },
    };
    return {
      ok: true,
      intent,
      targetDescription: `${entry.type === "gelir" ? "Gelir" : "Gider"}: ${entry.amount.toLocaleString("tr-TR")} TL — ${entry.description || ""}`,
    };
  }

  if (actionType === "cari_tahsilat") {
    // Tahsilat → cari bakiyeyi geri artır + kasa gider (ters)
    // Mevcut domain servislerde cari_tahsilat_undo yok — not implemented
    return {
      ok: false,
      error: "Cari tahsilat geri alma henüz desteklenmiyor. İleride eklenecek.",
    };
  }

  return { ok: false, error: `"${actionType}" işlemi geri alınamaz (undo desteklenmiyor).` };
}

// ── Ana API: Komut → Undo Intent ─────────────────────────────────────────────

/**
 * Tam undo pipeline: parse + find + build.
 * Caller (NexusExecutive) sonucu confirmation gateway'e gönderir.
 */
export function resolveUndo(text: string, db: DB): UndoIntentResult & {
  command?: UndoCommand;
  logEntry?: AIActionLogEntry;
} {
  const command = parseUndoCommand(text);
  if (!command) {
    return { ok: false, error: "Geri alma komutu anlaşılamadı." };
  }

  if (command.target === "unknown") {
    return { ok: false, error: command.ack, command };
  }

  const logEntry = findLastUndoableAction(db, command.target);
  if (!logEntry) {
    const targetLabel = command.target === "any" ? "işlem" : command.target;
    return {
      ok: false,
      error: `Geri alınacak ${targetLabel} kaydı bulunamadı.`,
      command,
    };
  }

  const result = buildUndoIntent(db, logEntry);
  if (!result.ok) {
    return { ...result, command, logEntry };
  }

  logger.info("ai", "Undo resolved", { actionType: logEntry.actionType, target: command.target });
  return { ...result, command, logEntry };
}
