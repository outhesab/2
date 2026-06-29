/**
 * @file index.tsx
 * @description Tedarikçi sayfası orchestrator. State yönetimi ve modül koordinasyonu.
 */

import { useState, useCallback, useMemo } from 'react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { genId } from '@/lib/utils-tr';
import type { Cari, DB, Order, OrderItem, Supplier } from '@/types';
import { useDebounce } from '@/pages/useDebounce';
import SupplierList from './SupplierList';
import SupplierForm from './SupplierForm';
import SupplierOrder from './SupplierOrder';
import SupplierDetail from './SupplierDetail';
import { emptySupplier } from './types';
import { getAllSuppliers, filterSuppliers, checkDuplicateSuppliers } from './SupplierHelpers';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function Suppliers({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [catFilter, setCatFilter] = useState<'hepsi' | 'genel' | 'pelet' | 'boru'>('hepsi');
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

  const allSuppliers = useMemo(() => getAllSuppliers(db), [db]);
  const filteredSuppliers = useMemo(
    () => filterSuppliers(allSuppliers, catFilter, debouncedSearch),
    [allSuppliers, catFilter, debouncedSearch],
  );

  const addOrderItem = useCallback(
    (productId: string) => {
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
    },
    [db.products],
  );

  const checkDuplicates = useCallback(
    (name: string) => {
      if (!name) return;
      const found = checkDuplicateSuppliers(name, editId, db);
      setDupWarning(found);
      setForceSave(false);
    },
    [editId, db],
  );

  const saveSupplier = useCallback(() => {
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
  }, [form, editId, dupWarning, forceSave, save, showToast]);

  const saveOrder = useCallback(() => {
    if (!orderSupplierId) {
      if (db.suppliers.length === 0) {
        showToast('Önce tedarikçi ekleyin! Tedarikçiler sekmesine yönlendiriliyorsunuz...', 'error');
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
  }, [orderSupplierId, orderItems, nakliye, deliveryDate, orderNote, db.suppliers.length, save, showToast]);

  const deleteSupplier = useCallback(
    (id: string) => {
      showConfirm('Tedarikçi Sil', 'Tedarikçi ve ilişkili cari kaydı gizlenecek. Devam etmek istiyor musunuz?', () => {
        const nowIso = new Date().toISOString();
        save((prev) => ({
          ...prev,
          suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, deleted: true, updatedAt: nowIso } : s)),
          cari: prev.cari.map((c) => (c.id === id ? { ...c, deleted: true, updatedAt: nowIso } : c)),
        }));
        showToast('Silindi!');
      });
    },
    [save, showConfirm, showToast],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: Order['status']) => {
      save((prev) => {
        const order = prev.orders.find((o) => o.id === id);
        if (!order) return prev;
        const updatedOrder = { ...order, status, updatedAt: new Date().toISOString() };
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
            const nakliyePay = nakliyeToplam > 0 ? ((item.lineTotal / totalOrderAmount) * nakliyeToplam) / item.qty : 0;
            const yeniMaliyet = item.unitCost + nakliyePay;
            const mevcutStok = p.stock || 0;
            const toplamStok = mevcutStok + item.qty;
            const ortMaliyet =
              toplamStok > 0 ? (p.cost * mevcutStok + yeniMaliyet * item.qty) / toplamStok : yeniMaliyet;
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
                note: `Sipariş #${id.slice(0, 8)}${supplier ? ' — ' + supplier.name : ''}`,
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
            showToast(`Sipariş tamamlandı! ⚠ Bulunamayan ürünler atlandı: ${missingProducts.join(', ')}`);
          } else {
            showToast('Sipariş tamamlandı! Stok ve cari güncellendi.');
          }
          newState = {
            ...newState,
            products,
            stockMovements,
            cari,
            orders: newState.orders.map((o) => (o.id === id ? { ...o, stockCompleted: true } : o)),
          };
        }
        return newState;
      });
    },
    [save, showToast],
  );

  const revertOrder = useCallback(
    (id: string) => {
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
                after: Math.max(0, (prev.products.find((p) => p.id === i.productId)?.stock || 0) - i.qty),
                note: 'Sipariş geri alındı',
                date: nowIso,
              })),
            ];
            const cariTutar = order.amount + (order.nakliye || 0);
            const cari = prev.cari.map((c) => {
              if (c.id === order.supplierId) {
                return {
                  ...c,
                  balance: (c.balance || 0) - cariTutar,
                  updatedAt: nowIso,
                };
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
    },
    [save, showConfirm, showToast],
  );

  const handleNameChange = useCallback((val: string) => {
    setForm((f) => ({ ...f, name: val }));
    setDupWarning([]);
    setForceSave(false);
  }, []);

  const handleNameBlur = useCallback(
    (val: string) => {
      checkDuplicates(val);
    },
    [checkDuplicates],
  );

  const handleFormField = useCallback((field: string, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
  }, []);

  const openSupplierForm = useCallback((supplier?: (typeof filteredSuppliers)[number]) => {
    if (supplier) {
      setForm({ ...supplier });
      setEditId(supplier.id);
    } else {
      setForm(emptySupplier);
      setEditId(null);
    }
    setDupWarning([]);
    setForceSave(false);
    setSupModal(true);
  }, []);

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['suppliers', 'orders'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl border-none font-bold cursor-pointer transition-colors ${
              tab === t ? 'bg-[#ff5722] text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t === 'suppliers' ? '🏭 Tedarikçiler' : '📦 Siparişler'}
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
          onEdit={(s) => openSupplierForm(s)}
          onDelete={deleteSupplier}
        />
      )}

      {tab === 'orders' && (
        <SupplierDetail
          db={db}
          selectedSup={selectedSup}
          onSelectSup={setSelectedSup}
          onUpdateStatus={updateOrderStatus}
          onRevert={revertOrder}
          onNewOrder={() => setOrderModal(true)}
        />
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
