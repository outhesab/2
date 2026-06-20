import { getAgent } from '@/agents';
import type { YeniSatisParams } from '@/agents/types';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { exportToExcel } from '@/lib/excelExport';
import { formatDate, formatMoney } from '@/lib/utils-tr';
import type { DB, SaleItem } from '@/types';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState';
import { ShoppingCart, FileSpreadsheet, Plus } from 'lucide-react';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { useLocation } from 'wouter';
import SaleFormModal from './SaleFormModal';
import { paymentLabels } from './salesStyles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// VoiceAssistantButton removed in favor of SobaNexus

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function Sales({ db, save: _save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { playSound } = useSoundFeedback();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [_receiptId, setReceiptId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'tamamlandi' | 'iade' | 'iptal'>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  // Yeni satış formu
  const [items, setItems] = useState<SaleItem[]>([]);
  const [cariId, setCariId] = useState('');
  const [payment, setPayment] = useState('nakit');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [tahsilat, setTahsilat] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 16));

  const addItem = (productId: string) => {
    const p = db.products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing)
        return prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * i.unitPrice,
              }
            : i,
        );
      return [
        ...prev,
        {
          productId,
          productName: p.name,
          quantity: 1,
          unitPrice: p.price,
          cost: p.cost,
          total: p.price,
        },
      ];
    });
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty, total: qty * i.unitPrice } : i)),
    );
  };
  const updatePrice = (productId: string, price: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, unitPrice: price, total: i.quantity * price } : i)),
    );
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountNum = parseFloat(discount) || 0;
  const discountAmount = discountType === 'percent' ? subtotal * (discountNum / 100) : discountNum;
  const total = Math.max(0, subtotal - discountAmount);
  const profit = items.reduce((s, i) => s + i.quantity * (i.unitPrice - i.cost), 0) - discountAmount;
  const tahsilatNum = tahsilat === '' ? total : parseFloat(tahsilat) || 0;
  const kalan = total - tahsilatNum;

  const saveSale = async () => {
    if (items.length === 0) {
      showToast('En az bir ürün ekleyin!', 'error');
      return;
    }
    if (!cariId) {
      showToast('Müşteri seçimi zorunludur! Yeni müşteri eklemek için Cari bölümünü kullanın.', 'error');
      return;
    }

    setLoading(true);
    try {
      const params: YeniSatisParams = {
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          cost: i.cost,
          total: i.total,
        })),
        cariId,
        payment: payment as 'nakit' | 'kart' | 'havale' | 'cari',
        discount: discountNum,
        discountAmount,
        tahsilat: tahsilat === '' ? undefined : tahsilatNum,
        saleDate,
      };

      const sonuc = await getAgent('satis').islemYap({ action: 'yeniSatis', payload: params as unknown as Record<string, unknown> });
      if (!sonuc.ok) {
        showToast(sonuc.error || 'Satış kaydedilemedi', 'error');
        return;
      }

      const resultData = sonuc.data as { intentResult: { data: { dbUpdates: { sale: { id: string; total: number } } } } };
      const saleData = resultData.intentResult.data.dbUpdates.sale;
      playSound('sale');
      toast.success(`Satış kaydedildi! ${formatMoney(saleData.total)}`);
      setReceiptId(saleData.id);
      setItems([]);
      setCariId('');
      setPayment('nakit');
      setDiscount('');
      setTahsilat('');
      setSaleDate(new Date().toISOString().slice(0, 16));
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = (id: string) => {
    showConfirm('İade / İptal', 'Bu satışı iade etmek istiyor musunuz? Stoklar geri yüklenecek.', async () => {
      setLoading(true);
      try {
        const sonuc = await getAgent('satis').islemYap({ action: 'iadeYap', payload: { saleId: id } });
        if (sonuc.ok) {
          showToast('İade işlemi tamamlandı!', 'success');
        } else {
          showToast(sonuc.error || 'İade başarısız', 'error');
        }
      } finally {
        setLoading(false);
      }
    });
  };

  const handleCancel = (id: string) => {
    showConfirm('Satış İptal', 'Bu satışı iptal etmek istiyor musunuz? Stoklar geri yüklenecek.', async () => {
      setLoading(true);
      try {
        const sonuc = await getAgent('satis').islemYap({ action: 'iptalEt', payload: { saleId: id } });
        if (sonuc.ok) {
          showToast('Satış iptal edildi!', 'success');
        } else {
          showToast(sonuc.error || 'İptal başarısız', 'error');
        }
      } finally {
        setLoading(false);
      }
    });
  };

  let sales = db.sales.filter((s) => !s.deleted);
  if (filter !== 'all') sales = sales.filter((s) => s.status === filter);
  if (search) sales = sales.filter((s) => s.productName.toLowerCase().includes(search.toLowerCase()));
  if (dateFrom) sales = sales.filter((s) => s.createdAt >= dateFrom);
  if (dateTo) sales = sales.filter((s) => s.createdAt <= dateTo + 'T23:59:59');
  const sorted = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const t = db.sales.filter((s) => !s.deleted && s.status === 'tamamlandi' && s.createdAt.slice(0, 10) === todayStr);
    return {
      count: t.length,
      revenue: t.reduce((s, x) => s + x.total, 0),
      profit: t.reduce((s, x) => s + x.profit, 0),
    };
  }, [db.sales]);

  if (loading) return <SkeletonTable rows={6} cols={9} />;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl p-4 border bg-emerald-500/10 border-emerald-500/25 transition-all hover:scale-[1.02]">
          <div className="text-2xl font-black text-emerald-500">{String(todayStats.count)}</div>
          <div className="text-slate-400 text-xs font-medium mt-1">Bugün Satış</div>
          <div className="text-slate-500 text-xs mt-1">Toplam Ciro: {formatMoney(todayStats.revenue)}</div>
        </div>
        <div className="rounded-xl p-4 border bg-blue-500/10 border-blue-500/25 transition-all hover:scale-[1.02]">
          <div className="text-2xl font-black text-blue-500">{formatMoney(todayStats.revenue)}</div>
          <div className="text-slate-400 text-xs font-medium mt-1">Bugün Ciro</div>
        </div>
        <div className="rounded-xl p-4 border bg-amber-500/10 border-amber-500/25 transition-all hover:scale-[1.02]">
          <div className="text-2xl font-black text-amber-500">{formatMoney(todayStats.profit)}</div>
          <div className="text-slate-400 text-xs font-medium mt-1">Bugün Kâr</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <Button 
          onClick={() => setModalOpen(true)} 
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl px-5 gap-2 transition-all active:scale-95"
        >
          <Plus size={16} /> Yeni Satış
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            exportToExcel(db, {
              sheets: ['satislar'],
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
            });
            showToast('Excel indirildi!', 'success');
          }}
          className="rounded-xl gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Excel İndir
        </Button>
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Ürün ara..." 
            className="pl-9 rounded-xl"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-xl w-[160px]"
        />
        <Input 
          type="date" 
          value={dateTo} 
          onChange={(e) => setDateTo(e.target.value)} 
          className="rounded-xl w-[160px]" 
        />
        <div className="flex gap-2">
          {(['all', 'tamamlandi', 'iade', 'iptal'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 h-8 text-xs font-semibold transition-all ${filter === f ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'text-slate-400'}`}
            >
              {f === 'all' ? 'Tümü' : f === 'tamamlandi' ? '✓ Tamamlandı' : f === 'iade' ? '↩ İade' : '✕ İptal'}
            </Button>
          ))}
        </div>
      </div>

      <div
        className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/60">
              {['Tarih', 'Ürün', 'Müşteri', 'Miktar', 'Tutar', 'Kâr', 'Ödeme', 'Durum', ''].map((h) => (
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
                <td colSpan={9} className="p-6">
                  <EmptyState
                    icon={ShoppingCart}
                    title="Satış bulunamadı"
                    description="Seçili tarih aralığında veya filtrelerde eşleşen satış kaydı yok."
                    actionLabel="Filtreleri temizle"
                    onAction={() => {
                      setFilter('all');
                      setSearch('');
                      setDateFrom('');
                      setDateTo('');
                    }}
                  />
                </td>
              </tr>
            ) : (
              sorted.map((s) => (
                <tr key={s.id} className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                  <td
                    data-label="Tarih"
                    className="p-3 text-muted-foreground text-xs"
                  >
                    {formatDate(s.createdAt)}
                  </td>
                  <td
                    data-label="Ürün"
                    className="p-3 text-foreground font-semibold"
                  >
                    {s.productName}
                  </td>
                  <td
                    data-label="Müşteri"
                    className="p-3 text-slate-400 text-sm"
                  >
                    {db.cari.find((c) => c.id === s.cariId)?.name || '-'}
                  </td>
                  <td data-label="Miktar" className="p-3 text-slate-400">
                    {s.quantity}
                  </td>
                  <td
                    data-label="Tutar"
                    className="p-3 text-emerald-500 font-bold"
                  >
                    {formatMoney(s.total)}
                  </td>
                  <td
                    data-label="Kâr"
                    className={`p-3 font-semibold ${s.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                  >
                    {formatMoney(s.profit)}
                  </td>
                  <td data-label="Ödeme" className="p-3">
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold text-xs"
                    >
                      {(db.kasalar || []).find((k) => k.id === s.payment)?.name ||
                        paymentLabels[s.payment] ||
                        s.payment}
                    </Badge>
                  </td>
                  <td data-label="Durum" className="p-3">
                    <Badge
                      variant="outline"
                      className={`font-semibold text-xs ${
                        s.status === 'tamamlandi' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {s.status === 'tamamlandi' ? '✓ Tamamlandı' : s.status === 'iade' ? '↩ İade' : '✕ İptal'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 h-7 px-2 text-xs font-semibold rounded-lg"
                        onClick={() => setLocation(`/satis/${s.id}`)}
                      >
                        Detay
                      </Button>
                      {s.status === 'tamamlandi' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 h-7 px-2 text-xs font-semibold rounded-lg"
                            onClick={() => handleReturn(s.id)}
                          >
                            ↩ İade
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 h-7 px-2 text-xs font-semibold rounded-lg"
                            onClick={() => handleCancel(s.id)}
                          >
                            ✕ İptal
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SaleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        items={items}
        cariId={cariId}
        setCariId={setCariId}
        payment={payment}
        setPayment={setPayment}
        discount={discount}
        setDiscount={setDiscount}
        discountType={discountType}
        setDiscountType={setDiscountType}
        tahsilat={tahsilat}
        setTahsilat={setTahsilat}
        saleDate={saleDate}
        setSaleDate={setSaleDate}
        addItem={addItem}
        removeItem={removeItem}
        updateQty={updateQty}
        updatePrice={updatePrice}
        saveSale={saveSale}
        cariList={db.cari}
        urunler={db.products}
        kasalar={db.kasalar}
        subtotal={subtotal}
        discountAmount={discountAmount}
        total={total}
        profit={profit}
        tahsilatNum={tahsilatNum}
        kalan={kalan}
        paraUstu={-kalan}
      />

      {/* VoiceAssistantButton removed in favor of SobaNexus */}
    </div>
  );
}
