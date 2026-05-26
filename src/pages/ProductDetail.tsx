import { useToast } from "@/components/Toast";
import { formatDate, formatMoney } from "@/lib/utils-tr";
import type { DB, Sale, SaleItem } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

interface Props {
  db: DB;
  save: (fn: (prev: DB) => DB) => void;
}

function currentIdFromPath(location: string): string {
  const value = location.split("/").filter(Boolean).pop() || "";
  return decodeURIComponent(value);
}

function productItems(sale: Sale, productId: string): SaleItem[] {
  const items = sale.items?.filter((item) => item.productId === productId) || [];
  if (items.length > 0) return items;
  if (sale.productId === productId) {
    return [
      {
        productId,
        productName: sale.productName,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        cost: sale.cost / Math.max(1, sale.quantity),
        total: sale.total,
      },
    ];
  }
  return [];
}

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
};

const muted: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.86rem",
};

export default function ProductDetail({ db, save }: Props) {
  const [location, setLocation] = useLocation();
  const { showToast } = useToast();
  const productId = currentIdFromPath(location);
  const product = db.products.find((p) => !p.deleted && p.id === productId);
  const [minStock, setMinStock] = useState(product?.minStock || 0);

  useEffect(() => {
    setMinStock(product?.minStock || 0);
  }, [product?.id, product?.minStock]);

  const stats = useMemo(() => {
    const productSales = db.sales
      .filter((sale) => !sale.deleted && sale.status === "tamamlandi")
      .map((sale) => ({ sale, items: productItems(sale, productId) }))
      .filter((row) => row.items.length > 0);

    const qty = productSales.reduce(
      (sum, row) =>
        sum + row.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const revenue = productSales.reduce(
      (sum, row) =>
        sum + row.items.reduce((itemSum, item) => itemSum + item.total, 0),
      0,
    );
    const profit = productSales.reduce(
      (sum, row) =>
        sum +
        row.items.reduce(
          (itemSum, item) =>
            itemSum + item.quantity * (item.unitPrice - item.cost),
          0,
        ),
      0,
    );

    return {
      productSales,
      qty,
      revenue,
      profit,
      margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
    };
  }, [db.sales, productId]);

  if (!product) {
    return (
      <div style={card}>
        <button onClick={() => setLocation("/products")} style={backButton}>
          ← Ürünlere dön
        </button>
        <h2 style={{ color: "#f1f5f9", marginTop: 16 }}>Ürün bulunamadı</h2>
        <p style={muted}>Bu ürün silinmiş olabilir veya bağlantı eski olabilir.</p>
      </div>
    );
  }

  const category = db.productCategories.find((c) => c.id === product.category);
  const supplier = db.suppliers.find((s) => s.id === product.supplierId);
  const movements = db.stockMovements
    .filter((movement) => movement.productId === product.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const stockValue = product.stock * product.cost;

  const updateMinStock = () => {
    const safeMinStock = Math.max(0, Math.floor(minStock || 0));
    save((prev) => ({
      ...prev,
      products: prev.products.map((item) =>
        item.id === product.id
          ? {
              ...item,
              minStock: safeMinStock,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
    showToast("Minimum stok eşiği güncellendi.", "success");
  };

  return (
    <div>
      <button onClick={() => setLocation("/products")} style={backButton}>
        ← Ürünlere dön
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.6fr)",
          gap: 16,
          marginTop: 16,
        }}
      >
        <section style={card}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: "2.7rem" }}>{category?.icon || "📦"}</div>
            <div>
              <h2 style={{ margin: 0, color: "#f8fafc" }}>{product.name}</h2>
              <div style={muted}>
                {[product.brand, category?.name || product.category, supplier?.name]
                  .filter(Boolean)
                  .join(" · ") || "Kategori yok"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginTop: 18 }}>
            <Metric label="Stok" value={`${product.stock} adet`} color={product.stock <= product.minStock ? "#f59e0b" : "#10b981"} />
            <Metric label="Satış Fiyatı" value={formatMoney(product.price)} color="#60a5fa" />
            <Metric label="Stok Değeri" value={formatMoney(stockValue)} color="#10b981" />
            <Metric label="Toplam Kâr" value={formatMoney(stats.profit)} color={stats.profit >= 0 ? "#10b981" : "#ef4444"} />
          </div>

          {product.description && (
            <p style={{ ...muted, marginTop: 18 }}>{product.description}</p>
          )}
        </section>

        <section style={card}>
          <h3 style={sectionTitle}>Stok Alarmı</h3>
          <label style={label}>Minimum stok eşiği</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              min={0}
              value={minStock}
              onChange={(event) => setMinStock(Number(event.target.value))}
              style={input}
            />
            <button onClick={updateMinStock} style={primaryButton}>
              Kaydet
            </button>
          </div>
          <div style={{ ...muted, marginTop: 12 }}>
            Güncel durum:{" "}
            <strong style={{ color: product.stock <= product.minStock ? "#f59e0b" : "#10b981" }}>
              {product.stock <= product.minStock ? "Sipariş gerekiyor" : "Normal"}
            </strong>
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 16 }}>
        <section style={card}>
          <h3 style={sectionTitle}>Satış Kâr Analizi</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
            <Metric label="Satılan" value={`${stats.qty}`} color="#60a5fa" />
            <Metric label="Ciro" value={formatMoney(stats.revenue)} color="#10b981" />
            <Metric label="Kâr" value={formatMoney(stats.profit)} color="#10b981" />
            <Metric label="Marj" value={`%${stats.margin}`} color="#f59e0b" />
          </div>
          {stats.productSales.length === 0 ? (
            <p style={muted}>Bu ürün için tamamlanmış satış bulunmuyor.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {stats.productSales.slice(0, 12).map(({ sale, items }) => {
                const saleProfit = items.reduce(
                  (sum, item) =>
                    sum + item.quantity * (item.unitPrice - item.cost),
                  0,
                );
                return (
                  <div key={sale.id} style={row}>
                    <div>
                      <strong style={{ color: "#f1f5f9" }}>{formatDate(sale.createdAt)}</strong>
                      <div style={muted}>{items.reduce((sum, item) => sum + item.quantity, 0)} adet</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#10b981", fontWeight: 700 }}>{formatMoney(saleProfit)}</div>
                      <button onClick={() => setLocation(`/satis/${sale.id}`)} style={linkButton}>Satış detayı</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={card}>
          <h3 style={sectionTitle}>Stok Hareketleri</h3>
          {movements.length === 0 ? (
            <p style={muted}>Stok hareketi yok.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {movements.slice(0, 16).map((movement) => (
                <div key={movement.id} style={row}>
                  <div>
                    <strong style={{ color: "#f1f5f9" }}>{movement.type}</strong>
                    <div style={muted}>{movement.note || "Açıklama yok"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: movement.amount >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                      {movement.before} → {movement.after}
                    </div>
                    <div style={muted}>{formatDate(movement.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", border: `1px solid ${color}33` }}>
      <div style={{ color, fontWeight: 800, fontSize: "1rem" }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 3 }}>{label}</div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  color: "#f8fafc",
  margin: "0 0 12px",
  fontSize: "1rem",
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 10,
  padding: "10px 12px",
};

const label: React.CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: "0.82rem",
  marginBottom: 6,
};

const input: React.CSSProperties = {
  flex: 1,
  minWidth: 80,
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 9,
  color: "#f8fafc",
  padding: "9px 10px",
};

const primaryButton: React.CSSProperties = {
  background: "#10b981",
  border: "none",
  borderRadius: 9,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  padding: "9px 14px",
};

const backButton: React.CSSProperties = {
  background: "rgba(148,163,184,0.12)",
  border: "1px solid rgba(148,163,184,0.24)",
  borderRadius: 9,
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: 700,
  padding: "8px 12px",
};

const linkButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#60a5fa",
  cursor: "pointer",
  fontSize: "0.78rem",
  padding: 0,
};
