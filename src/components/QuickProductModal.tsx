import { useState } from "react";
import { useToast } from "@/components/Toast";
import { useDB } from "@/hooks/useDB";
import { genId } from "@/lib/utils-tr";

interface Props {
  db: ReturnType<typeof useDB>["db"];
  save: ReturnType<typeof useDB>["save"];
  onClose: () => void;
}

export function QuickProductModal({ db, save, onClose }: Props) {
  const { showToast } = useToast();
  const cats = db.productCategories || [];
  const defaultCat = cats[0]?.id || "soba";
  const [form, setForm] = useState({
    name: "",
    category: defaultCat,
    cost: "",
    price: "",
    stock: "",
    minStock: "5",
  });

  const handleSave = () => {
    if (!form.name || !form.price) {
      showToast("Ad ve fiyat zorunlu!", "error");
      return;
    }
    const nowIso = new Date().toISOString();
    save((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: genId(),
          name: form.name,
          category: form.category,
          cost: parseFloat(form.cost) || 0,
          price: parseFloat(form.price) || 0,
          stock: parseInt(form.stock) || 0,
          minStock: parseInt(form.minStock) || 5,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
    }));
    showToast("Ürün eklendi!", "success");
    onClose();
  };

  return (
    <div className="quick-form-grid">
      <div>
        <label className="quick-form-label">Ürün Adı *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="quick-form-input"
          autoFocus
        />
      </div>
      <div>
        <label className="quick-form-label">Kategori</label>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="quick-form-input"
          aria-label="Ürün kategorisi seçimi"
        >
          {cats.length > 0
            ? cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))
            : ([
                ["soba", "🔥 Soba"],
                ["aksesuar", "🔧 Aksesuar"],
                ["yedek", "⚙️ Yedek Parça"],
                ["boru", "🔩 Boru"],
                ["pelet", "🪵 Pelet"],
              ] as const).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
        </select>
      </div>
      <div className="quick-form-grid-two">
        <div>
          <label className="quick-form-label">Alış (₺)</label>
          <input
            type="number"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            className="quick-form-input"
            title="Ürünün alış fiyatı"
            placeholder="0"
          />
        </div>
        <div>
          <label className="quick-form-label">Satış (₺) *</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="quick-form-input"
            title="Ürünün satış fiyatı"
            placeholder="0"
          />
        </div>
        <div>
          <label className="quick-form-label">Stok</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            className="quick-form-input"
            title="Mevcut stok miktarı"
            placeholder="0"
          />
        </div>
        <div>
          <label className="quick-form-label">Min. Stok</label>
          <input
            type="number"
            value={form.minStock}
            onChange={(e) =>
              setForm((f) => ({ ...f, minStock: e.target.value }))
            }
            className="quick-form-input"
            title="Minimum stok eşiği"
            placeholder="5"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="quick-submit-btn quick-submit-product"
      >
        📦 Ürün Ekle
      </button>
    </div>
  );
}
