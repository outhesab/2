# 🛠️ PARSPEL Teknik Analiz ve İyileştirme Raporu

Bu rapor; `useDB.ts`, `ruleEngine.ts`, `ai-asistan.tsx`, `package.json`, `storageQuota.ts` ve Excel entegrasyon süreçleri dahil olmak üzere tüm sistemin derinlemesine incelenmesi sonucu oluşturulmuştur.

## 🔴 1. Kritik Hatalar (Errors)

| Hata | Açıklama | Risk |
| :--- | :--- | :--- |
| **Eksik Stok Hareketi** | `iadeYap` ve benzeri fonksiyonlarda stok miktarı güncellenirken `StockMovement` tablosuna kayıt atılmıyor. | Stok geçmişi ve raporlamada finansal tutarsızlık; geçmişe dönük stok takibi yapılamaz. |
| **Kasa Hesaplama Darboğazı** | `computeKasaBalances` fonksiyonu her işlemde O(N) karmaşıklıkla tüm geçmişi tarıyor. | 1.000+ işlemden sonra `RULE_TIMEOUT_MS` (50ms) sınırı aşılır, kural motoru hata verir ve UI donar. |
| **XSS Güvenlik Riski** | `ai-asistan.tsx` içinde AI'dan gelen döküman verisi `dangerouslySetInnerHTML` ile doğrudan render ediliyor. | Kötü niyetli script enjeksiyonu ve kullanıcı oturum verilerinin çalınma riski. |
| **Hatalı Veri Temizleme** | `storageQuota.ts` içinde kota dolduğunda "soba" kelimesini içeren anahtarların silinmesi. | "Soba" isimli kritik ürün verilerinin (cache sanılarak) kalıcı olarak kaybolması ve veritabanı bütünlüğünün bozulması. |
| **Mimari Teknik Borç** | `useDB.ts` dosyasının 1.300+ satıra ulaşması; Firebase, LocalStorage ve Business Logic'in aynı yerde olması. | Kodun test edilemez hale gelmesi ve yeni özellik eklerken öngörülemeyen yan etkiler oluşması. |

## 🟡 2. Uyarılar (Warnings)

1.  **ID Çakışma Riski:** `genId` fonksiyonunun `Math.random()` kullanması. Milisaniyeler içinde gerçekleşen toplu işlemlerde (bulk insert) ID çakışması yaşanabilir. `crypto.randomUUID()` kullanımı daha güvenlidir.
2.  **O(N²) Zaman Karmaşıklığı:** `duplicateTransactionRule` kuralı, her yeni girişte tüm geçmişi `find` ile tarıyor. Bu durum veritabanı büyüdükçe işlem onay sürelerini hissedilir derecede artıracaktır.
3.  **Tarayıcı Uyumluluğu (OKLCH):** Modern OKLCH renk uzayı kullanımı, projenin hedef kitlesindeki eski Android WebView veya Safari sürümlerinde arayüzün hatalı görünmesine yol açabilir.
4.  **Paket Yönetici ve Script Hataları:** `package.json` içinde `npmn` gibi yazım hataları bulunması ve `npm` ile `pnpm` komutlarının karışık kullanılması CI/CD süreçlerini bozabilir.
5.  **Giriş Ekranı Performansı:** `LoginScreen.tsx` içindeki 55 adet yoğun animasyonlu `PARTICLES`, düşük donanımlı mobil cihazlarda GPU darboğazı ve gecikme yaratabilir.

## 🔵 3. İyileştirme Önerileri (Improvements)

*   **Stil Yönetimi:** `Monitor.tsx`, `preview.tsx` ve `diff.tsx` sayfalarındaki yoğun inline-style kullanımı Tailwind sınıflarına taşınarak bundle boyutu optimize edilmeli ve kod okunabilirliği artırılmalı.
*   **Dinamik Veri Bağlama:** `aiOffline.ts` içindeki "soba", "nakit", "iadeli" gibi hardcoded string değerler, veritabanındaki kategorilerden dinamik olarak beslenerek esneklik sağlanmalı.
*   **Merkezi Tip Güvenliği:** İşlem tipleri ve kural etiketleri için `enum` veya `as const` yapıları oluşturularak `ruleEngine` ve UI arasındaki tip senkronizasyonu güçlendirilmeli.
*   **Hafıza Yönetimi (Memory Management):** Excel merge işlemlerinde 10.000 satır ve üzeri verilerin `useState` içinde tutulması yerine Web Worker veya "chunk processing" (parçalı işleme) yöntemi tercih edilmeli.

## 🚀 4. Öncelikli Aksiyon Planı (Roadmap)

| Öncelik | Görev | Hedef Dosya | Tahmini Süre |
| :--- | :--- | :--- | :--- |
| **Kritik** | `DOMPurify` entegrasyonu ile XSS koruması | `ai-asistan.tsx` | 30 dk |
| **Kritik** | `useDB.ts` Refactor (Faz 1: Utility ve Sabitlerin Ayrılması) | `useDB.ts` | 2 saat |
| **Kritik** | İade işlemlerine `StockMovement` kaydı eklenmesi | `useDB.ts` | 45 dk |
| **Yüksek** | Incremental bakiye hesaplama (O(1) veya O(log N)) | `ruleEngine.ts` | 1.5 saat |
| **Orta** | `package.json` ve `genId` güncellemeleri | Proje Geneli | 20 dk |

---
*Rapor Tarihi: 23 Mayıs 2026*  
*Raporlayan: Gemini Code Assist*
