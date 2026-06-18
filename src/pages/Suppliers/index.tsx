import { useState } from 'react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { similarity } from '@/lib/similarity';
import { formatDate, formatMoney, genId } from '@/lib/utils-tr';
import type { Cari, DB, Order, OrderItem, Supplier } from '@/types';
import { useDebounce } from '@/pages/useDebounce';
import EmptyState from '@/components/EmptyState';
import { Truck } from 'lucide-react';
import SupplierList from './SupplierList';
import SupplierForm from './SupplierForm';
import SupplierOrder from './SupplierOrder';
import { emptySupplier, type CatFilter, type SupplierWithCat, statusColors, statusLabels } from './types';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function Suppliers({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [catFilter, setCatFilter] = useState<CatFilter>('hepsi');
  const [supModal, setSupModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [form, setForm] = useState<Partial<Supplier>>(emptySupplier);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [selectedSup, setSelectedSup] = useState('');
  const [dupWarning, setDupWarning] = useState<{ name: string; score: number }[]>([]);
  const [forceSave, setForceSave] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [nakliye, setNakliye] = useState(0);
  const [orderProductCat, setOrderProductCat] = useState('');

  const addOrderItem = (productId: string) => {
    const p = db.products.find((x) => x.id === productId);
    if (!p) return;
    setOrderItems((prev) => {
      const ex = prev.find((i) => i.productId === productId);
      if (ex)
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + 1, lineTotal: (i.qty + 1) * i.unitCost } : i,
        );
      return [
        ...prev,
        {
          productId,
          productName: p.name,
          qty: 1,
          unitCost: p.cost,
          lineTotal: p.cost,
        },
      ];
    });
  };

  const checkDuplicates = (name: string) => {
    if (!name) return;
    const candidates = [
      ...db.suppliers.filter((s) => !editId || s.id !== editId),
      ...(db.peletSuppliers || []),
      ...(db.boruSuppliers || []),
    ];
    const found = candidates
      .map((s) => ({ name: s.name, score: similarity(name, s.name) }))
      .filter((x) => x.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    setDupWarning(found);
    setForceSave(false);
  };

  const saveSupplier = () => {
    if (!form.name) {
      showToast('Tedarikçi adı gerekli!', 'error');
      return;
    }
    if (dupWarning.length > 0 && !forceSave) {
      setForceSave(true);
      return;
    }
    setDupWarning([]);
    setForceSave(false);
    const nowIso = new Date().toISOString();
    save((prev) => {
      const suppliers = [...prev.suppliers];
      const cari = [...prev.cari];
      if (editId) {
        const i = suppliers.findIndex((s) => s.id === editId);
        if (i >= 0) {
          suppliers[i] = { ...suppliers[i], ...form, updatedAt: nowIso } as Supplier;
          const ci = cari.findIndex((c) => c.id === editId);
          if (ci >= 0)
            cari[ci] = {
              ...cari[ci],
              name: form.name || cari[ci].name,
              phone: form.phone || cari[ci].phone,
              updatedAt: nowIso,
            };
        }
        showToast('Tedarikçi güncellendi!');
      } else {
        const newId = genId();
        suppliers.push({
          id: newId,
          createdAt: nowIso,
          updatedAt: nowIso,
          totalOrders: 0,
          totalAmount: 0,
          name: '',
          category: '',
          phone: '',
          ...form,
        } as Supplier);
        const yeniCari: Cari = {
          id: newId,
          createdAt: nowIso,
          updatedAt: nowIso,
          name: form.name || '',
          type: 'tedarikci',
          phone: form.phone || '',
          email: form.email || '',
          address: form.address || '',
          taxNo: form.taxNo || '',
          balance: 0,
        };
        cari.push(yeniCari);
        showToast('Tedarikçi eklendi, cari kaydı otomatik açıldı!', 'success');
      }
      return { ...prev, suppliers, cari };
    });
    setSupModal(false);
  };

  const saveOrder = () => {
    if (!orderSupplierId) {
      if (db.suppliers.length === 0) {
        showToast(
          'Önce tedarikçi ekleyin! Tedarikçiler sekmesine yönlendiriliyorsunuz...',
          'error',
        );
        setTimeout(() => {
          setOrderModal(false);
          setTab('suppliers');
        }, 1500);
        return;
      }
      showToast('Tedarikçi seçin!', 'error');
      return;
    }
    if (orderItems.length === 0) {
      showToast('Ürün ekleyin!', 'error');
      return;
    }
    const amount = orderItems.reduce((s, i) => s + i.lineTotal, 0);
    const nowIso = new Date().toISOString();
    const order: Order = {
      id: genId(),
      supplierId: orderSupplierId,
      items: orderItems,
      amount,
      nakliye: nakliye > 0 ? nakliye : undefined,
      paidAmount: 0,
      remainingAmount: amount,
      payments: [],
      deliveryDate,
      note: orderNote,
      status: 'bekliyor',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    save((prev) => {
      const suppliers = prev.suppliers.map((s) =>
        s.id === orderSupplierId
          ? {
              ...s,
              totalOrders: (s.totalOrders || 0) + 1,
              totalAmount: (s.totalAmount || 0) + amount,
            }
          : s,
      );
      return { ...prev, orders: [...prev.orders, order], suppliers };
    });
    showToast('Sipariş oluşturuldu!');
    setOrderItems([]);
    setOrderSupplierId('');
    setDeliveryDate('');
    setOrderNote('');
    setNakliye(0);
    setOrderProductCat('');
    setOrderModal(false);
  };

  const deleteSupplier = (id: string) => {
    showConfirm(
      'Tedarikçi Sil',
      'Tedarikçi ve ilişkili cari kaydı gizlenecek. Devam etmek istiyor musunuz?',
      () => {
        const nowIso = new Date().toISOString();
        save((prev) => ({
          ...prev,
          suppliers: prev.suppliers.map((s) =>
            s.id === id ? { ...s, deleted: true, updatedAt: nowIso } : s,
          ),
          cari: prev.cari.map((c) =>
            c.id === id ? { ...c, deleted: true, updatedAt: nowIso } : c,
          ),
        }));
        showToast('Silindi!');
      },
    );
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    save((prev) => {
      const order = prev.orders.find((o) => o.id === id);
      if (!order) return prev;
      const updatedOrder = {
        ...order,
        status,
        updatedAt: new Date().toISOString(),
      };
      let newState = {
        ...prev,
        orders: prev.orders.map((o) => (o.id === id ? updatedOrder : o)),
      };

      if (status === 'tamamlandi') {
        if (order.stockCompleted) {
          showToast('Sipariş tamamlandı!');
          return newState;
        }
        const totalOrderAmount = order.amount || 1;
        const nakliyeToplam = order.nakliye || 0;
        const supplier = prev.suppliers.find((s) => s.id === order.supplierId);
        const missingProducts: string[] = [];
        const products = prev.products.map((p) => {
          const item = order.items.find((i) => i.productId === p.id);
          if (!item) return p;
          const nakliyePay =
            nakliyeToplam > 0
              ? ((item.lineTotal / totalOrderAmount) * nakliyeToplam) / item.qty
              : 0;
          const yeniMaliyet = item.unitCost + nakliyePay;
          const mevcutStok = p.stock || 0;
          const toplamStok = mevcutStok + item.qty;
          const ortMaliyet =
            toplamStok > 0
              ? (p.cost * mevcutStok + yeniMaliyet * item.qty) / toplamStok
              : yeniMaliyet;
          return {
            ...p,
            stock: toplamStok,
            cost: Math.round(ortMaliyet * 100) / 100,
          };
        });
        order.items.forEach((i) => {
          if (!prev.products.find((p) => p.id === i.productId)) missingProducts.push(i.productName);
        });
        const stockMovements = [
          ...prev.stockMovements,
          ...order.items
            .filter((i) => prev.products.find((p) => p.id === i.productId))
            .map((i) => ({
              id: genId(),
              productId: i.productId,
              productName: i.productName,
              type: 'giris' as const,
              amount: i.qty,
              before: prev.products.find((p) => p.id === i.productId)?.stock || 0,
              after: (prev.products.find((p) => p.id === i.productId)?.stock || 0) + i.qty,
              note: `Sipariş #${id.slice(0, 8)}${supplier ? ' \u2014 ' + supplier.name : ''}`,
              date: new Date().toISOString(),
            })),
        ];
        const cariTutar = order.amount + (order.nakliye || 0);
        const cari = prev.cari.map((c) => {
          if (c.id === order.supplierId) {
            return {
              ...c,
              balance: (c.balance || 0) + cariTutar,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
        if (missingProducts.length > 0) {
          showToast(
            `Sipariş tamamlandı! ⚠ Bulunamayan ürünler atlandı: ${missingProducts.join(', ')}`,
          );
        } else {
          showToast('Sipariş tamamlandı! Stok ve cari güncellendi.');
        }
        newState = {
          ...newState,
          products,
          stockMovements,
          cari,
          orders: newState.orders.map((o) =>
            o.id === id ? { ...o, stockCompleted: true } : o,
          ),
        };
      }
      return newState;
    });
  };

  const revertOrder = (id: string) => {
    showConfirm(
      'Sipariş Geri Al',
      'Bu siparişi geri almak istiyor musunuz? Stok ve cari değişiklikleri geri alınacak.',
      () => {
        save((prev) => {
          const order = prev.orders.find((o) => o.id === id);
          if (!order || order.status !== 'tamamlandi') return prev;
          const nowIso = new Date().toISOString();
          const products = prev.products.map((p) => {
            const item = order.items.find((i) => i.productId === p.id);
            if (!item) return p;
            return { ...p, stock: Math.max(0, p.stock - item.qty) };
          });
          const stockMovements = [
            ...prev.stockMovements,
            ...order.items.map((i) => ({
              id: genId(),
              productId: i.productId,
              productName: i.productName,
              type: 'cikis' as const,
              amount: i.qty,
              before: prev.products.find((p) => p.id === i.productId)?.stock || 0,
              after: Math.max(
                0,
                (prev.products.find((p) => p.id === i.productId)?.stock || 0) - i.qty,
              ),
              note: 'Sipariş geri alındı',
              date: nowIso,
            })),
          ];
          const cariTutar = order.amount + (order.nakliye || 0);
          const cari = prev.cari.map((c) => {
            if (c.id === order.supplierId) {
              return { ...c, balance: (c.balance || 0) - cariTutar, updatedAt: nowIso };
            }
            return c;
          });
          const orders = prev.orders.map((o) =>
            o.id === id ? { ...o, status: 'bekliyor' as const, updatedAt: nowIso } : o,
          );
          return { ...prev, orders, products, stockMovements, cari };
        });
        showToast('Sipariş geri alındı! Stok ve cari güncellendi.');
      },
    );
  };

  const allSuppliers: SupplierWithCat[] = [
    ...db.suppliers.filter((s) => !s.deleted).map((s) => ({ ...s, _kat: 'genel' as const })),
    ...(db.peletSuppliers || []).map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      category: 'Pelet',
      totalOrders: 0,
      totalAmount: 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      _kat: 'pelet' as const,
    })),
    ...(db.boruSuppliers || []).map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      category: 'Boru',
      totalOrders: 0,
      totalAmount: 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      _kat: 'boru' as const,
    })),
  ];

  let filteredSuppliers = allSuppliers;
  if (catFilter !== 'hepsi') filteredSuppliers = filteredSuppliers.filter((s) => s._kat === catFilter);
  if (debouncedSearch)
    filteredSuppliers = filteredSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.phone || '').includes(debouncedSearch),
    );

  const filteredOrders = selectedSup
    ? db.orders.filter((o) => o.supplierId === selectedSup)
    : db.orders;
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val }));
    setDupWarning([]);
    setForceSave(false);
  };

  const handleNameBlur = (val: string) => {
    checkDuplicates(val);
  };

  const handleFormField = (field: string, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
  };

  const openSupplierForm = (supplier?: SupplierWithCat) => {
    if (supplier) {
      setForm({ ...supplier });
      setEditId(supplier.id);
    } else {
      setForm(emptySupplier);
      setEditId(null);
    }
    setSupModal(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['suppliers', 'orders'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
              background: tab === t ? '#ff5722' : '#273548',
              color: tab === t ? '#fff' : '#94a3b8',
            }}
          >
            {t === 'suppliers' ? '🏭 Tedarikçiler' : '\uD83D\uDCE6 Siparişler'}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <SupplierList
          filteredSuppliers={filteredSuppliers}
          orders={db.orders}
          search={search}
          onSearchChange={setSearch}
          catFilter={catFilter}
          onCatFilterChange={setCatFilter}
          onNewSupplier={() => openSupplierForm()}
          onNewOrder={() => setOrderModal(true)}
          onShowOrders={(id: string) => {
            setSelectedSup(id);
            setTab('orders');
          }}
          onEdit={(s: SupplierWithCat) => openSupplierForm(s)}
          onDelete={deleteSupplier}
        />
      )}

      {tab === 'orders' && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setOrderModal(true)}
              style={{
                background: '#ff5722',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                padding: '10px 20px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Sipariş Ver
            </button>
            <select
              value={selectedSup}
              onChange={(e) => setSelectedSup(e.target.value)}
              style={{
                padding: '9px 13px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 10,
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Tüm Tedarikçiler</option>
              {db.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              background: '#1e293b',
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
                  {['Tarih', 'Tedarikçi', 'Ürünler', 'Tutar', 'Durum', ''].map((h) => (
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
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24 }}>
                      <EmptyState
                        icon={Truck}
                        title="Sipariş bulunamadı"
                        description="Henüz kaydedilmiş sipariş bulunmamaktadır."
                      />
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((o) => (
                    <tr
                      key={o.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td
                        data-label="Tarih"
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem',
                        }}
                      >
                        {formatDate(o.createdAt)}
                      </td>
                      <td
                        data-label="Tedarikçi"
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {db.suppliers.find((s) => s.id === o.supplierId)?.name || '-'}
                      </td>
                      <td
                        data-label="Ürünler"
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-dim)',
                          fontSize: '0.85rem',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {o.items.map((i) => `${i.productName}\u00D7${i.qty}`).join(', ')}
                      </td>
                      <td
                        data-label="Tutar"
                        style={{
                          padding: '12px 16px',
                          color: '#10b981',
                          fontWeight: 700,
                        }}
                      >
                        {formatMoney(o.amount)}
                      </td>
                      <td data-label="Durum" style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: `${statusColors[o.status]}22`,
                            color: statusColors[o.status],
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {statusLabels[o.status]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {o.status === 'bekliyor' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => updateOrderStatus(o.id, 'yolda')}
                              style={{
                                background: 'rgba(59,130,246,0.1)',
                                border: 'none',
                                borderRadius: 6,
                                color: '#60a5fa',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                              }}
                            >
                              \uD83D\uDE9A Yolda
                            </button>
                            <button
                              onClick={() => updateOrderStatus(o.id, 'tamamlandi')}
                              style={{
                                background: 'rgba(16,185,129,0.1)',
                                border: 'none',
                                borderRadius: 6,
                                color: '#10b981',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                              }}
                            >
                              ✓ Tamamla
                            </button>
                          </div>
                        )}
                        {o.status === 'yolda' && (
                          <button
                            onClick={() => updateOrderStatus(o.id, 'tamamlandi')}
                            style={{
                              background: 'rgba(16,185,129,0.1)',
                              border: 'none',
                              borderRadius: 6,
                              color: '#10b981',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                            }}
                          >
                            ✓ Tamamla
                          </button>
                        )}
                        {o.status === 'tamamlandi' && (
                          <button
                            onClick={() => revertOrder(o.id)}
                            style={{
                              background: 'rgba(245,158,11,0.1)',
                              border: 'none',
                              borderRadius: 6,
                              color: '#f59e0b',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                            }}
                          >
                            \u21A9 Geri Al
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SupplierForm
        open={supModal}
        editId={editId}
        form={form}
        dupWarning={dupWarning}
        forceSave={forceSave}
        onNameChange={handleNameChange}
        onNameBlur={handleNameBlur}
        onFieldChange={handleFormField}
        onSave={saveSupplier}
        onClose={() => setSupModal(false)}
      />

      <SupplierOrder
        open={orderModal}
        db={db}
        orderSupplierId={orderSupplierId}
        setOrderSupplierId={setOrderSupplierId}
        orderItems={orderItems}
        setOrderItems={setOrderItems}
        deliveryDate={deliveryDate}
        setDeliveryDate={setDeliveryDate}
        orderNote={orderNote}
        setOrderNote={setOrderNote}
        nakliye={nakliye}
        setNakliye={setNakliye}
        orderProductCat={orderProductCat}
        setOrderProductCat={setOrderProductCat}
        addOrderItem={addOrderItem}
        onSave={saveOrder}
        onClose={() => setOrderModal(false)}
      />
    </div>
  );
}
