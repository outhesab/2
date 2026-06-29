import EmptyState from '@/components/EmptyState';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { ChevronDown, Coins, CreditCard, Download, Landmark, Plus, WalletCards } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { exportToExcel } from '@/lib/excelExport';
import { genId, formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';
import DOMPurify from 'dompurify';
import { TableFilterBar, TableWrapper } from '@/pages/pageHelpers.tsx';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

// VoiceAssistantButton removed in favor of SobaNexus

export default function Kasa({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { playSound } = useSoundFeedback();
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [kasaFilter, setKasaFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sayimModal, setSayimModal] = useState(false);
  const [sayimForm, setSayimForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sayimDate, setSayimDate] = useState(new Date().toISOString().slice(0, 10));

  const kasalar = useMemo(
    () =>
      db.kasalar || [
        { id: 'nakit', name: 'Nakit', icon: '💵' },
        { id: 'banka', name: 'Banka', icon: '🏦' },
      ],
    [db.kasalar],
  );

  const bakiyeler = useMemo(() => {
    const map: Record<string, number> = {};
    kasalar.forEach((k) => (map[k.id] = 0));
    db.kasa
      .filter((e) => !e.deleted)
      .forEach((e) => {
        map[e.kasa] = (map[e.kasa] || 0) + (e.type === 'gelir' ? e.amount : -e.amount);
      });
    return map;
  }, [db.kasa, kasalar]);

  const sayimFarklar = useMemo(() => {
    const result: { kasaId: string; kasaName: string; icon: string; fiziki: number; sistem: number; fark: number }[] =
      [];
    kasalar.forEach((k) => {
      const fiziki = parseFloat(sayimForm[k.id] || '0') || 0;
      const sistem = bakiyeler[k.id] || 0;
      result.push({ kasaId: k.id, kasaName: k.name, icon: k.icon, fiziki, sistem, fark: fiziki - sistem });
    });
    return result;
  }, [kasalar, bakiyeler, sayimForm]);
  const sayimToplamFark = sayimFarklar.reduce((s, f) => s + Math.abs(f.fark), 0);
  const gunSonuSayimPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gün Sonu Sayım - ${esc(sayimDate)}</title><style>body{font-family:Arial,sans-serif;margin:40px}h1{color:#333;border-bottom:2px solid #ff5722;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1e293b;color:#fff;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}.yesil{color:#10b981;font-weight:700}.kirmizi{color:#ef4444;font-weight:700}.toplam{margin-top:20px;font-size:1.1rem;font-weight:700}.footer{margin-top:40px;color:#666;font-size:0.85rem}</style></head><body>
    <h1>📋 Gün Sonu Sayım ${esc(sayimDate)}</h1>
    <table><thead><tr><th>Kasa</th><th>Sistem Bakiyesi</th><th>Fiziki Sayım</th><th>Fark</th></tr></thead><tbody>
    ${sayimFarklar
      .map((f) => {
        const cls = f.fark > 0 ? 'yesil' : f.fark < 0 ? 'kirmizi' : '';
        return `<tr><td>${esc(f.icon)} ${esc(f.kasaName)}</td><td>₺${f.sistem.toFixed(2)}</td><td>₺${f.fiziki.toFixed(2)}</td><td class="${cls}">${f.fark >= 0 ? '+' : ''}₺${f.fark.toFixed(2)}</td></tr>`;
      })
      .join('')}
    </tbody></table>
    <div class="toplam">Toplam Fark: <span class="${sayimToplamFark > 0 ? 'kirmizi' : ''}">₺${sayimToplamFark.toFixed(2)}</span></div>
    <div class="footer">${new Date().toLocaleString('tr-TR')} · PARSPEL Gün Sonu Raporu</div></body></html>`;
    w.document.write(DOMPurify.sanitize(html));
    w.document.close();
    w.print();
  };

  const catLabels: Record<string, string> = {
    satis: '🛒 Satış',
    tahsilat: '💰 Tahsilat',
    diger_gelir: '➕ Diğer Gelir',
    ortak_tahsilat: '🤝 Ortak Tahsilat',
    tedarik: '🏭 Tedarik',
    kira: '🏠 Kira',
    maas: '👤 Maaş',
    fatura: '📄 Fatura',
    nakliye: '🚛 Nakliye',
    diger_gider: '➖ Diğer Gider',
    iade: '🔄 İade',
  };
  const [form, setForm] = useState({
    amount: '',
    description: '',
    kasa: 'nakit',
    cariId: '',
    partnerId: '',
    category: '',
  });

  const totalBakiye = Object.values(bakiyeler).reduce((s, v) => s + v, 0);
  const posBakiyeleri = {
    pos_ziraat: bakiyeler.pos_ziraat || 0,
    pos_is: bakiyeler.pos_is || 0,
    pos_yk: bakiyeler.pos_yk || 0,
  };
  const totalPos = Object.values(posBakiyeleri).reduce((sum, value) => sum + value, 0);
  const bankaToplam = (bakiyeler.banka || 0) + totalPos;

  let entries = db.kasa.filter((e) => !e.deleted);
  if (filter === 'gelir') entries = entries.filter((e) => e.type === 'gelir');
  else if (filter === 'gider') entries = entries.filter((e) => e.type === 'gider');
  if (kasaFilter !== 'all') entries = entries.filter((e) => e.kasa === kasaFilter);
  if (search)
    entries = entries.filter(
      (e) =>
        (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (catLabels[e.category] || e.category || '').toLowerCase().includes(search.toLowerCase()),
    );
  if (dateFrom) entries = entries.filter((e) => e.createdAt >= dateFrom);
  if (dateTo) entries = entries.filter((e) => e.createdAt <= dateTo + 'T23:59:59');
  const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const saveEntry = (type: 'gelir' | 'gider') => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      showToast('Geçerli tutar girin!', 'error');
      return;
    }
    if (form.category === 'ortak_tahsilat' && !form.partnerId) {
      showToast('Ortak tahsilat için ortak seçin!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    const entry = {
      id: genId(),
      type,
      category: form.category || (type === 'gelir' ? 'diger_gelir' : 'diger_gider'),
      amount,
      kasa: form.kasa,
      description: form.description,
      cariId: form.cariId || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setLoading(true);
    save((prev) => {
      let cari = prev.cari;
      if (form.cariId) {
        cari = cari.map((c) =>
          c.id === form.cariId
            ? { ...c, balance: (c.balance || 0) - amount, lastTransaction: nowIso, updatedAt: nowIso }
            : c,
        );
      }
      // Ortak tahsilatı → ortakEmanetler'e de yaz
      let ortakEmanetler = prev.ortakEmanetler || [];
      if (form.partnerId && entry.category === 'ortak_tahsilat') {
        ortakEmanetler = [
          ...ortakEmanetler,
          {
            id: genId(),
            partnerId: form.partnerId,
            amount,
            note: form.description || 'Kasa tahsilatı',
            description: form.description || 'Kasa tahsilatı',
            type: 'emanet' as const,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }
      return { ...prev, kasa: [...prev.kasa, entry], cari, ortakEmanetler };
    });
    setLoading(false);
    playSound(type === 'gelir' ? 'success' : 'notification');
    showToast(`${type === 'gelir' ? 'Gelir' : 'Gider'} kaydedildi!`, 'success');
    setForm({ amount: '', description: '', kasa: 'nakit', cariId: '', partnerId: '', category: '' });
    setIncomeModal(false);
    setExpenseModal(false);
  };

  const deleteEntry = (id: string) => {
    showConfirm('Kaydı Sil', 'Bu kasa kaydını silmek istediğinizden emin misiniz?', () => {
      const nowIso = new Date().toISOString();
      setLoading(true);
      save((prev) => {
        const entry = prev.kasa.find((e) => e.id === id);
        if (!entry) return prev;

        // Soft delete
        const kasa = prev.kasa.map((e) => (e.id === id ? { ...e, deleted: true, updatedAt: nowIso } : e));

        // Cari bakiyeyi geri al
        let cari = prev.cari;
        if (entry.cariId) {
          cari = cari.map((c) =>
            c.id === entry.cariId
              ? { ...c, balance: (c.balance || 0) + entry.amount, lastTransaction: nowIso, updatedAt: nowIso }
              : c,
          );
        }

        return { ...prev, kasa, cari };
      });
      setLoading(false);
      showToast('Kayıt silindi!', 'success');
    });
  };

  const incomeCategories = ['satis', 'tahsilat', 'ortak_tahsilat', 'diger_gelir'];
  const expenseCategories = ['tedarik', 'kira', 'maas', 'fatura', 'nakliye', 'diger_gider'];

  const EntryModal = ({ type, open, onClose }: { type: 'gelir' | 'gider'; open: boolean; onClose: () => void }) => (
    <Modal open={open} onClose={onClose} title={type === 'gelir' ? '💚 Gelir Ekle' : '🔴 Gider Ekle'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block mb-1.5 text-slate-400 text-xs font-medium">Tutar (₺) *</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
            placeholder="0,00"
            min={0}
            step={0.01}
          />
        </div>
        <div>
          <label className="block mb-1.5 text-slate-400 text-xs font-medium">Kasa</label>
          <select
            value={form.kasa}
            onChange={(e) => setForm((f) => ({ ...f, kasa: e.target.value }))}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
          >
            {kasalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.icon} {k.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1.5 text-slate-400 text-xs font-medium">Kategori</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
          >
            <option value="">Seçin</option>
            {(type === 'gelir' ? incomeCategories : expenseCategories).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-1.5 text-slate-400 text-xs font-medium">Cari (opsiyonel)</label>
          <select
            value={form.cariId}
            onChange={(e) => setForm((f) => ({ ...f, cariId: e.target.value }))}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
          >
            <option value="">-- Cari Seç --</option>
            {db.cari.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {type === 'gelir' && form.category === 'ortak_tahsilat' && (
          <div className="sm:col-span-2">
            <label className="block mb-1.5 text-slate-400 text-xs font-medium">Ortak *</label>
            <select
              value={form.partnerId}
              onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
              className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
            >
              <option value="">-- Ortak Seç --</option>
              {(db.partners || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="block mb-1.5 text-slate-400 text-xs font-medium">Açıklama</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
            placeholder="Açıklama..."
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => saveEntry(type)}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 ${type === 'gelir' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
        >
          💾 Kaydet
        </button>
        <button
          onClick={onClose}
          className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-400 py-2.5 rounded-xl text-sm transition-all"
        >
          İptal
        </button>
      </div>
    </Modal>
  );

  if (loading) return <SkeletonTable rows={6} cols={7} />;

  return (
    <div>
      <div className="grid gap-3 mb-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Kasa', value: totalBakiye, icon: WalletCards },
          { label: 'Nakit', value: bakiyeler.nakit || 0, icon: Coins },
          { label: 'Banka', value: bankaToplam, icon: Landmark },
          { label: 'POS', value: totalPos, icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-xl p-4 border bg-card transition-all hover:scale-[1.02] cursor-pointer ${item.label === 'Kasa' ? 'cursor-default' : 'hover:border-blue-500/30'}`}
              onClick={
                item.label === 'Nakit'
                  ? () => setKasaFilter('nakit')
                  : item.label === 'Banka'
                    ? () => setKasaFilter('banka')
                    : undefined
              }
            >
              <div className="text-muted-foreground text-[0.7rem] mb-1 flex items-center gap-2 uppercase font-semibold">
                <Icon size={14} /> {item.label}
              </div>
              <div className={`text-2xl font-black ${item.value >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                {formatMoney(item.value)}
              </div>
              {item.label === 'POS' && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-[0.65rem] text-slate-500 bg-slate-900/40 px-1.5 py-0.5 rounded">
                    Ziraat {formatMoney(posBakiyeleri.pos_ziraat)}
                  </span>
                  <span className="text-[0.65rem] text-slate-500 bg-slate-900/40 px-1.5 py-0.5 rounded">
                    İş {formatMoney(posBakiyeleri.pos_is)}
                  </span>
                  <span className="text-[0.65rem] text-slate-500 bg-slate-900/40 px-1.5 py-0.5 rounded">
                    YK {formatMoney(posBakiyeleri.pos_yk)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Yeni İşlem
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setIncomeModal(true)} className="cursor-pointer">
              Gelir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExpenseModal(true)} className="cursor-pointer">
              Gider
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          onClick={() => {
            setSayimForm(Object.fromEntries(kasalar.map((k) => [k.id, ''])));
            setSayimModal(true);
          }}
          className="gap-2"
        >
          <WalletCards size={16} />
          Gün Sonu Sayım
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            exportToExcel(db, { sheets: ['kasa'] });
            showToast('Excel indirildi!', 'success');
          }}
          className="gap-2"
        >
          <Download size={16} />
          Excel İndir
        </Button>
        <TableFilterBar
          search={search}
          onSearchChange={setSearch}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClearDates={() => {
            setDateFrom('');
            setDateTo('');
          }}
        />
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="gelir">Gelir</TabsTrigger>
            <TabsTrigger value="gider">Gider</TabsTrigger>
          </TabsList>
        </Tabs>
        {kasaFilter !== 'all' && (
          <button
            onClick={() => setKasaFilter('all')}
            className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            ✕ Filtre Kaldır
          </button>
        )}
      </div>

      <TableWrapper
        columns={['Tarih', 'Açıklama', 'Kategori', 'Kasa', 'Tutar', 'Tür', '']}
        noData={
          sorted.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="Kasa kaydı bulunamadı"
              description="Seçili filtrelerle eşleşen gelir veya gider hareketi yok."
              actionLabel="Filtreleri temizle"
              onAction={() => {
                setFilter('all');
                setKasaFilter('all');
                setSearch('');
                setDateFrom('');
                setDateTo('');
              }}
            />
          ) : undefined
        }
        colSpan={7}
      >
        {sorted.map((e) => (
          <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td data-label="Tarih" className="p-3 text-muted-foreground text-xs">
              {formatDate(e.createdAt)}
            </td>
            <td data-label="Açıklama" className="p-3 text-foreground text-sm font-medium max-w-[200px] truncate">
              {e.description || '-'}
            </td>
            <td data-label="Kategori" className="p-3 text-slate-400 text-xs">
              {catLabels[e.category] || e.category || '-'}
            </td>
            <td data-label="Kasa" className="p-3 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                {kasalar.find((k) => k.id === e.kasa)?.icon} {e.kasa}
              </span>
            </td>
            <td
              data-label="Tutar"
              className={`p-3 font-bold ${e.type === 'gelir' ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {e.type === 'gelir' ? '+' : '-'}
              {formatMoney(e.amount)}
            </td>
            <td data-label="Tür" className="p-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${e.type === 'gelir' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
              >
                {e.type === 'gelir' ? '💚 Gelir' : '🔴 Gider'}
              </Badge>
            </td>
            <td className="p-3">
              <button
                onClick={() => deleteEntry(e.id)}
                className="text-red-500 hover:text-red-400 transition-colors p-1"
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </TableWrapper>

      <EntryModal type="gelir" open={incomeModal} onClose={() => setIncomeModal(false)} />
      <EntryModal type="gider" open={expenseModal} onClose={() => setExpenseModal(false)} />

      <Modal open={sayimModal} onClose={() => setSayimModal(false)} title="📋 Gün Sonu Sayım">
        <div className="mb-4">
          <label className="block mb-1.5 text-slate-400 text-xs font-medium">Tarih</label>
          <input
            type="date"
            value={sayimDate}
            onChange={(e) => setSayimDate(e.target.value)}
            className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
          />
        </div>
        <div className="grid gap-3">
          {kasalar.map((k) => {
            const fiziki = parseFloat(sayimForm[k.id] || '0') || 0;
            const sistem = bakiyeler[k.id] || 0;
            const fark = fiziki - sistem;
            const farkColor = fark > 0 ? 'text-emerald-500' : fark < 0 ? 'text-red-500' : 'text-slate-500';
            const borderColor = fark > 0 ? 'border-emerald-500/30' : fark < 0 ? 'border-red-500/30' : 'border-border';
            const bgColor = fark > 0 ? 'bg-emerald-500/5' : fark < 0 ? 'bg-red-500/5' : 'bg-slate-900/40';
            return (
              <div key={k.id} className={`rounded-xl p-4 border transition-all ${borderColor} ${bgColor}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{k.icon}</span>
                    <span className="text-foreground font-bold">{k.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 text-[0.65rem] uppercase font-semibold">Sistem Bakiyesi</div>
                    <div className="text-foreground font-bold">{formatMoney(sistem)}</div>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="block mb-1 text-slate-500 text-[0.7rem] font-medium">Fiziki Sayım</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={sayimForm[k.id] || ''}
                      onChange={(e) => setSayimForm((f) => ({ ...f, [k.id]: e.target.value }))}
                      className="w-full p-3 bg-slate-950 border border-border rounded-xl text-center text-xl font-black outline-none focus:ring-2 ring-blue-500/20 transition-all"
                      placeholder="0,00"
                      step={0.01}
                    />
                  </div>
                </div>
                {sayimForm[k.id] && sayimForm[k.id] !== '' && (
                  <div
                    className={`mt-3 flex justify-between items-center p-2 rounded-lg ${fark !== 0 ? 'bg-slate-900/60' : 'bg-transparent'}`}
                  >
                    <span className="text-slate-500 text-xs">Fark</span>
                    <span className={`font-black text-lg ${farkColor}`}>
                      {fark >= 0 ? '+' : ''}
                      {formatMoney(fark)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {sayimToplamFark > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 font-bold text-sm flex items-center gap-2">
              ⚠️ Toplam Fark: {formatMoney(sayimToplamFark)} — Sayım sonuçlarını kontrol edin.
            </span>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={gunSonuSayimPDF}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            🖨️ PDF Yazdır
          </button>
          <button
            onClick={() => setSayimModal(false)}
            className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-400 py-2.5 rounded-xl text-sm transition-all"
          >
            Kapat
          </button>
        </div>
      </Modal>
      {/* VoiceAssistantButton removed in favor of SobaNexus */}
    </div>
  );
}
