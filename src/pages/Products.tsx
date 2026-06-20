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
import { Label } from '@/components/ui/label';
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

// VoiceAssistantButton removed in favor of SobaNexus

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
          { label: 'Toplam Ürün', value: String(db.products.length), color: 'text-blue-500', border: 'border-blue-500/20' },
          { label: 'Stok Değeri', value: formatMoney(totalValue), color: 'text-emerald-500', border: 'border-emerald-500/20' },
          { label: 'Biten Stok', value: String(outOfStock), color: 'text-red-500', border: 'border-red-500/20' },
          { label: 'Az Stok', value: String(lowStock), color: 'text-amber-500', border: 'border-amber-500/20' },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-card rounded-xl p-3 border transition-all hover:border-white/20 ${s.border}`}
          >
            <div className={`text-lg font-black ${s.color}`}>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Ürün Adı *</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => f('name', e.target.value)}
              placeholder="Ürün adı"
            />
          </div>
          <div>
            <Label>Kategori</Label>
            <select
              value={form.category || productCats[0]?.id || 'soba'}
              onChange={(e) => f('category', e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none"
            >
              {productCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tedarikçi (opsiyonel)</Label>
            <select value={form.supplierId || ''} onChange={(e) => f('supplierId', e.target.value)} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none">
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
            <Label>Marka</Label>
            <Input
              value={form.brand || ''}
              onChange={(e) => f('brand', e.target.value)}
              placeholder="Marka"
            />
          </div>
          <div>
            <Label>Alış Fiyatı</Label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                inputMode="decimal"
                value={form.cost || 0}
                onChange={(e) => f('cost', parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
                className="flex-1"
              />
              <select
                value={'costCurrency' in form ? (form as Record<string, string>).costCurrency : 'TRY'}
                onChange={(e) => f('costCurrency', e.target.value as 'TRY' | 'USD' | 'EUR')}
                className="w-[70px] p-2 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none"
              >
                <option value="TRY">₺</option>
                <option value="USD">$</option>
                <option value="EUR">€</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Satış Fiyatı (₺)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.price || 0}
              onChange={(e) => f('price', parseFloat(e.target.value) || 0)}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <Label>Stok</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.stock || 0}
              onChange={(e) => f('stock', parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div>
            <Label>Min. Stok</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.minStock || 5}
              onChange={(e) => f('minStock', parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div>
            <Label>Barkod</Label>
            <Input
              value={form.barcode || ''}
              onChange={(e) => f('barcode', e.target.value)}
              placeholder="Barkod"
            />
          </div>
          <div className="col-span-2">
            <Label>Açıklama</Label>
            <textarea
              value={form.description || ''}
              onChange={(e) => f('description', e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none min-h-[60px] resize-y"
            />
          </div>
          {form.cost && form.price ? (
            <div className="col-span-2 bg-slate-900 rounded-lg px-3.5 py-2.5 flex gap-5">
              <span className="text-muted-foreground text-sm">
                Markup:{' '}
                <strong style={{ color: calcProfit(form.price, form.cost) >= 20 ? '#10b981' : '#f59e0b' }}>
                  %{calcProfit(form.price, form.cost)}
                </strong>
              </span>
              <span className="text-muted-foreground text-sm">
                Kâr:{' '}
                <strong style={{ color: '#10b981' }}>
                  {formatMoney((form.price - form.cost) * (form.stock || 0))}
                </strong>
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button onClick={handleSave} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl">
            💾 Kaydet
          </Button>
          <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
            İptal
          </Button>
        </div>
      </Modal>

      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="📈 Toplu Fiyat Güncelle">
        <div className="grid gap-3.5">
          <div>
            <Label>Kategori</Label>
            <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-foreground text-sm outline-none">
              <option value="all">Tüm Kategoriler</option>
              {productCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Yön</Label>
            <div className="flex gap-2">
              {(['up', 'down'] as const).map((d) => (
                <Button
                  key={d}
                  variant="ghost"
                  onClick={() => setBulkDirection(d)}
                  className={`flex-1 rounded-lg font-semibold ${
                    bulkDirection === d
                      ? 'bg-[#ff5722] text-white hover:bg-[#e64a19]'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d === 'up' ? '📈 Zam' : '📉 İndirim'}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>{bulkDirection === 'up' ? 'Zam Yüzdesi (%)' : 'İndirim Yüzdesi (%)'} *</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={bulkPct}
              onChange={(e) => setBulkPct(e.target.value)}
              className="text-2xl font-extrabold text-center py-4"
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
              <div className="bg-white/5 rounded-xl px-4 py-3.5">
                <div className="text-dim text-xs mb-2">Önizleme</div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground text-xs">Etkilenen ürün:</span>
                  <span className="text-foreground font-bold">{affected.length}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground text-xs">Ort. fiyat (önce):</span>
                  <span className="text-foreground font-bold">{formatMoney(avgBefore)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Ort. fiyat (sonra):</span>
                  <span style={{ color: bulkDirection === 'up' ? '#10b981' : '#ef4444' }} className="font-bold">
                    {formatMoney(avgBefore * multiplier)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button onClick={() => {
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
            }} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
            🔄 Uygula
          </Button>
          <Button variant="outline" onClick={() => setBulkModal(false)} className="rounded-xl">
            İptal
          </Button>
        </div>
      </Modal>
      // <VoiceAssistantButton /> removed
    </div>
  );
}


