import { useMemo, useState } from 'react';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { downloadObjectSheetsAsXlsx } from '@/lib/safeXlsx';
import { formatDate, genId } from '@/lib/utils-tr';
import type { BankTransaction } from '@/types';
import { BankStats } from './BankStats';
import { BankActions } from './BankActions';
import { BankFilters } from './BankFilters';
import { BankTable } from './BankTable';
import { BankForm } from './BankForm';
import type { Props, BankFormState, StatusFilter, TypeFilter } from './types';
import { STATUS_LABEL } from './types';

function filterTransactions(
  transactions: BankTransaction[],
  filter: StatusFilter,
  typeFilter: TypeFilter,
  search: string,
  dateFrom: string,
  dateTo: string,
) {
  let result = transactions;
  if (filter !== 'all') result = result.filter((t) => t.status === filter);
  if (typeFilter !== 'all')
    result = result.filter(
      (t) =>
        t.type === typeFilter ||
        (typeFilter === 'income' && t.type === 'credit') ||
        (typeFilter === 'expense' && t.type === 'debit'),
    );
  if (search) result = result.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));
  if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
  if (dateTo) result = result.filter((t) => t.date <= dateTo + 'T23:59:59');
  return [...result].sort(
    (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime(),
  );
}

function computeStats(transactions: BankTransaction[]) {
  return {
    totalIn: transactions.filter((t) => t.type === 'income' || t.type === 'credit').reduce((s, t) => s + t.amount, 0),
    totalOut: transactions.filter((t) => t.type === 'expense' || t.type === 'debit').reduce((s, t) => s + t.amount, 0),
    unmatched: transactions.filter((t) => t.status === 'unmatched').length,
    matched: transactions.filter((t) => t.status === 'matched').length,
    confirmed: transactions.filter((t) => t.status === 'confirmed').length,
  };
}

function parseCsvText(text: string) {
  const lines = text.split('\n').filter((l) => l.trim());
  const header = lines[0].toLowerCase();
  const hasDesc = header.includes('açıklama') || header.includes('description') || header.includes('aciklama');
  const hasAmount = header.includes('tutar') || header.includes('amount') || header.includes('miktar');
  if (!hasDesc || !hasAmount) return null;
  const parsed = lines
    .slice(1)
    .map((line) => {
      const cols = line.split(';').length > 1 ? line.split(';') : line.split(',');
      const find = (kw: string[]) => {
        const idx = header.split(/[;,]/).findIndex((h) => kw.some((k) => h.trim().toLowerCase().includes(k)));
        return idx >= 0 ? cols[idx]?.trim() : '';
      };
      const rawAmount = find(['tutar', 'amount', 'miktar']);
      const amount = Math.abs(parseFloat(rawAmount.replace(',', '.').replace(/[^0-9.-]/g, '')));
      const rawDate = find(['tarih', 'date']) || new Date().toISOString().split('T')[0];
      const parsedDate = rawDate.includes('T') ? rawDate : rawDate.includes('.') ? rawDate.split('.')[0] : rawDate;
      const desc = find(['açıklama', 'description', 'aciklama']);
      const rawType = (find(['tür', 'type', 'tur']) || '').toLowerCase();
      const type =
        rawAmount.startsWith('-') ||
        rawType.includes('giden') ||
        rawType.includes('expense') ||
        rawType.includes('çıkış')
          ? ('expense' as const)
          : ('income' as const);
      if (!desc || !amount || amount <= 0) return null;
      return {
        description: desc,
        amount,
        date: parsedDate,
        type,
      };
    })
    .filter(Boolean) as {
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
  }[];
  return parsed.length > 0 ? parsed : null;
}

