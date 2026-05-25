import { chromium } from "playwright";
import fs from "fs";

const LOG_FILE = "console-logs.txt";
const URL = "http://localhost:3000";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
const ts = () => new Date().toLocaleTimeString("tr-TR");

page.on("console", (msg) => {
  const text = `[${ts()}] [${msg.type().toUpperCase()}] ${msg.text()}`;
  console.log(text);
  stream.write(text + "\n");
});

page.on("pageerror", (err) => {
  const text = `[${ts()}] [PAGE_ERROR] ${err.message}\n${err.stack}`;
  console.error(text);
  stream.write(text + "\n");
});

page.on("requestfailed", (req) => {
  const text = `[${ts()}] [REQUEST_FAILED] ${req.url()} ${req.failure()?.errorText}`;
  console.warn(text);
  stream.write(text + "\n");
});

stream.write(`\n===== MONITOR STARTED ${new Date().toISOString()} =====\n`);

await page.goto(URL, { waitUntil: "networkidle" });
console.log(`\n✅ Sayfa yüklendi: ${URL}\n`);
stream.write(`✅ Sayfa yüklendi: ${URL}\n`);

// 60 saniye bekle, logları topla
await new Promise((r) => setTimeout(r, 60000));

stream.write(`===== MONITOR ENDED ${new Date().toISOString()} =====\n\n`);
stream.end();
await browser.close();
console.log("\n✅ Monitor tamamlandı. Loglar console-logs.txt dosyasına kaydedildi.");
