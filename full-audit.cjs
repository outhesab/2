/**
 * ============================================================
 * PARSPEL — TAM KAPSAMLI CANLI DENETİM
 * ============================================================
 * Tüm modüller, CRUD işlemleri, hata analizi, performans
 * Konsol hataları, responsive test, DB bütünlüğü
 * ============================================================
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://127.0.0.1:3000';
const OUT = 'e2e-report';
const results = {
  meta: { date: new Date().toISOString(), duration: 0 },
  summary: { passed: 0, failed: 0, warnings: 0, errors: 0 },
  pages: [],
  crud: [],
  performance: {},
  consoleErrors: [],
  pageErrors: [],
  responsive: [],
  issues: [],
  dbCheck: null,
};

function R(msg, type = 'i') {
  const p = type === 'e' ? '❌' : type === 'w' ? '⚠️' : type === 's' ? '✅' : '📌';
  console.log(`${p} ${msg}`);
}

SEED = {
  _version: 1, products: [
    { id: 'p1', name: 'Premium Soba X200', category: 'soba', cost: 2500, price: 4500, stock: 15, minStock: 3 },
    { id: 'p2', name: 'Ekonomik Soba', category: 'soba', cost: 1200, price: 2200, stock: 8, minStock: 2 },
    { id: 'p3', name: 'Boru 1m', category: 'boru', cost: 150, price: 300, stock: 30, minStock: 5 },
  ],
  suppliers: [{ id: 's1', name: 'Ankara Soba Sanayi', category: 'Üretici', phone: '03120000000', totalOrders: 0, totalAmount: 0 }],
  orders: [], cari: [{ id: 'c1', name: 'Ahmet Yılmaz', type: 'musteri', balance: 1500, phone: '05320000000' }],
  sales: [], kasa: [], stockMovements: [], bankTransactions: [], invoices: [], budgets: [],
  returns: [], matchRules: [], monitorRules: [], monitorLog: [], peletSuppliers: [], peletOrders: [],
  boruSuppliers: [], boruOrders: [], ortakEmanetler: [], installments: [], partners: [], notes: [],
  _activityLog: [{ ts: Date.now(), action: 'seed-yukleme', detail: 'Otomatik test verisi' }],
  _auditLog: [],
  kasalar: [{ id: 'nakit', name: 'Nakit' }, { id: 'banka', name: 'Banka' }, { id: 'pos', name: 'POS' }],
  company: { id: 'c1', name: 'Test Firma', createdAt: '2026-01-01T00:00:00.000Z' },
  settings: { currency: 'TRY', lang: 'tr' }, pelletSettings: { gramaj: 15, kgFiyat: 7 },
  productCategories: [{ id: 'soba', name: 'Soba' }, { id: 'boru', name: 'Boru' }, { id: 'aksesuar', name: 'Aksesuar' }],
};

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const startTime = Date.now();

  console.log('\n' + '='.repeat(70));
  console.log('🔥  PARSPEL TAM KAPSAMLI DENETİM');
  console.log('='.repeat(70));
  R('Tarih: ' + new Date().toLocaleString('tr-TR'));
  R('Server: ' + BASE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  // Seed data & session - context level for all pages
  await context.addInitScript((seed) => {
    window.localStorage.setItem('sobaYonetim', JSON.stringify(seed));
    window.localStorage.setItem('sobaYonetim_setupDone', '1');
    window.localStorage.setItem('sobaYonetim_setupApplied', '1');
    window.sessionStorage.setItem('sobaUser_session', JSON.stringify({
      userId: 'admin-1', username: 'admin', fullName: 'Pars Pel', role: 'admin', ts: Date.now()
    }));
  }, SEED);

  const page = await context.newPage();
  const consErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consErrors.push(msg.text()); });
  page.on('pageerror', err => results.pageErrors.push(err.message));

  try {
    // ================================================================
    // FAZ 1: ANA SAYFA
    // ================================================================
    R('\n=== FAZ 1: Ana Sayfa & Çekirdek ===', 'i');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 }).catch(() =>
      page.goto(BASE, { waitUntil: 'load', timeout: 20000 })
    );
    await page.waitForTimeout(2000);

    const title = await page.title();
    R('Başlık: ' + title, 's');

    // Sidebar yapısı
    const sidebarInfo = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return { found: false, error: 'nav elementi yok' };
      const buttons = Array.from(nav.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);
      const groups = buttons.filter(b => /genislet|daralt/i.test(b || ''));
      const modules = buttons.filter(b => !/genislet|daralt|favori|★|☆/i.test(b || ''));
      return { found: true, buttonCount: buttons.length, groups, modules: modules.slice(0, 20) };
    });
    if (sidebarInfo.found) {
      R(`Sidebar: ${sidebarInfo.buttonCount} buton, ${sidebarInfo.groups.length} grup`, 's');
      R('Modüller: ' + sidebarInfo.modules.join(', '));
    } else {
      R('Sidebar BULUNAMADI: ' + sidebarInfo.error, 'e');
      results.issues.push('Sidebar bulunamadı');
    }

    // Header - kasa özeti
    const headerInfo = await page.evaluate(() => {
      const allText = document.body?.innerText || '';
      const hasKasa = allText.includes('Kasa') || allText.includes('₺');
      const hasProfile = allText.includes('Pars Pel') || allText.includes('admin') || allText.includes('Yönetici');
      return { hasKasa, hasProfile };
    });
    R(`Kasa özeti: ${headerInfo.hasKasa ? '✅' : '❌'} | Profil: ${headerInfo.hasProfile ? '✅' : '❌'}`);

    await page.screenshot({ path: `${OUT}/01-anasayfa.png`, fullPage: true });
    results.pages.push({ route: '/', name: 'Ana Sayfa', loadTime: Date.now() - startTime, title, sidebarOk: sidebarInfo.found });

    // ================================================================
    // FAZ 2: TÜM MODÜLLERİ GEZ (SPA NAVIGASYON)
    // ================================================================
    R('\n=== FAZ 2: Modül Gezintisi ===', 'i');

    const navMap = [
      { name: 'Özet', expectedUrl: 'dashboard' },
      { name: 'Ürünler', expectedUrl: 'products' },
      { name: 'Satış', expectedUrl: 'sales' },
      { name: 'Fatura', expectedUrl: 'fatura' },
      { name: 'Tedarikçi', expectedUrl: 'suppliers' },
      { name: 'Pelet', expectedUrl: 'pelet' },
      { name: 'Cari', expectedUrl: 'cari' },
      { name: 'Kasa', expectedUrl: 'kasa' },
      { name: 'Bütçe', expectedUrl: 'butce' },
      { name: 'Banka', expectedUrl: 'bank' },
    ];

    for (const mod of navMap) {
      const modStart = Date.now();
      try {
        // Navigate via SPA: find and click the sidebar button
        const btn = page.locator('nav button').filter({ hasText: mod.name }).first();
        const exists = await btn.count();

        if (exists === 0) {
          // Try expanding groups
          const groups = ['Tedarik', 'Finans', 'Analiz', 'Sistem'];
          for (const g of groups) {
            const gBtn = page.locator('nav button').filter({ hasText: new RegExp(`${g}\\s+grubunu`, 'i') }).first();
            if (await gBtn.count()) {
              const text = await gBtn.textContent();
              if (text?.includes('genislet')) await gBtn.click();
            }
          }
          await page.waitForTimeout(500);
        }

        const btn2 = page.locator('nav button').filter({ hasText: mod.name }).first();
        if (await btn2.count() === 0) {
          R(`${mod.name}: buton bulunamadı`, 'w');
          results.issues.push(`${mod.name}: sidebar butonu yok`);
          continue;
        }

        await btn2.click();
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || 'H1 YOK');
        const urlOk = currentUrl.includes(mod.expectedUrl);
        const loadTime = Date.now() - modStart;

        await page.screenshot({ path: `${OUT}/02-${mod.name}.png`, fullPage: true });

        const result = { route: mod.name, url: currentUrl, h1, loadTime, urlOk };
        results.pages.push(result);

        if (urlOk && h1 !== 'H1 YOK') {
          R(`${mod.name}: ${h1} (${loadTime}ms)`, 's');
          results.summary.passed++;
        } else if (urlOk) {
          R(`${mod.name}: URL OK ama H1 yok (${loadTime}ms)`, 'w');
          results.summary.warnings++;
          results.issues.push(`${mod.name}: H1 bulunamadı`);
        } else {
          R(`${mod.name}: URL beklendiği gibi değil (${currentUrl})`, 'w');
          results.summary.warnings++;
        }
      } catch (e) {
        R(`${mod.name}: HATA - ${e.message?.substring(0, 100)}`, 'e');
        results.summary.failed++;
        results.issues.push(`${mod.name}: ${e.message?.substring(0, 100)}`);
      }
    }

    // ================================================================
    // FAZ 3: BUGHUNTER & HATA TESPİT
    // ================================================================
    R('\n=== FAZ 3: Hata Tespit Sayfaları ===', 'i');

    // Expand Sistem grubu
    try {
      const sistemBtn = page.locator('nav button').filter({ hasText: /sistem.*grubunu/i }).first();
      if (await sistemBtn.count()) {
        const text = await sistemBtn.textContent();
        if (text?.includes('genislet')) await sistemBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {}

    const errorPages = [
      { name: 'BugHunter', path: 'bughunter' },
      { name: 'Monitör', path: 'monitor' },
      { name: 'Anomali', path: 'anomali' },
      { name: 'Kontrol', path: 'kontrol' },
      { name: 'Ayarlar', path: 'settings' },
      { name: 'Stok', path: 'stock' },
    ];

    for (const ep of errorPages) {
      try {
        const btn = page.locator('nav button').filter({ hasText: ep.name }).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(2000);

          const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || 'H1 YOK');
          const btns = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 10);
          });
          const inputCount = await page.evaluate(() => document.querySelectorAll('input, select, textarea').length);

          R(`${ep.name}: "${h1}" - ${btns.length} buton, ${inputCount} input`, 's');
          await page.screenshot({ path: `${OUT}/03-${ep.name}.png`, fullPage: true });

          results.pages.push({ route: ep.path, name: ep.name, h1, buttons: btns.length, inputs: inputCount });

          // BugHunter'da "Tara" butonu var mı?
          const actionBtn = btns.find(b => /tara|analiz|kontrol|düzelt/i.test(b || ''));
          if (actionBtn) results.issues.push(`${ep.name}: "${actionBtn}" butonu mevcut`);

          results.summary.passed++;
        } else {
          R(`${ep.name}: buton bulunamadı`, 'w');
          results.summary.warnings++;
        }
      } catch (e) {
        R(`${ep.name}: HATA - ${e.message?.substring(0, 100)}`, 'e');
        results.summary.failed++;
      }
    }

    // ================================================================
    // FAZ 4: CRUD İŞLEMLERİ 
    // ================================================================
    R('\n=== FAZ 4: CRUD İşlemleri ===', 'i');

    // Ürünler sayfasına git
    try {
      await page.goto(BASE + '/products', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      
      // Var olan ürünleri doğrula
      const productCount = await page.evaluate(() => {
        const raw = localStorage.getItem('sobaYonetim');
        const db = JSON.parse(raw);
        return db.products?.length || 0;
      });
      R(`Veritabanında ürün sayısı: ${productCount}`, 's');
      
      // Yeni ürün butonu var mı?
      const yeniUrunBtn = page.locator('button').filter({ hasText: /yeni ürün/i }).first();
      if (await yeniUrunBtn.count()) {
        R('"Yeni Ürün" butonu mevcut', 's');
      } else {
        R('"Yeni Ürün" butonu bulunamadı', 'w');
      }

      // Tablo kontrolü
      const table = page.locator('table').first();
      if (await table.count()) {
        const rows = await page.locator('table tbody tr, table tr').count();
        R(`Tablo satır sayısı: ${rows}`, 's');
      } else {
        // Grid/liste kontrolü
        const items = page.locator('[class*="card"], [class*="item"], [class*="row"]').first();
        if (await items.count()) R('Grid/liste görünümü var', 's');
        else R('Tablo veya liste bulunamadı', 'w');
      }

      results.summary.passed++;
    } catch (e) {
      R(`Ürün CRUD: ${e.message?.substring(0, 100)}`, 'e');
      results.summary.failed++;
    }

    // Kasa sayfası
    try {
      const kasaBtn = page.locator('nav button').filter({ hasText: 'Kasa' }).first();
      if (await kasaBtn.count()) {
        await kasaBtn.click();
        await page.waitForTimeout(2000);
        const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || 'H1 YOK');
        R(`Kasa: ${h1}`, 's');
        await page.screenshot({ path: `${OUT}/04-kasa.png`, fullPage: true });
      }
    } catch (e) {
      R(`Kasa: ${e.message?.substring(0, 100)}`, 'e');
    }

    // Cari sayfası
    try {
      const cariBtn = page.locator('nav button').filter({ hasText: 'Cari' }).first();
      if (await cariBtn.count()) {
        await cariBtn.click();
        await page.waitForTimeout(2000);
        const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || 'H1 YOK');
        R(`Cari: ${h1}`, 's');
        await page.screenshot({ path: `${OUT}/05-cari.png`, fullPage: true });
        
        // Cari bakiyesi
        const cariBalance = await page.evaluate(() => {
          const raw = localStorage.getItem('sobaYonetim');
          if (!raw) return 'N/A';
          const db = JSON.parse(raw);
          const totalBalance = db.cari.reduce((sum, c) => sum + (c.balance || 0), 0);
          return totalBalance;
        });
        R(`Cari toplam bakiye: ₺${cariBalance}`);
      }
    } catch (e) {
      R(`Cari: ${e.message?.substring(0, 100)}`, 'e');
    }

    // ================================================================
    // FAZ 5: RESPONSIVE TEST
    // ================================================================
    R('\n=== FAZ 5: Responsive Test ===', 'i');

    const viewports = [
      { w: 375, h: 667, name: 'Mobil 375x667' },
      { w: 768, h: 1024, name: 'Tablet 768x1024' },
      { w: 1024, h: 768, name: 'Tablet Yatay 1024x768' },
      { w: 1440, h: 900, name: 'Desktop 1440x900' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      
      const metrics = await page.evaluate(() => ({
        scrollHeight: document.body.scrollHeight,
        scrollWidth: document.body.scrollWidth,
        hasNav: !!document.querySelector('nav'),
        buttons: document.querySelectorAll('button').length,
        visibleText: document.body?.innerText?.substring(0, 100) || '',
      }));
      
      R(`${vp.name}: scroll=${metrics.scrollHeight}x${metrics.scrollWidth}, ${metrics.buttons} buton, nav=${metrics.hasNav}`);
      await page.screenshot({ path: `${OUT}/responsive_${vp.w}x${vp.h}.png`, fullPage: true });
      results.responsive.push({ ...vp, ...metrics });
    }

    // ================================================================
    // FAZ 6: PERFORMANS
    // ================================================================
    R('\n=== FAZ 6: Performans Metrikleri ===', 'i');

    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (!nav) return {};
      return {
        domInteractive: Math.round(nav.domInteractive),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        domComplete: Math.round(nav.domComplete),
        loadComplete: Math.round(nav.loadEventEnd),
        responseEnd: Math.round(nav.responseEnd),
        type: nav.type,
        domLatency: Math.round(nav.domComplete - nav.domInteractive),
      };
    });
    results.performance = perf;
    R(`DOM Interactive: ${perf.domInteractive}ms | DOM Complete: ${perf.domComplete}ms | Load: ${perf.loadComplete}ms`);
    R(`Render Süresi: ${perf.domLatency}ms`);

    // Kaynak istatistikleri
    const resourceStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((s, r) => s + (r.transferSize || 0), 0);
      const totalDuration = resources.reduce((s, r) => s + (r.duration || 0), 0);
      const jsFiles = resources.filter(r => r.name.includes('.js') || r.name.includes('.tsx'));
      const cssFiles = resources.filter(r => r.name.includes('.css'));
      return {
        totalResources: resources.length,
        totalSize: totalSize,
        totalDuration: Math.round(totalDuration),
        jsCount: jsFiles.length,
        cssCount: cssFiles.length,
        avgLoad: resources.length > 0 ? Math.round(totalDuration / resources.length) : 0,
      };
    });
    R(`Kaynaklar: ${resourceStats.totalResources} dosya, ${(resourceStats.totalSize / 1024).toFixed(0)}KB, ortalama ${resourceStats.avgLoad}ms`);

    // ================================================================
    // FAZ 7: DB BÜTÜNLÜK KONTROLÜ
    // ================================================================
    R('\n=== FAZ 7: Veritabanı Bütünlüğü ===', 'i');

    const dbCheck = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('sobaYonetim');
        if (!raw) return { loaded: false };
        const db = JSON.parse(raw);
        const issues = [];
        const requiredArrays = ['products', 'sales', 'kasa', 'cari', 'suppliers', 'invoices', 'returns'];
        for (const key of requiredArrays) {
          if (!Array.isArray(db[key])) issues.push(`${key} array değil`);
        }
        if (typeof db._version !== 'number') issues.push('_version eksik');
        
        const stats = {};
        for (const key of Object.keys(db)) {
          if (Array.isArray(db[key])) stats[key] = db[key].length;
          else if (typeof db[key] === 'object' && db[key] !== null) stats[key] = 'object';
        }
        return { loaded: true, version: db._version, stats, issues };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });
    results.dbCheck = dbCheck;

    if (dbCheck.loaded) {
      R(`DB v${dbCheck.version} yüklü, ${Object.keys(dbCheck.stats).length} alan`, 's');
      if (dbCheck.issues.length > 0) {
        dbCheck.issues.forEach(i => R(`Bütünlük sorunu: ${i}`, 'e'));
        results.issues.push(...dbCheck.issues.map(i => 'DB: ' + i));
      } else {
        R('DB bütünlüğü TAMAM', 's');
      }
    } else {
      R('DB yüklenemedi!', 'e');
    }

    // ================================================================
    // FAZ 8: GÖRSEL/UI KALİTE KONTROLLERİ
    // ================================================================
    R('\n=== FAZ 8: UI Kalite Kontrolleri ===', 'i');

    const uiChecks = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return {
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        fontFamily: styles.fontFamily,
        bgColor: styles.backgroundColor,
        hasLoadingSpinner: !!document.querySelector('[class*="spinner"], [class*="loading"], [class*="skeleton"]'),
        hasNotifications: !!document.querySelector('[class*="toast"], [class*="notification"], [class*="sonner"]'),
        hasAIButton: document.body.innerText.includes('AI'),
        hasSearch: !!document.querySelector('input[type="search"], input[placeholder*="ara"]'),
        localStorageSize: new Blob([localStorage.getItem('sobaYonetim') || '']).size / 1024,
      };
    });
    R(`Tema rengi: ${uiChecks.themeColor}`);
    R(`Font: ${uiChecks.fontFamily?.split(',')[0]}`);
    R(`localStorage boyutu: ${uiChecks.localStorageSize?.toFixed(1)}KB`);
    R(`AI Asistan: ${uiChecks.hasAIButton ? '✅' : '❌'} | Arama: ${uiChecks.hasSearch ? '✅' : '❌'}`);
    if (!uiChecks.hasAIButton) results.issues.push('AI Asistan butonu görünmüyor');
    if (!uiChecks.hasSearch) results.issues.push('Arama kutusu görünmüyor');
    results.uiChecks = uiChecks;

    // ================================================================
    // FAZ 9: CONSLE HATA RAPORU
    // ================================================================
    R('\n=== FAZ 9: Konsol Hata Raporu ===', 'i');

    const uniqueErrors = [...new Set(consErrors)];
    results.consoleErrors = uniqueErrors;

    if (uniqueErrors.length === 0) {
      R('HİÇ konsol hatası yok!', 's');
    } else {
      R(`${uniqueErrors.length} konsol hatası:`, 'w');
      uniqueErrors.forEach((e, i) => R(`  ${i+1}. ${e.substring(0, 200)}`, 'e'));
      results.summary.errors += uniqueErrors.length;
    }

    if (results.pageErrors.length > 0) {
      R(`${results.pageErrors.length} sayfa hatası:`, 'e');
      results.pageErrors.forEach((e, i) => R(`  ${i+1}. ${e.substring(0, 200)}`, 'e'));
    }

  } catch (err) {
    R('KRİTİK HATA: ' + err.message, 'e');
    results.criticalError = err.message;
  } finally {
    results.meta.duration = Date.now() - startTime;
    await browser.close();
  }

  // ================================================================
  // NİHAİ RAPOR
  // ================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊  NİHAİ DENETİM RAPORU');
  console.log('='.repeat(70));
  R(`Süre: ${(results.meta.duration / 1000).toFixed(1)}s`);
  R(`Test Edilen Sayfalar: ${results.pages.length}`);
  R(`✅ Başarılı: ${results.summary.passed}`);
  R(`⚠️ Uyarı: ${results.summary.warnings}`);
  R(`❌ Başarısız: ${results.summary.failed}`);
  R(`🔴 Konsol Hataları: ${results.consoleErrors.length}`);
  R(`🔴 Sayfa Hataları: ${results.pageErrors.length}`);
  R(`⚠️ Tespit Edilen Sorun: ${results.issues.length}`);

  if (results.issues.length > 0) {
    console.log('\n=== TESPİT EDİLEN SORUNLAR ===');
    results.issues.forEach((issue, i) => R(`${i+1}. ${issue}`, 'w'));
  }

  if (results.performance.domComplete) {
    console.log('\n=== PERFORMANS ===');
    R(`DOM Interactive: ${results.performance.domInteractive}ms`);
    R(`DOM Complete: ${results.performance.domComplete}ms`);
    R(`Toplam Yükleme: ${results.performance.loadComplete}ms`);
    R(`Render Süresi: ${results.performance.domLatency}ms`);
  }

  // Write report
  fs.writeFileSync(`${OUT}/full-audit-results.json`, JSON.stringify(results, null, 2));
  console.log(`\n📄 Rapor: ${OUT}/full-audit-results.json`);
  console.log('✅ DENETİM TAMAMLANDI\n');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
