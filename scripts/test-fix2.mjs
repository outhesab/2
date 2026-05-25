import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.text().includes("Error")) {
    console.log("[" + msg.type() + "]", msg.text().substring(0, 250));
  }
});

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
await page.waitForTimeout(5000);

console.log("1. Dashboard URL:", page.url(), "title:", await page.title());

// Navigate with load event (not networkidle)
await page.goto("http://localhost:3000/products", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(5000);

console.log("2. Products URL:", page.url());
const text = await page.locator("body").innerText().catch(() => "no text");
console.log("3. Body text (first 300):", text.substring(0, 300));

const mainHtml = await page.locator("main").innerHTML().catch(() => "no main");
console.log("4. Main HTML length:", mainHtml.length);
if (mainHtml.length < 50) {
  console.log("4b. Main HTML:", mainHtml.substring(0, 300));
}

await browser.close();
