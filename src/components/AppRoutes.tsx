/**
 * App route tanımları
 * R3-8 F-4: App.tsx'ten ayrılan route yapısı
 *
 * Plan: fix-plan-repo_2-round2-2026-06-29.md, PR-R3-8
 */

import { Suspense, lazy } from 'react';
import { Switch, Route } from 'wouter';
import type { DB } from '@/types';
import type { TabId } from '@/config/tabs';
import PageFallback from '@/components/layout/PageFallback';

// Lazy imports (same pattern as original App.tsx)
const AIEylemLog = lazy(() => import('@/pages/AIEylemLog'));
const AnomaliOneri = lazy(() => import('@/pages/AnomaliOneri'));
const Bank = lazy(() => import('@/pages/Bank'));
const BoruTed = lazy(() => import('@/pages/BoruTed'));
const BugHunter = lazy(() => import('@/pages/BugHunter'));
const Butce = lazy(() => import('@/pages/Butce'));
const Cari = lazy(() => import('@/pages/Cari'));
const Cizelge = lazy(() => import('@/pages/Cizelge'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DashboardFinans = lazy(() => import('@/pages/DashboardFinans'));
const DashboardTicaret = lazy(() => import('@/pages/DashboardTicaret'));
const DashboardOperasyon = lazy(() => import('@/pages/DashboardOperasyon'));
const DashboardStrateji = lazy(() => import('@/pages/DashboardStrateji'));
const Entegrasyonlar = lazy(() => import('@/pages/Entegrasyonlar'));
const ExcelImport = lazy(() => import('@/pages/ExcelImport'));
const ExcelMerge = lazy(() => import('@/pages/ExcelMerge'));
const Fatura = lazy(() => import('@/pages/Fatura'));
const Kasa = lazy(() => import('@/pages/Kasa'));
const KontrolHalkasi = lazy(() => import('@/pages/KontrolHalkasi'));
const Monitor = lazy(() => import('@/pages/Monitor'));
const NotFound = lazy(() => import('@/pages/not-found'));
const Notlar = lazy(() => import('@/pages/Notlar'));
const OrtakEmanet = lazy(() => import('@/pages/OrtakEmanet'));
const Partners = lazy(() => import('@/pages/Partners'));
const Pelet = lazy(() => import('@/pages/Pelet'));
const Receivables = lazy(() => import('@/pages/Receivables'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Reports = lazy(() => import('@/pages/Reports'));
const Sales = lazy(() => import('@/pages/Sales'));
const SaleDetail = lazy(() => import('@/pages/SaleDetail'));
const Settings = lazy(() => import('@/pages/Settings'));
const NexusSalesAdmin = lazy(() => import('@/pages/NexusSalesAdmin'));
const Perf = lazy(() => import('@/pages/Perf'));
const SpecDashboard = lazy(() => import('@/pages/SpecDashboard'));
const Stock = lazy(() => import('@/pages/Stock'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));

export interface AppRoutesProps {
  db: DB;
  save: (updater: (prev: DB) => DB) => void;
  navigate: (tab: TabId) => void;
  exportJSON: () => void;
  importJSON: (file: File) => Promise<boolean>;
  undo: () => boolean;
}

export function AppRoutes({ db, save, navigate, exportJSON, importJSON, undo }: AppRoutesProps) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/dashboard">
          <Dashboard db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
        </Route>
        <Route path="/dashboard-finans">
          <DashboardFinans db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
        </Route>
        <Route path="/dashboard-ticaret">
          <DashboardTicaret db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
        </Route>
        <Route path="/dashboard-operasyon">
          <DashboardOperasyon db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
        </Route>
        <Route path="/dashboard-strateji">
          <DashboardStrateji db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
        </Route>
        <Route path="/urunler/:id">
          <ProductDetail db={db} save={save} />
        </Route>
        <Route path="/satis/:id">
          <SaleDetail db={db} />
        </Route>
        <Route path="/cari/:id">
          <Cari db={db} save={save} />
        </Route>
        <Route path="/products">
          <Products db={db} save={save} />
        </Route>
        <Route path="/sales">
          <Sales db={db} save={save} />
        </Route>
        <Route path="/fatura">
          <Fatura db={db} save={save} />
        </Route>
        <Route path="/suppliers">
          <Suppliers db={db} save={save} />
        </Route>
        <Route path="/pelet">
          <Pelet db={db} save={save} />
        </Route>
        <Route path="/boruTed">
          <BoruTed db={db} save={save} />
        </Route>
        <Route path="/ortak-emanet">
          <OrtakEmanet db={db} save={save} />
        </Route>
        <Route path="/receivables">
          <Receivables />
        </Route>
        <Route path="/cari">
          <Cari db={db} save={save} />
        </Route>
        <Route path="/kasa">
          <Kasa db={db} save={save} />
        </Route>
        <Route path="/butce">
          <Butce db={db} save={save} />
        </Route>
        <Route path="/bank">
          <Bank db={db} save={save} />
        </Route>
        <Route path="/reports">
          <Reports db={db} />
        </Route>
        <Route path="/stock">
          <Stock db={db} save={save} />
        </Route>
        <Route path="/monitor">
          <Monitor db={db} save={save} />
        </Route>
        <Route path="/kontrol">
          <KontrolHalkasi db={db} />
        </Route>
        <Route path="/entegrasyon">
          <Entegrasyonlar db={db} />
        </Route>
        <Route path="/excelmerge">
          <ExcelMerge />
        </Route>
        <Route path="/notlar">
          <Notlar db={db} save={save} />
        </Route>
        <Route path="/cizelge">
          <Cizelge db={db} />
        </Route>
        <Route path="/partners">
          <Partners db={db} save={save} />
        </Route>
        <Route path="/settings">
          <Settings db={db} save={save} exportJSON={exportJSON} importJSON={importJSON} />
        </Route>
        <Route path="/nexus-admin">
          <NexusSalesAdmin db={db} save={save} />
        </Route>
        <Route path="/bughunter">
          <BugHunter />
        </Route>
        <Route path="/anomali">
          <AnomaliOneri db={db} save={save} />
        </Route>
        <Route path="/excelimport">
          <ExcelImport db={db} save={save} />
        </Route>
        <Route path="/ai/eylem-log">
          <AIEylemLog db={db} undo={undo} />
        </Route>
        <Route path="/not-found">
          <NotFound />
        </Route>
        <Route path="/perf">
          <Perf />
        </Route>
        <Route path="/spec">
          <SpecDashboard />
        </Route>
        <Route>
          <Dashboard db={db} save={save} onTabChange={(tab) => navigate(tab as TabId)} />
        </Route>
      </Switch>
    </Suspense>
  );
}
