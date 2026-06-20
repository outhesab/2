/**
 * Cari listesi, filtreler, yaslandirma bandi ve istatistik kartlari.
 */

import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, HandCoins, UserRoundSearch } from 'lucide-react';
import type { Cari as CariType, DB } from '@/types';
import { exportArrayToExcel, exportToExcel } from '@/lib/excelExport';
import { formatMoney, formatDate } from '@/lib/utils-tr';
import { useLocation } from 'wouter';
import { ActionButtons, StatCard } from '@/pages/pageHelpers';
import { debtColor, type CariWithDays, type AgingBuckets } from './CariHelpers';

interface Props {
  db: DB;
  sorted: CariWithDays[];
  aging: AgingBuckets;
  totalReceivable: number;
  totalPayable: number;
  filter: 'all' | 'musteri' | 'tedarikci';
  setFilter: (v: 'all' | 'musteri' | 'tedarikci') => void;
  search: string;
  setSearch: (v: string) => void;
  showOnlyDebt: boolean;
  setShowOnlyDebt: (v: boolean) => void;
  sortBy: 'name' | 'balance' | 'debt_days';
  setSortBy: (v: 'name' | 'balance' | 'debt_days') => void;
  onOpenAdd: () => void;
  onOpenEdit: (c: CariType) => void;
  onDelete: (id: string) => void;
  onOpenIslem: (cariId: string, cariName: string, type: 'musteri' | 'tedarikci') => void;
  onSetFilterDebtDays: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function CariList({
  db,
  sorted,
  aging,
  totalReceivable,
  totalPayable,
  filter,
  setFilter,
  search,
  setSearch,
  showOnlyDebt,
  setShowOnlyDebt,
  sortBy,
  setSortBy,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onOpenIslem,
  onSetFilterDebtDays,
  showToast,
}: Props) {
  const [, setLocation] = useLocation();

  const agingBuckets = [
    { label: '0–7 gun', items: aging['0-7'], color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { label: '8–30 gun', items: aging['8-30'], color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { label: '31–60 gun', items: aging['31-60'], color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { label: '60+ gun', items: aging['60+'], color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/30' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Toplam Cari" value={String(db.cari.filter((c) => !c.deleted).length)} color="#3b82f6" />
        <StatCard label="Alacak" value={formatMoney(totalReceivable)} color="#10b981" sub="Musterilerden" />
        <StatCard label="Borc" value={formatMoney(totalPayable)} color="#ef4444" sub="Tedarikcilere" />
      </div>

      {(aging['8-30'].length > 0 || aging['31-60'].length > 0 || aging['60+'].length > 0) && (
        <Card className="mb-4 bg-slate-900/60 border-white/5">
          <CardContent className="p-4">
            <div className="text-[0.72rem] font-bold text-slate-400 uppercase tracking-wider mb-3">
              ⏱️ Alacak Yaslandirma
            </div>
            <div className="flex gap-3 flex-wrap">
              {agingBuckets.map((bucket) => (
                <div
                  key={bucket.label}
                  onClick={onSetFilterDebtDays}
                  className={`flex-1 min-w-[120px] ${bucket.bg} ${bucket.border} border rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02]`}
                >
                  <div className={`text-xl font-black leading-none ${bucket.color}`}>
                    {bucket.items.length}
                    <span className="text-xs font-semibold ml-1 opacity-80">musteri</span>
                  </div>
                  <div className={`text-sm font-bold mt-1 ${bucket.color}`}>
                    {formatMoney(bucket.items.reduce((s, c) => s + c.balance, 0))}
                  </div>
                  <div className="text-slate-500 text-[0.65rem] mt-1">{bucket.label}</div>
                </div>
              ))}
            </div>
            {aging['60+'].length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="text-red-500 text-[0.72rem] font-bold">60+ gun bekleyen alacaklar:</div>
                {aging['60+'].slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 bg-red-500/10 rounded-lg p-2">
                    <span className="text-foreground font-semibold text-sm flex-1">{c.name}</span>
                    {c.phone && <span className="text-slate-400 text-xs">📞 {c.phone}</span>}
                    <span className="text-red-500 font-bold text-sm">{formatMoney(c.balance)}</span>
                    <Badge variant="destructive" className="text-[0.72rem] px-2 py-0">
                      {c.debtDays}g
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 h-7 px-3 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenIslem(c.id, c.name, 'musteri');
                      }}
                    >
                      💰 Tahsil Et
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <Button onClick={onOpenAdd} className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-bold rounded-xl px-5">
          + Yeni Cari
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            exportToExcel(db, { sheets: ['cari'] });
            showToast('Excel indirildi!', 'success');
          }}
          className="rounded-xl"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel Indir
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const rows = sorted.map((c) => ({
              Ad: c.name,
              Tur: c.type === 'musteri' ? 'Musteri' : 'Tedarikci',
              Bakiye: c.balance,
              'Borc Gun': c.debtDays ?? '',
              Telefon: c.phone || '',
              'E-posta': c.email || '',
              'Vergi No': c.taxNo || '',
              Adres: c.address || '',
              Not: c.note || '',
            }));
            exportArrayToExcel(rows, 'cari-listesi');
            showToast('Ekstre indirildi!', 'success');
          }}
          className="rounded-xl"
        >
          <HandCoins className="mr-2 h-4 w-4" />
          Ekstre
        </Button>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Ara..."
          className="flex-1 min-w-[200px] rounded-xl"
        />
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'musteri' | 'tedarikci')} className="rounded-xl">
          <TabsList className="bg-slate-800/50 border border-white/10">
            <TabsTrigger value="all">Tumu</TabsTrigger>
            <TabsTrigger value="musteri">Musteri</TabsTrigger>
            <TabsTrigger value="tedarikci">Tedarikci</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={showOnlyDebt ? 'destructive' : 'outline'}
          onClick={() => setShowOnlyDebt(!showOnlyDebt)}
          className="rounded-xl font-semibold text-xs"
        >
          {showOnlyDebt ? '🚨 Borclular' : 'Borclular'}
        </Button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'balance' | 'debt_days')}
          className="p-2 bg-slate-800 border border-white/10 rounded-xl text-slate-400 text-xs cursor-pointer outline-none"
        >
          <option value="name">A–Z</option>
          <option value="balance">Bakiye ↓</option>
          <option value="debt_days">En Eski Borc</option>
        </select>
      </div>

