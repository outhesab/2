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
await page.waitForTimeout(5000);

// Check initial content
const mainHtml = await page.locator("main").innerHTML().catch(() => "no main");
console.log("Dashboard main HTML:", mainHtml.substring(0, 500));
console.log("Dashboard main length:", mainHtml.length);
console.log("Dashboard body length:", (await page.locator("body").innerHTML().catch(() => "")).length);

// Navigate
console.log("\n--- Navigating to /products ---");
try {
  await page.goto("http://localhost:3000/products", { waitUntil: "domcontentloaded", timeout: 30000 });
} catch (e) {
  console.log("Navigate timeout, checking current state...");
}
await page.waitForTimeout(5000);

const bodyFull = await page.locator("body").innerHTML().catch(() => "");
console.log("Products body length:", bodyFull.length);
console.log("Products body (first 1000):", bodyFull.substring(0, 1000));

const mainHtml2 = await page.locator("main").innerHTML().catch(() => "no main");
console.log("\nProducts main HTML:", mainHtml2.substring(0, 1000));
console.log("Products main length:", mainHtml2.length);

// Check if there's an error
const errorVisible = await page.locator("text=Bir Hata Olu").first().isVisible().catch(() => false);
console.log("Error visible:", errorVisible);

await browser.close();
