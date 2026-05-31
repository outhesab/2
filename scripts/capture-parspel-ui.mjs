import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3000";
const OUT_DIR = "C:\\temp\\parspel-shots-after";

const seedDb = {
  _version: 1,
  products: [
    {
      id: "urun-1",
      name: "PARSPEL Soba A",
      category: "soba",
      cost: 4200,
      price: 5900,
      stock: 14,
      minStock: 4,
      barcode: "",
      description: "",
      supplierId: "",
      deleted: false,
      createdAt: "2026-05-30T09:00:00.000Z",
      updatedAt: "2026-05-30T09:00:00.000Z",
    },
    {
      id: "urun-2",
      name: "Boru Seti Premium",
      category: "boru",
      cost: 850,
      price: 1200,
      stock: 22,
      minStock: 5,
      barcode: "",
      description: "",
      supplierId: "",
      deleted: false,
      createdAt: "2026-05-30T09:00:00.000Z",
      updatedAt: "2026-05-30T09:00:00.000Z",
    },
  ],
  sales: [
    {
      id: "sale-1",
      productId: "urun-1",
      productName: "PARSPEL Soba A",
      productCategory: "soba",
      quantity: 1,
      total: 5900,
      profit: 1700,
      payment: "nakit",
      status: "tamamlandi",
      deleted: false,
      createdAt: "2026-05-31T10:00:00.000Z",
      updatedAt: "2026-05-31T10:00:00.000Z",
      items: [{ productId: "urun-1", productName: "PARSPEL Soba A", quantity: 1, unitPrice: 5900, total: 5900, cost: 4200, profit: 1700 }],
    },
  ],
  suppliers: [],
  orders: [],
  cari: [
    {
      id: "cari-1",
      name: "Ayşe Demir",
      type: "musteri",
      taxNo: "",
      phone: "05551234567",
      email: "ayse@example.com",
      address: "Şanlıurfa",
      balance: 2400,
      note: "",
      deleted: false,
      createdAt: "2026-05-29T09:00:00.000Z",
      updatedAt: "2026-05-31T11:00:00.000Z",
    },
  ],
  kasa: [
    { id: "kasa-1", type: "gelir", kasa: "nakit", category: "satis", amount: 5900, description: "Günlük satış", createdAt: "2026-05-31T10:00:00.000Z", updatedAt: "2026-05-31T10:00:00.000Z" },
    { id: "kasa-2", type: "gider", kasa: "banka", category: "fatura", amount: 900, description: "Elektrik", createdAt: "2026-05-31T12:00:00.000Z", updatedAt: "2026-05-31T12:00:00.000Z" },
    { id: "kasa-3", type: "gelir", kasa: "pos_ziraat", category: "satis", amount: 2100, description: "POS satış", createdAt: "2026-05-31T14:00:00.000Z", updatedAt: "2026-05-31T14:00:00.000Z" },
  ],
  kasalar: [
    { id: "nakit", name: "Nakit", icon: "💵" },
    { id: "banka", name: "Banka", icon: "🏦" },
    { id: "pos_ziraat", name: "POS Ziraat", icon: "🏧" },
    { id: "pos_is", name: "POS İş", icon: "🏧" },
    { id: "pos_yk", name: "POS YapıKredi", icon: "🏧" },
  ],
  stockMovements: [],
  bankTransactions: [
    { id: "bank-1", type: "gelen", amount: 5000, description: "Tahsilat", status: "matched", date: "2026-05-31T09:00:00.000Z", createdAt: "2026-05-31T09:00:00.000Z", updatedAt: "2026-05-31T09:00:00.000Z" },
  ],
  matchRules: [],
  monitorRules: [],
  monitorLog: [],
  peletSuppliers: [],
  peletOrders: [],
  boruSuppliers: [],
  boruOrders: [],
  invoices: [
    {
      id: "inv-1",
      invoiceNo: "SF-2026-001",
      type: "satis",
      cariId: "cari-1",
      cariName: "Ayşe Demir",
      total: 5900,
      status: "kesildi",
      date: "2026-05-31T10:00:00.000Z",
      dueDate: "2026-06-15T00:00:00.000Z",
      items: [{ description: "PARSPEL Soba A", quantity: 1, unitPrice: 5900, total: 5900 }],
      createdAt: "2026-05-31T10:00:00.000Z",
      updatedAt: "2026-05-31T10:00:00.000Z",
    },
  ],
  budgets: [],
  returns: [],
  _activityLog: [
    { id: "act-1", action: "Satış oluşturuldu", time: "2026-05-31T10:00:00.000Z", createdAt: "2026-05-31T10:00:00.000Z" },
  ],
  company: { id: "company-1", name: "PARSPEL", createdAt: "2026-05-30T09:00:00.000Z" },
  settings: {},
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  ortakEmanetler: [],
  installments: [],
  partners: [],
  notes: [],
  _auditLog: [],
  productCategories: [
    { id: "soba", name: "Soba", icon: "🔥", createdAt: "2026-05-30T09:00:00.000Z" },
    { id: "boru", name: "Boru", icon: "🔩", createdAt: "2026-05-30T09:00:00.000Z" },
  ],
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function prepare(page, authed = true) {
  await page.addInitScript(
    ({ db, authedUser }) => {
      localStorage.setItem("sobaYonetim_setupDone", "1");
      localStorage.setItem("sobaYonetim_setupApplied", "1");
      localStorage.setItem("dashboardPrefs", JSON.stringify({ leftWidgets: ["chart", "recentSales", "tips", "excelBar"], brightness: 100 }));
      localStorage.setItem("sobaYonetim", JSON.stringify(db));
      localStorage.setItem("lastSeenVersion", "3.10.2");
      if (authedUser) {
        sessionStorage.setItem(
          "sobaUser_session",
          JSON.stringify({ userId: "admin-1", username: "demo29605", role: "admin", ts: Date.now() }),
        );
      } else {
        sessionStorage.removeItem("sobaUser_session");
        localStorage.removeItem("sobaUser_remember");
      }
    },
    { db: seedDb, authedUser: authed },
  );
}

async function shot(page, file, url, options = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: true, ...options });
}

async function main() {
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

  await prepare(page, false);
  await shot(page, "00_login.png", `${BASE}/`);

  await page.getByRole("button", { name: /kayıt ol/i }).click();
  await shot(page, "01_register.png", `${BASE}/`);

  await prepare(page, true);
  await shot(page, "02_dashboard.png", `${BASE}/dashboard`);
  await shot(page, "03_sales.png", `${BASE}/sales`);
  await shot(page, "04_products.png", `${BASE}/products`);
  await shot(page, "05_kasa.png", `${BASE}/kasa`);
  await shot(page, "06_cari.png", `${BASE}/cari`);
  await shot(page, "07_fatura.png", `${BASE}/fatura`);
  await shot(page, "08_bank.png", `${BASE}/bank`);
  await shot(page, "09_settings.png", `${BASE}/settings`);

  const meta = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    images: [
      "00_login.png",
      "01_register.png",
      "02_dashboard.png",
      "03_sales.png",
      "04_products.png",
      "05_kasa.png",
      "06_cari.png",
      "07_fatura.png",
      "08_bank.png",
      "09_settings.png",
    ].map((file) => path.join(OUT_DIR, file)),
  };
  fs.writeFileSync(path.join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});