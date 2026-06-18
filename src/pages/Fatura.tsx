import { useMemo, useState } from 'react';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { genId } from '@/lib/utils-tr';
import type { Invoice, InvoiceItem } from '@/types';
import { nextInvoiceNo, emptyItem } from './FaturaHelpers.utils';
import { calcTotals, createEmptyForm } from './Fatura/FaturaUtils';
import { FaturaStatsBar } from './Fatura/FaturaStats';
import { FaturaToolbar } from './Fatura/FaturaToolbar';
import { FaturaTable } from './Fatura/FaturaTable';
import FaturaForm from './Fatura/FaturaForm';
import FaturaPreview from './Fatura/FaturaPreview';
import type { Props } from './FaturaHelpers';
import { FaturaFormState, FaturaStats } from './Fatura/types';
import styles from './Fatura/Fatura.module.css';

export default function Fatura({ db, save: dbSave }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [modal, setModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'satis' | 'alis'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<FaturaFormState>({
    type: 'satis',
    cariId: '',
    cariName: '',
    cariTaxNo: '',
    cariAddress: '',
    items: [emptyItem()],
    discount: 0,
    payment: 'nakit',
    dueDate: '',
    note: '',
    status: 'taslak',
    saleId: '',
  });

  const invoices = useMemo(() => {
    let list = (db.invoices || []).filter((i) => !i.deleted);
    if (filter !== 'all') list = list.filter((i) => i.type === filter);
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.invoiceNo.toLowerCase().includes(q) || i.cariName.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [db.invoices, filter, statusFilter, search]);

  const stats = useMemo((): FaturaStats => {
    const all = (db.invoices || []).filter((i) => !i.deleted);
    const satisTotal = all.filter((i) => i.type === 'satis' && i.status !== 'iptal').reduce((s, i) => s + i.total, 0);
    const alisTotal = all.filter((i) => i.type === 'alis' && i.status !== 'iptal').reduce((s, i) => s + i.total, 0);
    const unpaid = all.filter((i) => i.status === 'onaylandi').reduce((s, i) => s + i.total, 0);
    const draft = all.filter((i) => i.status === 'taslak').length;
    return { satisTotal, alisTotal, unpaid, draft, total: all.length };
  }, [db.invoices]);

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      items[idx].total = items[idx].quantity * items[idx].unitPrice * (1 + items[idx].vatRate / 100);
      return { ...f, items };
    });
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const openNew = (type: 'satis' | 'alis') => {
    setForm({
      ...createEmptyForm(type),
      items: [emptyItem()],
    });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setForm({
      type: inv.type,
      cariId: inv.cariId || '',
      cariName: inv.cariName,
      cariTaxNo: inv.cariTaxNo || '',
      cariAddress: inv.cariAddress || '',
      items: [...inv.items],
      discount: inv.discount,
      payment: inv.payment,
      dueDate: inv.dueDate || '',
      note: inv.note || '',
      status: inv.status,
      saleId: inv.saleId || '',
    });
    setEditId(inv.id);
    setModal(true);
  };

  const handleSave = () => {
    if (!form.cariName) {
      showToast('Müşteri/Tedarikçi adı gerekli!', 'error');
      return;
    }
    if (form.items.length === 0 || form.items.every((it) => !it.description)) {
      showToast('En az bir kalem ekleyin!', 'error');
      return;
    }
    const validItems = form.items.filter((it) => it.description);
    const { subtotal, vatTotal, total } = calcTotals(validItems, form.discount);
    const nowIso = new Date().toISOString();

    setLoading(true);
    dbSave((prev) => {
      const invoices = [...(prev.invoices || [])];
      if (editId) {
        const i = invoices.findIndex((inv) => inv.id === editId);
        if (i >= 0) {
          const { kasaEntryId, cariUpdated } = invoices[i];
          invoices[i] = {
            ...invoices[i],
            ...form,
            items: validItems,
            subtotal,
            vatTotal,
            total,
            kasaEntryId,
            cariUpdated,
            updatedAt: nowIso,
          };
        }
        showToast('Fatura güncellendi!');
      } else {
        invoices.push({
          id: genId(),
          invoiceNo: nextInvoiceNo(invoices, form.type),
          ...form,
          items: validItems,
          subtotal,
          vatTotal,
          total,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        showToast('Fatura oluÅŸturuldu!');
      }
      return { ...prev, invoices };
    });
    setLoading(false);
    setModal(false);
  };

  const updateStatus = (id: string, status: Invoice['status']) => {
    setLoading(true);
    dbSave((prev) => {
      const nowIso = new Date().toISOString();
      const inv = (prev.invoices || []).find((i) => i.id === id);
      if (!inv) return prev;

      let kasa = [...prev.kasa];
      let cari = [...prev.cari];
      let kasaEntryId = inv.kasaEntryId;
      let cariUpdated = inv.cariUpdated;

      if (status === 'odendi' && !inv.kasaEntryId && inv.payment !== 'cari') {
        const entry = {
          id: genId(),
          type: (inv.type === 'satis' ? 'gelir' : 'gider') as 'gelir' | 'gider',
          category: inv.type === 'satis' ? 'satis' : 'alis_fatura',
          amount: inv.total,
          kasa: (inv.payment === 'nakit' ? 'nakit' : 'banka') as 'nakit' | 'banka',
          description: `Fatura: ${inv.invoiceNo} â€” ${inv.cariName}`,
          relatedId: id,
          cariId: inv.cariId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        kasa = [...kasa, entry];
        kasaEntryId = entry.id;
        showToast(
          `💰 Kasa otomatik güncellendi: ${inv.type === 'satis' ? '+' : '-'}${inv.total.toLocaleString('tr-TR')} ₺`,
        );
      }

      if (status === 'onaylandi' && inv.payment === 'cari' && inv.cariId && !cariUpdated) {
        cari = cari.map((c) => {
          if (c.id === inv.cariId) {
            const delta = inv.type === 'satis' ? inv.total : -inv.total;
            return {
              ...c,
              balance: (c.balance || 0) + delta,
              lastTransaction: nowIso,
              updatedAt: nowIso,
            };
          }
          return c;
        });
        cariUpdated = true;
        showToast(`👤 Cari bakiye güncellendi: ${inv.cariName}`);
      }

      if (status === 'iptal') {
        if (inv.kasaEntryId) {
          kasa = kasa.map((k) => (k.id === inv.kasaEntryId ? { ...k, deleted: true, updatedAt: nowIso } : k));
          kasaEntryId = undefined;
        }
        if (inv.cariUpdated && inv.cariId && inv.payment === 'cari') {
          const delta = inv.type === 'satis' ? inv.total : -inv.total;
          cari = cari.map((c) =>
            c.id === inv.cariId
              ? {
                  ...c,
                  balance: (c.balance || 0) - delta,
                  lastTransaction: nowIso,
                  updatedAt: nowIso,
                }
              : c,
          );
          cariUpdated = false;
        }
      }

      if (status === 'taslak') {
        if (inv.kasaEntryId) {
          kasa = kasa.map((k) => (k.id === inv.kasaEntryId ? { ...k, deleted: true, updatedAt: nowIso } : k));
          kasaEntryId = undefined;
        }
        if (inv.cariUpdated && inv.cariId && inv.payment === 'cari') {
          const delta = inv.type === 'satis' ? inv.total : -inv.total;
          cari = cari.map((c) =>
            c.id === inv.cariId
              ? {
                  ...c,
                  balance: (c.balance || 0) - delta,
                  lastTransaction: nowIso,
                  updatedAt: nowIso,
                }
              : c,
          );
          cariUpdated = false;
        }
      }

      const invoices = (prev.invoices || []).map((i) =>
        i.id === id ? { ...i, status, kasaEntryId, cariUpdated, updatedAt: nowIso } : i,
      );
      return { ...prev, invoices, kasa, cari };
    });
    setLoading(false);
    if (status !== 'odendi' && status !== 'onaylandi') showToast('Durum güncellendi!');
  };

  const deleteInvoice = (id: string) => {
    showConfirm('Fatura Sil', 'Bu fatura silinecek. Kasa ve cari etkileri de geri alınacak.', () => {
      const nowIso = new Date().toISOString();
      setLoading(true);
      dbSave((prev) => {
        const inv = (prev.invoices || []).find((i) => i.id === id);
        if (!inv) return prev;

        let kasa = prev.kasa;
        let cari = prev.cari;

        if (inv.kasaEntryId) {
          kasa = kasa.map((k) => (k.id === inv.kasaEntryId ? { ...k, deleted: true, updatedAt: nowIso } : k));
        }

        if (inv.cariUpdated && inv.cariId && inv.payment === 'cari') {
          const delta = inv.type === 'satis' ? inv.total : -inv.total;
          cari = cari.map((c) =>
            c.id === inv.cariId
              ? {
                  ...c,
                  balance: (c.balance || 0) - delta,
                  lastTransaction: nowIso,
                  updatedAt: nowIso,
                }
              : c,
          );
        }

        const invoices = (prev.invoices || []).map((i) =>
          i.id === id ? { ...i, deleted: true, updatedAt: nowIso } : i,
        );
        return { ...prev, invoices, kasa, cari };
      });
      setLoading(false);
      showToast('Fatura silindi!');
    });
  };

  const previewInv = previewId ? (db.invoices || []).find((i) => i.id === previewId) : null;
  const formTotals = calcTotals(
    form.items.filter((it) => it.description),
    form.discount,
  );

  const selectCari = (cariId: string) => {
    const c = db.cari.find((ci) => ci.id === cariId);
    if (c)
      setForm((f) => ({
        ...f,
        cariId: c.id,
        cariName: c.name,
        cariTaxNo: c.taxNo || '',
        cariAddress: c.address || '',
      }));
  };

  if (loading) return <SkeletonTable rows={6} cols={8} />;

  return (
    <div className={styles.page}>
      <FaturaStatsBar stats={stats} />
      <FaturaToolbar
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenNew={openNew}
      />
      <FaturaTable
        invoices={invoices}
        onEdit={openEdit}
        onPreview={setPreviewId}
        onDelete={deleteInvoice}
        onUpdateStatus={updateStatus}
      />
      <FaturaForm
        db={db}
        modal={modal}
        onClose={() => setModal(false)}
        form={form}
        setForm={setForm}
        updateItem={updateItem}
        addItem={addItem}
        removeItem={removeItem}
        formTotals={formTotals}
        editId={editId}
        handleSave={handleSave}
        selectCari={selectCari}
      />
      {previewInv && (
        <FaturaPreview
          db={db}
          previewInv={previewInv}
          onClose={() => setPreviewId(null)}
          save={dbSave}
          showToast={showToast}
        />
      )}
    </div>
  );
}
