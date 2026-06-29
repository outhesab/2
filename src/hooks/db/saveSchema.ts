import { z } from 'zod';

/**
 * PARSPEL DB yapısal bütünlük şeması (Zod)
 *
 * Moratorium Madde 2.4: save() pipeline giriş/çıkışına Zod şeması.
 *
 * Bu şema DB'nin temel yapısal bütünlüğünü kontrol eder — iş kuralları
 * (ruleEngine) bunun ÜSTÜNE kuruludur. Buradaki amaç:
 * - Kritik alanlar var mı? (shape validation)
 * - Array alanları gerçekten array mı? (type safety)
 * - Yazma sonrası data corruption erken yakalansın (defensive)
 *
 * Performans: ~µs seviyesinde, her save() çağrısında güvenle kullanılabilir.
 *
 * ⚠️ ENGELLEMEZ — yalnızca loglar. Mevcut validateAndClassify (ruleEngine)
 * hâlâ birincil block/warn mekanizmasıdır.
 */

const ArrayField = z.array(z.unknown());

export const DBStructureSchema = z
  .object({
    _version: z.number(),

    // Ana dizi alanları
    products: ArrayField,
    sales: ArrayField,
    cari: ArrayField,
    kasa: ArrayField,
    kasalar: ArrayField,
    orders: ArrayField,
    suppliers: ArrayField,
    invoices: ArrayField,
    partners: ArrayField,
    notes: ArrayField,
    ortakEmanetler: ArrayField,
    installments: ArrayField,
    stockMovements: ArrayField,
    monitorRules: ArrayField,
    monitorLog: ArrayField,
    peletSuppliers: ArrayField,
    peletOrders: ArrayField,
    boruSuppliers: ArrayField,
    boruOrders: ArrayField,
    bankTransactions: ArrayField,
    budgets: ArrayField,
    productCategories: ArrayField,

    // Log dizileri
    _activityLog: ArrayField,
    _auditLog: ArrayField,

    // Opsiyonel log
    aiActionLog: ArrayField.optional(),

    // Zorunlu nesneler
    company: z.object({}).passthrough(),
    pelletSettings: z.object({}).passthrough(),

    // Serbest ayar kaydı
    settings: z.record(z.string(), z.unknown()),
  })
  .passthrough();

export interface StructureCheck {
  ok: boolean;
  issues: string[];
}

/**
 * DB'nin yapısal bütünlüğünü kontrol eder. Sonuç `{ ok, issues }` formatında.
 * Hata durumunda issues listesi detay verir; ok=true ise temiz.
 */
export function checkDBStructure(db: unknown): StructureCheck {
  if (typeof db !== 'object' || db === null) {
    return { ok: false, issues: ['<root>: object bekleniyor'] };
  }
  const result = DBStructureSchema.safeParse(db);
  if (result.success) {
    return { ok: true, issues: [] };
  }
  return {
    ok: false,
    issues: result.error.issues.map((i) => {
      const path = i.path.length > 0 ? i.path.join('.') : '<root>';
      return `${path}: ${i.message}`;
    }),
  };
}
