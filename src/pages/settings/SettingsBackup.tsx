import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { mergeRestoreDB, saveBackupToFirebase, type RestoreReport } from '@/hooks/useDB';
import { logger } from '@/lib/logger';
import type { DB } from '@/types';

export const RESTORE_SECTIONS = [
  { key: 'products', label: 'Ürünler', icon: '📦' },
  { key: 'sales', label: 'Satışlar', icon: '🛒' },
  { key: 'suppliers', label: 'Tedarikçiler', icon: '🏭' },
  { key: 'cari', label: 'Cari Hesaplar', icon: '👤' },
  { key: 'kasa', label: 'Kasa İşlemleri', icon: '💰' },
  { key: 'bankTransactions', label: 'Banka İşlemleri', icon: '🏦' },
  { key: 'invoices', label: 'Faturalar', icon: '🧾' },
  { key: 'orders', label: 'Siparişler', icon: '📋' },
  { key: 'stockMovements', label: 'Stok Hareketleri', icon: '📊' },
  { key: 'peletSuppliers', label: 'Pelet Tedarikçi', icon: '🪵' },
  { key: 'peletOrders', label: 'Pelet Sipariş', icon: '🪵' },
  { key: 'boruSuppliers', label: 'Boru Tedarikçi', icon: '🔩' },
  { key: 'boruOrders', label: 'Boru Sipariş', icon: '🔩' },
  { key: 'budgets', label: 'Bütçe', icon: '📊' },
  { key: 'returns', label: 'İadeler', icon: '↩️' },
  { key: 'company', label: 'Şirket Bilgileri', icon: '🏢', isObject: true },
  {
    key: 'pelletSettings',
    label: 'Pelet Ayarları',
    icon: '⚙️',
    isObject: true,
  },
] as const;

const KNOWN_ARRAYS: Record<string, string> = {
  products: 'Ürünler',
  sales: 'Satışlar',
  suppliers: 'Tedarikçiler',
  cari: 'Cari Müşteriler',
  kasa: 'Kasa Hareketleri',
  bankTransactions: 'Banka İşlemleri',
  orders: 'Siparişler',
  invoices: 'Faturalar',
  stockMovements: 'Stok Hareketleri',
  peletSuppliers: 'Pelet Tedarikçi',
  peletOrders: 'Pelet Sipariş',
  boruSuppliers: 'Boru Tedarikçi',
  boruOrders: 'Boru Sipariş',
  budgets: 'Bütçe',
  returns: 'İadeler',
  ortakEmanetler: 'Ortak Emanet',
  installments: 'Taksitler',
};

const LEGACY_FIELD_MAP: Record<string, string> = {
  urunler: 'products',
  satislar: 'sales',
  tedarikci: 'suppliers',
  musteriler: 'cari',
  kasaHareketleri: 'kasa',
  bankHareketleri: 'bankTransactions',
  siparisler: 'orders',
  faturalar: 'invoices',
  stokHareketleri: 'stockMovements',
  stoklar: 'products',
  musteri: 'cari',
  tedarikcilar: 'suppliers',
  kasaIslemleri: 'kasa',
};

type ConflictResolution = 'overwrite' | 'skip' | 'merge';

interface ConflictInfo {
  entity: string;
  label: string;
  byId: number;
  byName: number;
  total: number;
}

const CSV_COLUMN_MAP: Record<string, { target: string; field: string }> = {
  müşteri: { target: 'cari', field: 'name' },
  musteri: { target: 'cari', field: 'name' },
  'müşteri adı': { target: 'cari', field: 'name' },
  ad: { target: 'cari', field: 'name' },
  isim: { target: 'cari', field: 'name' },
  'ad soyad': { target: 'cari', field: 'name' },
  telefon: { target: 'cari', field: 'phone' },
  tel: { target: 'cari', field: 'phone' },
  adres: { target: 'cari', field: 'address' },
  bakiye: { target: 'cari', field: 'balance' },
  borç: { target: 'cari', field: 'balance' },
  borc: { target: 'cari', field: 'balance' },
  tarih: { target: '_date', field: 'createdAt' },
  date: { target: '_date', field: 'createdAt' },
  tutar: { target: '_amount', field: 'amount' },
  toplam: { target: '_amount', field: 'total' },
  fiyat: { target: '_amount', field: 'price' },
  ürün: { target: 'products', field: 'name' },
  urun: { target: 'products', field: 'name' },
  'ürün adı': { target: 'products', field: 'name' },
  stok: { target: 'products', field: 'stock' },
  maliyet: { target: 'products', field: 'cost' },
  'satış fiyatı': { target: 'products', field: 'price' },
  kategori: { target: '_category', field: 'category' },
  açıklama: { target: '_desc', field: 'description' },
  aciklama: { target: '_desc', field: 'description' },
  not: { target: '_desc', field: 'note' },
  'e-posta': { target: 'cari', field: 'email' },
  email: { target: 'cari', field: 'email' },
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(/[,;\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ''));
}

