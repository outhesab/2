/**
 * PARSPEL KAPSAMLI CANLI TEST
 * ==========================
 * 1. Authentication seed
 * 2. Tüm modüller gezintisi + screenshot
 * 3. CRUD işlemleri
 * 4. Konsol/sayfa hataları
 * 5. Performans metrikleri
 * 6. Responsive test
 * 7. BugHunter/Monitor/Anomali
 * 8. DB bütünlüğü
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SEED_DB = {
  _version: 0,
  products: [
    { id: 'urun-1', name: 'Deneme Sobasi', category: 'soba', cost: 1200, price: 1800, stock: 8, minStock: 2, createdAt: '2026-05-06T09:00:00.000Z', updatedAt: '2026-05-06T09:00:00.000Z' },
    { id: 'urun-2', name: 'Boru Seti', category: 'boru', cost: 300, price: 500, stock: 12, minStock: 3, createdAt: '2026-05-06T09:00:00.000Z', updatedAt: '2026-05-06T09:00:00.000Z' },
  ],
  suppliers: [
    { id: 'sup-1', name: 'Test Tedarikci', category: 'Genel', phone: '05000000000', totalOrders: 0, totalAmount: 0, createdAt: '2026-05-06T09:00:00.000Z', updatedAt: '2026-05-06T09:00:00.000Z' },
  ],
  orders: [],
  cari: [
    { id: 'cari-1', name: 'Test Musterisi', type: 'musteri', balance: 0, phone: '05550000000', createdAt: '2026-05-06T09:00:00.000Z', updatedAt: '2026-05-06T09:00:00.000Z' },
  ],
  sales: [],
  kasa: [],
  stockMovements: [],
  bankTransactions: [],
  matchRules: [],
  monitorRules: [],
  monitorLog: [],
  peletSuppliers: [],
  peletOrders: [],
  boruSuppliers: [],
  boruOrders: [],
  invoices: [],
  budgets: [],
  returns: [],
  _activityLog: [],
  company: { id: 'company-1', createdAt: '2026-05-06T09:00:00.000Z' },
  settings: {},
  pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
  ortakEmanetler: [],
  installments: [],
  partners: [],
  productCategories: [
    { id: 'soba', name: 'Soba', icon: '🔥', createdAt: '2026-05-06T09:00:00.000Z' },
    { id: 'aksesuar', name: 'Aksesuar', icon: '🔧', createdAt: '2026-05-06T09:00:00.000Z' },
    { id: 'yedek', name: 'Yedek Parca', icon: '⚙️', createdAt: '2026-05-06T09:00:00.000Z' },
    { id: 'boru', name: 'Boru', icon: '🔩', createdAt: '2026-05-06T09:00:00.000Z' },
    { id: 'pelet', name: 'Pelet', icon: '🪵', createdAt: '2026-05-06T09:00:00.000Z' },
  ],
  notes: [],
  _auditLog: [],
  kasalar: [
    { id: 'nakit', name: 'Nakit', icon: '💵' },
    { id: 'banka', name: 'Banka', icon: '🏦' },
    { id: 'pos_ziraat', name: 'POS Ziraat', icon: '🏧' },
    { id: 'pos_is', name: 'POS Is', icon: '🏧' },
    { id: 'pos_yk', name: 'POS YapiKredi', icon: '🏧' },
  ],
};

const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = 'e2e-report';

const report = {
  timestamp: new Date().toISOString(),
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  modules: [],
  errors: [],
  consoleErrors: [],
  pageErrors: [],
  performance: {},
  dbStats: null,
  issues: []
};

function log(msg, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : '📌';
  console.log(`${prefix} ${msg}`);
}

async function loadSeed(page) {
  await page.addInitScript((seed) => {
    window.localStorage.setItem('sobaYonetim_setupDone', '1');
    window.localStorage.setItem('sobaYonetim_setupApplied', '1');
    window.localStorage.setItem('sobaYonetim', JSON.stringify(seed));
    window.sessionStorage.setItem('sobaUser_session', JSON.stringify({
      userId: 'admin-1', username: 'admin', role: 'admin', ts: Date.now()
    }));
  }, SEED_DB);
}

async function testModule(page, route, name) {
  log(`${name} (${route})...`, 'info');
  const startTime = Date.now();
  
  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const loadTime = Date.now() - startTime;
    const title = await page.title();
    const headings = await page.evaluate(() => 
      Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 5).map(h => h.textContent?.trim())
    );
    const hasError = await page.locator('[class*="error"], [class*="Error"]').count();
    const isLoaded = await page.evaluate(() => document.readyState === 'complete');
    
    // Screenshot
    const safeName = route.replace(/[\/\?&]/g, '_') || 'index';
    await page.screenshot({ path: `${OUT_DIR}/mod_${safeName}.png`, fullPage: true });
    
    const result = {
      route, name, loadTime,
      title, headings, isLoaded, hasError,
      timestamp: new Date().toISOString(),
    };
    
    report.modules.push(result);
    report.summary.total++;
    
    if (hasError > 0) {
      report.summary.warnings++;
      log(`${name}: ${loadTime}ms (⚠️ ${hasError} error indicator)`, 'warn');
    } else {
      report.summary.passed++;
      log(`${name}: ${loadTime}ms ✅`, 'success');
    }
    
    return result;
  } catch (e) {
    const loadTime = Date.now() - startTime;
    log(`${name}: ${loadTime}ms ❌ ${e.message?.substring(0, 100)}`, 'error');
    
    const result = { route, name, loadTime, error: e.message?.substring(0, 200) };
    report.modules.push(result);
    report.summary.total++;
    report.summary.failed++;
    report.errors.push({ route, name, error: e.message?.substring(0, 200) });
    
    try {
      await page.screenshot({ path: `${OUT_DIR}/mod_${route.replace(/[\/\?&]/g, '_')}_error.png`, fullPage: true });
    } catch {}
    
    return result;
  }
}

async function run() {
  console.log('\n' + '='.repeat(70));
  console.log('🔥 PARSPEL KAPSAMLI CANLI TEST SÜRÜM 1.0');
  console.log('='.repeat(70));
  console.log(`📅 ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🌐 ${BASE_URL}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Konsol dinleyici
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => report.pageErrors.push(err.message));

  try {
    // === PHASE 1: AUTH + ANA SAYFA ===
    log('FAZ 1: Authentication & Ana Sayfa', 'info');
    await loadSeed(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const title = await page.title();
    log(`Başlık: ${title}`, 'success');
    
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || 'YOK');
    log(`Ana sayfa içeriği: ${bodyText.substring(0, 200)}...`);

    // Sidebar kontrolü
    const hasSidebar = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const sidebarText = nav?.innerText || '';
      return {
        found: !!nav,
        hasModules: sidebarText.includes('Ürünler') || sidebarText.includes('Satış'),
        length: sidebarText.length,
        text: sidebarText.substring(0, 500)
      };
    });
    
    if (hasSidebar.found) {
      log(`Sidebar bulundu (${hasSidebar.length} karakter)`, 'success');
      if (!hasSidebar.hasModules) {
        log('Sidebar modül butonları görünmüyor!', 'warn');
        report.issues.push('Sidebar modül butonları görünmüyor');
      }
    } else {
      log('Sidebar BULUNAMADI!', 'error');
      report.issues.push('Sidebar navigation elementi yok');
    }

    await page.screenshot({ path: `${OUT_DIR}/01-anasayfa.png`, fullPage: true });

    // === PHASE 2: TÜM MODÜLLER ===
    log('\nFAZ 2: Tüm Modüller Gezintisi', 'info');
    
    const modules = [
      { route: '/dashboard', name: 'Özet' },
      { route: '/products', name: 'Ürünler' },
      { route: '/sales', name: 'Satış' },
      { route: '/fatura', name: 'Fatura' },
      { route: '/suppliers', name: 'Tedarikçi' },
      { route: '/pelet', name: 'Pelet' },
      { route: '/boruTed', name: 'Boruted' },
      { route: '/ortak-emanet', name: 'Ortak Emanet' },
      { route: '/cari', name: 'Cari' },
      { route: '/kasa', name: 'Kasa' },
      { route: '/butce', name: 'Bütçe' },
      { route: '/bank', name: 'Banka' },
      { route: '/reports', name: 'Raporlar' },
      { route: '/monitor', name: 'Monitör' },
      { route: '/kontrol', name: 'Kontrol' },
      { route: '/bughunter', name: 'BugHunter' },
      { route: '/anomali', name: 'Anomali' },
      { route: '/entegrasyon', name: 'Entegrasyon' },
      { route: '/excelmerge', name: 'ExcelMerge' },
      { route: '/excelimport', name: 'ExcelImport' },
      { route: '/notlar', name: 'Notlar' },
      { route: '/cizelge', name: 'Çizelge' },
      { route: '/stock', name: 'Stok' },
      { route: '/settings', name: 'Ayarlar' },
      { route: '/ai/eylem-log', name: 'AI Eylem Log' },
      { route: '/perf', name: 'Performans' },
    ];

    for (const mod of modules) {
      await testModule(page, mod.route, mod.name);
    }

    // === PHASE 3: CONSOLE ERROR ANALYSIS ===
    log('\nFAZ 3: Konsol Hata Analizi', 'info');
    
    report.consoleErrors = [...new Set(consoleErrors)];
    log(`Toplam ${report.consoleErrors.length} benzersiz konsol hatası`, report.consoleErrors.length > 0 ? 'warn' : 'success');
    
    report.consoleErrors.forEach((err, i) => {
      log(`  ${i+1}. ${err.substring(0, 200)}`, 'error');
    });

    if (report.pageErrors.length > 0) {
      log(`Toplam ${report.pageErrors.length} sayfa hatası`, 'error');
      report.pageErrors.forEach((err, i) => log(`  ${i+1}. ${err.substring(0, 200)}`, 'error'));
    }

    // === PHASE 4: DB VALIDATION ===
    log('\nFAZ 4: Veritabanı Bütünlük Kontrolü', 'info');
    
    const dbValidation = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('sobaYonetim');
        if (!raw) return { loaded: false, error: 'localStorage boş' };
        const db = JSON.parse(raw);
        const issues = [];
        if (!Array.isArray(db.products)) issues.push('products array değil');
        if (!Array.isArray(db.sales)) issues.push('sales array değil');
        if (!Array.isArray(db.kasa)) issues.push('kasa array değil');
        if (!Array.isArray(db.cari)) issues.push('cari array değil');
        if (!Array.isArray(db.suppliers)) issues.push('suppliers array değil');
        if (typeof db._version !== 'number') issues.push('_version tipi sayı değil');
        
        return {
          loaded: true,
          version: db._version,
          stats: {
            products: db.products?.length || 0,
            sales: db.sales?.length || 0,
            kasa: db.kasa?.length || 0,
            cari: db.cari?.length || 0,
            suppliers: db.suppliers?.length || 0,
            invoices: db.invoices?.length || 0,
            returns: db.returns?.length || 0,
            stockMovements: db.stockMovements?.length || 0,
            monitorLog: db.monitorLog?.length || 0,
            _auditLog: db._auditLog?.length || 0,
            _activityLog: db._activityLog?.length || 0,
          },
          issues
        };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });

    report.dbStats = dbValidation;
    
    if (dbValidation.loaded) {
      log(`DB yüklendi (v${dbValidation.version})`, 'success');
      log(`İstatistikler: ${JSON.stringify(dbValidation.stats)}`);
      
      if (dbValidation.issues.length > 0) {
        dbValidation.issues.forEach(i => log(`Bütünlük sorunu: ${i}`, 'error'));
        report.issues.push(...dbValidation.issues.map(i => `DB: ${i}`));
      } else {
        log('✅ DB bütünlüğü tamam', 'success');
      }
    } else {
      log(`DB yüklenemedi: ${dbValidation.error}`, 'error');
      report.issues.push(`DB yüklenemedi: ${dbValidation.error}`);
    }

    // === PHASE 5: PERFORMANCE ===
    log('\nFAZ 5: Performans Metrikleri', 'info');
    
    const perfMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (!nav) return {};
      
      // Kaynak bazında yükleme süreleri
      const resources = performance.getEntriesByType('resource')
        .map(function(r) { return {
          name: String(r.name).substring(0, 100),
          duration: Number(r.duration).toFixed(0),
          size: r.transferSize || 0,
          type: r.initiatorType
        };})
        .sort(function(a, b) { return (b.duration || 0) - (a.duration || 0); })
        .slice(0, 10);

      // Başarısız kaynaklar
      const failedResources = performance.getEntriesByType('resource')
        .filter(function(r) { return r.responseEnd === 0 && r.duration === 0; })
        .map(function(r) { return r.name; });

      return {
        navigation: {
          domContentLoaded: String(nav.domContentLoadedEventEnd),
          domComplete: String(nav.domComplete),
          domInteractive: String(nav.domInteractive),
          loadComplete: String(nav.loadEventEnd),
          responseEnd: String(nav.responseEnd),
          type: nav.type,
        },
        slowestResources: resources,
        failedResources
      };
    });

    report.performance = perfMetrics;
    
    log(`DOM Interactive: ${perfMetrics.navigation?.domInteractive || 'N/A'}ms`);
    log(`DOM Complete: ${perfMetrics.navigation?.domComplete || 'N/A'}ms`);
    log(`Load Complete: ${perfMetrics.navigation?.loadComplete || 'N/A'}ms`);
    
    if (perfMetrics.failedResources?.length > 0) {
      log(`${perfMetrics.failedResources.length} başarısız kaynak:`, 'warn');
      perfMetrics.failedResources.slice(0, 10).forEach(r => {
        log(`  ${r.substring(0, 120)}`, 'error');
      });
      report.issues.push(`${perfMetrics.failedResources.length} başarısız kaynak yüklemesi`);
    }
    
    if (perfMetrics.slowestResources?.length > 0) {
      log('En yavaş 5 kaynak:');
      perfMetrics.slowestResources.slice(0, 5).forEach(function(r) {
        log(`  ${r.duration}ms - ${r.name?.substring(0, 80)} (${r.type})`);
      });
    }

    // === PHASE 6: RESPONSIVE TEST ===
    log('\nFAZ 6: Responsive Test', 'info');
    
    const viewports = [
      { w: 375, h: 667, name: 'Mobil (iPhone SE)' },
      { w: 768, h: 1024, name: 'Tablet (iPad)' },
      { w: 1024, h: 768, name: 'Tablet Yatay' },
    ];
    
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const scrollH = await page.evaluate(() => document.body.scrollHeight);
      const vpContent = await page.evaluate(() => document.body?.innerText?.substring(0, 300) || '');
      
      log(`${vp.name} (${vp.w}x${vp.h}): scroll=${scrollH}px, içerik=${vpContent.substring(0, 80)}...`);
      await page.screenshot({ path: `${OUT_DIR}/responsive_${vp.w}x${vp.h}.png`, fullPage: true });
    }

    // === PHASE 7: BUGHUNTER ANALİZ ===
    log('\nFAZ 7: BugHunter & Hata Tespit Sayfaları', 'info');
    
    // BugHunter sayfasında butonlar
    const bugHunterModules = ['/bughunter', '/monitor', '/anomali', '/kontrol'];
    
    for (const route of bugHunterModules) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const buttons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button'))
            .map(b => b.textContent?.trim())
            .filter(Boolean)
            .slice(0, 15);
        });
        
        const heading = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1?.textContent?.trim() || document.querySelector('h2')?.textContent?.trim() || 'HEADING YOK';
        });
        
        log(`${route}: Başlık="${heading}", Butonlar=${buttons.length}`);
        
        // Varsa "Tara" veya "Analiz" butonuna tıkla
        const analyzeBtn = buttons.find(b => /tara|analiz|kontrol|düzelt|temizle|rapor/i.test(b || ''));
        if (analyzeBtn) {
          log(`  "Analiz" butonu bulundu: "${analyzeBtn}"`);
          report.issues.push(`${route}: Analiz butonu mevcut: "${analyzeBtn}"`);
        }
      } catch (e) {
        log(`${route}: ❌ ${e.message?.substring(0, 100)}`, 'error');
      }
    }

    // === FINAL REPORT ===
    log('\n' + '='.repeat(70), 'info');
    log('📊 NİHAİ RAPOR', 'info');
    log('='.repeat(70), 'info');
    
    const s = report.summary;
    const passRate = s.total > 0 ? (s.passed / s.total * 100).toFixed(1) : 0;
    
    log(`📈 Toplam Test: ${s.total}`);
    log(`✅ Geçen: ${s.passed}`);
    log(`⚠️ Uyarı: ${s.warnings}`);
    log(`❌ Başarısız: ${s.failed}`);
    log(`📊 Başarı Oranı: %${passRate}`);
    log(`🔴 Konsol Hataları: ${report.consoleErrors.length}`);
    log(`🔴 Sayfa Hataları: ${report.pageErrors.length}`);
    log(`⚠️ Tespit Edilen Sorunlar: ${report.issues.length}`);
    
    // Hızlı geçen/kalan modüller
    const failedMods = report.modules.filter(m => m.error);
    const slowMods = report.modules
      .filter(m => m.loadTime > 5000)
      .sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0));
    
    if (failedMods.length > 0) {
      log(`\n❌ Başarısız Modüller:`);
      failedMods.forEach(m => log(`  ${m.route}: ${m.error?.substring(0, 100)}`));
    }
    
    if (slowMods.length > 0) {
      log(`\n🐌 Yavaş Modüller (>5s):`);
      slowMods.forEach(m => log(`  ${m.route}: ${m.loadTime}ms`));
    }

  } catch (err) {
    log(`\n🔴 KRİTİK HATA: ${err.message}`, 'error');
    report.criticalError = err.message;
  } finally {
    await browser.close();
  }

  // JSON raporu yaz
  fs.writeFileSync(`${OUT_DIR}/comprehensive-results.json`, JSON.stringify(report, null, 2));
  log(`\n📄 Detaylı JSON rapor: ${OUT_DIR}/comprehensive-results.json`);
  log('✅ TEST TAMAMLANDI\n');
}

run().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
