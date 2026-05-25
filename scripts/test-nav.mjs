import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => console.log("[" + msg.type() + "]", msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));
page.on("response", (resp) => {
  if (resp.status() >= 400) console.log("HTTP ERROR:", resp.status(), resp.url().substring(0, 120));
});

// Navigate and inject user data to skip login
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 15000 });

// Wait for React to inject, then set auth data
await page.waitForTimeout(1000);
await page.evaluate(() => {
  // Set a fake auth session so we skip login
  const fakeSession = {
    username: "solhan2",
    role: "user",
    loginTime: Date.now(),
    expiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem("sobaYonetim_userSession", JSON.stringify(fakeSession));
  localStorage.setItem("sobaYonetim", '{"users":[{"username":"solhan2","password":"test123","role":"user","active":true,"createdAt":"2026-01-01"}],"settings":{},"products":[],"sales":[],"suppliers":[],"cariler":[],"kasa":[],"butce":[],"bank":[],"stok":[],"notes":[],"partners":[],"installments":[],"ortakEmanetler":[],"productCategories":[],"auditLog":[],"pelletSettings":{"gramaj":14,"kgFiyat":6.5,"cuvalKg":15,"critDays":3}}');
});

// Reload to pick up localStorage
await page.reload({ waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);

console.log("1. URL after reload:", page.url());
const bodyText = await page.locator("body").innerText().catch(() => "");
console.log("2. Body (first 200):", bodyText.substring(0, 200));

// Check if we're logged in
const hasSidebar = await page.locator("aside, nav").first().isVisible().catch(() => false);
const hasLogin = await page.locator("input[type='password']").first().isVisible().catch(() => false);
console.log("3. Sidebar visible:", hasSidebar, "Login visible:", hasLogin);

if (hasSidebar) {
  // Click on Settings
  const settingsBtn = page.locator("text=Ayarlar").first();
  console.log("4. Settings btn visible:", await settingsBtn.isVisible().catch(() => false));
  
  if (await settingsBtn.isVisible().catch(() => false)) {
    await settingsBtn.click();
    await page.waitForTimeout(4000);
    console.log("5. URL after click:", page.url());
    
    // Check what's visible in the main content area
    const mainContent = await page.locator("main").innerText().catch(() => "");
    console.log("6. Main content (first 300):", mainContent.substring(0, 300));
    
    // Check for PageFallback skeleton
    const hasSkeleton = await page.locator(".skeleton, .app-page-fallback").first().isVisible().catch(() => false);
    console.log("7. Skeleton/fallback visible:", hasSkeleton);
    
    // Check for error boundary
    const hasError = await page.locator("text=Bir Hata Olu").first().isVisible().catch(() => false);
    console.log("8. Error boundary:", hasError);
    
    // Take screenshot
    await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/settings-test.png", fullPage: true });
    console.log("9. Screenshot saved");
  }
}

await browser.close();
