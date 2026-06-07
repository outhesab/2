import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const routes = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'products', path: '/products' },
  { name: 'sales', path: '/sales' },
  { name: 'fatura', path: '/fatura' },
  { name: 'suppliers', path: '/suppliers' },
  { name: 'pelet', path: '/pelet' },
  { name: 'boruTed', path: '/boruTed' },
  { name: 'ortakEmanet', path: '/ortak-emanet' },
  { name: 'cari', path: '/cari' },
  { name: 'kasa', path: '/kasa' },
  { name: 'butce', path: '/butce' },
  { name: 'bank', path: '/bank' },
  { name: 'reports', path: '/reports' },
  { name: 'cizelge', path: '/cizelge' },
  { name: 'stock', path: '/stock' },
  { name: 'monitor', path: '/monitor' },
  { name: 'kontrol', path: '/kontrol' },
  { name: 'entegrasyon', path: '/entegrasyon' },
  { name: 'excelmerge', path: '/excelmerge' },
  { name: 'notlar', path: '/notlar' },
  { name: 'partners', path: '/partners' },
  { name: 'settings', path: '/settings' },
  { name: 'bughunter', path: '/bughunter' },
  { name: 'anomali', path: '/anomali' },
  { name: 'excelimport', path: '/excelimport' },
  { name: 'aiEylemLog', path: '/ai/eylem-log' },
  { name: 'specdashboard', path: '/spec' },
  { name: 'dashboard-finans', path: '/dashboard-finans' },
  { name: 'dashboard-ticaret', path: '/dashboard-ticaret' },
  { name: 'dashboard-operasyon', path: '/dashboard-operasyon' },
  { name: 'dashboard-strateji', path: '/dashboard-strateji' },
];

const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Login first if needed
  await page.goto('http://127.0.0.1:3000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check if login screen is present
  const loginVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
  if (loginVisible) {
    console.log('Login screen detected, attempting to login...');
    // Try default credentials or guest mode
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  for (const route of routes) {
    try {
      console.log(`Capturing ${route.name} at ${route.path}...`);
      await page.goto(`http://127.0.0.1:3000${route.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for lazy loading and animations
      
      // Take full page screenshot
      await page.screenshot({ 
        path: path.join(screenshotsDir, `${route.name}.png`), 
        fullPage: true 
      });
      console.log(`  ✓ Saved ${route.name}.png`);
    } catch (error) {
      console.error(`  ✗ Failed ${route.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('\nAll screenshots saved to ./screenshots/');
}

takeScreenshots().catch(console.error);