interface CsvColumnMapping {
  csvColumn: string;
  targetEntity: string;
  targetField: string;
  autoDetected: boolean;
}

function detectCsvColumns(headers: string[]): CsvColumnMapping[] {
  return headers.map((h) => {
    const lower = h.toLowerCase().trim();
    const match = CSV_COLUMN_MAP[lower];
    if (match) {
      return {
        csvColumn: h,
        targetEntity: match.target,
        targetField: match.field,
        autoDetected: true,
      };
    }
    for (const [key, val] of Object.entries(CSV_COLUMN_MAP)) {
      if (lower.includes(key)) {
        return {
          csvColumn: h,
          targetEntity: val.target,
          targetField: val.field,
          autoDetected: true,
        };
      }
    }
    return {
      csvColumn: h,
      targetEntity: '',
      targetField: '',
      autoDetected: false,
    };
  });
}

// ── Tam Geri Yükleme Paneli ─────────────────────────────────────────────────

export function FullRestorePanel({
  showToast,
  showConfirm,
  save,
  db,
}: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    showConfirm(
      '⚠️ Tam Geri Yükleme',
      `"${file.name}" dosyasındaki veriler yükleniyor. Mevcut tüm veriler bu yedekle değiştirilecek. Önceki veri otomatik yedeklenir. Devam edilsin mi?`,
      () => {
        saveBackupToFirebase(
          db,
          `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`,
        ).catch(() => logger.error('db', 'Tam geri yükleme öncesi yedek alınamadı'));

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const raw = JSON.parse(ev.target?.result as string) as DB;
            save((prev) => {
              const def = { ...prev };
              const merged: DB = { ...def, ...raw };
              const arrayKeys = [
                'products',
                'sales',
                'suppliers',
                'orders',
                'cari',
                'kasa',
                'bankTransactions',
                'matchRules',
                'monitorRules',
                'monitorLog',
                'stockMovements',
                'peletSuppliers',
                'peletOrders',
                'boruSuppliers',
                'boruOrders',
                'invoices',
                'budgets',
                'returns',
                '_activityLog',
                'ortakEmanetler',
                'installments',
                'partners',
                'notes',
              ] as const;
              for (const key of arrayKeys) {
                if (!Array.isArray(merged[key])) (merged as unknown as Record<string, unknown>)[key] = [];
              }
              if (!merged.kasalar || merged.kasalar.length === 0) merged.kasalar = def.kasalar;
              if (!merged.company || typeof merged.company !== 'object') merged.company = def.company;
              if (!merged.pelletSettings) merged.pelletSettings = def.pelletSettings;
              if (!Array.isArray(merged.productCategories) || merged.productCategories.length === 0)
                merged.productCategories = def.productCategories;
              return merged;
            });

            const report: RestoreReport = {
              added: 0,
              skippedDuplicate: 0,
              skippedInvalidName: 0,
              skippedMissingField: 0,
              warnings: [],
            };
            (raw.cari || []).forEach((c: { name?: unknown }) => {
              if (typeof c.name !== 'string' || c.name.trim().length < 2 || /^\d+$/.test(c.name.trim())) {
                report.skippedInvalidName++;
                report.warnings.push(`Cari gizlendi: "${c.name}" — geçersiz ad`);
              }
            });
            (raw.products || []).forEach((p: { name?: unknown }) => {
              if (typeof p.name !== 'string' || p.name.trim().length < 2 || /^\d+$/.test(p.name.trim())) {
                report.skippedInvalidName++;
                report.warnings.push(`Ürün gizlendi: "${p.name}" — geçersiz ad`);
              }
            });
            setLastReport(report);

            const msg =
              report.skippedInvalidName > 0
                ? `✅ Geri yükleme tamamlandı. ${report.skippedInvalidName} geçersiz kayıt gizlendi.`
                : '✅ Tam geri yükleme başarılı! Önceki veri yedeklendi.';
            showToast(msg, 'success');
            setTimeout(() => window.location.reload(), 1800);
          } catch {
            logger.warn('settings', 'Yedek dosyası okunamadı veya geçersiz format');
            showToast('Dosya okunamadı veya geçersiz format!', 'error');
          }
        };
        reader.readAsText(file);
      },
      true,
    );
  };

  return (
    <Card title="🔁 Tam Geri Yükleme">
      <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
        <strong>Dikkat:</strong> Mevcut tüm veriler yedekteki verilerle değiştirilir. İşlem öncesi otomatik yedek
        alınır. Yedekten gelen geçersiz adlı kayıtlar (boş, tek haneli, sadece sayı) gizlenir.
      </div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      <Button
        onClick={() => fileRef.current?.click()}
        className="btn-danger-dashed w-full py-3 rounded-xl font-bold text-sm border-2 border-dashed border-red-500/30 bg-red-500/10"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
        }}
      >
        📂 JSON Yedek Dosyası Seç — Tam Geri Yükle
      </Button>

      {lastReport && lastReport.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
          <div className="text-amber-400 font-bold text-sm">⚠️ Gizlenen Kayıtlar</div>
          {lastReport.warnings.map((w, i) => (
            <div key={i} className="text-muted-foreground text-sm">
              • {w}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Seçimli Geri Yükleme Paneli ─────────────────────────────────────────────

export function SelectiveRestore({
  showToast,
  showConfirm,
  save,
  db,
}: {
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
  save: (fn: (prev: DB) => DB) => void;
  db: DB;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [available, setAvailable] = useState<
    { key: string; label: string; icon: string; count: number; isObject?: boolean }[]
  >([]);
  const [lastReport, setLastReport] = useState<RestoreReport | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== 'object' || Array.isArray(data)) {
          showToast('Geçersiz JSON formatı!', 'error');
          return;
        }
        setFileData(data);
        const avail: typeof available = [];
        RESTORE_SECTIONS.forEach((s) => {
          const val = data[s.key];
          if (s.key === 'company' || s.key === 'pelletSettings') {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              avail.push({ key: s.key, label: s.label, icon: s.icon, count: 1, isObject: true });
            }
          } else if (Array.isArray(val) && val.length > 0) {
            avail.push({ key: s.key, label: s.label, icon: s.icon, count: val.length });
          }
        });
        setAvailable(avail);
        setSelected(new Set(avail.map((a) => a.key)));
      } catch {
        logger.warn('settings', 'JSON ayrıştırılamadı');
        showToast('JSON ayrıştırılamadı!', 'error');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleSection = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(available.map((a) => a.key)));
  const selectNone = () => setSelected(new Set());

  const doRestore = () => {
    if (!fileData || selected.size === 0) return;
    const selCount = available.filter((a) => selected.has(a.key)).reduce((s, a) => s + a.count, 0);
    showConfirm(
      'Seçimli Geri Yükleme',
      `${selected.size} bölüm (${selCount} kayıt) işlenecek. Mevcut ID'ler korunur, geçersiz adlar atlanır. Devam edilsin mi?`,
      () => {
        try {
          const preLabel = `onceki_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}`;
          saveBackupToFirebase(db, preLabel).catch(() =>
            logger.error('db', 'Seçimli geri yükleme öncesi yedek alınamadı'),
          );
          const { db: mergedDb, report } = mergeRestoreDB(db, fileData as Partial<DB>, selected);
          setLastReport(report);
          save(() => mergedDb);
          const msg = [
            `✅ ${report.added} kayıt eklendi.`,
            report.skippedDuplicate > 0 ? `${report.skippedDuplicate} tekrar (ID çakışması) atlandı.` : '',
            report.skippedInvalidName > 0 ? `${report.skippedInvalidName} geçersiz adlı kayıt atlandı.` : '',
            report.skippedMissingField > 0 ? `${report.skippedMissingField} eksik alanlı kayıt atlandı.` : '',
          ]
            .filter(Boolean)
            .join(' ');
          showToast(msg, report.skippedInvalidName > 0 || report.skippedMissingField > 0 ? 'info' : 'success');
          setTimeout(() => window.location.reload(), 2000);
        } catch {
          logger.warn('settings', 'Geri yükleme sırasında hata oluştu');
          showToast('Geri yükleme sırasında hata oluştu!', 'error');
        }
      },
      true,
    );
  };

  const reset = () => {
    setFileData(null);
    setFileName('');
    setSelected(new Set());
    setAvailable([]);
    setLastReport(null);
  };

  return (
    <Card title="📂 Seçimli Geri Yükleme">
      <p className="text-muted-foreground text-sm">
        Yedek dosyanızdan <strong className="text-orange-400 font-semibold">istediğiniz bölümleri seçerek</strong> geri
        yükleyin. Tüm veriyi değiştirmek zorunda değilsiniz.
      </p>

      {!fileData ? (
        <>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-blue-500/30 bg-blue-500/10 w-full"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)';
            }}
          >
            JSON Yedek Dosyası Seç
          </Button>
        </>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-[10px] p-3">
            <span className="text-green-400 text-lg">📁</span>
            <span className="text-green-400 font-bold">{fileName}</span>
            <span className="text-muted-foreground text-xs">{available.length} bölüm bulundu</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">Geri Yüklenecek Bölümler:</span>
            <Button onClick={selectAll} className="px-3 py-1.5 rounded-lg font-bold text-xs">
              Tümünü Seç
            </Button>
            <Button onClick={selectNone} className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs">
              Hiçbirini Seçme
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {available.map((section) => {
              const isSelected = selected.has(section.key);
              return (
                <div
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isSelected ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--color-info)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
                      color: 'var(--text-primary)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                  <span className="text-base">{section.icon}</span>
                  <div className="flex-1">
                    <div
                      style={{
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                      }}
                    >
                      {section.label}
                    </div>
                    <div className="text-[var(--text-dim)] text-sm">
                      {section.isObject ? 'Ayarlar' : `${section.count} kayıt`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              Mevcut ID'ler korunur. Geçersiz adlar (boş, tek haneli, sadece sayı) ve zorunlu alanı eksik kayıtlar
              atlanır.
            </div>
          )}

          {lastReport && lastReport.warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-red-400 font-bold text-sm">
                ⚠️ Atlanan Kayıtlar (
                {lastReport.skippedDuplicate + lastReport.skippedInvalidName + lastReport.skippedMissingField})
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {lastReport.skippedDuplicate > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-blue-500/20 text-blue-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    🔁 {lastReport.skippedDuplicate} tekrar ID
                  </span>
                )}
                {lastReport.skippedInvalidName > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    ✗ {lastReport.skippedInvalidName} geçersiz ad
                  </span>
                )}
                {lastReport.skippedMissingField > 0 && (
                  <span className="inline-flex items-center rounded-md border border-transparent bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    ⚡ {lastReport.skippedMissingField} eksik alan
                  </span>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {lastReport.warnings.map((w, i) => (
                  <div key={i} className="text-muted-foreground text-sm">
                    • {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {selected.size > 0 && (
              <Button
                onClick={doRestore}
                className="px-3 py-2.5 rounded-xl font-bold text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex-1"
              >
                {selected.size} Bölümü Geri Yükle
              </Button>
            )}
            <Button
              onClick={reset}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Sıfırla
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Akıllı Veri İçe Aktarma ─────────────────────────────────────────────────

export function SmartImportManager({
  db,
  save: _save,
  showToast,
  showConfirm,
}: {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<'idle' | 'mapping' | 'csvMapping' | 'preview' | 'done'>('idle');
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [mapped, setMapped] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [unknownFields, setUnknownFields] = useState<string[]>([]);
  const [legacyMapped, setLegacyMapped] = useState<Record<string, string>>({});
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvMappings, setCsvMappings] = useState<CsvColumnMapping[]>([]);
  const [csvTarget, setCsvTarget] = useState<string>('cari');

  const detectFieldMappings = (data: Record<string, unknown>) => {
    const unknown: string[] = [];
    const autoMapped: Record<string, string> = {};
    const knownAll = new Set([
      ...Object.keys(KNOWN_ARRAYS),
      '_version',
      'company',
      'settings',
      'pelletSettings',
      'kasalar',
      'matchRules',
      'monitorRules',
      'monitorLog',
      '_activityLog',
      'soundSettings',
    ]);
    Object.keys(data).forEach((key) => {
      if (!knownAll.has(key)) {
        if (LEGACY_FIELD_MAP[key]) {
          autoMapped[key] = LEGACY_FIELD_MAP[key];
        } else {
          unknown.push(key);
        }
      }
    });
    return { unknown, autoMapped };
  };

  const applyMappings = (data: Record<string, unknown>, mappings: Record<string, string>): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...data };
    Object.entries(mappings).forEach(([src, dst]) => {
      if (dst && dst !== '' && result[src] !== undefined) {
        if (!result[dst] || !Array.isArray(result[dst])) {
          result[dst] = result[src];
        } else if (Array.isArray(result[dst]) && Array.isArray(result[src])) {
          result[dst] = [...(result[dst] as unknown[]), ...(result[src] as unknown[])];
        }
        delete result[src];
      }
    });
    return result;
  };

  const detectConflicts = (data: Record<string, unknown>): ConflictInfo[] => {
    const checks: Array<{
      entity: string;
      label: string;
      dbItems: { id?: string; name?: string; code?: string }[];
      importKey: string;
    }> = [
      { entity: 'products', label: 'Ürün', dbItems: db.products, importKey: 'products' },
      { entity: 'sales', label: 'Satış', dbItems: db.sales, importKey: 'sales' },
      { entity: 'cari', label: 'Cari Müşteri', dbItems: db.cari, importKey: 'cari' },
      { entity: 'suppliers', label: 'Tedarikçi', dbItems: db.suppliers || [], importKey: 'suppliers' },
    ];
    return checks
      .map(({ entity, label, dbItems, importKey }) => {
        const incoming = (data[importKey] as { id?: string; name?: string; code?: string }[]) || [];
        const existingIds = new Set(dbItems.map((d) => d.id).filter(Boolean));
        const existingNames = new Set(dbItems.map((d) => (d.name || '').toLowerCase().trim()).filter(Boolean));
        const byId = incoming.filter((item) => item.id && existingIds.has(item.id)).length;
        const byName = incoming.filter(
          (item) => !item.id && item.name && existingNames.has(item.name.toLowerCase().trim()),
        ).length;
        return { entity, label, byId, byName, total: byId + byName };
      })
      .filter((c) => c.total > 0);
  };

  const analyzeData = (data: Record<string, unknown>) => {
    const errs: string[] = [];
    const warns: string[] = [];
    const st: Record<string, number> = {};
    Object.entries(KNOWN_ARRAYS).forEach(([key]) => {
      const val = data[key];
      if (Array.isArray(val)) {
        if (val.length > 0) st[key] = val.length;
        if (val.length === 0) warns.push(`"${KNOWN_ARRAYS[key]}" alanı boş`);
      } else if (val !== undefined) {
        errs.push(`"${key}" alanı geçersiz format — dizi bekleniyor`);
      }
    });
    if (!data.company || typeof data.company !== 'object')
      warns.push('Şirket bilgisi bulunamadı — varsayılan oluşturulacak');
    if (!data.pelletSettings) warns.push('Pelet ayarları bulunamadı — varsayılan kullanılacak');
    if (!data._version) warns.push('Versiyon bilgisi yok — eski format olabilir, lütfen kontrol edin');
    else if ((data._version as number) < 1)
      warns.push(`Eski versiyon (${data._version}) — bazı alanlar eksik olabilir`);
    return { errs, warns, st };
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setErrors(['CSV dosyası boş veya geçersiz format']);
          setStage('preview');
          return;
        }
        setCsvRows(rows);
        const headers = Object.keys(rows[0]);
        const mappings = detectCsvColumns(headers);
        setCsvMappings(mappings);
        const hasCariCols = mappings.some((m) => m.targetEntity === 'cari');
        const hasProductCols = mappings.some((m) => m.targetEntity === 'products');
        setCsvTarget(hasCariCols ? 'cari' : hasProductCols ? 'products' : 'cari');
        setStage('csvMapping');
        return;
      }
      try {
        const data = JSON.parse(text);
        if (typeof data !== 'object' || Array.isArray(data)) {
          setErrors(['Geçersiz JSON formatı — nesne bekleniyor']);
          setStage('preview');
          setRawData(null);
          return;
        }
        setRawData(data);
        const { unknown, autoMapped } = detectFieldMappings(data);
        setLegacyMapped(autoMapped);
        setUnknownFields(unknown);
        const initMappings: Record<string, string> = {};
        unknown.forEach((f) => {
          initMappings[f] = '';
        });
        setFieldMappings(initMappings);
        if (unknown.length > 0 || Object.keys(autoMapped).length > 0) {
          setStage('mapping');
        } else {
          proceedToPreview(data, {});
        }
      } catch {
        logger.warn('settings', 'Dosya ayrıştırılamadı — JSON veya CSV formatı hatalı');
        setErrors(['Dosya ayrıştırılamadı — JSON veya CSV formatını kontrol edin']);
        setStage('preview');
        setRawData(null);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const applyCsvImport = () => {
    if (csvRows.length === 0) return;
    const items: Record<string, unknown>[] = csvRows.map((row) => {
      const item: Record<string, unknown> = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      csvMappings.forEach((m) => {
        if (!m.targetField || m.targetField === '') return;
        const val = row[m.csvColumn];
        if (!val) return;
        const numFields = ['balance', 'amount', 'total', 'price', 'stock', 'cost', 'quantity'];
        if (numFields.includes(m.targetField)) {
          item[m.targetField] = parseFloat(val.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        } else if (m.targetField === 'createdAt') {
          try {
            item.createdAt = new Date(val).toISOString();
          } catch {
            /* keep default */
          }
        } else {
          item[m.targetField] = val;
        }
      });
      if (csvTarget === 'cari') {
        if (!item.type) item.type = 'musteri';
        if (!item.balance) item.balance = 0;
        if (!item.totalPurchases) item.totalPurchases = 0;
      }
      if (csvTarget === 'products') {
        if (!item.stock) item.stock = 0;
        if (!item.cost) item.cost = 0;
        if (!item.price) item.price = 0;
        if (!item.minStock) item.minStock = 5;
        if (!item.category) item.category = '';
      }
      if (csvTarget === 'kasa') {
        if (!item.type) item.type = 'gider';
        if (!item.kasa) item.kasa = 'nakit';
        if (!item.amount) item.amount = 0;
        if (!item.description) item.description = (item.name as string) || 'CSV İçe Aktarma';
        if (!item.category) item.category = 'diger';
      }
      return item;
    });
    const data: Record<string, unknown> = {};
    data[csvTarget] = items;
    setRawData(data);
    proceedToPreview(data, {});
  };

  const proceedToPreview = (data: Record<string, unknown>, userMappings: Record<string, string>) => {
    const allMappings = { ...legacyMapped, ...userMappings };
    const resolved = applyMappings(data, allMappings);
    const { errs, warns, st } = analyzeData(resolved);
    const detectedConflicts = detectConflicts(resolved);
    const initRes: Record<string, ConflictResolution> = {};
    detectedConflicts.forEach((c) => {
      initRes[c.entity] = 'overwrite';
    });
    setMapped(resolved);
    setErrors(errs);
    setWarnings(warns);
    setStats(st);
    setConflicts(detectedConflicts);
    setResolutions(initRes);
    setStage('preview');
  };

  const doImport = () => {
    if (!mapped) return;
    showConfirm(
      'Veri Aktarımını Onayla',
      'Seçilen çakışma çözümleri uygulanacak ve veriler içe aktarılacak. Mevcut veriler etkilenebilir. Onaylıyor musunuz?',
      () => {
        try {
          const raw = localStorage.getItem('sobaYonetim');
          const current = raw ? JSON.parse(raw) : {};
          const def = {
            _version: 1,
            products: [],
            sales: [],
            suppliers: [],
            orders: [],
            cari: [],
            kasa: [],
            kasalar: [
              { id: 'nakit', name: 'Nakit', icon: '💵' },
              { id: 'banka', name: 'Banka', icon: '🏦' },
            ],
            bankTransactions: [],
            matchRules: [],
            monitorRules: [],
            monitorLog: [],
            stockMovements: [],
            peletSuppliers: [],
            peletOrders: [],
            boruSuppliers: [],
            boruOrders: [],
            invoices: [],
            budgets: [],
            returns: [],
            _activityLog: [],
            company: current.company || {},
            settings: {},
            pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
            ortakEmanetler: [],
            installments: [],
          };
          const finalData: Record<string, unknown> = { ...def, ...mapped };
          const conflictEntities = ['products', 'cari', 'suppliers', 'sales'] as const;
          conflictEntities.forEach((entity) => {
            const resolution = resolutions[entity] || 'overwrite';
            const incoming = (mapped[entity] as { id?: string; name?: string }[]) || [];
            const existing = (current[entity] as { id?: string; name?: string }[]) || [];
            if (resolution === 'skip') {
              const existingIds = new Set(existing.map((x: { id?: string }) => x.id).filter(Boolean));
              const existingNames = new Set(
                existing.map((x: { name?: string }) => (x.name || '').toLowerCase()).filter(Boolean),
              );
              finalData[entity] = [
                ...existing,
                ...incoming.filter((item) => {
                  const hasConflict = !existingIds.has(item.id) && !existingNames.has((item.name || '').toLowerCase());
                  return item.name && hasConflict;
                }),
              ];
            } else if (resolution === 'merge') {
              const existingMap = new Map(existing.map((x: { id?: string }) => [x.id, x]));
              incoming.forEach((item) => {
                if (item.id && existingMap.has(item.id)) {
                  existingMap.set(item.id, { ...existingMap.get(item.id)!, ...item });
                } else {
                  existingMap.set(item.id || Math.random().toString(), item);
                }
              });
              finalData[entity] = Array.from(existingMap.values());
            }
          });
          if (!finalData.kasalar || (finalData.kasalar as unknown[]).length === 0) finalData.kasalar = def.kasalar;
          if (!finalData.pelletSettings) finalData.pelletSettings = def.pelletSettings;
          if (!finalData.company || typeof finalData.company !== 'object') finalData.company = def.company;
          localStorage.setItem('sobaYonetim', JSON.stringify(finalData));
          setStage('done');
          showToast('Veriler başarıyla aktarıldı! Sayfa yenilenecek...', 'success');
          setTimeout(() => window.location.reload(), 1200);
        } catch {
          logger.warn('settings', 'İçe aktarma sırasında hata oluştu');
          showToast('İçe aktarma sırasında hata oluştu!', 'error');
        }
      },
      true,
    );
  };

  const reset = () => {
    setStage('idle');
    setRawData(null);
    setMapped(null);
    setErrors([]);
    setWarnings([]);
    setStats({});
    setConflicts([]);
    setResolutions({});
    setFieldMappings({});
    setUnknownFields([]);
    setLegacyMapped({});
    setCsvRows([]);
    setCsvMappings([]);
    setCsvTarget('cari');
  };

  const btnStyle = (active: boolean, color: string) => ({
    padding: '6px 14px',
    border: `1px solid ${active ? color : 'var(--text-dim)'}`,
    borderRadius: 8,
    background: active ? `${color}20` : 'transparent',
    color: active ? color : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
  });

  return (
    <Card title="🧠 Akıllı Veri İçe Aktarma">
      <p className="text-muted-foreground text-sm">
        JSON, CSV veya TXT dosyanızı analiz eder; kolonları otomatik eşler (müşteri, tarih, tutar vb.), manuel düzeltme
        imkanı sunar ve çakışmaları çözerek güvenli aktarım yapar.
      </p>

      {stage === 'idle' && (
        <>
          <input ref={fileRef} type="file" accept=".json,.csv,.tsv,.txt" onChange={handleFile} className="hidden" />
          <Button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-3 rounded-xl font-bold text-sm border-2 border-dashed border-purple-500/30 bg-purple-500/10 w-full"
          >
            Dosya Seç & Akıllı Analiz Başlat
          </Button>
        </>
      )}

      {stage === 'csvMapping' && csvRows.length > 0 && (
        <div className="grid gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
            <div className="text-green-400 font-bold">{csvRows.length} satır okundu</div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-foreground text-sm font-semibold">Hedef Veri Türü:</span>
            {[
              { id: 'cari', label: 'Cari Müşteri', icon: '👤' },
              { id: 'products', label: 'Ürün', icon: '📦' },
              { id: 'kasa', label: 'Kasa', icon: '💰' },
            ].map((t) => (
              <Button
                key={t.id}
                onClick={() => setCsvTarget(t.id)}
                style={{
                  padding: '6px 14px',
                  border: `1px solid ${csvTarget === t.id ? '#ff5722' : '#334155'}`,
                  borderRadius: 8,
                  background: csvTarget === t.id ? 'rgba(255,87,34,0.15)' : 'transparent',
                  color: csvTarget === t.id ? 'var(--color-danger)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                {t.icon} {t.label}
              </Button>
            ))}
          </div>
          {csvMappings.map((m, i) => (
            <div key={m.csvColumn} className="flex items-center gap-2.5">
              <div
                style={{
                  minWidth: 140,
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 6,
                  color: m.autoDetected ? 'var(--color-success)' : 'var(--color-warning)',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {m.csvColumn} {m.autoDetected && <span className="text-green-400 text-xs">otomatik</span>}
              </div>
              <span className="text-[var(--text-dim)] text-sm">→</span>
              <select
                value={m.targetField}
                onChange={(e) => {
                  const next = [...csvMappings];
                  next[i] = { ...next[i], targetField: e.target.value, autoDetected: false };
                  setCsvMappings(next);
                }}
                className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono"
              >
                <option value="">— Yoksay —</option>
                <option value="name">Ad / İsim</option>
                <option value="phone">Telefon</option>
                <option value="email">E-posta</option>
                <option value="address">Adres</option>
                <option value="balance">Bakiye / Borç</option>
                <option value="amount">Tutar</option>
                <option value="total">Toplam</option>
                <option value="price">Fiyat</option>
                <option value="cost">Maliyet</option>
                <option value="stock">Stok</option>
                <option value="category">Kategori</option>
                <option value="description">Açıklama</option>
                <option value="note">Not</option>
                <option value="createdAt">Tarih</option>
              </select>
            </div>
          ))}
          <Button
            onClick={applyCsvImport}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
          >
            Devam → Önizleme & Çakışma Çözümü
          </Button>
          <Button
            onClick={reset}
            className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            Sıfırla
          </Button>
        </div>
      )}

      {stage === 'mapping' && rawData && (
        <div className="grid gap-4">
          {Object.keys(legacyMapped).length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-green-400 font-bold">✅ Otomatik Algılanan Eski Alanlar</div>
              {Object.entries(legacyMapped).map(([src, dst]) => (
                <div key={src} className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--color-warning)]">
                    {src}
                  </span>
                  <span className="text-[var(--text-dim)] text-sm">→</span>
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded text-[var(--color-success)]">
                    {dst}
                  </span>
                </div>
              ))}
            </div>
          )}
          {unknownFields.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 text-sm text-muted-foreground">
              <div className="text-amber-400 font-bold text-sm">⚠️ Tanınmayan Alanlar — Eşleme Seçin</div>
              {unknownFields.map((field) => (
                <div key={field} className="flex items-center gap-2.5">
                  <span className="font-mono text-xs bg-[rgba(0,0,0,0.3)] px-2.5 py-1 rounded text-[var(--color-warning)] text-center min-w-[120px]">
                    {field}
                  </span>
                  <span className="text-[var(--text-dim)] text-sm">→</span>
                  <select
                    value={fieldMappings[field] || ''}
                    onChange={(e) => setFieldMappings((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono"
                  >
                    <option value="">— Yoksay —</option>
                    {Object.entries(KNOWN_ARRAYS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label} ({k})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() => proceedToPreview(rawData, fieldMappings)}
            className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
          >
            Devam → Önizleme & Çakışma Çözümü
          </Button>
          <Button
            onClick={reset}
            className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            Sıfırla
          </Button>
        </div>
      )}

      {stage === 'preview' && (
        <div className="grid gap-3">
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3">
              <div className="text-red-400 font-bold text-sm">❌ Hatalar</div>
              {errors.map((e, i) => (
                <div key={i} className="text-red-400 text-xs">
                  • {e}
                </div>
              ))}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3">
              <div className="text-amber-400 font-bold text-sm">⚠️ Uyarılar</div>
              {warnings.map((w, i) => (
                <div key={i} className="text-amber-400 text-xs">
                  • {w}
                </div>
              ))}
            </div>
          )}
          {Object.keys(stats).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[10px] p-3">
              <div className="text-blue-400 font-bold text-sm">📊 İçe Aktarılacak Kayıtlar</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats).map(([k, v]) => (
                  <div key={k} className="bg-[var(--bg-card)] rounded-lg p-2 text-center">
                    <div className="text-foreground text-sm font-semibold">{v}</div>
                    <div className="text-[var(--text-dim)] text-sm">{KNOWN_ARRAYS[k] || k}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3">
              <div className="text-red-400 font-bold text-sm">⚡ Çakışma Çözümü</div>
              {conflicts.map((c) => (
                <div key={c.entity} className="border-b border-[var(--border)] pb-3 mb-3">
                  <div className="text-red-400 text-xs">
                    <strong>{c.label}</strong>: {c.byId > 0 && `${c.byId} aynı ID`}
                    {c.byId > 0 && c.byName > 0 && ', '}
                    {c.byName > 0 && `${c.byName} aynı isim`} çakışması
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'overwrite' }))}
                      style={btnStyle(resolutions[c.entity] === 'overwrite', '#ef4444')}
                    >
                      🔁 Üzerine Yaz
                    </Button>
                    <Button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'skip' }))}
                      style={btnStyle(resolutions[c.entity] === 'skip', '#f59e0b')}
                    >
                      ⏭️ Çakışanları Atla
                    </Button>
                    <Button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'merge' }))}
                      style={btnStyle(resolutions[c.entity] === 'merge', '#10b981')}
                    >
                      🔀 Birleştir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {mapped && errors.length === 0 && (
            <Button
              onClick={doImport}
              className="px-3 py-2.5 rounded-xl font-bold text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            >
              ✅ Aktarımı Onayla & Başlat
            </Button>
          )}
          <Button
            onClick={reset}
            className="px-3 py-2 rounded-lg font-medium text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            Sıfırla
          </Button>
        </div>
      )}

      {stage === 'done' && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-green-400 font-bold">Veriler başarıyla aktarıldı!</div>
          <div className="text-muted-foreground text-xs">Sayfa yenileniyor...</div>
        </div>
      )}
    </Card>
  );
}
