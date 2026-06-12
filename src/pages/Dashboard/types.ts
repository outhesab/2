import { ReactNode } from 'react';
import type { DB } from '@/types';

export interface DashboardProps {
  db: DB;
  onTabChange: (tab: string) => void;
  save: (updater: (prev: DB) => DB) => void;
}

export interface StatCardData {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  gradient: string;
  sub?: string;
  tab?: string;
  trend?: number;
}
