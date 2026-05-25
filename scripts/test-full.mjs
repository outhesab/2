import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => console.log("[" + msg.type() + "]", msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));
page.on("response", (resp) => {
  if (resp.status() >= 400) console.log("HTTP ERROR:", resp.status(), resp.url().substring(0, 120));
});

// Go to root, set localStorage BEFORE React loads
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 15000 });

// Inject session before the app fully loads
await page.evaluate(() => {
  // This mimics what setUserSession does when "remember" is checked
  localStorage.setItem("sobaUser_remember", JSON.stringify({
    userId: "user1",
    username: "solhan2",
    role: "user",
    ts: Date.now()
  }));
  // Also set DB data with a minimal valid user
  localStorage.setItem("sobaYonetim", JSON.stringify({
    _version: 0,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [
      { id: "nakit", name: "Nakit", icon: "💵" },
      { id: "banka", name: "Banka", icon: "🏦" },
      { id: "pos_ziraat", name: "POS Ziraat", icon: "🏧" },
      { id: "pos_is", name: "POS İş", icon: "🏧" },
      { id: "pos_yk", name: "POS YapıKredi", icon: "🏧" }
    ],
    bankTransactions: [],
    matchRules: [],
    monitorRules: [],
    invoices: [],
    notifications: [],
    _auditLog: [],
    settings: {},
    pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
    users: [{
      id: "user1",
      username: "solhan2",
      passwordHash: "",
      role: "user",
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      lastLogin: new Date().toISOString()
    }],
    ortakEmanetler: [],
    installments: [],
    partners: [],
    productCategories: [],
    notes: []
  }));
});

// Reload so app picks up localStorage
await page.reload({ waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);

console.log("1. URL:", page.url());
const bodyText = await page.locator("body").innerText().catch(() => "");
console.log("2. Body (first 200):", bodyText.substring(0, 200));

const hasSidebar = await page.locator("aside.app-sidebar, .app-shell nav").first().isVisible().catch(() => false);
const hasLogin = await page.locator("input[type='password']").first().isVisible().catch(() => false);
console.log("3. Sidebar:", hasSidebar, "Login:", hasLogin);

if (hasSidebar) {
  console.log("--- LOGGED IN, testing navigation ---");

  // Try navigating via URL directly first
  await page.goto("http://localhost:3000/products", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log("4. Products URL:", page.url());
  
  const mainContent = await page.locator("main").innerText().catch(() => "");
  console.log("5. Main content (first 300):", mainContent.substring(0, 300));
  
  // Check what the active tab shows
  const activeBtn = await page.locator("button.app-nav-tab-btn.active, button.app-priority-tab.active").first();
  console.log("6. Active btn text:", await activeBtn.innerText().catch(() => "n/a"));

  // Now try Settings via URL
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log("7. Settings URL:", page.url());
  const settingsContent = await page.locator("main").innerText().catch(() => "");
  console.log("8. Settings content (first 300):", settingsContent.substring(0, 300));
}

await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/page-test.png", fullPage: true });
console.log("--- DONE ---");

await browser.close();
