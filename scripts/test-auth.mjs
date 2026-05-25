import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => console.log("[" + msg.type() + "]", msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 45000 });
console.log("1. URL:", page.url());

// Login - wait a bit for form to render
await page.waitForTimeout(2000);

const usernameInput = page.locator("input[type='text'], input[placeholder*='kullan']").first();
const isVisible = await usernameInput.isVisible();
console.log("2. Login form visible:", isVisible);

if (isVisible) {
  await usernameInput.fill("solhan2");
  const passwordInput = page.locator("input[type='password']").first();
  if (await passwordInput.isVisible()) await passwordInput.fill("test123");
  
  const loginBtn = page.locator("button:has-text('Giri')").first();
  console.log("3. Login btn visible:", await loginBtn.isVisible());
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForTimeout(5000);
    console.log("4. URL after login:", page.url());
    
    // Check page content
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("5. Body text (first 500):", bodyText.substring(0, 500));
    
    // Check for sidebar
    const sidebar = page.locator("aside, nav, [class*='sidebar'], [class*='Sidebar']").first();
    console.log("6. Sidebar visible:", await sidebar.isVisible().catch(() => false));
    
    if (await sidebar.isVisible().catch(() => false)) {
      const sidebarText = await sidebar.innerText().catch(() => "");
      console.log("7. Sidebar text:", sidebarText.substring(0, 500));
    }
    
    // Check for error boundary
    console.log("8. Error boundary:", await page.locator("text=Bir Hata Olu").isVisible().catch(() => false));
  }
}

await browser.close();
