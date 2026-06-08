const { chromium } = require('playwright');
const fs = require('fs');
const p = require('path');
const dir = 'C:/Users/PARS PELET/Desktop/2/repo_2/test-results';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function ss(page, name) {
  await page.screenshot({ path: p.join(dir, name) });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ viewport: { width: 400, height: 800 } })).newPage();
  page.on('pageerror', err => console.log('❌ PAGE:', err.message.substring(0, 200)));

  // 1. KAYIT OL
  console.log('📝 Kayıt...');
  await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.getByText('Kayıt Ol', { exact: false }).first().click({ timeout: 5000 });
  await page.waitForTimeout(1500);
  await page.locator('input[placeholder*="Kullanıcı"]').first().fill('solhan');
  await page.locator('input[type=password]').first().fill('1111');
  await page.locator('input[type=password]').last().fill('1111');
  await page.locator('button:has-text("Kayıt Ol")').first().click({ timeout: 5000 });
  await page.waitForTimeout(5000);
  
  // Dashboard'da mıyız?
  let body = await page.evaluate(() => document.body.innerText.substring(0, 500));
  const onDashboard = body.includes('Hızlı') || body.includes('Ciro') || body.includes('Dashboard') || body.includes('Özet');
  console.log('Dashboard:', onDashboard);
  await ss(page, '01-dashboard.png');
  
  if (!onDashboard) {
    console.log('Sayfa:', body.substring(0, 200));
    console.log('❌ Dashboard açılamadı, test durduruldu');
    return;
  }

  // DB backup 1
  let db;
  try {
    db = await page.evaluate(() => JSON.parse(localStorage.getItem('sobaYonetim') || '{}'));
  } catch { db = {}; }
  fs.writeFileSync(p.join(dir, 'backup-1.json'), JSON.stringify(db, null, 2));
  console.log('💾 Backup 1:', db.products?.length || 0, 'ürün,', db.sales?.length || 0, 'satış');

  // 2. TÜM SAYFALARI TARA (sayfayı kapatmadan)
  console.log('\n🔍 SAYFA TARAMASI:');
  const routes = [
    ['/', 'dashboard'], ['/products', 'products'], ['/sales', 'sales'],
    ['/kasa', 'kasa'], ['/cari', 'cari'], ['/settings', 'settings'],
    ['/reports', 'reports'], ['/stock', 'stock'], ['/fatura', 'fatura'],
    ['/suppliers', 'suppliers']
  ];
  for (const [r, n] of routes) {
    try {
      await page.goto('http://localhost:3000' + r, { timeout: 8000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      await ss(page, `scan-${n}.png`);
      const t = await page.evaluate(() => document.body.innerText.substring(0, 120));
      const hasLogin = t.includes('Kayıt Ol') && (t.includes('Henüz') || t.includes('kayıtlı'));
      const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      console.log(`  ${hasLogin ? '🔒LOGIN' : hasOverflow ? '⚠️OVERFLOW' : '✅'} ${n}`);
    } catch (e) {
      console.log(`  ❌ ${n}: ${e.message.substring(0, 80)}`);
    }
  }

  // 3. ÜRÜN EKLE
  console.log('\n📦 Ürün ekleniyor...');
  await page.goto('http://localhost:3000/products', { timeout: 10000, waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // FAB (+) butonu
  let clicked = false;
  for (const btn of await page.locator('button:visible').all()) {
    const txt = (await btn.innerText().catch(() => '')).trim();
    const cl = await btn.getAttribute('class') || '';
    if (txt === '+' || cl.includes('fab-main') || cl.includes('kayan')) {
      await btn.click({ timeout: 3000 });
      clicked = true;
      console.log('  + butonuna tıklandı:', txt || cl.substring(0, 50));
      break;
    }
  }
  if (!clicked) {
    // Alternatif: "Yeni Ürün" ara
    for (const btn of await page.locator('button:visible').all()) {
      const txt = (await btn.innerText().catch(() => '')).trim();
      if (txt.includes('Yeni') || txt.includes('Ürün') || txt.includes('Ekle')) {
        await btn.click({ timeout: 3000 });
        clicked = true;
        console.log('  Buton:', txt);
        break;
      }
    }
  }

  if (clicked) {
    await page.waitForTimeout(1500);
    await ss(page, '02-product-modal.png');

    const inputs = await page.locator('input:visible').all();
    console.log('  Input sayısı:', inputs.length);
    
    for (const inp of inputs) {
      const ph = (await inp.getAttribute('placeholder') || '').toLowerCase();
      const type = await inp.getAttribute('type') || '';
      if (ph.includes('ürün') || ph.includes('urun') || ph.includes('ad') || ph.includes('name')) {
        await inp.fill('Deneme Ürünü A');
        console.log('  → İsim: Deneme Ürünü A');
      } else if (type === 'number') {
        const val = ph.includes('fiyat') ? '150' : ph.includes('maliyet') ? '100' : '10';
        await inp.fill(val);
        console.log(`  → ${ph || 'number'}: ${val}`);
      }
    }

    // Select
    for (const sel of await page.locator('select:visible').all()) {
      const opts = await sel.locator('option').all();
      if (opts.length > 1) {
        await sel.selectOption({ index: 1 });
        console.log('  → Select: option 1');
      }
    }

    await ss(page, '03-product-filled.png');

    // Kaydet
    for (const btn of await page.locator('button:visible').all()) {
      const txt = (await btn.innerText().catch(() => '')).trim();
      if (txt.includes('Kaydet') || txt === 'Ekle') {
        await btn.click({ timeout: 3000 });
        console.log('  → Kaydet:', txt);
        break;
      }
    }
    await page.waitForTimeout(2000);
    await ss(page, '04-product-saved.png');
  }

  // 4. KASA İŞLEMİ
  console.log('\n💰 Kasa...');
  await page.goto('http://localhost:3000/kasa', { timeout: 10000, waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  clicked = false;
  for (const btn of await page.locator('button:visible').all()) {
    const txt = (await btn.innerText().catch(() => '')).trim();
    const cl = await btn.getAttribute('class') || '';
    if (txt === '+' || cl.includes('fab-main') || cl.includes('kayan')) {
      await btn.click({ timeout: 3000 });
      clicked = true;
      console.log('  + butonuna tıklandı');
      break;
    }
  }
  if (!clicked) {
    for (const btn of await page.locator('button:visible').all()) {
      const txt = (await btn.innerText().catch(() => '')).trim();
      if (txt.includes('Yeni') || txt.includes('İşlem') || txt.includes('Ekle')) {
        await btn.click({ timeout: 3000 });
        clicked = true;
        break;
      }
    }
  }

  if (clicked) {
    await page.waitForTimeout(1500);
    await ss(page, '05-kasa-form.png');
    const kInputs = await page.locator('input:visible').all();
    for (const inp of kInputs) {
      const type = await inp.getAttribute('type') || '';
      if (type === 'number') { await inp.fill('500'); console.log('  → Tutar: 500'); break; }
    }
    await ss(page, '06-kasa-filled.png');
    for (const btn of await page.locator('button:visible').all()) {
      const txt = (await btn.innerText().catch(() => '')).trim();
      if (txt.includes('Kaydet')) {
        await btn.click({ timeout: 3000 });
        console.log('  → Kaydet:', txt);
        break;
      }
    }
    await page.waitForTimeout(2000);
  }

  // 5. FINAL DB + BACKUP 2
  try {
    db = await page.evaluate(() => JSON.parse(localStorage.getItem('sobaYonetim') || '{}'));
  } catch { db = {}; }
  fs.writeFileSync(p.join(dir, 'backup-2.json'), JSON.stringify(db, null, 2));
  console.log('\n📊 SON DB:', JSON.stringify({
    products: db.products?.length || 0, sales: db.sales?.length || 0,
    kasa: db.kasa?.length || 0, cari: db.cari?.length || 0,
    version: db._version || 0, activity: db._activityLog?.length || 0
  }));

  // 6. KARŞILAŞTIRMA
  console.log('\n🔍 BACKUP KARŞILAŞTIRMASI:');
  const b1 = JSON.parse(fs.readFileSync(p.join(dir, 'backup-1.json'), 'utf-8'));
  for (const key of ['products', 'sales', 'kasa', 'cari', 'suppliers', '_activityLog']) {
    const l1 = b1[key]?.length || 0;
    const l2 = db[key]?.length || 0;
    const diff = l2 - l1;
    console.log(`  ${key}: ${l1} → ${l2} ${diff > 0 ? '(+' + diff + ')' : diff === 0 ? '=' : '(' + diff + ')'}`);
  }

  console.log('\n✅ Test bitti — tarayıcı açık');
})();
