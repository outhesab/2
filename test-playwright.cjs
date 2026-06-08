const { chromium } = require('playwright');
const path = require('path');
const dir = 'C:/Users/PARS PELET/Desktop/2/repo_2';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 400, height: 800 } });
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Giris Yap linkine tikla
  await page.locator('text=Giriş Yap').first().click({ timeout: 5000 });
  await page.waitForTimeout(1500);

  // Kullanici adi ve sifre gir
  const textInput = page.locator('input[type=text], input:not([type])').first();
  const passInput = page.locator('input[type=password]').first();
  await textInput.fill('solhan');
  await passInput.fill('1111');
  await page.screenshot({ path: path.join(dir, 'pw-01-login.png') });
  
  // Giris Yap butonuna bas
  await page.locator('button:has-text("Giriş Yap")').first().click({ timeout: 5000 });
  await page.waitForTimeout(4000);
  console.log('Login URL:', page.url());
  await page.screenshot({ path: path.join(dir, 'pw-02-dashboard.png') });

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('Dashboard:', bodyText.substring(0, 200));

  // Settings
  await page.goto('http://localhost:3000/settings', { timeout: 15000, waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Settings URL:', page.url());
  await page.screenshot({ path: path.join(dir, 'pw-03-settings.png') });

  // Tum sayfalari test et
  const pages = ['products', 'sales', 'kasa', 'cari', 'reports', 'stock', 'fatura'];
  for (const p of pages) {
    await page.goto('http://localhost:3000/' + p, { timeout: 10000, waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(dir, 'pw-' + p + '.png') });
    console.log(p + ': OK');
  }

  console.log('\nHatalar:', errors.length);
  errors.forEach(e => console.log(' ', e.substring(0, 200)));

  await browser.close();
})();
