import type { InvoiceItem } from '@/types';
import { FaturaFormState } from './types';

export function calcTotals(items: InvoiceItem[], discount: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const vatTotal = items.reduce((s, it) => s + (it.quantity * it.unitPrice * it.vatRate) / 100, 0);
  return { subtotal, vatTotal, total: subtotal + vatTotal - discount };
}

export function createEmptyForm(type: 'satis' | 'alis'): FaturaFormState {
  return {
    type,
    cariId: '',
    cariName: '',
    cariTaxNo: '',
    cariAddress: '',
    items: [], // Will be populated with emptyItem() by the component
    discount: 0,
    payment: 'nakit',
    dueDate: '',
    note: '',
    status: 'taslak',
    saleId: '',
  };
}
