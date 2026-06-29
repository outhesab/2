/**
 * Cari detay modal icerigi — bakiye, islem gecmisi, ekstre indirme.
 */

import { formatDate, formatMoney } from '@/lib/utils-tr';
import { exportArrayToExcel } from '@/lib/excelExport';
import EmptyState from '@/components/EmptyState';
import { FileSpreadsheet, HandCoins, Users } from 'lucide-react';
import type { Cari as CariType, Sale, KasaEntry, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  detail: CariType & { note?: string };
  detailKasa: KasaEntry[];
  detailSales: Sale[];
  detailInvoices: Invoice[];
  totalPaid: number;
  totalPurchased: number;
  histTab: 'kasa' | 'satis' | 'fatura';
  setHistTab: (t: 'kasa' | 'satis' | 'fatura') => void;
  onQuickAction: (cariId: string, cariName: string, type: 'musteri' | 'tedarikci', balance: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function CariDetail({
  detail,
  detailKasa,
  detailSales,
  detailInvoices,
  totalPaid,
  totalPurchased,
  histTab,
  setHistTab,
  onQuickAction,
  showToast,
}: Props) {
  const stats = [
    {
      label: 'Bakiye',
      value: formatMoney(Math.abs(detail.balance)),
      color: detail.balance > 0 ? 'text-emerald-500' : detail.balance < 0 ? 'text-red-500' : 'text-slate-500',
      icon: detail.balance > 0 ? '↑' : '↓',
    },
    { label: 'Toplam Alisveris', value: formatMoney(totalPurchased), color: 'text-blue-500', icon: '🛒' },
    { label: 'Tahsil Edilen', value: formatMoney(totalPaid), color: 'text-emerald-500', icon: '💰' },
    { label: 'Fatura Sayisi', value: String(detailInvoices.length), color: 'text-violet-500', icon: '📄' },
  ];

  const tabs = [
    { id: 'kasa' as const, label: `💰 Odemeler (${detailKasa.length})` },
    { id: 'satis' as const, label: `🛒 Satislar (${detailSales.length})` },
    { id: 'fatura' as const, label: `📄 Faturalar (${detailInvoices.length})` },
  ];

  const handleExport = () => {
    const rows = [
      ...detailSales.map((s) => ({
        Tarih: formatDate(s.createdAt),
        Islem: 'Satis',
        Tutar: s.total,
        Aciklama: s.productName,
        Odeme: s.payment,
      })),
      ...detailKasa.map((k) => ({
        Tarih: formatDate(k.createdAt),
        Islem: k.type === 'gelir' ? 'Tahsilat' : 'Odeme',
        Tutar: k.type === 'gelir' ? k.amount : -k.amount,
        Aciklama: k.description || '',
        Odeme: k.kasa,
      })),
    ].sort((a, b) => a.Tarih.localeCompare(b.Tarih));
    exportArrayToExcel(rows, `ekstre-${detail.name}`);
    showToast('Ekstre indirildi!', 'success');
  };

  return (
    <>
      {detail.balance > 0 && (
        <button
          onClick={() => onQuickAction(detail.id, detail.name, detail.type, detail.balance)}
          className={`w-full mb-3.5 py-2.5 rounded-lg font-bold text-sm cursor-pointer border ${
            detail.type === 'musteri'
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
              : 'bg-amber-500/15 text-amber-500 border-amber-500/40'
          }`}
        >
          {detail.type === 'musteri'
            ? `💰 Tahsilat Al — Bakiye: ${formatMoney(detail.balance)}`
            : `💸 Odeme Yap — Borc: ${formatMoney(detail.balance)}`}
        </button>
      )}

      <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        {stats.map((s) => (
          <div key={s.label} className="bg-black/25 rounded-lg py-2.5 px-3 text-center border border-white/5">
            <div className="text-sm mb-0.5">{s.icon}</div>
            <div className={`text-base font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-[0.68rem] mt-0.5 font-semibold uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ['Tur', detail.type === 'musteri' ? '👥 Musteri' : '🏭 Tedarikci'],
          ['Telefon', detail.phone || '-'],
          ['E-posta', detail.email || '-'],
          ['Vergi No', detail.taxNo || '-'],
        ].map(([l, v]) => (
          <div key={l} className="bg-white/[0.03] rounded-lg py-1.5 px-3 text-sm">
            <span className="text-slate-500">{l}: </span>
            <span className="text-foreground font-semibold">{v}</span>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/25 hover:bg-emerald-500/20 ml-auto text-xs font-bold"
        >
          📥 Ekstre Indir
        </Button>
      </div>

      {detail.note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg py-2 px-3.5 mb-3.5 text-sm text-amber-300">
          💡 {detail.note}
        </div>
      )}

      <div className="flex gap-1 mb-3 bg-black/20 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setHistTab(t.id)}
            className={`flex-1 py-1.5 px-1 rounded-md border-none cursor-pointer font-bold text-[0.78rem] ${
              histTab === t.id
                ? 'bg-gradient-to-br from-[#ff5722] to-[#ff7043] text-white'
                : 'bg-transparent text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {histTab === 'kasa' &&
        (detailKasa.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Kasa hareketi yok"
            description="Bu cariye bagli kasa hareketi henuz olusmadi."
          />
        ) : (
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Tarih', 'Aciklama', 'Tutar', 'Hesap'].map((h) => (
                    <th key={h} className="py-2 px-2.5 text-left text-slate-400 text-[0.7rem] font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailKasa.map((k) => (
                  <tr key={k.id} className="border-b border-white/5">
                    <td className="py-2 px-2.5 text-slate-500">{formatDate(k.createdAt)}</td>
                    <td className="py-2 px-2.5 text-foreground">{k.description || '-'}</td>
                    <td className={`py-2 px-2.5 font-bold ${k.type === 'gelir' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {k.type === 'gelir' ? '+' : '-'}
                      {formatMoney(k.amount)}
                    </td>
                    <td className="py-2 px-2.5 text-slate-500">{k.kasa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {histTab === 'satis' &&
        (detailSales.length === 0 ? (
          <EmptyState icon={Users} title="Satis kaydi yok" description="Bu cariye ait tamamlanmis satis bulunamadi." />
        ) : (
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Tarih', 'Urun', 'Adet', 'Toplam', 'Odeme'].map((h) => (
                    <th key={h} className="py-2 px-2.5 text-left text-slate-400 text-[0.7rem] font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailSales.map((s) => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2 px-2.5 text-slate-500">{formatDate(s.createdAt)}</td>
                    <td className="py-2 px-2.5 text-foreground">{s.productName || s.items?.[0]?.productName || '-'}</td>
                    <td className="py-2 px-2.5 text-slate-400">
                      {s.quantity || s.items?.reduce((a: number, i: { quantity: number }) => a + i.quantity, 0) || '-'}
                    </td>
                    <td className="py-2 px-2.5 text-emerald-500 font-bold">{formatMoney(s.total)}</td>
                    <td className="py-2 px-2.5 text-slate-500">{s.payment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {histTab === 'fatura' &&
        (detailInvoices.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Fatura kaydi yok"
            description="Bu cariye bagli fatura hareketi bulunamadi."
          />
        ) : (
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['No', 'Tur', 'Tarih', 'Tutar', 'Durum'].map((h) => (
                    <th key={h} className="py-2 px-2.5 text-left text-slate-400 text-[0.7rem] font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5">
                    <td className="py-2 px-2.5 text-[#ff7043] font-mono font-bold">{inv.invoiceNo}</td>
                    <td className="py-2 px-2.5 text-slate-400">{inv.type === 'satis' ? '📤 Satis' : '📥 Alis'}</td>
                    <td className="py-2 px-2.5 text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="py-2 px-2.5 text-emerald-500 font-bold">{formatMoney(inv.total)}</td>
                    <td className="py-2 px-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[0.72rem] font-bold px-1.5 py-0.5 ${
                          inv.status === 'odendi'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : inv.status === 'onaylandi'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </>
  );
}
