import type { DB, Invoice, InvoiceItem } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export interface FormState {
  type: 'satis' | 'alis';
  cariId: string;
  cariName: string;
  cariTaxNo: string;
  cariAddress: string;
  items: InvoiceItem[];
  discount: number;
  payment: Invoice['payment'];
  dueDate: string;
  note: string;
  status: Invoice['status'];
  saleId: string;
}

/* ------------------------------------------------------------------ */
/*  TotalRow Component                                                */
/* ------------------------------------------------------------------ */

export function TotalRow({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string;
  color?: string;
  big?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}
    >
      <span
        style={{
          color: big ? '#94a3b8' : '#475569',
          fontSize: big ? '0.95rem' : '0.82rem',
          fontWeight: big ? 700 : 400,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: color || '#f1f5f9',
          fontWeight: big ? 900 : 600,
          fontSize: big ? '1.15rem' : '0.88rem',
        }}
      >
        {value}
      </span>
    </div>
  );
}
