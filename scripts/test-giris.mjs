import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => {
  const t = msg.type();
  if (t === "error" || t === "warning") console.log("[" + t + "]", msg.text().substring(0, 200));
});

await page.goto("http://localhost:3000", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2000));

// Inject session
await page.evaluate(() => {
  localStorage.setItem("sobaUser_remember", JSON.stringify({
    userId: "qcrcd9rdmp28bar8",
    username: "solhan",
    role: "admin",
    ts: Date.now()
  }));
});
console.log("Session injected");

// Reload
await page.reload({ waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 5000));

const sobaYonetim = await page.evaluate(() => {
  const data = localStorage.getItem("sobaYonetim");
  if (!data) return "NO_DB";
  const db = JSON.parse(data);
  return { 
    hasData: true,
    keys: Object.keys(db).filter((k) => Array.isArray(db[k])).join(", "),
    productCount: db.products?.length || 0,
    salesCount: db.sales?.length || 0,
    cariCount: db.cari?.length || 0,
    userCount: db.users?.length || 0
  };
});
console.log("DB:", JSON.stringify(sobaYonetim, null, 2));

const pageTitle = await page.title().catch(() => "N/A");
console.log("Title:", pageTitle);

const loginGorunuyor = await page.locator("input[type='password']").first().isVisible().catch(() => false);
console.log("Login visible:", loginGorunuyor);

if (loginGorunuyor) {
  console.log("Login page still showing - trying alternative approach...");
}

await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/test-giris.png" });

const bodyText = await page.locator("body").innerText().catch(() => "");
console.log("Body:", bodyText.substring(0, 300).replace(/\n/g, " | "));

await browser.close();
