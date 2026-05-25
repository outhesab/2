import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => console.log("[" + msg.type() + "]", msg.text()));
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message));

// Capture failed requests
page.on("requestfailed", (req) => {
  console.log("REQ_FAILED:", req.url().substring(0, 100), req.failure()?.errorText);
});

await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });

// Wait for app to stabilize
await page.waitForTimeout(5000);

// Check for localStorage data
const hasUsers = await page.evaluate(() => {
  const raw = localStorage.getItem("sobaYonetim");
  return { hasData: !!raw, length: raw ? raw.length : 0 };
});
console.log("localStorage sobaYonetim:", hasUsers);

// Check if there's a Firebase connection indicator
const fbStatus = await page.locator(".login-fb-status, .login-fb-dot").first().textContent().catch(() => "n/a");
console.log("Firebase status:", fbStatus);

// Look at what's visible on the page
const bodyText = await page.locator("body").innerText().catch(() => "");
// Look for key text
const hasSetupWizard = bodyText.includes("Kurulum") || bodyText.includes("setup");
const hasUsersSection = bodyText.includes("solhan");
console.log("Has setup wizard:", hasSetupWizard);
console.log("Has solhan:", hasUsersSection);
console.log("Body (first 300):", bodyText.substring(0, 300));

await browser.close();