      <div className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/60">
              {['Ad', 'Tur', 'Telefon', 'Bakiye', 'Borc Suresi', 'Son Islem', ''].map((h) => (
                <th key={h} className="p-3 text-left text-muted-foreground text-[0.78rem] font-semibold uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6">
                  <EmptyState
                    icon={UserRoundSearch}
                    title="Cari bulunamadi"
                    description="Arama veya filtrelere gore eslesen musteri/tedarikci kaydi yok."
                    actionLabel="Filtreleri sifirla"
                    onAction={() => {
                      setFilter('all');
                      setShowOnlyDebt(false);
                      setSortBy('name');
                      setSearch('');
                    }}
                  />
                </td>
              </tr>
            ) : (
              sorted.map((c) => {
                const dc = debtColor(c.balance > 0 ? c.debtDays : null);
                const seg =
                  c.type === 'musteri' && c.balance > 50000
                    ? { label: 'VIP', color: 'text-violet-500', bg: 'bg-violet-500/15' }
                    : c.type === 'musteri' && c.balance >= 0
                      ? { label: 'Normal', color: 'text-emerald-500', bg: 'bg-emerald-500/12' }
                      : c.balance < -10000
                        ? { label: 'Riskli', color: 'text-red-500', bg: 'bg-red-500/12' }
                        : null;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setLocation(`/cari/${c.id}`)}
                  >
                    <td data-label="Ad" className="p-3 text-foreground font-semibold">
                      {c.name}
                      {seg && (
                        <span
                          className={`ml-2 ${seg.bg} ${seg.color} rounded px-1.5 py-0.5 text-[0.68rem] font-bold align-middle`}
                        >
                          {seg.label}
                        </span>
                      )}
                    </td>
                    <td data-label="Tur" className="p-3">
                      <Badge
                        variant="outline"
                        className={`font-semibold text-xs ${
                          c.type === 'musteri'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {c.type === 'musteri' ? '👥 Musteri' : '🏭 Tedarikci'}
                      </Badge>
                      {c.ortak && (
                        <Badge
                          variant="outline"
                          className="ml-1 bg-purple-500/10 text-purple-400 border-purple-500/20 text-[0.75rem] font-semibold"
                        >
                          🤝 Ortak
                        </Badge>
                      )}
                    </td>
                    <td data-label="Telefon" className="p-3 text-slate-400">
                      {c.phone || '-'}
                    </td>
                    <td
                      data-label="Bakiye"
                      className={`p-3 font-bold ${
                        c.balance > 0
                          ? c.type === 'musteri'
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                          : c.balance < 0
                            ? 'text-red-500'
                            : 'text-slate-500'
                      }`}
                    >
                      {formatMoney(Math.abs(c.balance))}
                      {c.balance > 0
                        ? c.type === 'musteri'
                          ? ' ↑ alacak'
                          : ' ↑ borc'
                        : c.balance < 0
                          ? ' ↓'
                          : ''}
                    </td>
                    <td data-label="Borc Suresi" className="p-3">
                      {c.balance > 0 && c.debtDays !== null ? (
                        <Badge className={`font-bold text-[0.78rem] px-2 py-0 ${dc.bg} ${dc.color}`}>
                          {dc.label}
                        </Badge>
                      ) : (
                        <span className="text-slate-600 text-[0.78rem]">—</span>
                      )}
                    </td>
                    <td data-label="Son Islem" className="p-3 text-slate-500 text-xs">
                      {c.lastTransaction ? formatDate(c.lastTransaction) : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {c.balance > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-xs font-bold ${
                              c.type === 'musteri'
                                ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20'
                                : 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/20'
                            }`}
                            onClick={() => onOpenIslem(c.id, c.name, c.type)}
                          >
                            {c.type === 'musteri' ? '💰 Tahsilat' : '💸 Ode'}
                          </Button>
                        )}
                        <ActionButtons
                          onEdit={() => onOpenEdit(c)}
                          onDelete={() => onDelete(c.id)}
                          size="small"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
