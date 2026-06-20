/**
 * @file Suppliers.test.tsx
 * @description Suppliers sayfası smoke testi.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Suppliers from './index';
import type { DB } from '@/types';

const mockDb = {
  suppliers: [],
  peletSuppliers: [],
  boruSuppliers: [],
  orders: [],
  products: [],
  cari: [],
  stockMovements: [],
  sales: [],
  customers: [],
  payments: [],
  expenses: [],
  banks: [],
  bankMovements: [],
  employees: [],
  shifts: [],
  attendance: [],
  notes: [],
  reminders: [],
  tasks: [],
  projects: [],
  inventory: [],
  recipes: [],
  productions: [],
  settings: {},
} as unknown as DB;

describe('Suppliers', () => {
  it('renders tab buttons', () => {
    render(<Suppliers db={mockDb} save={() => {}} />);
    expect(screen.getByText('🏭 Tedarikçiler')).toBeTruthy();
    expect(screen.getByText('📦 Siparişler')).toBeTruthy();
  });
});