export default function Bank({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<BankFormState>({
    description: '',
    amount: '',
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    cariId: '',
  });

  const handleAdd = () => {
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) {
      showToast('Açıklama gerekli!', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('Geçerli tutar girin!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    const tx: BankTransaction = {
      id: genId(),
      date: new Date(form.date).toISOString(),
      description: form.description.trim(),
      amount,
      type: form.type,
      status: form.cariId ? 'matched' : 'unmatched',
      matchedCariId: form.cariId || undefined,
      matchScore: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    save((prev) => ({
      ...prev,
      bankTransactions: [...prev.bankTransactions, tx],
    }));
    showToast('İşlem eklendi!', 'success');
    setAddModal(false);
    setForm({
      description: '',
      amount: '',
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      cariId: '',
    });
  };

  const matchToAccount = (transId: string, cariId: string) => {
    save((prev) => ({
      ...prev,
      bankTransactions: prev.bankTransactions.map((t) =>
        t.id === transId
          ? {
              ...t,
              matchedCariId: cariId,
              status: 'matched' as const,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    }));
    showToast('Cari eşleştirildi!', 'success');
  };

  const confirmTx = (id: string) => {
    const tx = db.bankTransactions.find((t) => t.id === id);
    if (!tx) return;
    const nowIso = new Date().toISOString();
    save((prev) => {
      const isGelir = tx.type === 'income' || tx.type === 'credit';
      const kasaEntry = {
        id: genId(),
        type: isGelir ? ('gelir' as const) : ('gider' as const),
        category: isGelir ? 'banka_gelir' : 'banka_gider',
        amount: tx.amount,
        kasa: 'banka',
        description: `[Banka] ${tx.description}`,
        cariId: tx.matchedCariId,
        relatedId: tx.id,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      let cari = prev.cari;
      if (tx.matchedCariId) {
        cari = cari.map((c) =>
          c.id === tx.matchedCariId
            ? {
                ...c,
                balance: (c.balance || 0) + (isGelir ? -tx.amount : tx.amount),
                lastTransaction: nowIso,
                updatedAt: nowIso,
              }
            : c,
        );
      }
      return {
        ...prev,
        bankTransactions: prev.bankTransactions.map((t) =>
          t.id === id ? { ...t, status: 'confirmed' as const, updatedAt: nowIso } : t,
        ),
        kasa: [...prev.kasa, kasaEntry],
        cari,
      };
    });
    showToast('Onaylandı ve kasaya aktarıldı!', 'success');
  };

  const confirmAll = () => {
    const pending = db.bankTransactions.filter((t) => t.status === 'matched');
    if (!pending.length) {
      showToast('Onaylanacak eşleşmiş işlem yok!', 'warning');
      return;
    }
    showConfirm('Toplu Onayla', `${pending.length} eşleşmiş işlemi onaylayıp kasaya aktarmak istiyor musunuz?`, () => {
      const nowIso = new Date().toISOString();
      save((prev) => {
        const kasa = [...prev.kasa];
        let cari = [...prev.cari];
        const updated = prev.bankTransactions.map((t) => {
          if (t.status !== 'matched') return t;
          const isGelir = t.type === 'income' || t.type === 'credit';
          kasa.push({
            id: genId(),
            type: isGelir ? ('gelir' as const) : ('gider' as const),
            category: isGelir ? 'banka_gelir' : 'banka_gider',
            amount: t.amount,
            kasa: 'banka',
            description: `[Banka] ${t.description}`,
            cariId: t.matchedCariId,
            relatedId: t.id,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
          if (t.matchedCariId) {
            cari = cari.map((c) =>
              c.id === t.matchedCariId
                ? {
                    ...c,
                    balance: (c.balance || 0) + (isGelir ? -t.amount : t.amount),
                    lastTransaction: nowIso,
                    updatedAt: nowIso,
                  }
                : c,
            );
          }
          return { ...t, status: 'confirmed' as const, updatedAt: nowIso };
        });
        return { ...prev, bankTransactions: updated, kasa, cari };
      });
      showToast(`${pending.length} işlem onaylandı ve kasaya aktarıldı!`, 'success');
    });
  };

  const handleDelete = (id: string) => {
    showConfirm('İşlemi Sil', 'Bu banka işlemini silmek istiyor musunuz?', () => {
      const nowIso = new Date().toISOString();
      save((prev) => {
        const tx = prev.bankTransactions.find((t) => t.id === id);
        if (!tx) return prev;
        let kasa = prev.kasa;
        let cari = prev.cari;
        if (tx.status === 'confirmed') {
          kasa = kasa.map((k) => (k.relatedId === tx.id ? { ...k, deleted: true, updatedAt: nowIso } : k));
          if (tx.matchedCariId) {
            const isGelir = tx.type === 'income' || tx.type === 'credit';
            cari = cari.map((c) =>
              c.id === tx.matchedCariId
                ? {
                    ...c,
                    balance: (c.balance || 0) + (isGelir ? tx.amount : -tx.amount),
                    lastTransaction: nowIso,
                    updatedAt: nowIso,
                  }
                : c,
            );
          }
        }
        return {
          ...prev,
          bankTransactions: prev.bankTransactions.filter((t) => t.id !== id),
          kasa,
          cari,
        };
      });
      showToast('Silindi!', 'success');
    });
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCsvText(text);
      if (!parsed) {
        showToast('CSV\'de en az "Açıklama" ve "Tutar" sütunları olmalı!', 'error');
        return;
      }
      save((prev) => ({
        ...prev,
        bankTransactions: [
          ...prev.bankTransactions,
          ...parsed.map((p) => ({
            id: genId(),
            date: new Date(p.date).toISOString(),
            description: p.description,
            amount: p.amount,
            type: p.type,
            status: 'unmatched' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        ],
      }));
      showToast(`${parsed.length} işlem yüklendi!`, 'success');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleExcelDownload = () => {
    const rows = sorted.map((t) => ({
      Tarih: formatDate(t.date),
      Açıklama: t.description,
      Tutar: t.amount,
      Tür: t.type === 'income' || t.type === 'credit' ? 'Gelen' : 'Giden',
      Durum: STATUS_LABEL[t.status || 'unmatched']?.label || '',
      Cari: t.matchedCariId ? db.cari.find((c) => c.id === t.matchedCariId)?.name || '' : '',
    }));
    void downloadObjectSheetsAsXlsx(
      [
        {
          name: 'Banka İşlemleri',
          rows: rows.length > 0 ? rows : [{}],
          widths: [18, 35, 15, 10, 14, 20],
        },
      ],
      `banka-islemleri-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showToast('Excel indirildi!', 'success');
  };

  const handleAiMatch = () => {
    const unmatched = db.bankTransactions.filter((t) => t.status === 'unmatched' || t.status === 'matched');
    if (unmatched.length === 0) {
      showToast('Eşlenecek işlem yok', 'info');
      return;
    }
    let matchCount = 0;
    save((prev) => ({
      ...prev,
      bankTransactions: prev.bankTransactions.map((t) => {
        if (t.status !== 'unmatched' && t.status !== 'matched') return t;
        const kw = t.description.toLowerCase().replace(/[^a-z0-9çşğıüö]/g, '');
        const found = prev.cari
          .filter((c) => !c.deleted)
          .find((c) => {
            const ckw = c.name.toLowerCase().replace(/[^a-z0-9çşğıüö]/g, '');
            if (ckw.length < 3) return false;
            return kw.includes(ckw) || ckw.includes(kw);
          });
        if (!found) {
          const words = kw.split(/\s+/).filter((w) => w.length > 3);
          const match = prev.cari
            .filter((c) => !c.deleted)
            .find((c) => {
              const ckw = c.name.toLowerCase().replace(/[^a-z0-9çşğıüö]/g, '');
              const intersect = words.filter((w) => ckw.includes(w));
              return intersect.length >= Math.min(2, words.length);
            });
          if (!match) return t;
          matchCount++;
          return {
            ...t,
            matchedCariId: match.id,
            status: 'matched' as const,
            updatedAt: new Date().toISOString(),
          };
        }
        matchCount++;
        return {
          ...t,
          matchedCariId: found.id,
          status: 'matched' as const,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    setTimeout(() => showToast(`${matchCount} işlem eşlendi!`, 'success'), 100);
  };

  const stats = useMemo(() => computeStats(db.bankTransactions), [db.bankTransactions]);

  const sorted = useMemo(
    () => filterTransactions(db.bankTransactions, filter, typeFilter, search, dateFrom, dateTo),
    [db.bankTransactions, filter, typeFilter, search, dateFrom, dateTo],
  );

  const cariList = db.cari.filter((c) => !c.deleted).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <BankStats stats={stats} />
      <BankActions
        onAddClick={() => setAddModal(true)}
        matchedCount={stats.matched}
        onConfirmAll={confirmAll}
        onExcelDownload={handleExcelDownload}
        onCsvFile={handleCsvFile}
        onAiMatch={handleAiMatch}
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
      <BankFilters
        filter={filter}
        setFilter={setFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        stats={stats}
        totalCount={db.bankTransactions.length}
      />
      <BankTable
        sorted={sorted}
        db={db}
        onConfirm={confirmTx}
        onDelete={handleDelete}
        onMatch={matchToAccount}
        onClearFilters={() => {
          setSearch('');
          setDateFrom('');
          setDateTo('');
          setTypeFilter('all');
        }}
      />
      <BankForm
        open={addModal}
        onClose={() => setAddModal(false)}
        form={form}
        onFormChange={setForm}
        onSave={handleAdd}
        cariList={cariList}
      />
    </div>
  );
}
