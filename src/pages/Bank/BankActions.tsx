import { TableFilterBar } from '@/pages/pageHelpers';

interface BankActionsProps {
  onAddClick: () => void;
  matchedCount: number;
  onConfirmAll: () => void;
  onExcelDownload: () => void;
  onCsvFile: (file: File) => void;
  onAiMatch: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  onClearDates: () => void;
}

export function BankActions({
  onAddClick,
  matchedCount,
  onConfirmAll,
  onExcelDownload,
  onCsvFile,
  onAiMatch,
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearDates,
}: BankActionsProps) {
  return (
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
        onClick={onAddClick}
        style={{
          background: '#ff5722',
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          padding: '9px 18px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.88rem',
        }}
      >
        + İşlem Ekle
      </button>
      {matchedCount > 0 && (
        <button
          onClick={onConfirmAll}
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            color: '#10b981',
            padding: '9px 16px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ✓ Tümünü Onayla ({matchedCount})
        </button>
      )}
      <button
        onClick={onExcelDownload}
        style={{
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 10,
          color: '#818cf8',
          padding: '9px 14px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.85rem',
        }}
      >
        📥 Excel
      </button>
      <label
        style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 10,
          color: '#10b981',
          padding: '9px 14px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        📤 CSV Yükle
        <input
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onCsvFile(file);
            e.target.value = '';
          }}
        />
      </label>
      <button
        onClick={onAiMatch}
        style={{
          background: 'rgba(139,92,246,0.12)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 10,
          color: '#a78bfa',
          padding: '9px 14px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.85rem',
        }}
      >
        🤖 AI Eşle
      </button>
      <TableFilterBar
        search={search}
        onSearchChange={onSearchChange}
        dateFrom={dateFrom}
        onDateFromChange={onDateFromChange}
        dateTo={dateTo}
        onDateToChange={onDateToChange}
        onClearDates={onClearDates}
      />
    </div>
  );
}
