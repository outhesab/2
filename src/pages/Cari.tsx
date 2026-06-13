import CariDetail from './CariDetail';
import { useConfirm } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { exportArrayToExcel, exportToExcel } from '@/lib/excelExport';
import { isExactMatch, similarity } from '@/lib/similarity';
import { formatDate, formatMoney, genId } from '@/lib/utils-tr';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, HandCoins, UserRoundSearch } from 'lucide-react';
import type { Cari as CariType, DB } from '@/types';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useDebounce } from './useDebounce';
import { StatCard, ModalActions, FormField, FormTextArea, ActionButtons } from './pageHelpers';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

const empty: Omit<CariType, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'musteri',
  taxNo: '',
  phone: '',
  email: '',
  address: '',
  balance: 0,
  note: '',
};

// Bir carinin borcunun kaç gündür beklendiğini hesapla
function calcDebtDays(
  cari: CariType,
  db: { sales: import('@/types').Sale[]; kasa: import('@/types').KasaEntry[] },
): number | null {
  if (cari.balance <= 0) return null;
  const lastPayment = db.kasa
    .filter((k) => !k.deleted && k.cariId === cari.id && k.type === 'gelir')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const lastPaymentDate = lastPayment ? new Date(lastPayment.createdAt) : null;
  const unpaidSales = db.sales
    .filter((s) => !s.deleted && s.status === 'tamamlandi' && s.cariId === cari.id)
    .filter((s) => !lastPaymentDate || new Date(s.createdAt) > lastPaymentDate)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const oldestUnpaid = unpaidSales[0];
  if (oldestUnpaid) return Math.floor((Date.now() - new Date(oldestUnpaid.createdAt).getTime()) / 86400000);
  if (cari.lastTransaction) return Math.floor((Date.now() - new Date(cari.lastTransaction).getTime()) / 86400000);
  return null;
}

function debtColor(days: number | null): {
  color: string;
  bg: string;
  label: string;
} {
  if (days === null) return { color: '#64748b', bg: 'transparent', label: '' };
  if (days <= 7) return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: `${days}g` };
  if (days <= 30) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: `${days}g` };
  if (days <= 60)
    return {
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      label: `${days}g ⚠️`,
    };
  return {
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.18)',
    label: `${days}g gecikmiş`,
  };
}

import { VoiceAssistantButton } from '@/components/VoiceAssistantButton';

