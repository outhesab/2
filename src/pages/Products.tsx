import EmptyState from '@/components/EmptyState';
import { SkeletonStatRow, SkeletonTable } from '@/components/SkeletonLoaders';
import { PackageSearch } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { genId, formatMoney, calcProfit } from '@/lib/utils-tr';
import { exportArrayToExcel } from '@/lib/excelExport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { DB, Product } from '@/types';
import { useLocation } from 'wouter';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const empty: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'soba',
  supplierId: '',
  brand: '',
  cost: 0,
  price: 0,
  stock: 0,
  minStock: 5,
  barcode: '',
  description: '',
};

import { VoiceAssistantButton } from '@/components/VoiceAssistantButton';

export default function Products({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkPct, setBulkPct] = useState('');
  const [bulkCat, setBulkCat] = useState('all');
  const [bulkDirection, setBulkDirection] = useState<'up' | 'down'>('up');

  const productCats = db.productCategories || [];
  const getCategoryIcon = (id: string) => productCats.find((c) => c.id === id)?.icon || '📦';
  const getCategoryName = (id: string) => productCats.find((c) => c.id === id)?.name || id;

  let products = db.products.filter((p) => !p.deleted);
  if (filter === 'zero') products = products.filter((p) => p.stock === 0);
  else if (filter === 'low') products = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  else if (filter !== 'all') products = products.filter((p) => p.category === filter);
  if (debouncedSearch)
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.barcode || '').includes(debouncedSearch),
    );

  const openAdd = () => {
    const defCat = productCats[0]?.id || 'soba';
    setForm({ ...empty, category: defCat });
    setEditId(null);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setForm({ ...p });
    setEditId(p.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      showToast('Ürün adı gerekli!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    setLoading(true);
    save((prev) => {
      const products = [...prev.products];
      if (editId) {
        const i = products.findIndex((p) => p.id === editId);
        if (i >= 0) products[i] = { ...products[i], ...form, updatedAt: nowIso } as Product;
        showToast('Ürün güncellendi!', 'success');
      } else {
        const np: Product = {
          id: genId(),
          createdAt: nowIso,
          updatedAt: nowIso,
          name: '',
          category: productCats[0]?.id || 'soba',
          cost: 0,
          price: 0,
          stock: 0,
          minStock: 5,
          ...form,
        } as Product;
        products.push(np);
        showToast('Ürün eklendi!', 'success');
      }
      return { ...prev, products };
    });
    setLoading(false);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    showConfirm('Ürünü Sil', 'Bu ürünü silmek istediğinizden emin misiniz?', () => {
      const nowIso = new Date().toISOString();
      setLoading(true);
      save((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === id ? { ...p, deleted: true, updatedAt: nowIso } : p)),
      }));
      setLoading(false);
      showToast('Ürün silindi!', 'success');
    });
  };

  const f = <K extends keyof Product>(k: K, v: Product[K]) => setForm((prev) => ({ ...prev, [k]: v }));

  const activeProducts = db.products.filter((p) => !p.deleted);
  const totalValue = activeProducts.reduce((s, p) => s + p.cost * p.stock, 0);
  const outOfStock = activeProducts.filter((p) => p.stock === 0).length;
  const lowStock = activeProducts.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const siparisOnerisi = activeProducts.filter((p) => p.stock <= p.minStock);

  if (loading)
    return (
      <div>
        <SkeletonStatRow count={4} />
        <SkeletonTable rows={6} cols={4} />
      </div>
    );

  return (
    <div>
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <Button onClick={openAdd} className="bg-[#ff5722] hover:bg-[#e64a19] text-white font-bold rounded-xl px-5">
          + Yeni Ürün
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const rows = activeProducts.map((p) => ({
              Ad: p.name,
              Kategori: p.category,
              Marka: p.brand || '',
              Alış: p.cost,
              Satış: p.price,
              Stok: p.stock,
              'Min Stok': p.minStock,
              Barkod: p.barcode || '',
            }));
            exportArrayToExcel(rows, 'urun-listesi');
            showToast('Excel indirildi!', 'success');
          }}
          className="rounded-xl"
        >
          📊 Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => setBulkModal(true)}
          className="rounded-xl text-amber-500 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20"
        >
          📈 Toplu Fiyat
        </Button>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Ürün ara..."
          className="flex-1 min-w-[200px] rounded-xl"
        />
      </div>

      {siparisOnerisi.length > 0 && (
        <Card className="mb-4 bg-amber-500/10 border-amber-500/25">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <span className="text-amber-400 font-bold text-sm">
                {siparisOnerisi.length} ürün sipariş gerektirir:{' '}
              </span>
              <span className="text-slate-400 text-xs">
                {siparisOnerisi
                  .slice(0, 4)
                  .map((p) => p.name)
                  .join(', ')}
                {siparisOnerisi.length > 4 ? ` +${siparisOnerisi.length - 4} daha` : ''}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 h-8 px-3 text-xs font-bold rounded-lg"
              onClick={() => setFilter('low')}
            >
              Listele →
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={`rounded-xl px-3 h-8 text-xs font-semibold ${filter === 'all' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
        >
          Tümü
        </Button>
        {productCats.map((c) => (
          <Button
            key={c.id}
            variant={filter === c.id ? 'default' : 'outline'}
            onClick={() => setFilter(c.id)}
            className={`rounded-xl px-3 h-8 text-xs font-semibold ${filter === c.id ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          >
            {c.icon} {c.name}
          </Button>
        ))}
        <Button
          variant={filter === 'zero' ? 'destructive' : 'outline'}
          onClick={() => setFilter('zero')}
          className={`rounded-xl px-3 h-8 text-xs font-semibold ${filter === 'zero' ? 'bg-red-600' : ''}`}
        >
          🔴 Biten {outOfStock > 0 && <Badge variant="destructive" className="ml-1 px-1 h-4">{outOfStock}</Badge>}
        </Button>
        <Button
          variant={filter === 'low' ? 'outline' : 'outline'}
          onClick={() => setFilter('low')}
          className={`rounded-xl px-3 h-8 text-xs font-semibold ${filter === 'low' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : ''}`}
        >
          ⚠️ Az {lowStock > 0 && <Badge variant="outline" className="ml-1 px-1 h-4 border-amber-500 text-amber-500 bg-amber-500/10">{lowStock}</Badge>}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Toplam Ürün', value: String(db.products.length), color: '#3b82f6' },
          { label: 'Stok Değeri', value: formatMoney(totalValue), color: '#10b981' },
          { label: 'Biten Stok', value: String(outOfStock), color: '#ef4444' },
          { label: 'Az Stok', value: String(lowStock), color: '#f59e0b' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl p-3 border transition-all hover:border-white/20"
            style={{ borderColor: `${s.color}33` }}
          >
            <div style={{ color: s.color }} className="text-lg font-black">
              {s.value}
            </div>
            <div className="text-muted-foreground text-[0.78rem] mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={PackageSearch}
              title="Ürün bulunamadı"
              description="Arama veya filtreleri sıfırlayıp ürün listenizi tekrar görüntüleyin."
              actionLabel="Tüm ürünleri göster"
              onAction={() => {
                setFilter('all');
                setSearch('');
              }}
            />
          </div>
        ) : (
          products.map((p) => {
            const margin = calcProfit(p.price, p.cost);
            const marginColor = margin >= 30 ? '#10b981' : margin >= 10 ? '#f59e0b' : '#ef4444';
            const stockStatus =
              p.stock === 0
                ? { color: '#ef4444', label: '🔴 Stok Yok' }
                : p.stock <= p.minStock
                  ? { color: '#f59e0b', label: `⚠️ Az: ${p.stock}` }
                  : { color: '#10b981', label: `✓ ${p.stock} adet` };
            return (
              <Card 
                key={p.id} 
                className={`group transition-all hover:-translate-y-1 ${p.stock === 0 ? 'border-red-500/30' : p.stock <= p.minStock ? 'border-amber-500/30' : 'border-slate-500/30'}`}
              >
                <CardContent className="p-4">
                  <div className="text-4xl mb-3 text-center">{getCategoryIcon(p.category)}</div>
                  <h4 className="font-bold mb-1 text-foreground text-sm line-clamp-1">
                    {p.name}
                  </h4>
                  <p className="text-muted-foreground text-xs mb-3">
                    {p.brand ? `${p.brand} · ` : ''}
                    {getCategoryName(p.category)}
                  </p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-foreground text-base">
                      {formatMoney(p.price)}
                    </span>
                    <span style={{ color: marginColor }} className="text-xs font-bold">
                      %{margin} markup
                    </span>
                  </div>
                  {p.costCurrency && p.costCurrency !== 'TRY' && (
                    <div className="text-slate-500 text-[0.72rem] mb-2">
                      Alış: {p.cost} {p.costCurrency}
                    </div>
                  )}
                  <div style={{ color: stockStatus.color }} className="text-sm font-semibold mb-3">
                    {stockStatus.label}
                  </div>
                  {p.barcode && (
                    <div className="text-slate-500 text-[0.72rem] mb-3">🔖 {p.barcode}</div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 h-8 text-xs font-semibold rounded-lg"
                      onClick={() => setLocation(`/urunler/${p.id}`)}
                    >
                      Detay
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 h-8 text-xs font-semibold rounded-lg"
                      onClick={() => openEdit(p)}
                    >
                      ✏️ Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 h-8 px-2 rounded-lg"
                      onClick={() => handleDelete(p.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Ürün Adı *</label>
            <input
              value={form.name || ''}
              onChange={(e) => f('name', e.target.value)}
              style={inp}
              placeholder="Ürün adı"
            />
          </div>
          <div>
            <label style={lbl}>Kategori</label>
            <select
              value={form.category || productCats[0]?.id || 'soba'}
              onChange={(e) => f('category', e.target.value)}
              style={inp}
            >
              {productCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Tedarikçi (opsiyonel)</label>
            <select value={form.supplierId || ''} onChange={(e) => f('supplierId', e.target.value)} style={inp}>
              <option value="">— Seçilmedi —</option>
              {db.suppliers
                .filter((s) => !s.deleted)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Marka</label>
            <input
              value={form.brand || ''}
              onChange={(e) => f('brand', e.target.value)}
              style={inp}
              placeholder="Marka"
            />
          </div>
          <div>
            <label style={lbl}>Alış Fiyatı</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                inputMode="decimal"
                value={form.cost || 0}
                onChange={(e) => f('cost', parseFloat(e.target.value) || 0)}
                style={{ ...inp, flex: 1 }}
                min={0}
                step={0.01}
              />
              <select
                value={'costCurrency' in form ? (form as Record<string, string>).costCurrency : 'TRY'}
                onChange={(e) => f('costCurrency', e.target.value as 'TRY' | 'USD' | 'EUR')}
                style={{ ...inp, width: 70, flex: '0 0 70px' }}
              >
                <option value="TRY">₺</option>
                <option value="USD">$</option>
                <option value="EUR">€</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Satış Fiyatı (₺)</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.price || 0}
              onChange={(e) => f('price', parseFloat(e.target.value) || 0)}
              style={inp}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label style={lbl}>Stok</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.stock || 0}
              onChange={(e) => f('stock', parseInt(e.target.value) || 0)}
              style={inp}
              min={0}
            />
          </div>
          <div>
            <label style={lbl}>Min. Stok</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.minStock || 5}
              onChange={(e) => f('minStock', parseInt(e.target.value) || 0)}
              style={inp}
              min={0}
            />
          </div>
          <div>
            <label style={lbl}>Barkod</label>
            <input
              value={form.barcode || ''}
              onChange={(e) => f('barcode', e.target.value)}
              style={inp}
              placeholder="Barkod"
            />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Açıklama</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => f('description', e.target.value)}
              style={{ ...inp, minHeight: 60, resize: 'vertical' as const }}
            />
          </div>
          {form.cost && form.price ? (
            <div
              style={{
                gridColumn: '1/-1',
                background: '#0f172a',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                gap: 20,
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Markup:{' '}
                <strong style={{ color: calcProfit(form.price, form.cost) >= 20 ? '#10b981' : '#f59e0b' }}>
                  %{calcProfit(form.price, form.cost)}
                </strong>
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Kâr:{' '}
                <strong style={{ color: '#10b981' }}>
                  {formatMoney((form.price - form.cost) * (form.stock || 0))}
                </strong>
              </span>
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: '#10b981',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              padding: '11px 0',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            💾 Kaydet
          </button>
          <button
            onClick={() => setModalOpen(false)}
            style={{
              background: '#273548',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-dim)',
              padding: '11px 20px',
              cursor: 'pointer',
            }}
          >
            İptal
          </button>
        </div>
      </Modal>

      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="📈 Toplu Fiyat Güncelle">
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={lbl}>Kategori</label>
            <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} style={inp}>
              <option value="all">Tüm Kategoriler</option>
              {productCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Yön</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['up', 'down'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setBulkDirection(d)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: bulkDirection === d ? '#ff5722' : '#273548',
                    color: bulkDirection === d ? '#fff' : '#94a3b8',
                  }}
                >
                  {d === 'up' ? '📈 Zam' : '📉 İndirim'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>{bulkDirection === 'up' ? 'Zam Yüzdesi (%)' : 'İndirim Yüzdesi (%)'} *</label>
            <input
              type="number"
              inputMode="decimal"
              value={bulkPct}
              onChange={(e) => setBulkPct(e.target.value)}
              style={{ ...inp, fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', padding: '16px' }}
              placeholder="0"
              min={0}
              step={0.1}
            />
          </div>
          {(() => {
            const pct = parseFloat(bulkPct);
            if (!pct || pct <= 0) return null;
            const filtered = bulkCat === 'all' ? activeProducts : activeProducts.filter((p) => p.category === bulkCat);
            const affected = filtered.filter((p) => p.price > 0);
            const multiplier = bulkDirection === 'up' ? (100 + pct) / 100 : (100 - pct) / 100;
            const avgBefore = affected.length > 0 ? affected.reduce((s, p) => s + p.price, 0) / affected.length : 0;
            return (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 8 }}>Önizleme</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Etkilenen ürün:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{affected.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Ort. fiyat (önce):</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatMoney(avgBefore)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Ort. fiyat (sonra):</span>
                  <span style={{ color: bulkDirection === 'up' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    {formatMoney(avgBefore * multiplier)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={() => {
              const pct = parseFloat(bulkPct);
              if (!pct || pct <= 0) {
                showToast('Geçerli yüzde girin!', 'error');
                return;
              }
              const multiplier = bulkDirection === 'up' ? (100 + pct) / 100 : (100 - pct) / 100;
              const nowIso = new Date().toISOString();
              setLoading(true);
              save((prev) => ({
                ...prev,
                products: prev.products.map((p) => {
                  if (p.deleted) return p;
                  if (bulkCat !== 'all' && p.category !== bulkCat) return p;
                  if (p.price <= 0) return p;
                  return { ...p, price: Math.round(p.price * multiplier * 100) / 100, updatedAt: nowIso };
                }),
              }));
              setLoading(false);
              showToast(
                `${bulkCat === 'all' ? 'Tüm ürünler' : 'Seçili kategori'} ${bulkDirection === 'up' ? `%${pct} zamlandı` : `%${pct} indirim yapıldı`}!`,
                'success',
              );
              setBulkModal(false);
              setBulkPct('');
            }}
            style={{
              flex: 1,
              background: '#f59e0b',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              padding: '11px 0',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 Uygula
          </button>
          <button
            onClick={() => setBulkModal(false)}
            style={{
              background: '#273548',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-dim)',
              padding: '11px 20px',
              cursor: 'pointer',
            }}
          >
            İptal
          </button>
        </div>
      </Modal>
      <VoiceAssistantButton />
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: 'var(--text-dim)',
  fontSize: '0.85rem',
  fontWeight: 500,
};
const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

function Chip({
  label,
  active,
  onClick,
  danger,
  warning,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
  warning?: boolean;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.83rem',
        background: active ? '#ff5722' : danger ? 'rgba(239,68,68,0.1)' : warning ? 'rgba(245,158,11,0.1)' : '#273548',
        color: active ? '#fff' : danger ? '#ef4444' : warning ? '#f59e0b' : '#94a3b8',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}{' '}
      {count !== undefined && count > 0 && (
        <span
          style={{
            background: active ? 'rgba(255,255,255,0.2)' : danger ? '#ef4444' : '#f59e0b',
            color: '#fff',
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
