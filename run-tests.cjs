/**
 * PARSPEL Kapsamlı Test Koşucusu
 * Tüm E2E testlerini sırayla çalıştırır, sonuçları toplar
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = __dirname;
const RESULTS_FILE = path.join(PROJECT_ROOT, 'e2e-test-results.json');
const SUMMARY_FILE = path.join(PROJECT_ROOT, 'e2e-test-summary.md');

const results = {
  timestamp: new Date().toISOString(),
  overall: { total: 0, passed: 0, failed: 0, skipped: 0 },
  suites: []
};

function runTestSuite(suiteName, filePattern, grepFilter) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 TEST SUITE: ${suiteName}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    const grepArg = grepFilter ? ` -g "${grepFilter}"` : '';
    const cmd = `npx playwright test "${filePattern}"${grepArg} --reporter=json 2>&1`;
    
    const output = execSync(cmd, {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
      shell: 'cmd.exe',
      encoding: 'utf8',
      env: { ...process.env, CI: 'false' }
    });

    // JSON reporter çıktısını parse et
    const lines = output.split('\n').filter(l => l.trim().startsWith('{') || l.trim().startsWith('['));
    let parsed = null;
    for (const line of lines) {
      try {
        parsed = JSON.parse(line.trim());
        if (parsed?.suites) break;
      } catch {}
    }

    if (parsed?.suites) {
      let passed = 0, failed = 0, skipped = 0;
      
      function countTests(suite) {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            const status = test.results?.[0]?.status || 'skipped';
            if (status === 'expected') passed++;
            else if (status === 'unexpected' || status === 'failed') failed++;
            else skipped++;
          }
        }
        for (const child of suite.suites || []) countTests(child);
      }
      countTests(parsed);
      
      const suiteResult = {
        name: suiteName,
        passed,
        failed,
        skipped,
        total: passed + failed + skipped
      };
      
      results.overall.total += suiteResult.total;
      results.overall.passed += suiteResult.passed;
      results.overall.failed += suiteResult.failed;
      results.overall.skipped += suiteResult.skipped;
      results.suites.push(suiteResult);
      
      console.log(`✅ PASS: ${passed} | ❌ FAIL: ${failed} | ⏭️ SKIP: ${skipped}`);
      return suiteResult;
    } else {
      // JSON parse edilemedi, raw çıktıyı göster
      console.log(`⚠️ JSON parse failed, showing raw output (first 2000 chars):`);
      console.log(output.substring(0, 2000));
      
      // Basit regex ile test geçişlerini say
      const passedMatch = output.match(/(\d+)\s+passed/g);
      const failedMatch = output.match(/(\d+)\s+failed/g);
      const p = passedMatch ? parseInt(passedMatch[0]) : 0;
      const f = failedMatch ? parseInt(failedMatch[0]) : 0;
      
      console.log(`📊 Raw parse: PASS=${p} FAIL=${f}`);
      return { name: suiteName, passed: p, failed: f, skipped: 0, total: p+f };
    }
  } catch (err) {
    // Hata durumunda çıktıyı yakala
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    
    console.log(`❌ SUITE HATASI: ${err.message?.substring(0, 200)}`);
    if (stdout) console.log(`STDOUT: ${stdout.substring(0, 1000)}`);
    if (stderr) console.log(`STDERR: ${stderr.substring(0, 1000)}`);
    
    const suiteResult = {
      name: suiteName,
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      error: err.message?.substring(0, 500)
    };
    results.suites.push(suiteResult);
    return suiteResult;
  }
}

// === TEST SUITELERİ ===
console.log('🚀 PARSPEL KAPSAMLI E2E TEST KOŞUSU');
console.log(`📅 ${new Date().toLocaleString('tr-TR')}`);
console.log('='.repeat(70));

// 1. Varolan smoke testler
runTestSuite('Mevcut Smoke Testler', 'e2e/smoke.spec.ts');
runTestSuite('Mevcut Sales Testler', 'e2e/sales.spec.ts');
runTestSuite('Mevcut Inventory Testler', 'e2e/inventory.spec.ts');
runTestSuite('Mevcut Finance Testler', 'e2e/finance.spec.ts');

// 2. Kapsamlı audit testleri - modül navigasyonu
runTestSuite('Modül Navigasyonu', 'e2e/comprehensive-audit.spec.ts', '1\\. MODÜL');
runTestSuite('Satış Yaşam Döngüsü', 'e2e/comprehensive-audit.spec.ts', '2\\. SATIŞ');

// Hata durumunda graceful devam
try {
  runTestSuite('Ürün & Stok', 'e2e/comprehensive-audit.spec.ts', '3\\. ÜRÜN');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Kasa & Finans', 'e2e/comprehensive-audit.spec.ts', '4\\. KASA');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Tedarikçi', 'e2e/comprehensive-audit.spec.ts', '5\\. TEDARİKÇİ');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Raporlar & Analiz', 'e2e/comprehensive-audit.spec.ts', '6\\. RAPORLAR');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Hata Tespit', 'e2e/comprehensive-audit.spec.ts', '7\\. HATA');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Veri Tutarlılığı', 'e2e/comprehensive-audit.spec.ts', '8\\. VERİ');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Tema & Görsel', 'e2e/comprehensive-audit.spec.ts', '9\\. TEMA');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

try {
  runTestSuite('Responsive', 'e2e/comprehensive-audit.spec.ts', '10\\. RESPONSIVE');
} catch (e) { console.log('Suite skip (hata):', e.message?.substring(0, 100)); }

// === ÖZET ===
console.log('\n' + '='.repeat(70));
console.log('📊 GENEL ÖZET');
console.log('='.repeat(70));
console.log(`Toplam: ${results.overall.total}`);
console.log(`✅ Geçen: ${results.overall.passed}`);
console.log(`❌ Başarısız: ${results.overall.failed}`);
console.log(`⏭️ Atlanan: ${results.overall.skipped}`);
console.log(`Başarı Oranı: ${results.overall.total > 0 ? ((results.overall.passed / results.overall.total) * 100).toFixed(1) : 0}%`);

// Sonuçları dosyaya yaz
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
console.log(`\n📄 Detaylı sonuçlar: ${RESULTS_FILE}`);