export default function Cari({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'musteri' | 'tedarikci'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'debt_days'>('name');
  const [showOnlyDebt, setShowOnlyDebt] = useState(false);
  const [form, setForm] = useState<Partial<CariType>>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [islemModal, setIslemModal] = useState<{
    cariId: string;
    cariName: string;
    type: 'musteri' | 'tedarikci';
  } | null>(null);
  const [islemForm, setIslemForm] = useState({
    amount: '',
    kasa: 'nakit',
    description: '',
  });

  let cari = db.cari.filter((c) => !c.deleted);
  if (filter !== 'all') cari = cari.filter((c) => c.type === filter);
  if (showOnlyDebt) cari = cari.filter((c) => c.balance > 0);
  if (debouncedSearch)
    cari = cari.filter(
      (c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || (c.phone || '').includes(debouncedSearch),
    );

  const cariWithDays = cari.map((c) => ({
    ...c,
    debtDays: calcDebtDays(c, db),
  }));
  const sorted = [...cariWithDays].sort((a, b) => {
    if (sortBy === 'balance') return b.balance - a.balance;
    if (sortBy === 'debt_days') return (b.debtDays ?? -1) - (a.debtDays ?? -1);
    return (a.name || '').localeCompare(b.name || '', 'tr');
  });

  const aging = {
    '0-7': cariWithDays.filter((c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays <= 7),
    '8-30': cariWithDays.filter(
      (c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays > 7 && c.debtDays <= 30,
    ),
    '31-60': cariWithDays.filter(
      (c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays > 30 && c.debtDays <= 60,
    ),
    '60+': cariWithDays.filter((c) => c.type === 'musteri' && c.debtDays !== null && c.debtDays > 60),
  };

  const totalReceivable = db.cari
    .filter((c) => !c.deleted && c.type === 'musteri' && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);
  const totalPayable = db.cari
    .filter((c) => !c.deleted && c.type === 'tedarikci' && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);

  const openAdd = () => {
    setForm({ ...empty });
    setEditId(null);
    setModalOpen(true);
  };
  const openEdit = (c: CariType) => {
    setForm({ ...c });
    setEditId(c.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    const trimmedName = (form.name || '').trim();
    if (!trimmedName) {
      showToast('Ad gerekli!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();

    if (!editId || !isExactMatch(trimmedName, db.cari.find((c) => c.id === editId)?.name || '')) {
      const aktifCari = db.cari.filter((c) => !c.deleted && c.id !== editId);
      const tamEslesme = aktifCari.find((c) => isExactMatch(c.name, trimmedName));
      if (tamEslesme) {
        showToast(`"${tamEslesme.name}" adında cari zaten var! Kayıt engellendi.`, 'error');
        return;
      }
      const benzer = aktifCari.find((c) => similarity(c.name, trimmedName) >= 70);
      if (benzer) {
        const devamEt = window.confirm(
          `⚠️ "${benzer.name}" adında benzer bir cari mevcut.\nYine de kaydetmek istiyor musunuz?`,
        );
        if (!devamEt) return;
      }
    }

    save((prev) => {
      const cari = [...prev.cari];
      if (editId) {
        const i = cari.findIndex((c) => c.id === editId);
        if (i >= 0)
          cari[i] = {
            ...cari[i],
            ...form,
            name: trimmedName,
            updatedAt: nowIso,
          } as CariType;
        showToast('Cari güncellendi!', 'success');
      } else {
        cari.push({
          id: genId(),
          createdAt: nowIso,
          updatedAt: nowIso,
          name: trimmedName,
          type: 'musteri',
          balance: 0,
          ...form,
        } as CariType);
        showToast('Cari eklendi!', 'success');
      }
      return { ...prev, cari };
    });
    setModalOpen(false);
  };

  const handleIslem = () => {
    if (!islemModal) return;
    const amount = parseFloat(islemForm.amount);
    if (!amount || amount <= 0) {
      showToast('Geçerli tutar girin!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    const isTahsilat = islemModal.type === 'musteri'; // müşteriden tahsilat = gelir; tedarikçiye ödeme = gider
    const kasaType = isTahsilat ? ('gelir' as const) : ('gider' as const);
    const category = isTahsilat ? 'tahsilat' : 'tedarik';
    const desc =
      islemForm.description || (isTahsilat ? `Tahsilat: ${islemModal.cariName}` : `Ödeme: ${islemModal.cariName}`);

    save((prev) => {
      const kasaEntry = {
        id: genId(),
        type: kasaType,
        category,
        amount,
        kasa: islemForm.kasa,
        description: desc,
        cariId: islemModal.cariId,
        relatedId: islemModal.cariId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      // Her iki durumda da cari bakiye azalır (alacak tahsil edildi / borç ödendi)
      const cari = prev.cari.map((c) =>
        c.id === islemModal.cariId
          ? {
              ...c,
              balance: (c.balance || 0) - amount,
              lastTransaction: nowIso,
              updatedAt: nowIso,
            }
          : c,
      );

      // Ortak cari ise → kasadan çekim ortakEmanetler'e de yazılır
      const cariRec = prev.cari.find((c) => c.id === islemModal.cariId);
      let ortakEmanetler = prev.ortakEmanetler || [];
      if (cariRec?.ortak && cariRec?.partnerId && kasaType === 'gider') {
        ortakEmanetler = [
          ...ortakEmanetler,
          {
            id: genId(),
            partnerId: cariRec.partnerId,
            description: desc || `Kasadan çekim: ${islemModal.cariName}`,
            amount,
            note: `Kasa: ${islemForm.kasa}`,
            type: 'emanet' as const,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }

      return { ...prev, kasa: [...prev.kasa, kasaEntry], cari, ortakEmanetler };
    });

    showToast(
      isTahsilat ? `Tahsilat kaydedildi: ${formatMoney(amount)}` : `Ödeme kaydedildi: ${formatMoney(amount)}`,
      'success',
    );
    setIslemModal(null);
    setIslemForm({ amount: '', kasa: 'nakit', description: '' });
  };

  const handleDelete = (id: string) => {
    // İlişkili kayıt kontrolü
    const relatedSales = db.sales.filter((s) => !s.deleted && s.cariId === id);
    const relatedKasa = db.kasa.filter((k) => !k.deleted && k.cariId === id);
    const hasRelated = relatedSales.length > 0 || relatedKasa.length > 0;
    const msg = hasRelated
      ? `Bu cariye ait ${relatedSales.length} satış ve ${relatedKasa.length} kasa kaydı var. Silinen cari gizlenecek ancak geçmiş kayıtlar korunacak.`
      : 'Bu cari kaydını silmek istediğinizden emin misiniz?';
    showConfirm('Cari Sil', msg, () => {
      const nowIso = new Date().toISOString();
      save((prev) => ({
        ...prev,
        cari: prev.cari.map((c) => (c.id === id ? { ...c, deleted: true, updatedAt: nowIso } : c)),
      }));
      showToast('Cari silindi!', 'success');
    });
  };

  const detail = detailId ? db.cari.find((c) => c.id === detailId) : null;
  const detailKasa = detailId
    ? db.kasa
        .filter((k) => !k.deleted && k.cariId === detailId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30)
    : [];
  const detailSales =
    detailId && detail
      ? db.sales
          .filter((s) => s.cariId === detailId || s.cariName === detail.name || s.customerName === detail.name)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20)
      : [];
  const detailInvoices = detailId
    ? (db.invoices || [])
        .filter((inv) => inv.cariId === detailId || (detail && inv.cariName === detail.name))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
    : [];
  const totalPaid = detailKasa.filter((k) => k.type === 'gelir').reduce((s, k) => s + k.amount, 0);
  const totalPurchased =
    detailSales.reduce((s, s2) => s + s2.total, 0) +
    detailInvoices.filter((i) => i.type === 'satis').reduce((s, i) => s + i.total, 0);
  const [histTab, setHistTab] = useState<'kasa' | 'satis' | 'fatura'>('kasa');

  return (
    <div>
      {/* Stat kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Toplam Cari" value={String(db.cari.filter((c) => !c.deleted).length)} color="#3b82f6" />
        <StatCard label="Alacak" value={formatMoney(totalReceivable)} color="#10b981" sub="Müşterilerden" />
        <StatCard label="Borç" value={formatMoney(totalPayable)} color="#ef4444" sub="Tedarikçilere" />
      </div>

      {/* Alacak Yaşlandırma Bandı */}
      {(aging['8-30'].length > 0 || aging['31-60'].length > 0 || aging['60+'].length > 0) && (
        <Card className="mb-4 bg-slate-900/60 border-white/5">
          <CardContent className="p-4">
            <div className="text-[0.72rem] font-bold text-slate-400 uppercase tracking-wider mb-3">
              ⏱️ Alacak Yaşlandırma
            </div>
            <div className="flex gap-3 flex-wrap">
              {[
                {
                  label: '0–7 gün',
                  items: aging['0-7'],
                  color: '#10b981',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/30',
                },
                {
                  label: '8–30 gün',
                  items: aging['8-30'],
                  color: '#f59e0b',
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/30',
                },
                {
                  label: '31–60 gün',
                  items: aging['31-60'],
                  color: '#ef4444',
                  bg: 'bg-red-500/10',
                  border: 'border-red-500/30',
                },
                {
                  label: '60+ gün',
                  items: aging['60+'],
                  color: '#dc2626',
                  bg: 'bg-red-600/10',
                  border: 'border-red-600/30',
                },
              ].map((bucket) => (
                <div
                  key={bucket.label}
                  onClick={() => {
                    setFilter('musteri');
                    setShowOnlyDebt(true);
                    setSortBy('debt_days');
                  }}
                  className={`flex-1 min-w-[120px] ${bucket.bg} ${bucket.border} border rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02]`}
                >
                  <div style={{ color: bucket.color }} className="text-xl font-black leading-none">
                    {bucket.items.length}
                    <span className="text-xs font-semibold ml-1 opacity-80">müşteri</span>
                  </div>
                  <div style={{ color: bucket.color }} className="text-sm font-bold mt-1">
                    {formatMoney(bucket.items.reduce((s, c) => s + c.balance, 0))}
                  </div>
                  <div className="text-slate-500 text-[0.65rem] mt-1">
                    {bucket.label}
                  </div>
                </div>
              ))}
            </div>
            {aging['60+'].length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="text-red-500 text-[0.72rem] font-bold">
                  60+ gün bekleyen alacaklar:
                </div>
                {aging['60+'].slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 bg-red-500/10 rounded-lg p-2"
                  >
                    <span className="text-foreground font-semibold text-sm flex-1">
                      {c.name}
                    </span>
                    {c.phone && <span className="text-slate-400 text-xs">📞 {c.phone}</span>}
                    <span className="text-red-500 font-bold text-sm">
                      {formatMoney(c.balance)}
                    </span>
                    <Badge variant="destructive" className="text-[0.72rem] px-2 py-0">
                      {c.debtDays}g
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 h-7 px-3 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIslemModal({
                          cariId: c.id,
                          cariName: c.name,
                          type: 'musteri',
                        });
                        setIslemForm({
                          amount: String(c.balance),
                          kasa: 'nakit',
                          description: '',
                        });
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
        <Button onClick={openAdd} className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-bold rounded-xl px-5">
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
          Excel İndir
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const rows = sorted.map((c) => ({
              Ad: c.name,
              Tür: c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi',
              Bakiye: c.balance,
              'Borç Gün': c.debtDays ?? '',
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
        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'musteri' | 'tedarikci')} className="rounded-xl">
          <TabsList className="bg-slate-800/50 border border-white/10">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="musteri">Müşteri</TabsTrigger>
            <TabsTrigger value="tedarikci">Tedarikçi</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={showOnlyDebt ? 'destructive' : 'outline'}
          onClick={() => setShowOnlyDebt((v) => !v)}
          className="rounded-xl font-semibold text-xs"
        >
          {showOnlyDebt ? '🚨 Borçlular' : 'Borçlular'}
        </Button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="p-2 bg-slate-800 border border-white/10 rounded-xl text-slate-400 text-xs cursor-pointer outline-none"
        >
          <option value="name">A–Z</option>
          <option value="balance">Bakiye ↓</option>
          <option value="debt_days">En Eski Borç</option>
        </select>
      </div>

      <div
        className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/60">
              {['Ad', 'Tür', 'Telefon', 'Bakiye', 'Borç Süresi', 'Son İşlem', ''].map((h) => (
                <th
                  key={h}
                  className="p-3 text-left text-muted-foreground text-[0.78rem] font-semibold uppercase"
                >
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
                    title="Cari bulunamadı"
                    description="Arama veya filtrelere göre eşleşen müşteri/tedarikçi kaydı yok."
                    actionLabel="Filtreleri sıfırla"
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
                return (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setLocation(`/cari/${c.id}`)}
                  >
                    <td
                      data-label="Ad"
                      className="p-3 text-foreground font-semibold"
                    >
                      {c.name}
                      {(() => {
                        const seg =
                          c.type === 'musteri' && c.balance > 50000
                            ? { label: 'VIP', color: '#8b5cf6', bg: 'bg-violet-500/15' }
                            : c.type === 'musteri' && c.balance >= 0
                              ? { label: 'Normal', color: '#10b981', bg: 'bg-emerald-500/12' }
                              : c.balance < -10000
                                ? { label: 'Riskli', color: '#ef4444', bg: 'bg-red-500/12' }
                                : null;
                        if (!seg) return null;
                        return (
                          <span
                            className={`ml-2 ${seg.bg} text-white rounded px-1.5 py-0.5 text-[0.68rem] font-bold align-middle`}
                            style={{ color: seg.color }}
                          >
                            {seg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td data-label="Tür" className="p-3">
                      <Badge
                        variant="outline"
                        className={`font-semibold text-xs ${
                          c.type === 'musteri' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {c.type === 'musteri' ? '👥 Müşteri' : '🏭 Tedarikçi'}
                      </Badge>
                      {c.ortak && (
                        <Badge variant="outline" className="ml-1 bg-purple-500/10 text-purple-400 border-purple-500/20 text-[0.75rem] font-semibold">
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
                      {c.balance > 0 ? (c.type === 'musteri' ? ' ↑ alacak' : ' ↑ borç') : c.balance < 0 ? ' ↓' : ''}
                    </td>
                    <td data-label="Borç Süresi" className="p-3">
                      {c.balance > 0 && c.debtDays !== null ? (
                        <Badge
                          className={`font-bold text-[0.78rem] px-2 py-0 ${
                            c.debtDays <= 7 ? 'bg-emerald-500/10 text-emerald-500' :
                            c.debtDays <= 30 ? 'bg-amber-500/10 text-amber-500' :
                            c.debtDays <= 60 ? 'bg-red-500/10 text-red-500' : 'bg-red-600/20 text-red-600'
                          }`}
                        >
                          {dc.label}
                        </Badge>
                      ) : (
                        <span className="text-slate-600 text-[0.78rem]">—</span>
                      )}
                    </td>
                    <td
                      data-label="Son İşlem"
                      className="p-3 text-slate-500 text-xs"
                    >
                      {c.lastTransaction ? formatDate(c.lastTransaction) : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {c.balance > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-xs font-bold ${
                              c.type === 'musteri' ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20' : 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/20'
                            }`}
                            onClick={() => {
                              setIslemModal({
                                cariId: c.id,
                                cariName: c.name,
                                type: c.type,
                              });
                              setIslemForm({
                                amount: '',
                                kasa: 'nakit',
                                description: '',
                              });
                            }}
                          >
                            {c.type === 'musteri' ? '💰 Tahsilat' : '💸 Öde'}
                          </Button>
                        )}
                        <ActionButtons onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id)} size="small" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Cari Düzenle' : '🆕 Yeni Cari'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <Label>Ad *</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Cari adı"
            />
          </div>
          <div>
            <Label>Tür</Label>
            <select
              value={form.type || 'musteri'}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as 'musteri' | 'tedarikci',
                }))
              }
              className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none"
            >
              <option value="musteri">👥 Müşteri</option>
              <option value="tedarikci">🏭 Tedarikçi</option>
            </select>
          </div>
          <FormField label="Telefon" value={form.phone || ''} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <FormField label="Vergi No" value={form.taxNo || ''} onChange={(v) => setForm((f) => ({ ...f, taxNo: v }))} />
          <FormField
            label="E-posta"
            value={form.email || ''}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            type="email"
          />
          <div className="col-span-1 md:col-span-2">
            <Label>Adres</Label>
            <textarea
              value={form.address || ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none min-h-[60px]"
            />
          </div>
          <FormTextArea
            label="Not / Açıklama"
            value={form.note || ''}
            onChange={(v) => setForm((f) => ({ ...f, note: v }))}
            placeholder="Müşteri hakkında notlar..."
            minHeight={50}
            gridColumn="1/-1"
          />
        </div>
        <ModalActions onSave={handleSave} onCancel={() => setModalOpen(false)} />
      </Modal>

      {/* Tahsilat / Ödeme Modalı */}
      {islemModal && (
        <Modal
          open={!!islemModal}
          onClose={() => setIslemModal(null)}
          title={
            islemModal.type === 'musteri' ? `💰 Tahsilat — ${islemModal.cariName}` : `💸 Ödeme — ${islemModal.cariName}`
          }
        >
          <div className="grid gap-4">
            <div>
              <Label>Tutar (₺) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={islemForm.amount}
                min={0}
                step={0.01}
                placeholder="0,00"
                onChange={(e) => setIslemForm((f) => ({ ...f, amount: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <Label>Kasa / Hesap</Label>
              <select
                value={islemForm.kasa}
                onChange={(e) => setIslemForm((f) => ({ ...f, kasa: e.target.value }))}
                className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none"
              >
                {(
                  db.kasalar || [
                    { id: 'nakit', name: 'Nakit', icon: '💵' },
                    { id: 'banka', name: 'Banka', icon: '🏦' },
                  ]
                ).map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.icon} {k.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                value={islemForm.description}
                onChange={(e) => setIslemForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={islemModal.type === 'musteri' ? 'Tahsilat açıklaması...' : 'Ödeme açıklaması...'}
              />
            </div>
          </div>
          <ModalActions
            onSave={handleIslem}
            onCancel={() => setIslemModal(null)}
            saveLabel={islemModal.type === 'musteri' ? '💾 Tahsilatı Kaydet' : '💾 Ödemeyi Kaydet'}
            saveColor={islemModal.type === 'musteri' ? '#10b981' : '#f59e0b'}
          />
        </Modal>
      )}

      {detail && (
        <Modal
          open={!!detailId}
          onClose={() => {
            setDetailId(null);
            setHistTab('kasa');
          }}
          title={`👥 ${detail.name}`}
          maxWidth={680}
        >
          <CariDetail
            detail={detail}
            detailKasa={detailKasa}
            detailSales={detailSales}
            detailInvoices={detailInvoices}
            totalPaid={totalPaid}
            totalPurchased={totalPurchased}
            histTab={histTab}
            setHistTab={setHistTab}
            onQuickAction={(cariId: string, cariName: string, type: 'musteri' | 'tedarikci', balance: number) => {
              setIslemModal({ cariId, cariName, type });
              setIslemForm({ amount: String(balance), kasa: 'nakit', description: '' });
            }}
            showToast={showToast}
          />
        </Modal>
      )}
      <VoiceAssistantButton />
    </div>
  );
}
