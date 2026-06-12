import { useState } from 'react';
import { ReportsOzet } from './Reports/ReportsOzet';
import { ReportsSatis } from './Reports/ReportsSatis';
import { ReportsUrun } from './Reports/ReportsUrun';
import { ReportsCari } from './Reports/ReportsCari';
import { ReportsKasa } from './Reports/ReportsKasa';
import { ReportsGenerator } from './Reports/ReportsGenerator';
import { periodDates } from './Reports/ReportsUtils';
import type { DB } from '@/types';
import { Tab, Period } from './Reports/types';

interface Props {
  db: DB;
}

export default function Reports({ db }: Props) {
  const [tab, setTab] = useState<Tab>('ozet');
  const [period, setPeriod] = useState<Period>('bu_ay');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { start, end } = periodDates(period, dateFrom, dateTo);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'ozet', label: 'Genel Özet', icon: '🏠' },
    { id: 'satis', label: 'Satış', icon: '🛒' },
    { id: 'urun', label: 'Ürün & Stok', icon: '📦' },
    { id: 'cari', label: 'Cari', icon: '👤' },
    { id: 'kasa', label: 'Kasa', icon: '💰' },
    { id: 'olusturucu', label: 'Oluşturucu', icon: '🔧' },
  ];

  const periods: { id: Period; label: string }[] = [
    { id: 'bu_ay', label: 'Bu Ay' },
    { id: 'gecen_ay', label: 'Geçen Ay' },
    { id: 'bu_yil', label: 'Bu Yıl' },
    { id: 'ozel', label: 'Özel' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          background: '#0d1b2e',
          borderRadius: 12,
          padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                background: period === p.id ? 'rgba(255,87,34,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${period === p.id ? 'rgba(255,87,34,0.35)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8,
                color: period === p.id ? '#ff7043' : '#64748b',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'ozel' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            />
            <span style={{ color: '#334155' }}>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            />
          </div>
        )}
        <div style={{ color: '#1e3a5f', fontSize: '0.75rem', marginLeft: 'auto' }}>
          {start.toLocaleDateString('tr-TR')} – {end.toLocaleDateString('tr-TR')}
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#0d1b2e',
          borderRadius: 12,
          padding: 6,
          border: '1px solid rgba(255,255,255,0.06)',
          overflowX: 'auto',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              minWidth: 80,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 9,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              background:
                tab === t.id ? 'linear-gradient(135deg,rgba(255,87,34,0.2),rgba(255,87,34,0.08))' : 'transparent',
              color: tab === t.id ? '#ff7043' : '#475569',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              boxShadow: tab === t.id ? 'inset 0 0 0 1px rgba(255,87,34,0.25)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab içeriği */}
      {tab === 'ozet' && <ReportsOzet db={db} start={start} end={end} />}
      {tab === 'satis' && <ReportsSatis db={db} start={start} end={end} />}
      {tab === 'urun' && <ReportsUrun db={db} start={start} end={end} />}
      {tab === 'cari' && <ReportsCari db={db} start={start} end={end} />}
      {tab === 'kasa' && <ReportsKasa db={db} start={start} end={end} />}
      {tab === 'olusturucu' && <ReportsGenerator db={db} start={start} end={end} />}
    </div>
  );
}
