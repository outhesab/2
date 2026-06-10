import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/pages/SettingsCard';
import { formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';

const inpBase =
  'w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
  showToast: (m: string, t?: string) => void;
  showConfirm: (t: string, m: string, ok: () => void, d?: boolean) => void;
}

function getIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes('satış') || a.includes('satis') || a.includes('sale')) return '🛒';
  if (a.includes('ürün') || a.includes('urun') || a.includes('stok')) return '📦';
  if (a.includes('kasa') || a.includes('gelir') || a.includes('gider')) return '💰';
  if (a.includes('cari') || a.includes('müşteri')) return '👤';
  if (a.includes('fatura')) return '🧾';
  if (a.includes('sipariş')) return '📋';
  if (a.includes('sil') || a.includes('iptal')) return '🗑️';
  return '📝';
}

export function ActivityPanel({ db, save, showToast, showConfirm }: Props) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const activityLog = [...(db._activityLog || [])].sort(
    (a, b) => new Date(b.time || b.createdAt || '').getTime() - new Date(a.time || a.createdAt || '').getTime(),
  );

  const actionTypes = Array.from(
    new Set(
      activityLog.map((a) => {
        const parts = a.action.split(':');
        return parts[0].trim();
      }),
    ),
  ).slice(0, 15);

  let filtered = activityLog;
  if (typeFilter !== 'all') filtered = filtered.filter((a) => a.action.startsWith(typeFilter));
  if (dateFilter) filtered = filtered.filter((a) => (a.time || '').startsWith(dateFilter));

  const clearLog = () => {
    showConfirm(
      'Aktivite Günlüğünü Temizle',
      `${db._activityLog.length} kayıt silinecek. Devam edilsin mi?`,
      () => {
        save((prev: DB) => ({ ...prev, _activityLog: [] }));
        showToast('Aktivite günlüğü temizlendi!');
      },
      true,
    );
  };

  return (
    <Card title="📋 Aktivite Günlüğü">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={inpBase}
          style={{ width: 160 }}
          placeholder="Tarih filtrele"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inpBase} flex-1`}>
          <option value="all">Tüm İşlemler</option>
          {actionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {dateFilter && (
          <Button
            onClick={() => setDateFilter('')}
            className="px-3 py-2 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          >
            ✕ Tarih
          </Button>
        )}
        <Button
          onClick={clearLog}
          className="btn-danger-outline px-3 py-2 rounded-lg font-bold text-xs border border-red-500/30"
        >
          🗑️ Temizle
        </Button>
      </div>

      <div className="text-[var(--text-dim)] text-xs">
        {filtered.length} kayıt (toplam {activityLog.length})
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <div className="text-3xl mb-2">📋</div>
            <p>Aktivite bulunamadı</p>
          </div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <div className="text-lg w-8 h-8 flex items-center justify-center">{getIcon(a.action)}</div>
              <div className="flex-1">
                <div className="text-foreground text-xs">{a.action}</div>
                {a.detail && <div className="text-muted-foreground text-xs">{a.detail}</div>}
              </div>
              <div className="text-[var(--text-dim)] text-xs">{formatDate(a.time || a.createdAt || '')}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
