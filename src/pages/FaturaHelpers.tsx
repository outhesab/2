import type { DB, Installment, Invoice, InvoiceItem } from '@/types';

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
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export function createInstallmentPlan(
  invoiceId: string,
  total: number,
  count: number,
  firstDueDate: Date,
): Installment[] {
  const base = Math.floor((total / count) * 100) / 100;
  const last = Math.round((total - base * (count - 1)) * 100) / 100;
  const nowIso = new Date().toISOString();
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `inst-${Date.now()}-${i}`,
    invoiceId,
    dueDate: new Date(firstDueDate.getFullYear(), firstDueDate.getMonth() + i, firstDueDate.getDate()).toISOString(),
    amount: i === count - 1 ? last : base,
    paid: false,
    paidAt: undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}

export const emptyItem = (): InvoiceItem => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  vatRate: 20,
  total: 0,
});

export function nextInvoiceNo(invoices: Invoice[], type: 'satis' | 'alis') {
  const prefix = type === 'satis' ? 'SFT' : 'AFT';
  const year = new Date().getFullYear();
  const existing = invoices.filter((i) => i.invoiceNo.startsWith(`${prefix}-${year}`));
  const maxNum = existing.reduce((mx, i) => {
    const n = parseInt(i.invoiceNo.split('-')[2]) || 0;
    return n > mx ? n : mx;
  }, 0);
  return `${prefix}-${year}-${String(maxNum + 1).padStart(4, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const statusColors: Record<string, string> = {
  taslak: '#f59e0b',
  onaylandi: '#3b82f6',
  odendi: '#10b981',
  iptal: '#ef4444',
};

export const statusLabels: Record<string, string> = {
  taslak: '📄 Taslak',
  onaylandi: '✅ Onaylandı',
  odendi: '💰 Ödendi',
  iptal: '❌ İptal',
};

export const paymentLabels: Record<string, string> = {
  nakit: 'Nakit',
  kart: 'Kredi Kartı',
  havale: 'Havale/EFT',
  cari: 'Cari',
  cek: 'Çek',
};

/* ------------------------------------------------------------------ */
/*  Style constants                                                   */
/* ------------------------------------------------------------------ */

export const miniBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: 'none',
  borderRadius: 6,
  color: 'var(--text-muted)',
  padding: '4px 6px',
  cursor: 'pointer',
  fontSize: '0.82rem',
};

export const lbl: React.CSSProperties = {
  display: 'block',
  marginBottom: 5,
  color: 'var(--text-muted)',
  fontSize: '0.82rem',
  fontWeight: 600,
};

export const inp: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.88rem',
  boxSizing: 'border-box',
};

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
