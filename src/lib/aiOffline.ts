import type { DB } from "@/types";
import { formatMoney } from "@/lib/utils-tr";
import {
  computeAlacak,
  computeBorc,
  computeKasaByType,
  computeKasaToplam,
  computeStokDeger,
  getCategorySales,
  getLowStockProducts,
  getMonthSales,
  getOutOfStockProducts,
  getOverdueMusteri,
  getProductSalesAgg,
  getTopBorclu,
} from "@/lib/dbUtils";

export function offlineReply(db: DB, query: string): string {
  const q = query.toLowerCase();
  const { sales: monthSales, ciro, kar } = getMonthSales(db);
  const kasaToplam = computeKasaToplam(db);
  const nakit = computeKasaByType(db, "nakit");
  const banka = computeKasaByType(db, "banka");

  if (q.includes("stok") || q.includes("ürün") || q.includes("sipariş")) {
    const out = getOutOfStockProducts(db);
    const low = getLowStockProducts(db);
    const stokDeger = computeStokDeger(db);
    const totalUrun = db.products.filter((p) => !p.deleted).length;
    return `📦 **Stok Ozeti**\n- Toplam urun: ${totalUrun} | Stok degeri: ${formatMoney(stokDeger)}\n- Stok biten: ${out.length}${
      out.length
        ? "\n  " +
          out
            .slice(0, 5)
            .map((p) => `• ${p.name}`)
            .join("\n  ")
        : ""
    }\n- Az stoklu: ${low.length}${
      low.length
        ? "\n  " +
          low
            .slice(0, 5)
            .map((p) => `• ${p.name} (${p.stock}/${p.minStock})`)
            .join("\n  ")
        : ""
    }\n\n⚠️ *Cevrimdisi mod - derin analiz icin internet gerekli*`;
  }
  if (
    q.includes("kasa") ||
    q.includes("nakit") ||
    q.includes("para") ||
    q.includes("sermaye")
  ) {
    const alacak = computeAlacak(db);
    const borc = computeBorc(db);
    const netSermaye = kasaToplam + alacak - borc;
    return `💰 **Kasa ve Sermaye**\n- Nakit: ${formatMoney(nakit)}\n- Banka: ${formatMoney(banka)}\n- Toplam Kasa: ${formatMoney(kasaToplam)}\n- Musteri Alacagi: ${formatMoney(alacak)}\n- Tedarikci Borcu: ${formatMoney(borc)}\n- **Net Sermaye: ${formatMoney(netSermaye)}**\n\n⚠️ *Cevrimdisi mod*`;
  }
  if (
    q.includes("alacak") ||
    q.includes("borç") ||
    q.includes("cari") ||
    q.includes("müşteri") ||
    q.includes("tahsilat")
  ) {
    const alacak = computeAlacak(db);
    const topBorclu = getTopBorclu(db);
    const overdue = getOverdueMusteri(db);
    return `👤 **Cari ve Alacak Ozeti**\n- Toplam alacak: ${formatMoney(alacak)}\n- Alacakli musteri: ${topBorclu.length}\n\n**En Yuksek 5 Alacak:**\n${topBorclu.map((c) => `- ${c.name}: ${formatMoney(c.balance)}`).join("\n") || "Yok"}${
      overdue.length > 0
        ? `\n\n⚠️ **Gecikmis Alacaklar (30+ gun):**\n${overdue
            .slice(0, 5)
            .map(
              (c) =>
                `- ${c.name}: ${formatMoney(c.balance)} - ${c.days} gun`,
            )
            .join("\n")}`
        : ""
    }`;
  }
  if (
    q.includes("satış") ||
    q.includes("analiz") ||
    q.includes("performans") ||
    q.includes("bu ay") ||
    q.includes("kâr")
  ) {
    const marj = ciro > 0 ? ((kar / ciro) * 100).toFixed(1) : "0";
    const topProducts = Object.entries(
      db.sales
        .filter(
          (s) =>
            !s.deleted &&
            s.status === "tamamlandi" &&
            new Date(s.createdAt) >= monthStart,
        )
        .reduce(
          (acc, s) => {
            acc[s.productName] = (acc[s.productName] || 0) + s.total;
            return acc;
          },
          {} as Record<string, number>,
        ),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return `📊 **Bu Ay Satis Ozeti**\n- ${monthSales.length} satis\n- Ciro: ${formatMoney(ciro)}\n- Kar: ${formatMoney(kar)} (%${marj} marj)\n\n**Bu Ay Top 3 Urun:**\n${topProducts.map(([n, v], i) => `${i + 1}. ${n}: ${formatMoney(v)}`).join("\n") || "Veri yok"}\n\n⚠️ *Cevrimdisi mod - karsilastirmali analiz icin internet gerekli*`;
  }
  if (
    q.includes("risk") ||
    q.includes("kritik") ||
    q.includes("öneri") ||
    q.includes("ipucu")
  ) {
    const out = getOutOfStockProducts(db).length;
    const low = getLowStockProducts(db).length;
    const alacak = computeAlacak(db);
    const riskler: string[] = [];
    if (kasaToplam < 5000)
      riskler.push(`💸 Kasa dusuk: ${formatMoney(kasaToplam)}`);
    if (out > 0) riskler.push(`📦 ${out} urunde stok bitti`);
    if (low > 0) riskler.push(`⚠️ ${low} urunde az stok`);
    if (alacak > 50000)
      riskler.push(`💳 Yuksek alacak: ${formatMoney(alacak)}`);
    if (db.orders.filter((o) => o.status === "bekliyor").length > 3)
      riskler.push(
        `🚚 ${db.orders.filter((o) => o.status === "bekliyor").length} bekleyen siparis`,
      );
    return `🔴 **Kritik Durumlar**\n${riskler.length > 0 ? riskler.map((r, i) => `${i + 1}. ${r}`).join("\n") : "✅ Kritik durum tespit edilmedi"}\n\n⚠️ *Cevrimdisi mod - detayli analiz icin internet gerekli*`;
  }
  return `🔌 **Cevrimdisi Mod**\n\nInternet baglantisi olmadigindan AI analizi yapilamiyor.\n\nSorabileceginiz konular:\n- Stok durumu\n- Kasa ve sermaye ozeti\n- Musteri alacaklari\n- Bu ay satislar\n- Kritik riskler`;
}

export function buildContext(
  db: DB,
  actionMode: "read-only" | "manual" | "auto",
  maxAutoActions: number,
  stopOnViolation: boolean,
): string {
  const today = new Date();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const { sales: monthSales, ciro: monthCiro, kar: monthKar } = getMonthSales(db);
  const lastMonthSales = db.sales.filter(
    (s) =>
      !s.deleted &&
      s.status === "tamamlandi" &&
      new Date(s.createdAt) >= lastMonthStart &&
      new Date(s.createdAt) <= lastMonthEnd,
  );
  const totalKasa = computeKasaToplam(db);
  const nakit = computeKasaByType(db, "nakit");
  const banka = computeKasaByType(db, "banka");
  const outStock = getOutOfStockProducts(db);
  const lowStock = getLowStockProducts(db);
  const stokDeger = computeStokDeger(db);

  // Top ürünler — satış adedi ve ciro bazlı
  const productSales = getProductSalesAgg(db);
  const topProducts = db.products
    .filter((p) => !p.deleted)
    .map((p) => ({
      ...p,
      ...(productSales[p.id] || { ciro: 0, adet: 0, kar: 0 }),
    }))
    .sort((a, b) => b.ciro - a.ciro)
    .slice(0, 5);

  // Gecikmiş alacaklar
  const overdueMusteri = getOverdueMusteri(db).map((c) => ({
    name: c.name, balance: c.balance, days: c.days, phone: c.phone,
  }));

  const alacak = computeAlacak(db);
  const borc = computeBorc(db);
  const topBorclu = getTopBorclu(db);

  const catSales = getCategorySales(db);

  // Aylık trend (son 6 ay)
  const monthlyTrend: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = d.toLocaleDateString("tr-TR", {
      month: "short",
      year: "2-digit",
    });
    monthlyTrend[key] = 0;
  }
  db.sales
    .filter((s) => !s.deleted && s.status === "tamamlandi")
    .forEach((s) => {
      const d = new Date(s.createdAt);
      const key = d.toLocaleDateString("tr-TR", {
        month: "short",
        year: "2-digit",
      });
      if (monthlyTrend[key] !== undefined) monthlyTrend[key] += s.total;
    });

  const lastMonthCiro = lastMonthSales.reduce((s, x) => s + x.total, 0);
  const buyumePct =
    lastMonthCiro > 0
      ? (((monthCiro - lastMonthCiro) / lastMonthCiro) * 100).toFixed(1)
      : "N/A";

  return `## İşletme Özeti — ${today.toLocaleDateString("tr-TR")}

### 📊 Satış Performansı
- Bu ay: ${monthSales.length} satış | Ciro: ${formatMoney(monthCiro)} | Kâr: ${formatMoney(monthKar)} | Marj: %${monthCiro > 0 ? ((monthKar / monthCiro) * 100).toFixed(1) : 0}
- Geçen ay: ${lastMonthSales.length} satış | Ciro: ${formatMoney(lastMonthCiro)}
- Büyüme: ${buyumePct}%
- Tüm zamanlar: ${db.sales.filter((s) => !s.deleted && s.status === "tamamlandi").length} satış

### 💰 Kasa Durumu
- Toplam: ${formatMoney(totalKasa)} | Nakit: ${formatMoney(nakit)} | Banka: ${formatMoney(banka)}
- Diğer kasalar: ${formatMoney(totalKasa - nakit - banka)}

### 📦 Stok
- Toplam: ${db.products.filter((p) => !p.deleted).length} ürün | Stok değeri: ${formatMoney(stokDeger)}
- Biten: ${outStock.length}${
    outStock.length
      ? ` (${outStock
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ")})`
      : ""
  } | Az stoklu: ${lowStock.length}

### 🏆 Top 5 Ürün (Ciro)
${topProducts.map((p, i) => `${i + 1}. ${p.name}: ${formatMoney(p.ciro)} ciro, ${p.adet} adet, ${formatMoney(p.kar)} kâr`).join("\n")}

### 👤 Cari & Alacak
- Toplam alacak: ${formatMoney(alacak)} | Toplam borç: ${formatMoney(borc)}
- En yüksek 5 alacak: ${topBorclu.map((c) => `${c.name}(${formatMoney(c.balance)})`).join(", ") || "Yok"}
${
  overdueMusteri.length > 0
    ? `- ⚠️ GECIKMIS ALACAKLAR (30+ gun): ${overdueMusteri
        .slice(0, 5)
        .map((c) => `${c.name} ${c.days}gün ${formatMoney(c.balance)}`)
        .join(", ")}`
    : "- ✅ Gecikmis alacak yok"
}

### 🏭 Tedarik
- Tedarikçi: ${db.suppliers.length} | Bekleyen sipariş: ${db.orders.filter((o) => o.status === "bekliyor").length} | Yolda: ${db.orders.filter((o) => o.status === "yolda").length}

### 🏷️ Kategori Performansı
${
  Object.entries(catSales)
    .sort((a, b) => b[1].ciro - a[1].ciro)
    .map(
      ([c, v]) =>
        `${c}: ${formatMoney(v.ciro)} ciro, %${v.ciro > 0 ? ((v.kar / v.ciro) * 100).toFixed(1) : 0} marj`,
    )
    .join("\n") || "Veri yok"
}

### 📅 Aylık Trend (Son 6 Ay)
${Object.entries(monthlyTrend)
  .map(([m, v]) => `${m}: ${formatMoney(v)}`)
  .join(" | ")}

---
## 🛠️ DB ISLEM TALIMATLARI
Aktif işlem modu: ${actionMode === "read-only" ? "READ_ONLY (sadece analiz)" : actionMode === "auto" ? "AUTO_EXECUTE (otomatik)" : "MANUAL_APPROVAL (onaylı)"}
${actionMode === "read-only" ? "READ_ONLY modundasın. Kesinlikle action bloğu üretme, sadece analiz ve öneri ver." : "İşlem gerekiyorsa action bloğu üretebilirsin."}
AUTO mod aktifse tek yanıtta en fazla ${maxAutoActions} action üret.
Kural ihlali davranışı: ${stopOnViolation ? "İhlalde durdur" : "İhlalli actionı atla ve devam et"}.
Kullanıcı bir işlem yapmak istediğinde (satış, kasa, stok, tahsilat), yanıtının SONUNA aşağıdaki formatta bir action bloğu ekle.
Sadece kullanici acikca bir islem yapmak istediginde ekle - analiz/soru sorularinda EKLEME.

### Satış kaydı:
\`\`\`action
{"type":"sale","label":"[ürün adı] x[adet] — [tutar] TL satış","payload":{"productName":"[ürün adı]","quantity":[adet],"unitPrice":[birim fiyat],"discount":0,"payment":"nakit","cariName":"[müşteri adı veya boş string]"}}
\`\`\`

### Kasa gelir:
\`\`\`action
{"type":"kasa_gelir","label":"[açıklama] — [tutar] TL gelir","payload":{"amount":[tutar],"kasa":"nakit","category":"diger_gelir","description":"[açıklama]"}}
\`\`\`

### Kasa gider:
\`\`\`action
{"type":"kasa_gider","label":"[açıklama] — [tutar] TL gider","payload":{"amount":[tutar],"kasa":"nakit","category":"diger_gider","description":"[açıklama]"}}
\`\`\`

### Stok güncelleme:
\`\`\`action
{"type":"stok_guncelle","label":"[ürün adı] stok → [yeni miktar]","payload":{"productName":"[ürün adı]","stock":[yeni miktar],"note":"[açıklama]"}}
\`\`\`

### Cari tahsilat:
\`\`\`action
{"type":"cari_tahsilat","label":"[müşteri adı] — [tutar] TL tahsilat","payload":{"cariName":"[müşteri adı]","amount":[tutar],"kasa":"nakit"}}
\`\`\`

### Yeni ürün ekleme:
\`\`\`action
{"type":"urun_ekle","label":"[ürün adı] eklenecek","payload":{"name":"[ürün adı]","category":"soba","cost":[alış],"price":[satış],"stock":[stok],"minStock":[min stok]}}
\`\`\`

### Yeni cari ekleme:
\`\`\`action
{"type":"cari_ekle","label":"[cari adı] eklenecek","payload":{"name":"[cari adı]","type":"musteri","phone":"[telefon]","balance":0}}
\`\`\`

### Mevcut ürünler (satış için kullan):
${db.products
  .filter((p) => !p.deleted)
  .map((p) => `- ${p.name} (stok:${p.stock}, fiyat:${p.price}TL)`)
  .join("\n")}

### Mevcut müşteriler (cari için kullan):
${db.cari
  .filter((c) => !c.deleted && c.type === "musteri")
  .slice(0, 20)
  .map((c) => `- ${c.name} (bakiye:${c.balance}TL)`)
  .join("\n")}`;
}

export const QUICK_PROMPTS: Array<{ label: string; prompt: string }> = [
  {
    label: "📊 Bu Ay Analiz",
    prompt:
      "Bu ayın satış performansını detaylı analiz et. Geçen aya göre büyüme/düşüş var mı? Kâr marjı nasıl?",
  },
  {
    label: "📦 Stok Durumu",
    prompt:
      "Stoklarımın durumunu değerlendir. Hangi ürünleri acil sipariş etmeliyim? Stok değerim ne kadar?",
  },
  {
    label: "💰 Kâr Analizi",
    prompt:
      "En kârlı ürünlerim hangileri? Hangi kategoride kâr marjı düşük? İyileştirme önerileri ver.",
  },
  {
    label: "🔮 Satış Tahmini",
    prompt:
      "Aylık trend verilerime göre önümüzdeki ay için satış tahmini yap. Hangi ürünlere odaklanmalıyım?",
  },
  {
    label: "👤 Alacak Takibi",
    prompt:
      "Gecikmiş alacaklarım var mı? Hangi müşterilerden tahsilat yapmalıyım? Öncelik sırası ver.",
  },
  {
    label: "🏭 Tedarik Analizi",
    prompt:
      "Tedarikçilerimle ilgili durum nedir? Bekleyen siparişler var mı? Maliyet optimizasyonu için ne yapabilirim?",
  },
  {
    label: "💡 Kritik Öneriler",
    prompt:
      "İşletmem için şu an en kritik 5 aksiyon nedir? Öncelik sırasıyla listele.",
  },
  {
    label: "📈 Büyüme Stratejisi",
    prompt:
      "Verilerime göre satışları artırmak için hangi stratejileri izlemeliyim? Hangi ürün/kategori potansiyeli var?",
  },
  {
    label: "⚖️ Net Sermaye",
    prompt:
      "Net sermayem ne durumda? Kasa, alacak ve borçlarımı değerlendirerek finansal sağlığımı analiz et.",
  },
  {
    label: "🔴 Risk Analizi",
    prompt:
      "İşletmemde şu an en büyük finansal riskler neler? Stok, alacak ve kasa açısından değerlendir.",
  },
];
