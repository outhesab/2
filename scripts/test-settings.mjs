import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => console.log("[" + msg.type() + "]", msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 45000 });
console.log("--- PAGE URL:", page.url(), "---");

// Try to login
const usernameInput = page.locator("input[type='text'], input[placeholder*='kullan']").first();
const passwordInput = page.locator("input[type='password']").first();

if (await usernameInput.isVisible()) {
  console.log("Login form found, trying to login...");
  await usernameInput.fill("solhan2");
  if (await passwordInput.isVisible()) await passwordInput.fill("test123");
  const loginBtn = page.locator("button:has-text('Giri'), button:has-text('Login')").first();
  if (await loginBtn.isVisible()) {
    console.log("Clicking login button...");
    await loginBtn.click();
    await page.waitForTimeout(3000);
  }
}

console.log("--- AFTER LOGIN URL:", page.url(), "---");

// Navigate to settings
console.log("--- NAVIGATING TO /settings ---");
try {
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle", timeout: 15000 });
} catch (e) {
  console.log("NAVIGATION ERROR:", e.message);
}
console.log("--- SETTINGS URL:", page.url(), "---");

const content = await page.content();
console.log("--- PAGE HTML (first 1000) ---");
console.log(content.substring(0, 1000));

await page.waitForTimeout(3000);
console.log("--- FINAL URL:", page.url(), "---");

await browser.close();
