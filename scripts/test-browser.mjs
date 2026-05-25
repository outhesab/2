import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false, channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[ERROR]", msg.text());
});
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

const fullDb = {
  _version: 97, company: { name: "SOLHAN TİCARET", city: "İstanbul" },
  users: [{ id: "user1", username: "solhan2", passwordHash: "", role: "user", active: true, createdAt: "2026-01-01" }],
  settings: {}, kasa: [], kasalar: [{ id: "nakit", name: "Nakit", icon: "💵" }, { id: "banka", name: "Banka", icon: "🏦" }],
  products: [
    { id: "p1", name: "Soba Premium", category: "soba", stock: 25, minStock: 5, cost: 3000, price: 5000, createdAt: "2026-01-01" },
    { id: "p2", name: "Pelet 15kg", category: "pelet", stock: 100, minStock: 20, cost: 40, price: 65, createdAt: "2026-01-01" },
    { id: "p3", name: "Baca Borusu", category: "boru", stock: 50, minStock: 10, cost: 200, price: 350, createdAt: "2026-01-01" },
  ],
  sales: [
    { id: "s1", productId: "p1", productName: "Soba Premium", quantity: 2, unitPrice: 5000, total: 10000, date: "2026-05-20", customer: "Ahmet", payment: "nakit" },
  ],
  cari: [
    { id: "c1", name: "Ahmet Yılmaz", phone: "555-1234", debt: 5000, type: "musteri", createdAt: "2026-01-01" },
  ],
  suppliers: [], orders: [],
  invoices: [], bankTransactions: [], matchRules: [], monitorRules: [], monitorLog: [],
  stockMovements: [], peletSuppliers: [], peletOrders: [], boruSuppliers: [], boruOrders: [],
  budgets: [], returns: [], _activityLog: [], _auditLog: [],
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  notifications: [],
  ortakEmanetler: [], installments: [], partners: [], productCategories: [{ id: "genel", name: "Genel", icon: "📦" }, { id: "soba", name: "Soba", icon: "🔥" }], notes: [],
  expenses: [], productionOrders: [],
};

await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.evaluate((db) => {
  localStorage.setItem("sobaUser_remember", JSON.stringify({ userId: "user1", username: "solhan2", role: "user", ts: Date.now() }));
  localStorage.setItem("sobaYonetim", JSON.stringify(db));
  localStorage.setItem("sobaYonetim_setupDone", "1");
}, fullDb);

await page.reload({ waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(3000);

console.log("Tarayıcı açıldı. Sayfaları test ediyorum...");

// Navigate through pages
const testPages = ["/products", "/sales", "/cari", "/kasa", "/settings", "/dashboard"];
for (const p of testPages) {
  console.log(`→ ${p}`);
  await page.goto(`http://localhost:3000${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const mainLen = (await page.locator("main").innerHTML().catch(() => "")).length;
  const hasError = await page.locator("text=Bir Hata Olu").first().isVisible().catch(() => false);
  console.log(`  ${mainLen}b, hata: ${hasError}`);
}

console.log("\n✅ Tüm sayfalar yüklendi. Tarayıcı 30sn sonra kapanacak.");
await page.waitForTimeout(30000);
await browser.close();
