import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const fullDb = {
  _version: 97, company: { name: "SOLHAN TİCARET", city: "İstanbul" },
  users: [{ id: "user1", username: "solhan2", passwordHash: "", role: "user", active: true, createdAt: "2026-01-01" }],
  settings: {}, kasa: [], kasalar: [{ id: "nakit", name: "Nakit", icon: "💵" }],
  products: [], sales: [], suppliers: [], orders: [], cari: [],
  invoices: [], bankTransactions: [], matchRules: [], monitorRules: [], monitorLog: [],
  stockMovements: [], peletSuppliers: [], peletOrders: [], boruSuppliers: [], boruOrders: [],
  budgets: [], returns: [], _activityLog: [], _auditLog: [],
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  notifications: [],
  ortakEmanetler: [], installments: [], partners: [], productCategories: [], notes: [],
  expenses: [], productionOrders: [],
};

await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.evaluate((db) => {
  localStorage.setItem("sobaUser_remember", JSON.stringify({ userId: "user1", username: "solhan2", role: "user", ts: Date.now() }));
  localStorage.setItem("sobaYonetim", JSON.stringify(db));
  localStorage.setItem("sobaYonetim_setupDone", "1");
}, fullDb);

await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(3000);

const pages = ["/", "/products", "/sales", "/settings", "/cari", "/kasa", "/bank", "/reports"];
let allOk = true;

for (const p of pages) {
  const url = p === "/" ? "http://localhost:3000/" : `http://localhost:3000${p}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);
    const mainLen = (await page.locator("main").innerHTML().catch(() => "")).length;
    const hasError = await page.locator("text=Bir Hata Olu").first().isVisible().catch(() => false);
    const status = mainLen > 200 ? "OK" : "EMPTY";
    console.log(`${p}: ${status} (main: ${mainLen}b, error: ${hasError})`);
    if (mainLen <= 200 || hasError) allOk = false;
  } catch (e) {
    console.log(`${p}: TIMEOUT`);
    allOk = false;
  }
}

console.log(`\nAll pages OK: ${allOk}`);
await browser.close();
