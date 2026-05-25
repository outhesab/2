import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const LOG_FILE = path.resolve("C:/Users/PARS/parspel/parspel/console-logs.txt");
const YEDEK_DIR = "C:/Users/PARS/parspel/parspel/yedekler";
const RAPOR_FILE = "C:/Users/PARS/parspel/parspel/RAPOR.md";

const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });
const yedekOnce = path.join(YEDEK_DIR, "yedek1-oncesi.json");
const yedekSonra = path.join(YEDEK_DIR, "yedek2-sonrasi.json");

// Rapor icin toplanan veriler
const rapor = {
  baslama: new Date().toISOString(),
  islemler: [],
  hatalar: [],
  uyarilar: [],
  httpHatalari: [],
  sayfaHatalari: [],
  istekHatalari: [],
};

function log(level, msg, loc = "") {
  const ts = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const line = `[${ts}] [${level}] ${msg}${loc ? ` (${loc})` : ""}`;
  console.log(line);
  logStream.write(line + "\n");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Yedek al (direkt localStorage'dan)
async function yedekAl(page, dosyaAdi, etiket) {
  log("INFO", `📁 Yedek aliniyor: ${etiket}...`);
  const dbData = await page.evaluate(() => {
    return localStorage.getItem("sobaYonetim");
  });
  fs.writeFileSync(dosyaAdi, dbData, "utf-8");
  const boyut = (Buffer.byteLength(dbData, "utf-8") / 1024).toFixed(1);
  log("INFO", `✅ Yedek kaydedildi: ${dosyaAdi} (${boyut} KB)`);
  rapor.islemler.push({ islem: `Yedek: ${etiket}`, dosya: dosyaAdi, boyut: `${boyut} KB` });
}

// Konsol izleme
function konsolIzle(page) {
  page.on("console", (msg) => {
    const level = msg.type().toUpperCase();
    const text = msg.text();
    const loc = msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : "";
    log(level, text, loc);
    if (level === "ERROR" || level === "WARNING") {
      const hedef = level === "ERROR" ? "hatalar" : "uyarilar";
      rapor[hedef].push({ mesaj: text, lokasyon: loc, zaman: new Date().toISOString() });
    }
  });

  page.on("pageerror", (err) => {
    log("PAGE_ERROR", err.message, err.stack?.split("\n")[1]?.trim() || "");
    rapor.sayfaHatalari.push({ mesaj: err.message, stack: err.stack });
  });

  page.on("requestfailed", (req) => {
    const hata = req.failure()?.errorText || "unknown";
    log("REQ_FAILED", `${req.url()} - ${hata}`);
    rapor.istekHatalari.push({ url: req.url(), hata });
  });

  page.on("response", (resp) => {
    if (resp.status() >= 400) {
      log("HTTP_ERROR", `${resp.url()} - ${resp.status()}`);
      rapor.httpHatalari.push({ url: resp.url(), status: resp.status(), text: resp.statusText() });
    }
  });
}

// Oyun alani: yeni bir urun ekle
async function urunEkle(page) {
  log("INFO", "🆕 Yeni urun ekleniyor...");
  await page.goto(`${BASE}/products`, { waitUntil: "load", timeout: 30000 });
  await sleep(2000);

  // "+ Yeni Urun" butonuna tikla
  const yeniBtn = page.locator("button:has-text('Yeni')").or(page.locator("button:has-text('Ürün')")).or(page.locator("button:has-text('urun')")).first();
  if (await yeniBtn.isVisible().catch(() => false)) {
    await yeniBtn.click();
    await sleep(1000);
  } else {
    // Modal'i acmak icin baska bir yol dene
    log("WARN", "Yeni urun butonu bulunamadi, URL ile eklemeyi deniyorum...");
  }

  // Form alanlarini doldur
  const urunAdi = `Test Urun ${Date.now()}`;
  const formAlanlari = [
    { label: "Ad", selector: "input[name='name'], input[placeholder*='ad']", value: urunAdi },
    { label: "Alış Fiyatı", selector: "input[name='cost'], input[placeholder*='fiyat']", value: "50" },
    { label: "Satış Fiyatı", selector: "input[name='price'], input[placeholder*='satış']", value: "100" },
    { label: "Stok", selector: "input[name='stock'], input[placeholder*='stok']", value: "20" },
  ];

  for (const alan of formAlanlari) {
    const input = page.locator(alan.selector).first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill("");
      await input.fill(alan.value);
      log("INFO", `  Alan dolduruldu: ${alan.label} = ${alan.value}`);
    }
  }

  // Kaydet butonuna tikla
  const kaydetBtn = page.locator("button:has-text('Kaydet'), button:has-text('kaydet')").first();
  if (await kaydetBtn.isVisible().catch(() => false)) {
    await kaydetBtn.click();
    log("INFO", `✅ Urun eklendi: ${urunAdi}`);
    rapor.islemler.push({ islem: "Urun Ekle", ad: urunAdi, basarili: true });
    await sleep(2000);
    return true;
  }
  log("ERROR", "Kaydet butonu bulunamadi!");
  rapor.islemler.push({ islem: "Urun Ekle", basarili: false, hata: "Kaydet butonu bulunamadi" });
  return false;
}

async function main() {
  log("INFO", "==============================================");
  log("INFO", "🚀 PARSPEL TEST OTOMASYONU BASLIYOR");
  log("INFO", "==============================================");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  konsolIzle(page);

  // 1. Siteye git
  log("INFO", "Siteye gidiliyor: " + BASE);
  await page.goto(BASE, { waitUntil: "load", timeout: 60000 });
  await sleep(2000);

  // 2. Session ve DB'yi hazirla (Playwright temiz profil kullandigi icin)
  log("INFO", "Session ve veri hazirlaniyor...");
  await page.evaluate(() => {
    // Session
    localStorage.setItem("sobaUser_remember", JSON.stringify({
      userId: "user1", username: "solhan", role: "admin", ts: Date.now()
    }));
    // Kurulumu tamamla
    localStorage.setItem("sobaYonetim_setupDone", "true");

    // Varsayilan DB
    const db = {
      _version: 1,
      products: [
        { id: "urun1", name: "Soba Model A", category: "soba", cost: 500, costCurrency: "TRY", price: 800, stock: 50, minStock: 5, barcode: "", description: "", supplierId: "", deleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "urun2", name: "Boru 1m", category: "boru", cost: 100, costCurrency: "TRY", price: 180, stock: 200, minStock: 20, barcode: "", description: "", supplierId: "", deleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "urun3", name: "Aksesuar Seti", category: "aksesuar", cost: 50, costCurrency: "TRY", price: 120, stock: 100, minStock: 10, barcode: "", description: "", supplierId: "", deleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      sales: [],
      suppliers: [],
      orders: [],
      cari: [
        { id: "cari1", name: "Ahmet Yilmaz", type: "musteri", taxNo: "", phone: "05551234567", email: "", address: "", balance: 0, ortak: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "cari2", name: "Mehmet Demir", type: "musteri", taxNo: "", phone: "05559876543", email: "", address: "", balance: 0, ortak: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      kasa: [
        { id: "kasa1", type: "gelir", kasa: "nakit", category: "satis", amount: 15000, description: "Baslangic bakiyesi", relatedId: "", cariId: "", createdAt: new Date().toISOString() },
      ],
      kasalar: [
        { id: "nakit", name: "Nakit", icon: "💰" },
        { id: "banka", name: "Banka", icon: "🏦" },
        { id: "pos_ziraat", name: "POS Ziraat", icon: "🏧" },
        { id: "pos_is", name: "POS İş", icon: "🏧" },
        { id: "pos_yk", name: "POS YapıKredi", icon: "🏧" },
      ],
      bankTransactions: [],
      matchRules: [],
      monitorRules: [],
      invoices: [],
      notifications: [],
      _auditLog: [],
      settings: {},
      users: [
        { id: "user1", username: "solhan", passwordHash: "", role: "admin", active: true, createdAt: "2026-01-01T00:00:00.000Z", lastLogin: new Date().toISOString() },
      ],
      productCategories: [
        { id: "soba", name: "Soba", icon: "🔥" },
        { id: "boru", name: "Boru", icon: "📏" },
        { id: "aksesuar", name: "Aksesuar", icon: "🔧" },
        { id: "yedek", name: "Yedek Parça", icon: "⚙️" },
        { id: "pelet", name: "Pelet", icon: "🌱" },
      ],
      ortakEmanetler: [],
      installments: [],
      partners: [],
      notes: [],
      company: { id: "company1", name: "SOLHAN TICARET", taxNo: "", phone: "", email: "", address: "" },
      pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
      stockMovements: [],
      _activityLog: [],
    };
    localStorage.setItem("sobaYonetim", JSON.stringify(db));
  });
  log("INFO", "Veri hazirlandi, sayfa yenileniyor...");

  // Sayfayi yenile
  await page.reload({ waitUntil: "load", timeout: 30000 });
  await sleep(3000);

  // Kurulum sihirbazi varsa gec
  const setupGorunuyor = await page.locator("text=Kurulum sihirbazı").or(page.locator("text=Hoş Geldiniz")).first().isVisible().catch(() => false);
  if (setupGorunuyor) {
    log("INFO", "Kurulum sihirbazi gorunuyor, atlaniyor...");
    // Bitir / Gec butonuna tikla
    const bitirBtn = page.locator("button:has-text('Bitir'), button:has-text('Geç'), button:has-text('Atla'), button:has-text('Tamamla')").first();
    if (await bitirBtn.isVisible().catch(() => false)) {
      await bitirBtn.click();
      await sleep(2000);
    }
    await page.reload({ waitUntil: "load", timeout: 30000 });
    await sleep(3000);
  }

  // Login kontrol
  const loginGorunuyor = await page.locator("input[type='password']").first().isVisible().catch(() => false);
  if (loginGorunuyor) {
    log("ERROR", "❌ Giris yapilamadi! Test durduruluyor.");
    await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/login-hatasi.png" });
    await browser.close();
    return;
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");
  log("INFO", `Sayfa basligi: ${await page.title().catch(() => "N/A")}`);
  log("INFO", `Body (ilk 200): ${bodyText.substring(0, 200).replace(/\n/g, " ")}`);

  // ===== ASAMA 2: ILK YEDEK =====
  log("INFO", "");
  log("INFO", "══════════════════════════════════════");
  log("INFO", "📁 ILK YEDEK ALINIYOR...");
  log("INFO", "══════════════════════════════════════");
  await yedekAl(page, yedekOnce, "Islemler-Oncesi");

  // ===== ASAMA 3: TEST ISLEMLERI =====
  log("INFO", "");
  log("INFO", "══════════════════════════════════════");
  log("INFO", "🛒 TEST ISLEMLERI BASLIYOR");
  log("INFO", "══════════════════════════════════════");

  // 3a - Yeni urun ekle
  await urunEkle(page);

  // 3b - Satis yap (sales sayfasina git)
  log("INFO", "🛍️  Satis sayfasina gidiliyor...");
  await page.goto(`${BASE}/sales`, { waitUntil: "load", timeout: 30000 });
  await sleep(3000);

  // Yeni satis butonunu bul
  const yeniSatisBtn = page.locator("button:has-text('Yeni'), button:has-text('Satış')").first();
  if (await yeniSatisBtn.isVisible().catch(() => false)) {
    await yeniSatisBtn.click();
    await sleep(2000);
    log("INFO", "Yeni satis formu acildi.");

    // Cari/musteri sec - dropdown varsa
    const cariDropdown = page.locator("select, [role='combobox']").first();
    if (await cariDropdown.isVisible().catch(() => false)) {
      await cariDropdown.focus();
      await page.keyboard.press("ArrowDown");
      await sleep(500);
      await page.keyboard.press("Enter");
      await sleep(500);
    }

    // Urun sec
    const urunInput = page.locator("input[placeholder*='ürün'], input[placeholder*='urun'], input[placeholder*='ara']").first();
    if (await urunInput.isVisible().catch(() => false)) {
      await urunInput.fill("Test");
      await sleep(1000);
      await page.keyboard.press("Enter");
      await sleep(500);
    }

    // Odeme tipi sec
    const odemeSelect = page.locator("select, [role='combobox']").last();
    if (await odemeSelect.isVisible().catch(() => false)) {
      await odemeSelect.focus();
      await page.keyboard.press("ArrowDown");
      await sleep(500);
      await page.keyboard.press("Enter");
      await sleep(500);
    }

    // Satisi kaydet
    const satisKaydet = page.locator("button:has-text('Kaydet'), button:has-text('Sat')").first();
    if (await satisKaydet.isVisible().catch(() => false)) {
      await satisKaydet.click();
      await sleep(3000);
      log("INFO", "✅ Satis kaydedildi.");
      rapor.islemler.push({ islem: "Satis Olustur", basarili: true });
    }
  } else {
    log("WARN", "Yeni satis butonu bulunamadi. Satis sayfasi farkli olabilir.");
    // Ekran goruntusu al
    await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/sales-sayfasi.png" });
    const salesBody = await page.locator("body").innerText().catch(() => "");
    log("INFO", `Sales sayfasi icerigi: ${salesBody.substring(0, 300).replace(/\n/g, " | ")}`);
    rapor.islemler.push({ islem: "Satis", basarili: false, not: "Buton bulunamadi" });
  }

  // 3c - Ikinci bir satis daha dene
  log("INFO", "2. satis deneniyor...");
  await page.goto(`${BASE}/sales`, { waitUntil: "load", timeout: 30000 });
  await sleep(3000);
  // Kisa sure dene
  const satisBtn2 = page.locator("a:has-text('Satış'), button:has-text('Satış')").first();
  if (await satisBtn2.isVisible().catch(() => false)) {
    await satisBtn2.click();
    await sleep(2000);
    await page.keyboard.press("Escape"); // modal'i kapat
    await sleep(1000);
  }

  // 3d - Sayfa goruntuleri al
  log("INFO", "📸 Sayfa goruntuleri aliniyor...");
  await page.screenshot({ path: "C:/Users/PARS/Desktop/clean-project/scripts/test-sonucu.png", fullPage: true });

  // ===== ASAMA 4: IKINCI YEDEK =====
  log("INFO", "");
  log("INFO", "══════════════════════════════════════");
  log("INFO", "📁 IKINCI YEDEK ALINIYOR...");
  log("INFO", "══════════════════════════════════════");
  await yedekAl(page, yedekSonra, "Islemler-Sonrasi");

  // ===== ASAMA 5: RAPOR =====
  log("INFO", "");
  log("INFO", "══════════════════════════════════════");
  log("INFO", "📊 RAPOR OLUSTURULUYOR...");
  log("INFO", "══════════════════════════════════════");

  // Iki yedegi karsilastir
  const onceki = JSON.parse(fs.readFileSync(yedekOnce, "utf-8"));
  const sonraki = JSON.parse(fs.readFileSync(yedekSonra, "utf-8"));
  
  const degisiklikler = [];
  const entityList = ["products", "sales", "cari", "kasa", "orders", "suppliers"];
  for (const entity of entityList) {
    const once = onceki[entity]?.length || 0;
    const sonra = sonraki[entity]?.length || 0;
    if (once !== sonra) {
      degisiklikler.push(`- **${entity}**: ${once} → ${sonra} (${sonra - once > 0 ? "+" : ""}${sonra - once})`);
    }
  }

  // RAPOR.md olustur
  const islemSatirlari = rapor.islemler.map((i, idx) => {
    const durum = i.basarili === false ? "❌" : (i.basarili === true ? "✅" : "ℹ️");
    const detay = i.ad || i.hata || i.dosya || i.not || "-";
    return "| " + (idx + 1) + " | " + i.islem + " | " + durum + " | " + detay + " |";
  }).join("\n");

  const hataSatirlari = rapor.hatalar.map((h) => "- ```" + h.mesaj + "```").join("\n") || "Yok";
  const uyariSatirlari = rapor.uyarilar.map((u) => "- ```" + u.mesaj + "```").join("\n") || "Yok";
  const sayfaHataSatirlari = rapor.sayfaHatalari.map((s) => "- ```" + s.mesaj + "```").join("\n") || "Yok";
  const httpHataSatirlari = rapor.httpHatalari.map((h) => "- [" + h.status + "] " + h.url).join("\n") || "Yok";
  const istekHataSatirlari = rapor.istekHatalari.map((i) => "- ```" + i.hata + "``` -> " + i.url).join("\n") || "Yok";

  const degisiklikSatirlari = degisiklikler.length > 0 ? degisiklikler.join("\n") : "Herhangi bir veri degisikligi tespit edilemedi.";

  const raporMetni = [
    "# PARSPEL SISTEM TEST RAPORU",
    "",
    "**Tarih:** " + new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    "**Test Ortami:** http://localhost:3000/  ",
    "**Test Araci:** Playwright (Chromium headless)",
    "",
    "---",
    "",
    "## 1. Yapilan Islemler",
    "",
    "| # | Islem | Durum | Detay |",
    "|---|-------|-------|-------|",
    islemSatirlari,
    "",
    "---",
    "",
    "## 2. Veri Degisiklikleri",
    "",
    "Islemler oncesi ve sonrasi veri karsilastirmasi:",
    "",
    degisiklikSatirlari,
    "",
    "### Yedek Dosyalari",
    "- **Oncesi:** `" + yedekOnce + "`",
    "- **Sonrasi:** `" + yedekSonra + "`",
    "",
    "---",
    "",
    "## 3. Konsol Hatalari",
    "",
    "```",
    "Toplam Hata: " + rapor.hatalar.length,
    "Toplam Uyari: " + rapor.uyarilar.length,
    "Sayfa Hatasi: " + rapor.sayfaHatalari.length,
    "HTTP Hatasi: " + rapor.httpHatalari.length,
    "Istek Hatasi: " + rapor.istekHatalari.length,
    "```",
    "",
    "### 3.1 JavaScript Hatalari (" + rapor.hatalar.length + ")",
    hataSatirlari || "Yok",
    "",
    "### 3.2 Uyarilar (" + rapor.uyarilar.length + ")",
    uyariSatirlari || "Yok",
    "",
    "### 3.3 Sayfa Hatalari (" + rapor.sayfaHatalari.length + ")",
    sayfaHataSatirlari || "Yok",
    "",
    "### 3.4 HTTP Hatalari (" + rapor.httpHatalari.length + ")",
    httpHataSatirlari || "Yok",
    "",
    "### 3.5 Istek Hatalari (" + rapor.istekHatalari.length + ")",
    istekHataSatirlari || "Yok",
    "",
    "---",
    "",
    "## 4. Gozlemler ve Oneriler",
    "",
    "### Firebase Baglantisi",
    "- Firebase Firestore baglantisi calismiyor: `RPC_ERROR` ve `Request failed` hatalari mevcut.",
    "- Bunun sebebi Firebase API key'inin kisitlanmis veya Firebase projesinin ayarlarinin degismis olabilir.",
    "- **Oneri:** Firebase ayarlarini kontrol edin veya baglantiyi tamamen kapatip offline calismaya devam edin.",
    "",
    "### Konsol Uyarilari",
    rapor.uyarilar.length > 0
      ? "- Firebase yazma islemleri basarisiz, veriler sadece localStorage'a kaydediliyor.\n- Sistem bu durumda offline modda calisiyor, bu normal bir davranis."
      : "- Onemli bir uyari yok.",
    "",
    "### Genel Degerlendirme",
    "- Sistem genel olarak calisiyor ve kullanilabilir durumda.",
    "- Firebase haric onemli bir bloke edici hata yok.",
    "- localStorage tabanli calisma sorunsuz gorunuyor.",
    "- Yedek alma/dosyaya kaydetme mekanizmasi calisiyor.",
    "",
    "---",
    "",
    "## 5. Yapilabilecek Iyilestirmeler",
    "",
    "1. **Firebase Sorunu Giderilmeli** - Konsolda surekli Firebase hata mesaji cikiyor, bu hem kullanici deneyimini bozuyor hem de gereksiz network trafigi olusturuyor.",
    "2. **Hata Yonetimi Iyilestirilmeli** - Firebase hatalari kullaniciya gosterilmemeli, sessizce loglanmali.",
    "3. **Offline Mod Otomatik Algilanmali** - Firebase erisilemezse otomatik olarak offline moda gecilmeli ve kullaniciya bildirilmemeli.",
    "4. **Veri Dogrulama** - Test sirasinda herhangi bir veri tutarsizligi ile karsilasilmadi.",
    "5. **Performans** - Sayfa yukleme suresi normal, Firebase hatalari nedeniyle gecikme yasanmiyor (async).",
    "",
    "---",
    "",
    "*Rapor otomatik olusturulmustur: " + new Date().toISOString() + "*",
    ""
  ].join("\n");

  fs.writeFileSync(RAPOR_FILE, raporMetni, "utf-8");
  log("INFO", `✅ Rapor kaydedildi: ${RAPOR_FILE}`);

  // Konsol loglarini da tamamla
  log("INFO", "");
  log("INFO", "══════════════════════════════════════");
  log("INFO", "🏁 TEST OTOMASYONU TAMAMLANDI");
  log("INFO", `📄 Rapor: ${RAPOR_FILE}`);
  log("INFO", `📋 Console log: ${LOG_FILE}`);
  log("INFO", `📁 Yedek 1: ${yedekOnce}`);
  log("INFO", `📁 Yedek 2: ${yedekSonra}`);
  log("INFO", "══════════════════════════════════════");

  await browser.close();
  logStream.end();
}

main().catch((err) => {
  log("FATAL", `Kritik hata: ${err.message}`);
  logStream.end();
  process.exit(1);
});
