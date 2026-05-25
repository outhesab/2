import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

const fullDb = {
  _version: 97, company: { name: "SOLHAN TİCARET", city: "İstanbul", phone: "", taxOffice: "", taxNo: "" },
  users: [{ id: "user1", username: "solhan2", passwordHash: "", role: "user", active: true, createdAt: "2026-01-01T00:00:00.000Z" }],
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
await page.waitForTimeout(5000);

// Check initial dashboard opacity
const dashOpacity = await page.evaluate(() => {
  const main = document.querySelector("main");
  if (!main) return "no main";
  const firstChild = main.firstElementChild;
  if (!firstChild) return "no child";
  const style = window.getComputedStyle(firstChild);
  return `opacity: ${style.opacity}, transform: ${style.transform}, filter: ${style.filter}`;
});
console.log("1. Dashboard main div style:", dashOpacity);

// Navigate to products
await page.goto("http://localhost:3000/products", { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(5000);

// Check products opacity
const prodOpacity = await page.evaluate(() => {
  const main = document.querySelector("main");
  if (!main) return "no main";
  const firstChild = main.firstElementChild;
  if (!firstChild) return "no child";
  const style = window.getComputedStyle(firstChild);
  return `opacity: ${style.opacity}, transform: ${style.transform}, filter: ${style.filter}`;
});
console.log("2. Products main div style:", prodOpacity);

// Check what's actually rendered in the main element
const mainHtml = await page.evaluate(() => {
  const main = document.querySelector("main");
  return main ? main.innerHTML.substring(0, 500) : "no main";
});
console.log("3. Main innerHTML:", mainHtml.substring(0, 500));

// Also try clicking Ürünler in nav
const prodBtn = page.locator("button:has-text('Ürünler')").first();
if (await prodBtn.isVisible().catch(() => false)) {
  await prodBtn.click();
  await page.waitForTimeout(5000);
  
  const clickOpacity = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return "no main";
    const firstChild = main.firstElementChild;
    if (!firstChild) return "no child";
    const style = window.getComputedStyle(firstChild);
    return `opacity: ${style.opacity}, transform: ${style.transform}`;
  });
  console.log("4. After click opacity:", clickOpacity);
}

await browser.close();
