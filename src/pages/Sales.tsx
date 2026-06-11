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
import { ShoppingCart } from 'lucide-react';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { useLocation } from 'wouter';
import SaleFormModal from './SaleFormModal';
import { StatCard } from './SalesHelpers';
import { sinp, paymentLabels } from './salesStyles';
import { VoiceAssistantButton } from '@/components/VoiceAssistantButton';

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

      const sonuc = await getAgent('satis').yeniSatis(params);
      if (!sonuc.ok) {
        showToast(sonuc.error || 'Satış kaydedilemedi', 'error');
        return;
      }

      playSound('sale');
      toast.success(`Satış kaydedildi! ${formatMoney(sonuc.data!.total)}`);
      setReceiptId(sonuc.data!.saleId);
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
        const sonuc = await getAgent('satis').iadeYap(id);
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
        const sonuc = await getAgent('satis').iptalEt(id);
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
      <div
        className="stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Bugün Satış"
          value={String(todayStats.count)}
          sub={formatMoney(todayStats.revenue)}
          color="#10b981"
        />
        <StatCard label="Bugün Ciro" value={formatMoney(todayStats.revenue)} color="#3b82f6" />
        <StatCard label="Bugün Kâr" value={formatMoney(todayStats.profit)} color="#f59e0b" />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: '#ff5722',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            padding: '10px 20px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          + Yeni Satış
        </button>
        <button
          onClick={() => {
            exportToExcel(db, {
              sheets: ['satislar'],
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
            });
            showToast('Excel indirildi!', 'success');
          }}
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            color: '#10b981',
            padding: '10px 16px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          📊 Excel İndir
        </button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Ürün ara..." style={sinp} />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ ...sinp, width: 160 }}
        />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...sinp, width: 160 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'tamamlandi', 'iade', 'iptal'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                background: filter === f ? '#ff5722' : '#273548',
                color: filter === f ? '#fff' : '#94a3b8',
              }}
            >
              {f === 'all' ? 'Tümü' : f === 'tamamlandi' ? '✓ Tamamlandı' : f === 'iade' ? '↩ İade' : '✕ İptal'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="responsive-table-wrap"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14,
          border: '1px solid #334155',
          overflowX: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            whiteSpace: 'nowrap',
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
              {['Tarih', 'Ürün', 'Müşteri', 'Miktar', 'Tutar', 'Kâr', 'Ödeme', 'Durum', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 24 }}>
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
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td
                    data-label="Tarih"
                    style={{
                      padding: '12px 16px',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {formatDate(s.createdAt)}
                  </td>
                  <td
                    data-label="Ürün"
                    style={{
                      padding: '12px 16px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {s.productName}
                  </td>
                  <td
                    data-label="Müşteri"
                    style={{
                      padding: '12px 16px',
                      color: 'var(--text-dim)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {db.cari.find((c) => c.id === s.cariId)?.name || '-'}
                  </td>
                  <td data-label="Miktar" style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>
                    {s.quantity}
                  </td>
                  <td
                    data-label="Tutar"
                    style={{
                      padding: '12px 16px',
                      color: '#10b981',
                      fontWeight: 700,
                    }}
                  >
                    {formatMoney(s.total)}
                  </td>
                  <td
                    data-label="Kâr"
                    style={{
                      padding: '12px 16px',
                      color: s.profit >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                    }}
                  >
                    {formatMoney(s.profit)}
                  </td>
                  <td data-label="Ödeme" style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {(db.kasalar || []).find((k) => k.id === s.payment)?.name ||
                        paymentLabels[s.payment] ||
                        s.payment}
                    </span>
                  </td>
                  <td data-label="Durum" style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: s.status === 'tamamlandi' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: s.status === 'tamamlandi' ? '#10b981' : '#ef4444',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {s.status === 'tamamlandi' ? '✓ Tamamlandı' : s.status === 'iade' ? '↩ İade' : '✕ İptal'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setLocation(`/satis/${s.id}`)}
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          border: 'none',
                          borderRadius: 6,
                          color: '#60a5fa',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Detay
                      </button>
                      {s.status === 'tamamlandi' && (
                        <>
                          <button
                            onClick={() => handleReturn(s.id)}
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              border: 'none',
                              borderRadius: 6,
                              color: '#ef4444',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            ↩ İade
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            style={{
                              background: 'rgba(245,158,11,0.1)',
                              border: 'none',
                              borderRadius: 6,
                              color: '#f59e0b',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            ✕ İptal
                          </button>
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

      <VoiceAssistantButton />
    </div>
  );
}
