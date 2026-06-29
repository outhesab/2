import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { logger } from '@/lib/logger';
import { KNOWN_ARRAYS, LEGACY_FIELD_MAP } from './types';
import { parseCSV, detectCsvColumns } from './parseCsv';
import type { ConflictInfo, ConflictResolution, CsvColumnMapping, DB } from './types';

interface SmartImportManagerProps {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}

export function SmartImportManager({ db, save, showToast, showConfirm }: SmartImportManagerProps) {
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

  const detectFieldMappings = useCallback((data: Record<string, unknown>) => {
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
  }, []);

  const applyMappings = useCallback(
    (data: Record<string, unknown>, mappings: Record<string, string>): Record<string, unknown> => {
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
    },
    [],
  );

  const detectConflicts = useCallback(
    (data: Record<string, unknown>): ConflictInfo[] => {
      const checks = [
        { entity: 'products', label: 'Ürün', dbItems: db.products, importKey: 'products' },
        { entity: 'sales', label: 'Satış', dbItems: db.sales, importKey: 'sales' },
        { entity: 'cari', label: 'Cari Müşteri', dbItems: db.cari, importKey: 'cari' },
        { entity: 'suppliers', label: 'Tedarikçi', dbItems: db.suppliers || [], importKey: 'suppliers' },
      ];
      return checks
        .map(({ entity, label, dbItems, importKey }) => {
          const incoming = (data[importKey] as { id?: string; name?: string; code?: string }[]) || [];
          const items = dbItems as { id?: string; name?: string }[];
          const existingIds = new Set(items.map((d) => d.id).filter(Boolean));
          const existingNames = new Set(items.map((d) => (d.name || '').toLowerCase().trim()).filter(Boolean));
          const byId = incoming.filter((item) => item.id && existingIds.has(item.id)).length;
          const byName = incoming.filter(
            (item) => !item.id && item.name && existingNames.has(item.name.toLowerCase().trim()),
          ).length;
          return { entity, label, byId, byName, total: byId + byName };
        })
        .filter((c) => c.total > 0);
    },
    [db],
  );

  const analyzeData = useCallback((data: Record<string, unknown>) => {
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
    if (!data.company || typeof data.company !== 'object') {
      warns.push('Şirket bilgisi bulunamadı — varsayılan oluşturulacak');
    }
    if (!data.pelletSettings) warns.push('Pelet ayarları bulunamadı — varsayılan kullanılacak');
    if (!data._version) warns.push('Versiyon bilgisi yok — eski format olabilir, lütfen kontrol edin');
    else if ((data._version as number) < 1) {
      warns.push(`Eski versiyon (${data._version}) — bazı alanlar eksik olabilir`);
    }
    return { errs, warns, st };
  }, []);

  const proceedToPreview = useCallback(
    (data: Record<string, unknown>, userMappings: Record<string, string>) => {
      const allMappings = { ...legacyMapped, ...userMappings };
      const resolved = applyMappings(data, allMappings);
      const { errs, warns, st } = analyzeData(resolved);
      const detectedConflicts = detectConflicts(resolved);
      const initRes: Record<string, string> = {};
      detectedConflicts.forEach((c) => {
        initRes[c.entity] = 'overwrite';
      });
      setMapped(resolved);
      setErrors(errs);
      setWarnings(warns);
      setStats(st);
      setConflicts(detectedConflicts);
      setResolutions(initRes as Record<string, ConflictResolution>);
      setStage('preview');
    },
    [legacyMapped, applyMappings, analyzeData, detectConflicts],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [proceedToPreview, detectFieldMappings],
  );

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

  const doImport = () => {
    if (!mapped) return;
    showConfirm(
      'Veri Aktarımını Onayla',
      'Seçilen çakışma çözümleri uygulanacak ve veriler içe aktarılacak. Mevcut veriler etkilenebilir. Onaylıyor musunuz?',
      () => {
        try {
          const def: Record<string, unknown> = {
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
            _auditLog: [],
            company: db.company || {},
            settings: db.settings || {},
            pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
            ortakEmanetler: [],
            installments: [],
            partners: [],
            productCategories: [],
            notes: [],
          };
          const finalData: Record<string, unknown> = { ...def, ...mapped };
          const conflictEntities = ['products', 'cari', 'suppliers', 'sales'] as const;
          conflictEntities.forEach((entity) => {
            const resolution = resolutions[entity] || 'overwrite';
            const incoming = (mapped[entity] as { id?: string; name?: string }[]) || [];
            const existing = (db[entity as keyof DB] as { id?: string; name?: string }[]) || [];
            if (resolution === 'skip') {
              const existingIds = new Set(existing.map((x) => x.id).filter(Boolean));
              const existingNames = new Set(existing.map((x) => (x.name || '').toLowerCase()).filter(Boolean));
              finalData[entity] = [
                ...existing,
                ...incoming.filter((item) => {
                  const hasConflict = !existingIds.has(item.id) && !existingNames.has((item.name || '').toLowerCase());
                  return item.name && hasConflict;
                }),
              ];
            } else if (resolution === 'merge') {
              const existingMap = new Map(existing.map((x) => [x.id, x]));
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
          save(() => finalData as unknown as DB);
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

  const reset = useCallback(() => {
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
  }, []);

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
              <button
                key={t.id}
                onClick={() => setCsvTarget(t.id)}
                className="px-3.5 py-1.5 rounded-lg font-semibold text-xs border cursor-pointer"
                style={{
                  borderColor: csvTarget === t.id ? '#ff5722' : '#334155',
                  background: csvTarget === t.id ? 'rgba(255,87,34,0.15)' : 'transparent',
                  color: csvTarget === t.id ? 'var(--color-danger)' : 'var(--text-muted)',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {csvMappings.map((m, i) => (
            <div key={m.csvColumn} className="flex items-center gap-2.5">
              <div
                className="px-2.5 py-1.5 rounded-[6px] font-mono text-xs font-semibold min-w-[140px]"
                style={{
                  background: 'var(--bg-elevated)',
                  color: m.autoDetected ? 'var(--color-success)' : 'var(--color-warning)',
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
                    <button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'overwrite' }))}
                      style={btnStyle(resolutions[c.entity] === 'overwrite', '#ef4444')}
                    >
                      🔁 Üzerine Yaz
                    </button>
                    <button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'skip' }))}
                      style={btnStyle(resolutions[c.entity] === 'skip', '#f59e0b')}
                    >
                      ⏭️ Çakışanları Atla
                    </button>
                    <button
                      onClick={() => setResolutions((r) => ({ ...r, [c.entity]: 'merge' }))}
                      style={btnStyle(resolutions[c.entity] === 'merge', '#10b981')}
                    >
                      🔀 Birleştir
                    </button>
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
