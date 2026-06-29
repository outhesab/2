/**
 * Cari sayfasi — Orchestrator.
 * Musteri ve tedarikci yonetimi, borc takibi, tahsilat/odeme.
 */

import CariDetail from './CariDetail';
import CariForm from './CariForm';
import CariIslemModal from './CariIslemModal';
import CariList from './CariList';
import { useConfirm } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { isExactMatch, similarity } from '@/lib/similarity';
import { formatMoney, genId } from '@/lib/utils-tr';
import type { Cari as CariType, DB } from '@/types';
import { useState } from 'react';
import { useDebounce } from '@/pages/useDebounce';
// VoiceAssistantButton removed in favor of SobaNexus
import { filterAndSortCari, getAgingBuckets, getTotals } from './CariHelpers';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export default function Cari({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'musteri' | 'tedarikci'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'debt_days'>('name');
  const [showOnlyDebt, setShowOnlyDebt] = useState(false);
  const [form, setForm] = useState<Partial<CariType>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [islemModal, setIslemModal] = useState<{
    cariId: string;
    cariName: string;
    type: 'musteri' | 'tedarikci';
  } | null>(null);

  const sorted = filterAndSortCari(db.cari, { filter, search: debouncedSearch, showOnlyDebt, sortBy }, db);
  const aging = getAgingBuckets(sorted);
  const { totalReceivable, totalPayable } = getTotals(db);

  const openAdd = () => {
    setForm({ type: 'musteri', name: '', taxNo: '', phone: '', email: '', address: '', balance: 0, note: '' });
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (c: CariType) => {
    setForm({ ...c });
    setEditId(c.id);
    setModalOpen(true);
  };

  const handleSave = (formData: Partial<CariType>) => {
    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      showToast('Ad gerekli!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();

    if (!editId || !isExactMatch(trimmedName, db.cari.find((c) => c.id === editId)?.name || '')) {
      const aktifCari = db.cari.filter((c) => !c.deleted && c.id !== editId);
      const tamEslesme = aktifCari.find((c) => isExactMatch(c.name, trimmedName));
      if (tamEslesme) {
        showToast(`"${tamEslesme.name}" adinda cari zaten var! Kayit engellendi.`, 'error');
        return;
      }
      const benzer = aktifCari.find((c) => similarity(c.name, trimmedName) >= 70);
      if (benzer) {
        const devamEt = window.confirm(
          `⚠️ "${benzer.name}" adinda benzer bir cari mevcut.\nYine de kaydetmek istiyor musunuz?`,
        );
        if (!devamEt) return;
      }
    }

    save((prev) => {
      const cari = [...prev.cari];
      if (editId) {
        const i = cari.findIndex((c) => c.id === editId);
        if (i >= 0) cari[i] = { ...cari[i], ...formData, name: trimmedName, updatedAt: nowIso } as CariType;
        showToast('Cari guncellendi!', 'success');
      } else {
        cari.push({
          id: genId(),
          createdAt: nowIso,
          updatedAt: nowIso,
          name: trimmedName,
          type: 'musteri',
          balance: 0,
          ...formData,
        } as CariType);
        showToast('Cari eklendi!', 'success');
      }
      return { ...prev, cari };
    });
    setModalOpen(false);
  };

  const handleIslem = (amountStr: string, kasa: string, description: string) => {
    if (!islemModal) return;
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      showToast('Gecerli tutar girin!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    const isTahsilat = islemModal.type === 'musteri';
    const kasaType = isTahsilat ? ('gelir' as const) : ('gider' as const);
    const category = isTahsilat ? 'tahsilat' : 'tedarik';
    const desc = description || (isTahsilat ? `Tahsilat: ${islemModal.cariName}` : `Odeme: ${islemModal.cariName}`);

    save((prev) => {
      const kasaEntry = {
        id: genId(),
        type: kasaType,
        category,
        amount,
        kasa,
        description: desc,
        cariId: islemModal.cariId,
        relatedId: islemModal.cariId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const cari = prev.cari.map((c) =>
        c.id === islemModal.cariId
          ? { ...c, balance: (c.balance || 0) - amount, lastTransaction: nowIso, updatedAt: nowIso }
          : c,
      );
      const cariRec = prev.cari.find((c) => c.id === islemModal.cariId);
      let ortakEmanetler = prev.ortakEmanetler || [];
      if (cariRec?.ortak && cariRec?.partnerId && kasaType === 'gider') {
        ortakEmanetler = [
          ...ortakEmanetler,
          {
            id: genId(),
            partnerId: cariRec.partnerId,
            description: desc || `Kasadan cekim: ${islemModal.cariName}`,
            amount,
            note: `Kasa: ${kasa}`,
            type: 'emanet' as const,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }
      return { ...prev, kasa: [...prev.kasa, kasaEntry], cari, ortakEmanetler };
    });

    showToast(
      isTahsilat ? `Tahsilat kaydedildi: ${formatMoney(amount)}` : `Odeme kaydedildi: ${formatMoney(amount)}`,
      'success',
    );
    setIslemModal(null);
  };

  const handleDelete = (id: string) => {
    const relatedSales = db.sales.filter((s) => !s.deleted && s.cariId === id);
    const relatedKasa = db.kasa.filter((k) => !k.deleted && k.cariId === id);
    const hasRelated = relatedSales.length > 0 || relatedKasa.length > 0;
    const msg = hasRelated
      ? `Bu cariye ait ${relatedSales.length} satis ve ${relatedKasa.length} kasa kaydi var. Silinen cari gizlenecek ancak gecmis kayitlar korunacak.`
      : 'Bu cari kaydini silmek istediginizden emin misiniz?';
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

  const handleOpenIslem = (cariId: string, cariName: string, type: 'musteri' | 'tedarikci') => {
    setIslemModal({ cariId, cariName, type });
  };

  return (
    <div>
      <CariList
        db={db}
        sorted={sorted}
        aging={aging}
        totalReceivable={totalReceivable}
        totalPayable={totalPayable}
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        showOnlyDebt={showOnlyDebt}
        setShowOnlyDebt={setShowOnlyDebt}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onOpenAdd={openAdd}
        onOpenEdit={openEdit}
        onDelete={handleDelete}
        onOpenIslem={handleOpenIslem}
        onSetFilterDebtDays={() => {
          setFilter('musteri');
          setShowOnlyDebt(true);
          setSortBy('debt_days');
        }}
        showToast={showToast}
      />

      <CariForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={form}
        editId={editId}
      />

      <CariIslemModal
        open={!!islemModal}
        onClose={() => setIslemModal(null)}
        onSave={handleIslem}
        cariName={islemModal?.cariName || ''}
        type={islemModal?.type || 'musteri'}
        db={db}
      />

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
            detail={detail as CariType & { note?: string }}
            detailKasa={detailKasa}
            detailSales={detailSales}
            detailInvoices={detailInvoices}
            totalPaid={totalPaid}
            totalPurchased={totalPurchased}
            histTab={histTab}
            setHistTab={setHistTab}
            onQuickAction={(cariId, cariName, type, _balance) => {
              setIslemModal({ cariId, cariName, type });
            }}
            showToast={showToast}
          />
        </Modal>
      )}
      {/* VoiceAssistantButton removed in favor of SobaNexus */}
    </div>
  );
}
