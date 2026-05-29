import { useState, useRef, useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { exportToExcel } from '@/lib/excelExport';
import { genId, formatDate, formatMoney } from '@/lib/utils-tr';
import type { DB } from '@/types';

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

    save(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === form.productId ? { ...p, stock: after, updatedAt: nowIso } : p),
      stockMovements: [...prev.stockMovements, {
        id: genId(), productId: form.productId, productName: product.name,
        type: form.type, amount: form.type === 'duzeltme' ? after - before : amount,
        before, after, note: form.note, date: nowIso,
      }],
    }));

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

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Toplam Ürün" value={String(activeProducts.length)} color="#3b82f6" />
        <StatCard label="Stok Değeri" value={`₺${(totalValue / 1000).toFixed(1)}K`} color="#10b981" />
        <StatCard label="Biten Stok" value={String(outOfStock)} color="#ef4444" />
        <StatCard label="Az Stok" value={String(lowStock)} color="#f59e0b" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setAdjustModal(true)} style={{ background: '#ff5722', border: 'none', borderRadius: 10, color: '#fff', padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>⚙️ Stok Ayarla</button>
        <button onClick={() => { exportToExcel(db, { sheets: ['stok'] }); showToast('Excel indirildi!', 'success'); }} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#10b981', padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>📊 Excel İndir</button>
        {(['products', 'abc', 'dead', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 16px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, background: tab === t ? '#ff5722' : '#273548', color: tab === t ? '#fff' : '#94a3b8' }}>
            {t === 'products' ? '📦 Ürünler' : t === 'abc' ? '📊 ABC' : t === 'dead' ? '💀 Ölü Stok' : '📋 Hareketler'}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Ürün ara..." style={{ marginBottom: 14, width: '100%', padding: '9px 13px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', boxSizing: 'border-box' }} />
          <div className="responsive-table-wrap" style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  {['Ürün', 'Kategori', 'Stok', 'Min.Stok', 'Durum', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProducts.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Ürün bulunamadı</td></tr>
                ) : sortedProducts.map(p => {
                  const stockStatus = p.stock === 0 ? { color: '#ef4444', label: '🔴 Bitti', bg: 'rgba(239,68,68,0.1)' } : p.stock <= p.minStock ? { color: '#f59e0b', label: '⚠️ Az', bg: 'rgba(245,158,11,0.1)' } : { color: '#10b981', label: '✓ Normal', bg: 'rgba(16,185,129,0.1)' };
                  const catIcon = (db.productCategories || []).find(c => c.id === p.category)?.icon || '📦';
                  const catName = (db.productCategories || []).find(c => c.id === p.category)?.name || p.category;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td data-label="Ürün" style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600 }}>{catIcon} {p.name}</td>
                      <td data-label="Kategori" style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{catName}</td>
                      <td data-label="Stok" style={{ padding: '12px 16px', color: p.stock === 0 ? '#ef4444' : p.stock <= p.minStock ? '#f59e0b' : '#10b981', fontWeight: 700, fontSize: '1rem' }}>{p.stock}</td>
                      <td data-label="Min.Stok" style={{ padding: '12px 16px', color: '#64748b' }}>{p.minStock}</td>
                      <td data-label="Durum" style={{ padding: '12px 16px' }}>
                        <span style={{ background: stockStatus.bg, color: stockStatus.color, borderRadius: 6, padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600 }}>{stockStatus.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => { setForm(f => ({ ...f, productId: p.id })); setAdjustModal(true); }} style={{ background: 'rgba(255,87,34,0.1)', border: 'none', borderRadius: 6, color: '#ff5722', padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>⚙️ Ayarla</button>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {(['A', 'B', 'C'] as const).map(cls => {
              const d = abcSummary[cls];
              const colors: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#64748b' };
              const labels: Record<string, string> = { A: 'A — %80 Ciro (Kritik)', B: 'B — %15 Ciro (Orta)', C: 'C — %5 Ciro (Düşük)' };
              return (
                <div key={cls} style={{ background: `${colors[cls]}10`, borderRadius: 12, padding: '14px 16px', border: `1px solid ${colors[cls]}25` }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: colors[cls] }}>{d.count} ürün</div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>{labels[cls]}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Ciro: ₺{(d.revenue / 1000).toFixed(0)}K</div>
                </div>
              );
            })}
          </div>
          <div className="responsive-table-wrap" style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  {['Sınıf', 'Ürün', 'Ciro', 'Ciro %', 'Küm.%', 'Adet', 'Kâr'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {abcData.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Satış verisi yok</td></tr>
                ) : abcData.map((v, i) => {
                  const clsColor = v.class === 'A' ? '#10b981' : v.class === 'B' ? '#3b82f6' : '#64748b';
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td data-label="Sınıf" style={{ padding: '12px 16px' }}>
                        <span style={{ background: `${clsColor}20`, color: clsColor, borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: '0.9rem' }}>{v.class}</span>
                      </td>
                      <td data-label="Ürün" style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600 }}>{v.name}</td>
                      <td data-label="Ciro" style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700 }}>₺{(v.revenue / 1000).toFixed(1)}K</td>
                      <td data-label="Ciro %" style={{ padding: '12px 16px', color: '#94a3b8' }}>%{v.revenuePct.toFixed(1)}</td>
                      <td data-label="Küm.%"><div style={{ height: 6, borderRadius: 3, background: '#273548', overflow: 'hidden', maxWidth: 80 }}><div style={{ width: `${v.cumulPct}%`, height: 6, borderRadius: 3, background: clsColor }} /></div></td>
                      <td data-label="Adet" style={{ padding: '12px 16px', color: '#94a3b8' }}>{v.qty}</td>
                      <td data-label="Kâr" style={{ padding: '12px 16px', color: v.profit >= 0 ? '#f59e0b' : '#ef4444' }}>₺{(v.profit / 1000).toFixed(1)}K</td>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#ef444410', borderRadius: 12, padding: '14px 16px', border: '1px solid #ef444425' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{deadStock.length}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>Ölü Stok (90+ gün)</div>
            </div>
            <div style={{ background: '#f59e0b10', borderRadius: 12, padding: '14px 16px', border: '1px solid #f59e0b25' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{formatMoney(deadStockValue)}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>Bağlı Sermaye</div>
            </div>
            <div style={{ background: '#3b82f610', borderRadius: 12, padding: '14px 16px', border: '1px solid #3b82f625' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>
                {deadStock.length > 0 ? `₺${(deadStockValue / deadStock.length / 1000).toFixed(0)}K` : '—'}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>Ort. Ürün Değeri</div>
            </div>
          </div>
          <div className="responsive-table-wrap" style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  {['Ürün', 'Stok', 'Maliyet', 'Değer', 'Son Hareket', 'Gün'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deadStock.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Ölü stok bulunamadı</td></tr>
                ) : deadStock.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td data-label="Ürün" style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600 }}>{p.name}</td>
                    <td data-label="Stok" style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 700 }}>{p.stock}</td>
                    <td data-label="Maliyet" style={{ padding: '12px 16px', color: '#94a3b8' }}>{formatMoney(p.cost)}</td>
                    <td data-label="Değer" style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 700 }}>{formatMoney(p.cost * p.stock)}</td>
                    <td data-label="Son Hareket" style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{formatDate(p.lastMovement)}</td>
                    <td data-label="Gün" style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>{p.daysSince}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input value={histSearch} onChange={e => { setHistSearch(e.target.value); setHistPage(1); }} placeholder="🔍 Ürün ara..." style={{ flex: 1, minWidth: 160, padding: '9px 13px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', boxSizing: 'border-box' }} />
            <select value={histTypeFilter} onChange={e => { setHistTypeFilter(e.target.value); setHistPage(1); }} style={{ padding: '9px 13px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', cursor: 'pointer' }}>
              <option value="">Tüm İşlemler</option>
              <option value="satis">🛒 Satış</option>
              <option value="iade">↩️ İade</option>
              <option value="giris">📥 Giriş</option>
              <option value="cikis">📤 Çıkış</option>
              <option value="duzeltme">⚙️ Düzeltme</option>
            </select>
          </div>
          <div ref={movTableRef} className="responsive-table-wrap" style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  {['Tarih', 'Ürün', 'İşlem', 'Miktar', 'Önceki', 'Sonraki', 'Not'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedMovements.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Hareket bulunamadı</td></tr>
                ) : pagedMovements.map(m => {
                  const typeMap: Record<string, { label: string; color: string }> = { giris: { label: '📥 Giriş', color: '#10b981' }, cikis: { label: '📤 Çıkış', color: '#ef4444' }, satis: { label: '🛒 Satış', color: '#3b82f6' }, iade: { label: '↩️ İade', color: '#8b5cf6' }, duzeltme: { label: '⚙️ Düzeltme', color: '#f59e0b' }, siparis: { label: '📦 Sipariş', color: '#8b5cf6' } };
                  const t = typeMap[m.type] || { label: m.type, color: '#94a3b8' };
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td data-label="Tarih" style={{ padding: '11px 16px', color: '#64748b', fontSize: '0.82rem' }}>{formatDate(m.date)}</td>
                      <td data-label="Ürün" style={{ padding: '11px 16px', color: '#f1f5f9', fontWeight: 600 }}>{m.productName}</td>
                      <td data-label="İşlem" style={{ padding: '11px 16px' }}><span style={{ color: t.color, fontWeight: 600, fontSize: '0.85rem' }}>{t.label}</span></td>
                      <td data-label="Miktar" style={{ padding: '11px 16px', color: m.amount >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{m.amount > 0 ? '+' : ''}{m.amount}</td>
                      <td data-label="Önceki" style={{ padding: '11px 16px', color: '#94a3b8' }}>{m.before}</td>
                      <td data-label="Sonraki" style={{ padding: '11px 16px', color: '#f1f5f9', fontWeight: 600 }}>{m.after}</td>
                      <td data-label="Not" style={{ padding: '11px 16px', color: '#64748b', fontSize: '0.82rem' }}>{m.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalHistPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <button onClick={() => { setHistPage(p => Math.max(1, p - 1)); scrollToMovTable(); }} disabled={histPage === 1} style={{ padding: '6px 14px', background: histPage === 1 ? '#1e293b' : '#273548', border: '1px solid #334155', borderRadius: 8, color: histPage === 1 ? '#334155' : '#94a3b8', cursor: histPage === 1 ? 'default' : 'pointer', fontWeight: 600 }}>← Önceki</button>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Sayfa {histPage} / {totalHistPages} (toplam {sortedMovements.length} kayıt)</span>
              <button onClick={() => { setHistPage(p => Math.min(totalHistPages, p + 1)); scrollToMovTable(); }} disabled={histPage === totalHistPages} style={{ padding: '6px 14px', background: histPage === totalHistPages ? '#1e293b' : '#273548', border: '1px solid #334155', borderRadius: 8, color: histPage === totalHistPages ? '#334155' : '#94a3b8', cursor: histPage === totalHistPages ? 'default' : 'pointer', fontWeight: 600 }}>Sonraki →</button>
            </div>
          )}
        </>
      )}

      <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="⚙️ Stok Ayarla">
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={lbl}>Ürün *</label>
            <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} style={inp}>
              <option value="">-- Ürün Seç --</option>
              {activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>İşlem Türü</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['giris', 'cikis', 'duzeltme'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: form.type === t ? '#ff5722' : '#273548', color: form.type === t ? '#fff' : '#94a3b8' }}>
                  {t === 'giris' ? '📥 Giriş' : t === 'cikis' ? '📤 Çıkış' : '⚙️ Düzeltme'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>{form.type === 'duzeltme' ? 'Yeni Stok Miktarı' : 'Miktar'}</label>
            <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inp} min={0} placeholder="0" />
          </div>
          <div>
            <label style={lbl}>Not</label>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={inp} placeholder="Opsiyonel not..." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleAdjust} style={{ flex: 1, background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', padding: '11px 0', fontWeight: 700, cursor: 'pointer' }}>💾 Kaydet</button>
          <button onClick={() => setAdjustModal(false)} style={{ background: '#273548', border: '1px solid #334155', borderRadius: 10, color: '#94a3b8', padding: '11px 20px', cursor: 'pointer' }}>İptal</button>
        </div>
      </Modal>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' };

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 18px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
    </div>
  );
}
