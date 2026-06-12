import type { Invoice, InvoiceItem } from '@/types';

export interface FaturaFormState {
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

export interface FaturaStats {
  satisTotal: number;
  alisTotal: number;
  unpaid: number;
  draft: number;
  total: number;
}
