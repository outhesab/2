import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { Card } from '@/pages/SettingsCard';
import { Button } from '@/components/ui/button';
import type { DB } from '@/types';

const inpBase =
  'w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] box-border';

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

export function KategoriYonetim({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const cats = db.productCategories || [];
  const [yeniAd, setYeniAd] = useState('');
  const [yeniIcon, setYeniIcon] = useState('📦');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '' });

  const addKat = () => {
    const ad = yeniAd.trim();
    if (!ad) {
      showToast('Kategori adı gerekli!', 'error');
      return;
    }
    const id = ad
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    if (cats.find((c) => c.id === id)) {
      showToast('Bu ID zaten var!', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    save((prev) => ({
      ...prev,
      productCategories: [...(prev.productCategories || []), { id, name: ad, icon: yeniIcon, createdAt: nowIso }],
    }));
    setYeniAd('');
    setYeniIcon('📦');
    showToast('Kategori eklendi!', 'success');
  };

  const saveEdit = (id: string) => {
    if (!editForm.name.trim()) {
      showToast('Ad gerekli!', 'error');
      return;
    }
    save((prev) => ({
      ...prev,
      productCategories: (prev.productCategories || []).map((c) =>
        c.id === id ? { ...c, name: editForm.name.trim(), icon: editForm.icon || c.icon } : c,
      ),
    }));
    setEditId(null);
    showToast('Güncellendi!', 'success');
  };

  const deleteKat = (id: string) => {
    const used = db.products.filter((p) => !p.deleted && p.category === id).length;
    if (used > 0) {
      showToast(`${used} ürün bu kategoriyi kullanıyor, silemezsiniz!`, 'error');
      return;
    }
    showConfirm('Kategori Sil', 'Bu kategoriyi silmek istiyor musunuz?', () => {
      save((prev) => ({
        ...prev,
        productCategories: (prev.productCategories || []).filter((c) => c.id !== id),
      }));
      showToast('Kategori silindi!', 'success');
    });
  };

  return (
    <Card title="🏷️ Ürün Kategorileri">
      <div className="flex flex-col gap-3">
        {cats.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Henüz kategori yok</div>}
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            {editId === c.id ? (
              <>
                <input
                  value={editForm.icon}
                  onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                  className={`${inpBase} w-[48px] text-center text-lg`}
                  style={{ padding: '6px' }}
                  maxLength={2}
                />
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={`${inpBase} flex-1 p-[7px_10px]`}
                  autoFocus
                />
                <Button
                  onClick={() => saveEdit(c.id)}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs bg-green-500/20 text-green-500 hover:bg-green-500/30"
                >
                  ✓
                </Button>
                <Button
                  onClick={() => setEditId(null)}
                  className="px-2.5 py-1.5 rounded-lg font-medium text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                >
                  ✕
                </Button>
              </>
            ) : (
              <>
                <span className="text-lg">{c.icon}</span>
                <span className="text-foreground font-semibold">{c.name}</span>
                <span className="text-[var(--text-dim)] text-xs font-mono">{c.id}</span>
                <span className="text-[var(--text-dim)] text-xs">
                  {db.products.filter((p) => !p.deleted && p.category === c.id).length} ürün
                </span>
                <Button
                  onClick={() => {
                    setEditId(c.id);
                    setEditForm({ name: c.name, icon: c.icon });
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  ✏️
                </Button>
                <Button
                  onClick={() => deleteKat(c.id)}
                  className="btn-danger-sm px-3 py-1.5 rounded-lg font-bold text-xs"
                >
                  🗑️
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={yeniIcon}
          onChange={(e) => setYeniIcon(e.target.value)}
          className={`${inpBase} w-[52px] text-center text-xl`}
          placeholder="📦"
          maxLength={2}
        />
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addKat()}
          className={`${inpBase} flex-1`}
          placeholder="Yeni kategori adı..."
        />
        <Button onClick={addKat} className="btn-primary px-4 py-2 rounded-xl font-bold text-sm">
          + Ekle
        </Button>
      </div>
      <p className="text-[var(--text-dim)] text-xs mt-2">Ürünleri kullanan kategoriler silinemez.</p>
    </Card>
  );
}
