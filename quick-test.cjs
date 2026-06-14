// Playwright testini programatik olarak çalıştır
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:3000';
const results = { pages: [], errors: [], timestamp: new Date().toISOString() };

async function run() {
  console.log('🚀 PARSPEL CANLI TEST BAŞLADI');
  console.log(`📅 ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🌐 ${BASE_URL}`);
  
  // Önce dev server'ı kontrol et
  const http = require('http');
  try {
    await new Promise((resolve, reject) => {
      const req = http.get(`${BASE_URL}/`, (res) => {
        console.log(`✅ Server yanıt verdi: ${res.statusCode}`);
        resolve();
      });
      req.on('error', (e) => {
        console.log(`❌ Server yanıt vermiyor: ${e.message}`);
        reject(e);
      });
      req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    });
  } catch (e) {
    console.log('❌ Dev server çalışmıyor, önce başlatmalısın: pnpm run dev');
    process.exit(1);
  }

  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Users\\PARS\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe'
  });
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // Konsol hatalarını topla
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Sayfa hatalarını topla
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  try {
    // === 1. ANA SAYFA ===
    console.log('\n📌 1. ANA SAYFA');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`   Başlık: ${title}`);
    results.pages.push({ name: 'Ana Sayfa', url: '/', title, consoleErrors: consoleErrors.length, pageErrors: pageErrors.length });
    
    // Ekran görüntüsü
    await page.screenshot({ path: 'e2e-report/anasayfa.png', fullPage: true });
    console.log(`   📸 Ekran görüntüsü alındı`);
    
    // Ana sayfa içeriği
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
    console.log(`   İçerik: ${bodyText.substring(0, 200)}...`);
    
    // Sidebar kontrolü
    const sidebarText = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav?.innerText?.substring(0, 300) || 'SIDEBAR BULUNAMADI';
    });
    console.log(`   Sidebar: ${sidebarText.substring(0, 200)}...`);
    
    if (sidebarText.includes('BULUNAMADI')) {
      results.errors.push('Sidebar navigation bulunamadı');
    }
    
    // Hızlı erişim butonları
    const quickAccess = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns).slice(0, 20).map(b => b.textContent?.trim()).filter(Boolean);
    });
    console.log(`   Butonlar (ilk 20): ${quickAccess.join(', ')}`);

    // === 2. TÜM MODÜLLERİ GEZ ===
    console.log('\n📌 2. MODÜL GEZİNTİSİ');
    
    const modules = [
      '/dashboard', '/products', '/sales', '/fatura', 
      '/suppliers', '/stock', '/cari', '/kasa', '/bank',
      '/reports', '/monitor', '/kontrol', '/bughunter', '/anomali',
      '/settings', '/notlar'
    ];
    
    for (const route of modules) {
      try {
        console.log(`   ➡️ ${route}...`);
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1500);
        
        const pageTitle = await page.title();
        const heading = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1?.textContent?.trim() || 'HEADING YOK';
        });
        
        results.pages.push({
          name: route,
          url: route,
          title: pageTitle,
          heading,
          consoleErrors: consoleErrors.length,
          pageErrors: pageErrors.length,
        });
        
        console.log(`      ✅ ${heading.substring(0, 60)}`);
        
        // Her modül için screenshot
        await page.screenshot({ path: `e2e-report/${route.replace(/\//g, '_')}.png`, fullPage: true });
        
      } catch (e) {
        console.log(`      ❌ HATA: ${e.message?.substring(0, 100)}`);
        results.errors.push(`${route}: ${e.message?.substring(0, 100)}`);
      }
    }

    // === 3. DB KONTROLÜ ===
    console.log('\n📌 3. VERİ TABANI KONTROLÜ');
    const db = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('sobaYonetim');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    });
    
    if (db) {
      const dbInfo = {
        products: db.products?.length || 0,
        sales: db.sales?.length || 0,
        kasa: db.kasa?.length || 0,
        cari: db.cari?.length || 0,
        suppliers: db.suppliers?.length || 0,
        invoices: db.invoices?.length || 0,
        returns: db.returns?.length || 0,
        stockMovements: db.stockMovements?.length || 0,
      };
      console.log(`   DB İstatistikleri: ${JSON.stringify(dbInfo)}`);
      results.dbStats = dbInfo;
      
      // Tutarlılık kontrolü
      const integrityIssues = [];
      if (!Array.isArray(db.products)) integrityIssues.push('products array değil');
      if (!Array.isArray(db.sales)) integrityIssues.push('sales array değil');
      if (!Array.isArray(db.kasa)) integrityIssues.push('kasa array değil');
      if (!Array.isArray(db.cari)) integrityIssues.push('cari array değil');
      if (typeof db._version !== 'number') integrityIssues.push('_version eksik');
      
      if (integrityIssues.length > 0) {
        console.log(`   ⚠️ Bütünlük sorunları: ${integrityIssues.join(', ')}`);
        results.errors.push(...integrityIssues);
      } else {
        console.log('   ✅ DB bütünlüğü tamam');
      }
    } else {
      console.log('   ⚠️ DB bulunamadı (seed data yok)');
    }
    
    // === 4. KONSOL HATALARI ===
    console.log('\n📌 4. KONSOL HATALARI');
    if (consoleErrors.length > 0) {
      console.log(`   ⚠️ Toplam ${consoleErrors.length} konsol hatası:`);
      const uniqueErrors = [...new Set(consoleErrors)];
      uniqueErrors.slice(0, 15).forEach((err, i) => {
        console.log(`   ${i+1}. ${err.substring(0, 200)}`);
      });
      results.consoleErrors = uniqueErrors;
    } else {
      console.log('   ✅ Konsol hatası yok');
    }
    
    if (pageErrors.length > 0) {
      console.log(`   ⚠️ Toplam ${pageErrors.length} sayfa hatası:`);
      pageErrors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i+1}. ${err.substring(0, 200)}`);
      });
      results.pageErrors = pageErrors;
    }
    
    // === 5. PERFORMANS METRİKLERİ ===
    console.log('\n📌 5. PERFORMANS METRİKLERİ');
    const perfData = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      if (!perf) return {};
      return {
        domContentLoaded: perf.domContentLoadedEventEnd?.toFixed(0),
        loadComplete: perf.loadEventEnd?.toFixed(0),
        domInteractive: perf.domInteractive?.toFixed(0),
        domComplete: perf.domComplete?.toFixed(0),
        responseEnd: perf.responseEnd?.toFixed(0),
        type: perf.type,
      };
    });
    console.log(`   Performans: ${JSON.stringify(perfData)}`);
    results.performance = perfData;
    
    // Başarısız kaynaklar
    const failedResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((r) => /** @type {PerformanceResourceTiming} */ (r).responseEnd === 0)
        .map((r) => r.name);
    });
    if (failedResources.length > 0) {
      console.log(`   ⚠️ ${failedResources.length} başarısız kaynak:`);
      failedResources.slice(0, 10).forEach(r => console.log(`      ${r.substring(0, 120)}`));
      results.failedResources = failedResources;
    }
    
  } catch (err) {
    console.log(`❌ KRİTİK HATA: ${err.message}`);
    results.criticalError = err.message;
  } finally {
    await browser.close();
  }
  
  // === RAPOR ===
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RAPORU');
  console.log('='.repeat(60));
  console.log(`Gezilen sayfalar: ${results.pages.length}`);
  console.log(`Başarılı: ${results.pages.filter(p => !p.heading?.includes('HEADING YOK')).length}`);
  console.log(`Hatalı sayfalar: ${results.pages.filter(p => p.heading?.includes('HEADING YOK')).length}`);
  console.log(`Konsol hataları: ${results.consoleErrors?.length || 0}`);
  console.log(`Sayfa hataları: ${results.pageErrors?.length || 0}`);
  console.log(`Toplam sorun: ${results.errors.length}`);
  
  // Dosyaya yaz
  fs.mkdirSync('e2e-report', { recursive: true });
  fs.writeFileSync('e2e-report/test-results.json', JSON.stringify(results, null, 2));
  console.log(`\n📄 Rapor: e2e-report/test-results.json`);
  console.log('✅ TEST TAMAMLANDI');
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
