import { applyIntentResult } from '@/hooks/db/dbHelpers';
import type { DB } from '@/types';
import { processIntent } from '@/domain/intentEngine';
import type { Intent } from '@/domain/types';

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
 
function findBySimpleRef(items: Array<{ id: string; name: string; deleted?: boolean }>, idKey: string, nameKey: string, payload: Record<string, unknown>) {
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
  return findBySimpleRef(db.products, 'productId', 'productName', payload);
}
 
export function findCariByRef(db: DB, payload: Record<string, unknown>) {
  return findBySimpleRef(db.cari, 'cariId', 'cariName', payload);
}
 
// ---------------------------------------------------------------------------
// Validasyon — işlemin DB'ye uygulanabilir olup olmadığını kontrol eder
// ---------------------------------------------------------------------------
 
export function validateAction(prev: DB, action: DBAction): string | null {
  const intent = mapActionToIntent(action);
  if (!intent) return `Desteklenmeyen aksiyon tipi: ${action.type}`;
  
  const result = processIntent(intent, prev);
  if (!result.ok) return result.error || 'İşlem doğrulanamadı';
  
  return null;
}
 
function mapActionToIntent(action: DBAction): Intent | null {
  const p = action.payload;
  switch (action.type) {
    case 'sale':
      return {
        type: 'sale',
        payload: {
          items: (p.items as Array<{ productId: string; productName: string; quantity: number; unitPrice: number; cost: number; total: number }>) || [],
          payment: (p.payment as "nakit" | "kart" | "havale" | "cari") || 'nakit',
          cariId: (p.cariId as string) || undefined,
          customerName: (p.customerName as string) || undefined,
          discount: (p.discount as number) || 0,
          discountAmount: (p.discountAmount as number) || 0,
          tahsilat: (p.tahsilat as number) || 0,
          saleDate: (p.saleDate as string) || undefined,
        }
      };
    case 'kasa_gelir':
    case 'kasa_gider':
      return {
        type: action.type as 'kasa_gelir' | 'kasa_gider',
        payload: {
          amount: (p.amount as number) || 0,
          kasa: (p.kasa as string) || 'nakit',
          description: (p.description as string) || '',
          category: (p.category as string) || 'diger',
        }
      };
    case 'stok_guncelle':
      return {
        type: 'stok_guncelle',
        payload: {
          productId: (p.productId as string) || '',
          amount: (p.amount as number) || 0,
          type: (p.type as 'giris' | 'cikis') || 'cikis',
          description: (p.label as string) || '',
        }
      };
    case 'urun_ekle':
      return {
        type: 'urun_ekle',
        payload: {
          productName: (p.name as string) || '',
          category: (p.category as string) || 'Genel',
          initialStock: (p.stock as number) || 0,
          unitPrice: (p.price as number) || 0,
        }
      };
    case 'cari_tahsilat':
      return {
        type: 'cari_tahsilat',
        payload: {
          cariId: (p.cariId as string) || '',
          amount: (p.amount as number) || 0,
          kasa: (p.kasa as string) || 'nakit',
        }
      };
    case 'cari_ekle':
      return {
        type: 'cari_ekle',
        payload: {
          name: (p.name as string) || '',
          taxNumber: (p.taxNumber as string) || '',
          email: (p.email as string) || '',
          phone: (p.phone as string) || '',
          address: (p.address as string) || '',
        }
      };
    default:
      return null;
  }
}
 
// ---------------------------------------------------------------------------
// Fallback — validasyon hatası durumunda alternatif aksiyonlar üret
// ---------------------------------------------------------------------------
 
export function buildFallbackActions(prev: DB, action: DBAction, reason: string): DBAction[] {
  const p = action.payload;
  const candidates: DBAction[] = [];
 
  if (action.type === 'sale') {
    const product = findProductByRef(prev, p);
    if (!product) return [];
    const qty = Number(p.quantity);
    const unitPrice = Number(p.unitPrice);
 
    if (String(p.productId || '').trim() !== product.id) {
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
  }
 
  if (action.type === 'stok_guncelle') {
    const product = findProductByRef(prev, p);
    if (!product) return [];
    const stock = Number(p.stock);
    candidates.push({
      ...action,
      label: `${action.label} (fallback: ürün/stok düzeltildi)`,
      payload: {
        ...p,
        productId: product.id,
        productName: product.name,
        stock: Number.isFinite(stock) ? Math.max(0, stock) : product.stock,
      },
    });
  }
 
  if (action.type === 'cari_tahsilat') {
    const cari = findCariByRef(prev, p);
    if (!cari) return [];
    const amount = Number(p.amount);
    if (cari.balance <= 0) return [];
    const safeAmount =
      !Number.isFinite(amount) || amount <= 0 ? Math.min(1, cari.balance) : Math.min(amount, cari.balance);
    candidates.push({
      ...action,
      label: `${action.label} (fallback: cari/tutar düzeltildi)`,
      payload: {
        ...p,
        cariId: cari.id,
        cariName: cari.name,
        amount: safeAmount,
      },
    });
  }
 
  if (action.type === 'kasa_gelir' || action.type === 'kasa_gider') {
    const amount = Number(p.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      candidates.push({
        ...action,
        label: `${action.label} (fallback: tutar düzeltildi)`,
        payload: { ...p, amount: Math.abs(amount) || 1 },
      });
    }
  }
 
  return candidates;
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
// applyAction — DB'ye işlemi uygula (atomic transition)
// ---------------------------------------------------------------------------
 
export function applyAction(prev: DB, action: DBAction): DB {
  const intent = mapActionToIntent(action);
  if (!intent) throw new Error(`Desteklenmeyen aksiyon tipi: ${action.type}`);
  
  const result = processIntent(intent, prev);
  if (!result.ok) throw new Error(result.error || 'İşlem başarısız oldu');
  
  return applyIntentResult(prev, result.data!);
}
