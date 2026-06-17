import { useState, useRef, useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { exportToExcel } from '@/lib/excelExport';
import { genId, formatDate, formatMoney } from '@/lib/utils-tr';
import type { DB } from '@/types';
import EmptyState from '@/components/EmptyState';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VoiceAssistantButton } from '@/components/VoiceAssistantButton';

interface Props { db: DB; save: (fn: (prev: DB) => DB) => void; }

export default function Stock({ db, save }: Props) {
  const { showToast } = useToast();
  const { playSound } = useSoundFeedback();
  const [adjustModal, setAdjustModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'giris' as 'giris' | 'cikis' | 'duzeltme', amount: '', note: '' });
  const [tab, setTab] = useState<'products' | 'abc' | 'dead' | 'history'>('products');
  const [search, setSearch] = useState('');
  const [histSearch, setHistSearch] = useState('');
  const [histTypeFilter, setHistTypeFilter] = useState('');
  const [histPage, setHistPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const HIST_PAGE_SIZE = 50;
  const movTableRef = useRef<HTMLDivElement>(null);

  let products = db.products.filter(p => !p.deleted);
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const sortedProducts = [...products].sort((a, b) => a.stock - b.stock);

  let movements = db.stockMovements;
  if (histSearch) movements = movements.filter(m => m.productName.toLowerCase().includes(histSearch.toLowerCase()));
  if (histTypeFilter) movements = movements.filter(m => m.type === histTypeFilter);
  const sortedMovements = [...movements].sort((a, b) => new Date(b.date || b.id).getTime() - new Date(a.date || a.id).getTime());
  const totalHistPages = Math.ceil(sortedMovements.length / HIST_PAGE_SIZE);
  const pagedMovements = sortedMovements.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE);

  const scrollToMovTable = () => movTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleAdjust = () => {
    const product = db.products.find(p => p.id === form.productId);
    if (!product) { showToast('Ürün seçin!', 'error'); return; }
    const amount = parseInt(form.amount);
    if (!amount || amount <= 0) { showToast('Geçerli miktar girin!', 'error'); return; }

    const nowIso = new Date().toISOString();
    const before = product.stock;
    const after = form.type === 'giris' ? before + amount : form.type === 'cikis' ? Math.max(0, before - amount) : amount;

    setLoading(true);
    save(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === form.productId ? { ...p, stock: after, updatedAt: nowIso } : p),
      stockMovements: [...prev.stockMovements, {
        id: genId(), productId: form.productId, productName: product.name,
        type: form.type, amount: form.type === 'duzeltme' ? after - before : amount,
        before, after, note: form.note, date: nowIso,
      }],
    }));
    setLoading(false);

    playSound('success');
    showToast(`Stok güncellendi: ${product.name} → ${after}`, 'success');
    setForm({ productId: '', type: 'giris', amount: '', note: '' });
    setAdjustModal(false);
  };

  // ABC Analizi
  const abcData = useMemo(() => {
    const productRev: Record<string, { name: string; category: string; revenue: number; qty: number; profit: number }> = {};
    db.sales.filter(s => !s.deleted && s.status === 'tamamlandi').forEach(s => {
      if (!s.productId) return;
      if (!productRev[s.productId]) productRev[s.productId] = { name: s.productName, category: s.productCategory || '', revenue: 0, qty: 0, profit: 0 };
      productRev[s.productId].revenue += s.total;
      productRev[s.productId].qty += s.quantity;
      productRev[s.productId].profit += s.profit;
    });
    const sorted = Object.entries(productRev).sort((a, b) => b[1].revenue - a[1].revenue);
    const totalRev = sorted.reduce((s, [, v]) => s + v.revenue, 0) || 1;
    let cumul = 0;
    return sorted.map(([id, v]): { id: string; name: string; category: string; revenue: number; qty: number; profit: number; revenuePct: number; cumulPct: number; class: 'A' | 'B' | 'C' } => {
      cumul += v.revenue;
      const pct = cumul / totalRev;
      const cls: 'A' | 'B' | 'C' = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C';
      return { id, ...v, revenuePct: (v.revenue / totalRev * 100), cumulPct: pct * 100, class: cls };
    });
  }, [db.sales]);
  const abcSummary = useMemo(() => {
    const s = { A: { count: 0, revenue: 0 }, B: { count: 0, revenue: 0 }, C: { count: 0, revenue: 0 } };
    abcData.forEach(v => { s[v.class].count++; s[v.class].revenue += v.revenue; });
    return s;
  }, [abcData]);

  // Ölü Stok (90+ gün hareketsiz)
  const deadStock = useMemo(() => {
    const now = Date.now();
    const cutoff90 = new Date(now - 90 * 86400000).toISOString();
    const lastMovementByProduct: Record<string, string> = {};
    db.stockMovements.forEach(m => {
      const existing = lastMovementByProduct[m.productId];
      if (!existing || m.date > existing) lastMovementByProduct[m.productId] = m.date;
    });
    return db.products.filter(p => {
      if (p.deleted) return false;
      if (p.stock <= 0) return false;
      const last = lastMovementByProduct[p.id];
      if (!last) return true;
      return last < cutoff90;
    }).map(p => {
      const last = lastMovementByProduct[p.id] || p.createdAt;
      const daysSince = Math.floor((now - new Date(last).getTime()) / 86400000);
      return { ...p, lastMovement: last, daysSince };
    }).sort((a, b) => b.daysSince - a.daysSince);
  }, [db.products, db.stockMovements]);
  const deadStockValue = deadStock.reduce((s, p) => s + p.cost * p.stock, 0);

  const activeProducts = db.products.filter(p => !p.deleted);
  const totalValue = activeProducts.reduce((s, p) => s + p.cost * p.stock, 0);
  const outOfStock = activeProducts.filter(p => p.stock === 0).length;
  const lowStock = activeProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length;

  if (loading) return <SkeletonTable rows={6} cols={6} />;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard label="Toplam Ürün" value={String(activeProducts.length)} color="#3b82f6" />
        <StatCard label="Stok Değeri" value={`₺${(totalValue / 1000).toFixed(1)}K`} color="#10b981" />
        <StatCard label="Biten Stok" value={String(outOfStock)} color="#ef4444" />
        <StatCard label="Az Stok" value={String(lowStock)} color="#f59e0b" />
      </div>

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <Button onClick={() => setAdjustModal(true)} className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-bold rounded-xl px-5">
          ⚙️ Stok Ayarla
        </Button>
        <Button
          variant="outline"
          onClick={() => { exportToExcel(db, { sheets: ['stok'] }); showToast('Excel indirildi!', 'success'); }}
          className="rounded-xl"
        >
          📊 Excel İndir
        </Button>
        <div className="flex gap-2">
          {(['products', 'abc', 'dead', 'history'] as const).map(t => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'outline'}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3 h-8 text-xs font-semibold ${tab === t ? 'bg-[#ff5722] hover:bg-[#e64a19]' : ''}`}
            >
              {t === 'products' ? '📦 Ürünler' : t === 'abc' ? '📊 ABC' : t === 'dead' ? '💀 Ölü Stok' : '📋 Hareketler'}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'products' && (
        <>
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="🔍 Ürün ara..." 
            className="mb-4 w-full rounded-xl" 
          />
          <div className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900/60">
                  {['Ürün', 'Kategori', 'Stok', 'Min.Stok', 'Durum', ''].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground text-[0.78rem] font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProducts.length === 0 ? (
                  <tr><td colSpan={6} className="p-6">
                    <EmptyState
                      icon={PackageSearch}
                      title="Ürün bulunamadı"
                      description="Arama kriterlerine uygun ürün bulunamadı. Filtreleri temizleyip tekrar deneyin."
                      actionLabel="Aramayı temizle"
                      onAction={() => setSearch('')}
                    />
                  </td></tr>
                ) : sortedProducts.map(p => {
                  const stockStatus = p.stock === 0 ? { color: '#ef4444', label: '🔴 Bitti', bg: 'bg-red-500/10' } : p.stock <= p.minStock ? { color: '#f59e0b', label: '⚠️ Az', bg: 'bg-amber-500/10' } : { color: '#10b981', label: '✓ Normal', bg: 'bg-emerald-500/10' };
                  const catIcon = (db.productCategories || []).find(c => c.id === p.category)?.icon || '📦';
                  const catName = (db.productCategories || []).find(c => c.id === p.category)?.name || p.category;
                  return (
                    <tr key={p.id} className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                      <td data-label="Ürün" className="p-3 text-foreground font-semibold">{catIcon} {p.name}</td>
                      <td data-label="Kategori" className="p-3 text-slate-400 text-sm">{catName}</td>
                      <td data-label="Stok" className="p-3 font-bold text-base" style={{ color: stockStatus.color }}>{p.stock}</td>
                      <td data-label="Min.Stok" className="p-3 text-muted-foreground">{p.minStock}</td>
                      <td data-label="Durum" className="p-3">
                        <Badge variant="outline" className={`font-semibold text-xs ${stockStatus.bg} ${stockStatus.color.replace('#', 'text-')} border-transparent`}>
                          {stockStatus.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 h-7 px-3 text-xs font-bold rounded-lg"
                          onClick={() => { setForm(f => ({ ...f, productId: p.id })); setAdjustModal(true); }}
                        >
                          ⚙️ Ayarla
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'abc' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {(['A', 'B', 'C'] as const).map(cls => {
              const d = abcSummary[cls];
              const colors: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#64748b' };
              const labels: Record<string, string> = { A: 'A — %80 Ciro (Kritik)', B: 'B — %15 Ciro (Orta)', C: 'C — %5 Ciro (Düşük)' };
              return (
                <div key={cls} className={`rounded-xl p-4 border transition-all hover:scale-[1.02] ${colors[cls] === '#10b981' ? 'bg-emerald-500/10 border-emerald-500/25' : colors[cls] === '#3b82f6' ? 'bg-blue-500/10 border-blue-500/25' : 'bg-slate-500/10 border-slate-500/25'}`}>
                  <div style={{ color: colors[cls] }} className="text-2xl font-black">{d.count} ürün</div>
                  <div className="text-slate-400 text-xs font-medium mt-1">{labels[cls]}</div>
                  <div className="text-slate-500 text-xs mt-1">Ciro: ₺{(d.revenue / 1000).toFixed(0)}K</div>
                </div>
              );
            })}
          </div>
          <div className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900/60">
                  {['Sınıf', 'Ürün', 'Ciro', 'Ciro %', 'Küm.%', 'Adet', 'Kâr'].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground text-[0.78rem] font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {abcData.length === 0 ? (
                  <tr><td colSpan={7} className="p-6">
                    <EmptyState
                      icon={PackageSearch}
                      title="ABC verisi yok"
                      description="ABC analizi için tamamlanmış satış kaydı bulunamadı."
                    />
                  </td></tr>
                ) : abcData.map((v, _i) => {
                  const clsColor = v.class === 'A' ? '#10b981' : v.class === 'B' ? '#3b82f6' : '#64748b';
                  return (
                    <tr key={v.id} className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                      <td data-label="Sınıf" className="p-3">
                        <Badge variant="outline" className={`font-bold text-xs ${v.class === 'A' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : v.class === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {v.class}
                        </Badge>
                      </td>
                      <td data-label="Ürün" className="p-3 text-foreground font-semibold">{v.name}</td>
                      <td data-label="Ciro" className="p-3 text-emerald-500 font-bold">₺{(v.revenue / 1000).toFixed(1)}K</td>
                      <td data-label="Ciro %" className="p-3 text-slate-400">%{v.revenuePct.toFixed(1)}</td>
                      <td data-label="Küm.%" className="p-3">
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden max-w-[80px]">
                          <div style={{ width: `${v.cumulPct}%`, background: clsColor }} className="h-full rounded-full" />
                        </div>
                      </td>
                      <td data-label="Adet" className="p-3 text-slate-400">{v.qty}</td>
                      <td data-label="Kâr" className={`p-3 font-semibold ${v.profit >= 0 ? 'text-amber-500' : 'text-red-500'}`}>₺{(v.profit / 1000).toFixed(1)}K</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'dead' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-4 border bg-red-500/10 border-red-500/25 transition-all hover:scale-[1.02]">
              <div className="text-2xl font-black text-red-500">{deadStock.length}</div>
              <div className="text-slate-400 text-xs font-medium mt-1">Ölü Stok (90+ gün)</div>
            </div>
            <div className="rounded-xl p-4 border bg-amber-500/10 border-amber-500/25 transition-all hover:scale-[1.02]">
              <div className="text-2xl font-black text-amber-500">{formatMoney(deadStockValue)}</div>
              <div className="text-slate-400 text-xs font-medium mt-1">Bağlı Sermaye</div>
            </div>
            <div className="rounded-xl p-4 border bg-blue-500/10 border-blue-500/25 transition-all hover:scale-[1.02]">
              <div className="text-2xl font-black text-blue-500">
                {deadStock.length > 0 ? `₺${(deadStockValue / deadStock.length / 1000).toFixed(0)}K` : '—'}
              </div>
              <div className="text-slate-400 text-xs font-medium mt-1">Ort. Ürün Değeri</div>
            </div>
          </div>
          <div className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900/60">
                  {['Ürün', 'Stok', 'Maliyet', 'Değer', 'Son Hareket', 'Gün'].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground text-[0.78rem] font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deadStock.length === 0 ? (
                  <tr><td colSpan={6} className="p-6">
                    <EmptyState
                      icon={PackageSearch}
                      title="Ölü stok bulunamadı"
                      description="90 günden uzun süredir hareket görmeyen ürün bulunamadı."
                    />
                  </td></tr>
                ) : deadStock.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td data-label="Ürün" className="p-3 text-foreground font-semibold">{p.name}</td>
                    <td data-label="Stok" className="p-3 text-red-500 font-bold">{p.stock}</td>
                    <td data-label="Maliyet" className="p-3 text-slate-400">{formatMoney(p.cost)}</td>
                    <td data-label="Değer" className="p-3 text-amber-500 font-bold">{formatMoney(p.cost * p.stock)}</td>
                    <td data-label="Son Hareket" className="p-3 text-muted-foreground text-xs">{formatDate(p.lastMovement)}</td>
                    <td data-label="Gün" className="p-3 text-red-500 font-semibold">{p.daysSince}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input 
                value={histSearch} 
                onChange={e => { setHistSearch(e.target.value); setHistPage(1); }} 
                placeholder="Ürün ara..." 
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-foreground text-sm focus:ring-2 ring-blue-500/20 outline-none transition-all" 
              />
            </div>
            <select 
              value={histTypeFilter} 
              onChange={e => { setHistTypeFilter(e.target.value); setHistPage(1); }} 
              className="px-3 py-2 bg-card border border-border rounded-xl text-foreground text-sm cursor-pointer outline-none focus:ring-2 ring-blue-500/20 transition-all"
            >
              <option value="">Tüm İşlemler</option>
              <option value="satis">🛒 Satış</option>
              <option value="iade">↩️ İade</option>
              <option value="giris">📥 Giriş</option>
              <option value="cikis">📤 Çıkış</option>
              <option value="duzeltme">⚙️ Düzeltme</option>
            </select>
          </div>
          <div ref={movTableRef} className="responsive-table-wrap bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900/60">
                  {['Tarih', 'Ürün', 'İşlem', 'Miktar', 'Önceki', 'Sonraki', 'Not'].map(h => (
                    <th key={h} className="p-3 text-left text-muted-foreground text-[0.78rem] font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedMovements.length === 0 ? (
                  <tr><td colSpan={7} className="p-6">
                    <EmptyState
                      icon={PackageSearch}
                      title="Hareket bulunamadı"
                      description="Seçili filtrelere uygun stok hareketi bulunamadı."
                      actionLabel="Filtreleri temizle"
                      onAction={() => { setHistSearch(''); setHistTypeFilter(''); }}
                    />
                  </td></tr>
                ) : pagedMovements.map(m => {
                  const typeMap: Record<string, { label: string; color: string }> = { giris: { label: '📥 Giriş', color: '#10b981' }, cikis: { label: '📤 Çıkış', color: '#ef4444' }, satis: { label: '🛒 Satış', color: '#3b82f6' }, iade: { label: '↩️ İade', color: '#8b5cf6' }, duzeltme: { label: '⚙️ Düzeltme', color: '#f59e0b' }, siparis: { label: '📦 Sipariş', color: '#8b5cf6' } };
                  const t = typeMap[m.type] || { label: m.type, color: 'var(--text-dim)' };
                  return (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td data-label="Tarih" className="p-3 text-muted-foreground text-xs">{formatDate(m.date)}</td>
                      <td data-label="Ürün" className="p-3 text-foreground font-semibold">{m.productName}</td>
                      <td data-label="İşlem" className="p-3">
                        <span style={{ color: t.color }} className="font-semibold text-xs">{t.label}</span>
                      </td>
                      <td data-label="Miktar" className={`p-3 font-bold ${m.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {m.amount > 0 ? '+' : ''}{m.amount}
                      </td>
                      <td data-label="Önceki" className="p-3 text-slate-400">{m.before}</td>
                      <td data-label="Sonraki" className="p-3 text-foreground font-bold">{m.after}</td>
                      <td data-label="Not" className="p-3 text-muted-foreground text-xs">{m.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalHistPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <button 
                onClick={() => { setHistPage(p => Math.max(1, p - 1)); scrollToMovTable(); }} 
                disabled={histPage === 1} 
                className={`px-4 py-2 rounded-xl border font-semibold text-xs transition-all ${histPage === 1 ? 'bg-slate-900 text-slate-600 border-border cursor-default' : 'bg-card text-slate-400 border-border hover:bg-slate-800 hover:text-white cursor-pointer'}`}
              >
                ← Önceki
              </button>
              <span className="text-muted-foreground text-xs font-medium">
                Sayfa {histPage} / {totalHistPages} <span className="opacity-50 ml-1">(toplam {sortedMovements.length} kayıt)</span>
              </span>
              <button 
                onClick={() => { setHistPage(p => Math.min(totalHistPages, p + 1)); scrollToMovTable(); }} 
                disabled={histPage === totalHistPages} 
                className={`px-4 py-2 rounded-xl border font-semibold text-xs transition-all ${histPage === totalHistPages ? 'bg-slate-900 text-slate-600 border-border cursor-default' : 'bg-card text-slate-400 border-border hover:bg-slate-800 hover:text-white cursor-pointer'}`}
              >
                Sonraki →
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="⚙️ Stok Ayarla">
        <div className="grid gap-4">
          <div>
            <label className="block mb-2 text-slate-400 text-sm font-medium">Ürün *</label>
            <select 
              value={form.productId} 
              onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} 
              className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all"
            >
              <option value="">-- Ürün Seç --</option>
              {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-slate-400 text-sm font-medium">İşlem Türü</label>
            <div className="flex gap-2">
              {(['giris', 'cikis', 'duzeltme'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setForm(f => ({ ...f, type: t }))} 
                  className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-all ${form.type === t ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {t === 'giris' ? '📥 Giriş' : t === 'cikis' ? '📤 Çıkış' : '⚙️ Düzeltme'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-2 text-slate-400 text-sm font-medium">{form.type === 'duzeltme' ? 'Yeni Stok Miktarı' : 'Miktar'}</label>
            <input 
              type="number" 
              inputMode="decimal" 
              value={form.amount} 
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
              className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all" 
              min={0} 
              placeholder="0" 
            />
          </div>
          <div>
            <label className="block mb-2 text-slate-400 text-sm font-medium">Not</label>
            <input 
              value={form.note} 
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} 
              className="w-full p-2.5 bg-slate-900/60 border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all" 
              placeholder="Opsiyonel not..." 
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleAdjust} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95">💾 Kaydet</button>
          <button onClick={() => setAdjustModal(false)} className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-400 py-2.5 rounded-xl text-sm transition-all">İptal</button>
        </div>
      </Modal>
      <VoiceAssistantButton />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '16px 18px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
    </div>
  );
}
