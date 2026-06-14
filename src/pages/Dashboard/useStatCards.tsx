import { useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, Package, Wallet, Landmark, ClipboardList, AlertTriangle } from 'lucide-react';
import { formatMoney } from '@/lib/utils-tr';
import type { StatCardData } from './types';

export interface DashboardStats {
  todayRevenue: number;
  todayProfit: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthProfit: number;
  outOfStock: number;
  lowStock: number;
  totalKasa: number;
  nakit: number;
  banka: number;
  pendingOrders: number;
  totalReceivable: number;
  totalPayable: number;
  netSermaye: number;
  stokDeger: number;
  revTrend: number;
}

export function useStatCards(stats: DashboardStats, productCount: number): StatCardData[] {
  return useMemo(
    () => [
      {
        icon: <DollarSign className="size-5" />,
        label: 'Bugün Ciro',
        value: formatMoney(stats.todayRevenue),
        color: '#10b981',
        gradient: 'rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%',
        sub: `${stats.todaySalesCount} satış`,
        tab: 'sales',
        trend: stats.revTrend,
      },
      {
        icon: <TrendingUp className="size-5" />,
        label: 'Bugün Kâr',
        value: formatMoney(stats.todayProfit),
        color: '#3b82f6',
        gradient: 'rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%',
        sub: `${stats.todayRevenue > 0 ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1) : 0}% marj`,
      },
      {
        icon: <Calendar className="size-5" />,
        label: 'Bu Ay Ciro',
        value: formatMoney(stats.monthRevenue),
        color: '#8b5cf6',
        gradient: 'rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%',
        sub: `Kâr: ${formatMoney(stats.monthProfit)}`,
      },
      {
        icon: <Package className="size-5" />,
        label: 'Stok Değeri',
        value: formatMoney(stats.stokDeger),
        color: '#f59e0b',
        gradient: 'rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%',
        tab: 'stock',
        sub: `${productCount} ürün`,
      },
      {
        icon: <Wallet className="size-5" />,
        label: 'Nakit Kasa',
        value: formatMoney(stats.nakit),
        color: '#06b6d4',
        gradient: 'rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 100%',
        tab: 'kasa',
      },
      {
        icon: <Landmark className="size-5" />,
        label: 'Banka',
        value: formatMoney(stats.banka),
        color: '#6366f1',
        gradient: 'rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%',
        tab: 'kasa',
      },
      {
        icon: <ClipboardList className="size-5" />,
        label: 'Alacak',
        value: formatMoney(stats.totalReceivable),
        color: '#ff5722',
        gradient: 'rgba(255,87,34,0.12) 0%, rgba(255,87,34,0.04) 100%',
        tab: 'cari',
      },
      {
        icon: <AlertTriangle className="size-5" />,
        label: 'Stok Uyarısı',
        value: `${stats.outOfStock + stats.lowStock}`,
        color: '#ef4444',
        gradient: 'rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.06) 100%',
        tab: 'products',
        sub: `${stats.outOfStock} bitti · ${stats.lowStock} az`,
      },
    ],
    [stats, productCount],
  );
}
