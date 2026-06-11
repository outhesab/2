import EmptyState from '@/components/EmptyState';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { FileText } from 'lucide-react';
import { formatDate, formatMoney, genId } from '@/lib/utils-tr';
import type { Invoice, InvoiceItem } from '@/types';
import { useMemo, useState } from 'react';
import FaturaForm from './FaturaForm';
import FaturaPreview from './FaturaPreview';
import { nextInvoiceNo, statusColors, statusLabels, paymentLabels, miniBtn, emptyItem } from './FaturaHelpers.utils';
import type { Props } from './FaturaHelpers';

export default function Fatura({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [modal, setModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'satis' | 'alis'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    type: 'satis' as 'satis' | 'alis',
    cariId: '',
    cariName: '',
    cariTaxNo: '',
    cariAddress: '',
    items: [emptyItem()] as InvoiceItem[],
    discount: 0,
    payment: 'nakit' as Invoice['payment'],
    dueDate: '',
    note: '',
    status: 'taslak' as Invoice['status'],
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

  const stats = useMemo(() => {
    const all = (db.invoices || []).filter((i) => !i.deleted);
    const satisTotal = all.filter((i) => i.type === 'satis' && i.status !== 'iptal').reduce((s, i) => s + i.total, 0);
    const alisTotal = all.filter((i) => i.type === 'alis' && i.status !== 'iptal').reduce((s, i) => s + i.total, 0);
    const unpaid = all.filter((i) => i.status === 'onaylandi').reduce((s, i) => s + i.total, 0);
    const draft = all.filter((i) => i.status === 'taslak').length;
    return { satisTotal, alisTotal, unpaid, draft, total: all.length };
  }, [db.invoices]);

  const calcTotals = (items: InvoiceItem[], discount: number) => {
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const vatTotal = items.reduce((s, it) => s + (it.quantity * it.unitPrice * it.vatRate) / 100, 0);
    return { subtotal, vatTotal, total: subtotal + vatTotal - discount };
  };

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
      type,
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
      showToast('MüÅŸteri/Tedarikçi adı gerekli!', 'error');
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
    save((prev) => {
      const invoices = [...(prev.invoices || [])];
      if (editId) {
        const i = invoices.findIndex((inv) => inv.id === editId);
        if (i >= 0) {
          // Mevcut kasaEntryId ve cariUpdated'ı koru (durum geçiÅŸlerinde kullanılıyor)
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
    save((prev) => {
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
        // Kasa kaydını soft-delete et
        if (inv.kasaEntryId) {
          kasa = kasa.map((k) => (k.id === inv.kasaEntryId ? { ...k, deleted: true, updatedAt: nowIso } : k));
          kasaEntryId = undefined;
        }
        // Cari bakiyeyi geri al (onaylandi + cari ödeme ile güncellenmiÅŸse)
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
        // Kasa kaydını soft-delete et
        if (inv.kasaEntryId) {
          kasa = kasa.map((k) => (k.id === inv.kasaEntryId ? { ...k, deleted: true, updatedAt: nowIso } : k));
          kasaEntryId = undefined;
        }
        // Cari bakiyeyi geri al (onaylandi ile güncellenmiÅŸse)
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
      save((prev) => {
        const inv = (prev.invoices || []).find((i) => i.id === id);
        if (!inv) return prev;

        let kasa = prev.kasa;
        let cari = prev.cari;

        // Kasa kaydını soft-delete et
        if (inv.kasaEntryId) {
          kasa = kasa.map((k) => (k.id === inv.kasaEntryId ? { ...k, deleted: true, updatedAt: nowIso } : k));
        }

        // Cari güncellenmiÅŸse geri al
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

        // Faturayı soft-delete et
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
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            icon: '📄',
            label: 'Toplam Fatura',
            value: String(stats.total),
            color: '#3b82f6',
          },
          {
            icon: '📤',
            label: 'Satış Faturaları',
            value: formatMoney(stats.satisTotal),
            color: '#10b981',
          },
          {
            icon: '📥',
            label: 'Alış Faturaları',
            value: formatMoney(stats.alisTotal),
            color: '#f59e0b',
          },
          {
            icon: '⏳',
            label: 'Ödenmemiş',
            value: formatMoney(stats.unpaid),
            color: '#ef4444',
          },
          {
            icon: '📝',
            label: 'Taslak',
            value: String(stats.draft),
            color: '#8b5cf6',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`,
              borderRadius: 14,
              padding: '16px 18px',
              border: `1px solid ${s.color}20`,
            }}
          >
            <div style={{ fontSize: '1rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div
              style={{
                color: '#475569',
                fontSize: '0.72rem',
                marginTop: 3,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => openNew('satis')}
          style={{
            background: 'linear-gradient(135deg, #ff5722, #ff7043)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            padding: '10px 18px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.88rem',
            boxShadow: '0 4px 16px rgba(255,87,34,0.3)',
          }}
        >
          + SatıÅŸ Faturası
        </button>
        <button
          onClick={() => openNew('alis')}
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 10,
            color: '#60a5fa',
            padding: '10px 18px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.88rem',
          }}
        >
          + AlıÅŸ Faturası
        </button>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ğŸ” Ara..."
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              width: 160,
            }}
          />
          {}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'satis' | 'alis')}
            style={{
              padding: '8px 10px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              color: 'var(--text-dim)',
              fontSize: '0.82rem',
            }}
          >
            <option value="all">Tümü</option>
            <option value="satis">SatıÅŸ</option>
            <option value="alis">AlıÅŸ</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 10px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              color: 'var(--text-dim)',
              fontSize: '0.82rem',
            }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="taslak">Taslak</option>
            <option value="onaylandi">Onaylandı</option>
            <option value="odendi">Ã–dendi</option>
            <option value="iptal">İptal</option>
          </select>
        </div>
      </div>

      {/* Invoice List */}
      <div
        className="responsive-table-wrap"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              {['Fatura No', 'Tür', 'Müşteri/Tedarikçi', 'Tarih', 'Tutar', 'Durum', 'Ödeme', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    color: '#334155',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24 }}>
                  <EmptyState
                    icon={FileText}
                    title="Henüz fatura yok"
                    description="Yukarıdaki aksiyonlarla ilk satış veya alış faturanızı oluşturabilirsiniz."
                  />
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)')
                  }
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                >
                  <td data-label="Fatura No" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          fontSize: '0.88rem',
                        }}
                      >
                        {inv.invoiceNo}
                      </span>
                      {inv.saleId && (
                        <span
                          style={{
                            background: 'rgba(139,92,246,0.15)',
                            color: '#a78bfa',
                            borderRadius: 5,
                            padding: '1px 6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          🔗 Satış
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Tür" style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        background: inv.type === 'satis' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: inv.type === 'satis' ? '#10b981' : '#f59e0b',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {inv.type === 'satis' ? '📤 Satış' : '📥 Alış'}
                    </span>
                  </td>
                  <td
                    data-label="Müşteri"
                    style={{
                      padding: '12px 14px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    {inv.cariName}
                  </td>
                  <td
                    data-label="Tarih"
                    style={{
                      padding: '12px 14px',
                      color: '#475569',
                      fontSize: '0.82rem',
                    }}
                  >
                    {formatDate(inv.createdAt)}
                  </td>
                  <td
                    data-label="Tutar"
                    style={{
                      padding: '12px 14px',
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                    }}
                  >
                    {formatMoney(inv.total)}
                  </td>
                  <td data-label="Durum" style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        background: `${statusColors[inv.status]}18`,
                        color: statusColors[inv.status],
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {statusLabels[inv.status]}
                    </span>
                  </td>
                  <td
                    data-label="Ödeme"
                    style={{
                      padding: '12px 14px',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {paymentLabels[inv.payment]}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setPreviewId(inv.id)} title="Önizle" style={miniBtn}>
                        👁️
                      </button>
                      <button onClick={() => openEdit(inv)} title="Düzenle" style={miniBtn}>
                        ✏️
                      </button>
                      {inv.status === 'taslak' && (
                        <button
                          onClick={() => updateStatus(inv.id, 'onaylandi')}
                          title="Onayla"
                          style={{ ...miniBtn, color: '#10b981' }}
                        >
                          ✅
                        </button>
                      )}
                      {inv.status === 'onaylandi' && (
                        <button
                          onClick={() => updateStatus(inv.id, 'odendi')}
                          title="Ödendi"
                          style={{ ...miniBtn, color: '#3b82f6' }}
                        >
                          💰
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvoice(inv.id)}
                        title="Sil"
                        style={{ ...miniBtn, color: '#ef4444' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
          save={save}
          showToast={showToast}
        />
      )}
    </div>
  );
}
