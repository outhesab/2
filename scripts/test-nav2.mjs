import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[ERROR]", msg.text().substring(0, 200));
  if (msg.text().includes("ErrorBoundary")) console.log("[BOUNDARY]", msg.text().substring(0, 200));
});

const fullDb = {
  _version: 97, company: { name: "SOLHAN TİCARET", city: "İstanbul", phone: "", taxOffice: "", taxNo: "" },
  users: [{ id: "user1", username: "solhan2", passwordHash: "", role: "user", active: true, createdAt: "2026-01-01T00:00:00.000Z" }],
  settings: {}, kasa: [], kasalar: [{ id: "nakit", name: "Nakit", icon: "💵" }],
  products: [{ id: "p1", name: "Test Ürün", category: "genel", stock: 10, minStock: 2, cost: 50, price: 100, createdAt: "2026-01-01" }],
  sales: [], suppliers: [], orders: [], cari: [],
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

console.log("1. Dashboard loaded, testing navigation...");

// Wait longer for all lazy chunks to load
await page.waitForTimeout(3000);

// Click on "Ürünler" in sidebar
const productsLink = page.locator("button:has-text('Ürünler')").first();
const isVisible = await productsLink.isVisible().catch(() => false);
console.log("2. Ürünler visible:", isVisible);

if (isVisible) {
  await productsLink.click();
  await page.waitForTimeout(5000);
  console.log("3. URL:", page.url());
  const mainText = await page.locator("main").innerText().catch(() => "");
  console.log("4. Main text:", mainText.substring(0, 400));
  
  // Check if content area is blank
  const mainHtml = await page.locator("main").innerHTML().catch(() => "");
  console.log("5. Main HTML length:", mainHtml.length);
  console.log("5b. Main HTML (first 300):", mainHtml.substring(0, 300));
}

await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/products.png", fullPage: false });
console.log("6. Screenshot saved");

await browser.close();
