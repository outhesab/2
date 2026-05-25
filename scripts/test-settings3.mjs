import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Capture ALL console output
page.on("console", (msg) => {
  if (msg.type() !== "verbose") {
    console.log("[" + msg.type() + "]", msg.text().substring(0, 300));
  }
});
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

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

console.log("=== NOW NAVIGATING TO SETTINGS ===");

// Try client-side navigation first
await page.evaluate(() => window.history.pushState({}, "", "/settings"));
await page.evaluate(() => window.dispatchEvent(new PopStateEvent("popstate")));
await page.waitForTimeout(5000);

console.log("=== AFTER PUSHSTATE ===");

// Check what's in the main element
const mainHtml = await page.evaluate(() => {
  const main = document.querySelector("main");
  if (!main) return "no main";
  
  // Check if there's a motion.div with opacity 0
  const children = Array.from(main.children);
  return {
    childCount: children.length,
    tags: children.map(c => c.tagName),
    styles: children.map(c => c.getAttribute("style")?.substring(0, 100) || "no style"),
    innerLength: children.map(c => c.innerHTML.length),
    textPreview: children.map(c => (c.textContent || "").substring(0, 200))
  };
});
console.log("Main children:", JSON.stringify(mainHtml, null, 2));

// Also try direct URL navigation
console.log("=== DIRECT URL NAVIGATION ===");
try {
  await page.goto("http://localhost:3000/settings", { timeout: 15000 });
} catch (e) {
  console.log("Goto timeout:", e.message);
}
await page.waitForTimeout(5000);

const settingsHtml = await page.evaluate(() => {
  const main = document.querySelector("main");
  if (!main) return "no main";
  return {
    children: main.children.length,
    innerHTML: main.innerHTML.substring(0, 500),
    text: (main.textContent || "").substring(0, 500)
  };
});
console.log("Settings content:", JSON.stringify(settingsHtml, null, 2));

await browser.close();
