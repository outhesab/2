import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/excelExport';
import { logger } from '@/lib/logger';
import type { DB } from '@/types';
import { Card } from '@/pages/SettingsCard';
import { Button } from '@/components/ui/button';

const inpBase =
  'w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border';

const lbl = {
  display: 'block',
  marginBottom: 6,
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-muted)' as const,
};

export function ExcelExportPanel({ db }: { db: DB }) {
  const { showToast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sheets, setSheets] = useState({
    stok: true,
    satislar: true,
    cari: true,
    kasa: true,
  });

  type SheetKey = keyof typeof sheets;

  const toggleSheet = (key: SheetKey) => setSheets((s) => ({ ...s, [key]: !s[key] }));

  const handleExport = () => {
    const selectedSheets = (Object.keys(sheets) as SheetKey[]).filter((k) => sheets[k]) as (
      | 'stok'
      | 'satislar'
      | 'cari'
      | 'kasa'
    )[];
    if (selectedSheets.length === 0) {
      showToast('En az bir sekme seçin!', 'warning');
      return;
    }
    try {
      exportToExcel(db, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sheets: selectedSheets,
      });
      showToast(`Excel dosyası oluşturuldu! (${selectedSheets.length} sekme)`, 'success');
    } catch {
      logger.warn('settings', 'Excel oluşturulamadı');
      showToast('Excel oluşturulamadı!', 'error');
    }
  };

  const sheetDefs: {
    key: SheetKey;
    label: string;
    icon: string;
    count: number;
  }[] = [
    {
      key: 'stok',
      label: 'Stok / Ürünler',
      icon: '📦',
      count: db.products.length,
    },
    { key: 'satislar', label: 'Satışlar', icon: '🛒', count: db.sales.length },
    { key: 'cari', label: 'Cari Hesaplar', icon: '👤', count: db.cari.length },
    { key: 'kasa', label: 'Kasa İşlemleri', icon: '💰', count: db.kasa.length },
  ];

  return (
    <div className="grid gap-4">
      <Card title="📊 Excel Dışa Aktarma">
        <p className="text-muted-foreground text-sm">
          Seçtiğiniz veri gruplarını Türkçe başlıklı, tarih ve para birimi formatlarıyla{' '}
          <strong className="text-green-400 font-semibold">.xlsx</strong> dosyasına aktarın.
        </p>

        <div className="mb-4">
          <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">
            Tarih Aralığı (Satış ve Kasa için)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label style={{ ...lbl, fontSize: '0.78rem' }}>Başlangıç</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inpBase} />
            </div>
            <div>
              <label style={{ ...lbl, fontSize: '0.78rem' }}>Bitiş</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inpBase} />
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Dahil Edilecek Sayfalar</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sheetDefs.map((s) => (
              <div
                key={s.key}
                onClick={() => toggleSheet(s.key)}
                className={`flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all border-2 ${
                  sheets[s.key] ? 'bg-green-500/8 border-green-500' : 'bg-black/20 border-white/6'
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <div className="flex-1">
                  <div
                    className="font-semibold text-[0.88rem]"
                    style={{ color: sheets[s.key] ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {s.label}
                  </div>
                  <div className="text-[var(--text-dim)] text-xs">{s.count} kayıt</div>
                </div>
                <div
                  className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[0.75rem] font-extrabold"
                  style={{
                    background: sheets[s.key] ? 'var(--color-success)' : 'rgba(255,255,255,0.06)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {sheets[s.key] ? '✔' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleExport} className="btn-primary btn-green w-full py-3 rounded-xl font-bold text-sm">
          📊 Excel Dosyasını İndir (.xlsx)
        </Button>
      </Card>
    </div>
  );
}
