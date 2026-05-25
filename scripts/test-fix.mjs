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

await page.reload({ waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);

console.log("1. Dashboard loaded");

// Navigate to different pages via URL and verify content loads
const pages = ["/products", "/sales", "/settings", "/cari", "/kasa"];
for (const p of pages) {
  console.log(`--- Navigating to ${p} ---`);
  await page.goto(`http://localhost:3000${p}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Get the main content
  const mainText = await page.locator("main").innerText().catch(() => "NO MAIN");
  const mainHtml = await page.locator("main").innerHTML().catch(() => "");
  
  console.log(`URL: ${page.url()}`);
  console.log(`Main text (first 200): ${mainText.substring(0, 200)}`);
  console.log(`Main HTML length: ${mainHtml.length}`);
  
  // Check opacity
  const opacity = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main || !main.firstElementChild) return "?";
    return window.getComputedStyle(main.firstElementChild).opacity;
  });
  console.log(`First child opacity: ${opacity}`);
  
  // Error check
  const hasError = await page.locator("text=Bir Hata Olu").first().isVisible().catch(() => false);
  console.log(`Error boundary: ${hasError}`);
}

await browser.close();
