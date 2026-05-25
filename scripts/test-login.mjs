import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

let consoleErrors = [];
let pageErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(err.message));

await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 45000 });
console.log("Initial URL:", page.url());
await page.waitForTimeout(3000);

const loginForm = await page
  .locator(".login-card, .login-form, input[type='password']")
  .first()
  .isVisible();
console.log("Login visible:", loginForm);

const passwords = ["1234", "test123", "123456", "admin123", "parspel", "12345"];
for (const pw of passwords) {
  await page
    .locator("input[type='text'], input[placeholder*='kullan']")
    .first()
    .fill("solhan2");
  await page.locator("input[type='password']").first().fill(pw);
  await page.locator("button:has-text('Giri')").first().click();
  await page.waitForTimeout(1000);
  const url = page.url();
  const errMsg = await page
    .locator(".login-error-msg, [class*='error']")
    .first()
    .isVisible()
    .catch(() => false);
  console.log("pw:", pw, "url:", url, "error:", errMsg);
}

console.log("Final URL:", page.url());
console.log("Console errors:", consoleErrors);
console.log("Page errors:", pageErrors);

await browser.close();
