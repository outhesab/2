import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => console.log("[" + msg.type() + "]", msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 45000 });
console.log("--- PAGE URL:", page.url(), "---");

// Login
const usernameInput = page.locator("input[type='text'], input[placeholder*='kullan']").first();
if (await usernameInput.isVisible()) {
  console.log("Login form found");
  await usernameInput.fill("solhan2");
  const passwordInput = page.locator("input[type='password']").first();
  if (await passwordInput.isVisible()) await passwordInput.fill("test123");
  const loginBtn = page.locator("button:has-text('Giri')").first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
    console.log("Login clicked");
    await page.waitForTimeout(3000);
  }
}

console.log("--- AFTER LOGIN URL:", page.url(), "---");

// Click the settings nav button 
const settingsBtn = page.locator("text= Ayarlar").first();
console.log("Settings button visible:", await settingsBtn.isVisible());
if (await settingsBtn.isVisible()) {
  await settingsBtn.click();
  await page.waitForTimeout(3000);
  console.log("--- AFTER CLICK URL:", page.url(), "---");
  
  // Check for error boundary
  const errorVisible = await page.locator("text=Bir Hata Olu tu").isVisible().catch(() => false);
  console.log("Error boundary visible:", errorVisible);
  
  if (errorVisible) {
    const errorMsg = await page.locator("div[style*='color: #ef4444']").textContent().catch(() => "n/a");
    console.log("Error message:", errorMsg);
  }
  
  // Check for settings content
  const settingsContent = await page.locator("text=SAyarlar").first().isVisible().catch(() => false);
  console.log("Settings content visible:", settingsContent);
}

await page.waitForTimeout(2000);
await browser.close();
