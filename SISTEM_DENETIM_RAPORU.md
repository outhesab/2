# PARSPEL — KAPSAMLI SİSTEM DENETİM VE RİSK RAPORU (v3.43.2)

> **Tarih:** 23 Haziran 2026
> **Kapsam:** 70.000 satırlık kod tabanı (Sıfır Varsayım Analizi)

---

## 1. MİMARİ VE VERİ YÖNETİMİ

### 1.1 "Source of Truth" Karmaşası
*   **Sorun:** `localStorage` ana veri kaynağıdır (`useDB.ts`). `Firebase` ikincil bir senkronizasyon aracıdır.
*   **Risk:** `localStorage` kapasitesi (5MB-10MB) aşıldığında sistem sessizce `QuotaExceededError` verir ve veriler kaybolur.
*   **Öneri:** `Dexie.js` (IndexedDB) katmanı zorunlu hale getirilerek `localStorage` sadece "hızlı önbellek" (cache) katmanına indirgenmelidir.

### 1.2 İşlem Atomikliği Eksikliği (Transactionless Design)
*   **Sorun:** `processIntent` (iş mantığı) ve `applyIntentResult` (DB güncelleme) birbirinden kopuktur.
*   **Risk:** Sistem bir işlem sırasında yarı yolda çökerse (tab kapatma, internet kesintisi), veritabanı "yarı güncellenmiş" (dirty state) kalır.
*   **Öneri:** İşlem başlatılmadan önce verinin bir `snapshot`'ının alınması ve başarısızlıkta geri dönülmesi (rollback) için `ActionManager` katmanı kurulmalıdır.

### 1.3 State Senkronizasyonu (Race Condition)
*   **Sorun:** `useDB.ts` içerisindeki `save()` metodu asenkron bir `SyncQueue` tetikleyicisine sahip.
*   **Risk:** Bir ajan veri yazdığı sırada ikinci bir ajan veriyi okuyup tekrar yazarsa, ilk işlem "overwritten" (üzerine yazılmış) olur.
*   **Öneri:** Veritabanı işlemleri için `Mutex` (mutex lock) mekanizması eklenmeli.

---

## 2. AJAN VE NEXUS MİMARİSİ

### 2.1 Ajanların "God Object"leşmesi
*   **Sorun:** `SatisAgent`, `KasaAgent` gibi sınıflar sadece niyet (intent) üretmiyor; doğrudan `this.db` verisine erişip, onu manipüle edip kaydediyor.
*   **Risk:** Ajanlar "yönetilen birim" olmaktan çıkıp "sistemi yöneten" birimlere dönüşüyor.
*   **Öneri:** Ajanlar sadece `Intent` üretmeli ve bu intent'ler merkezi bir `Orchestrator` tarafından işlenmelidir.

### 2.2 Intent Engine ve "Rigid Schema"
*   **Sorun:** `processIntent` fonksiyonları, veritabanı şemasına (schema) doğrudan bağlı.
*   **Risk:** Veritabanına yeni bir alan eklediğinde, 7 ayrı ajan dosyasında onlarca `map` fonksiyonunu manuel güncellemen gerekir.
*   **Öneri:** `Schema-driven` bir dönüşüm katmanı (JSON-schema validator) eklenmelidir.

---

## 3. TİP GÜVENLİĞİ VE KOD KALİTESİ

### 3.1 "Any" ve "Unknown" İhlalleri
*   **Sorun:** Kod tabanında tip güvenliği `any` veya `unknown` ile esnetilmiş.
*   **Risk:** Runtime sırasında `undefined` hataları birikiyor.
*   **Öneri:** `Zod` kütüphanesi ile tüm ajan giriş verileri ve veritabanı model şemaları runtime tip denetimine (Runtime Validation) tabi tutulmalıdır.

### 3.2 Ghost Import'lar
*   **Sorun:** `src/lib/version.ts` gibi silinmiş dosyalara yapılan import'lar.
*   **Risk:** Derleme sürecini (build-time) kirletir, karmaşık hata mesajlarına yol açar.
*   **Öneri:** `fallow` ve `eslint` kuralları ile ölü importlar otomatik temizlenmelidir.

---

## 4. GÜVENLİK VE PERFORMANS

### 4.1 Sessiz Hata Yönetimi (Silent Failures)
*   **Sorun:** `logger.warn` ile yutulan hatalar.
*   **Risk:** Kullanıcı verisinin yazılmadığını veya işlemin başarısız olduğunu hiçbir zaman öğrenemez.
*   **Öneri:** `NotificationCenter` (Toast) ile hatalar kullanıcıya "operasyonel seviyede" bildirilmelidir.

### 4.2 Güvenlik (Encryption) Yanılsaması
*   **Sorun:** `localStorage` anahtarı (`BRAND_STORAGE_KEY`) hardcoded.
*   **Risk:** Browser tarafında herhangi bir extension veya debugger, veritabanının tamamını tek satırda okuyabilir.
*   **Öneri:** Şifreleme anahtarı, `session` bazlı (kullanıcı login olduğunda oluşan) `crypto.subtle` API'si ile dinamik üretilmelidir.

---

## 5. ÖZET ÖNERİLER (Büyük Resim)

1.  **Atomik Transaction Pipeline:** `save()` işlemini `localStorage.set` olmaktan çıkarıp, `db-provider` üzerinden geçecek bir `transaction-manager` yapısına sokun.
2.  **Schema Enforcement:** Veritabanı şemasını `Zod` ile tanımlayın; ajanlar artık veriyi `map` ederken `z.parse()` kullanmak zorunda kalsın.
3.  **Hata Yayılımı:** `DomainEventBus`'ı hata sinyallerini de taşıyacak şekilde yükseltin; bir ajan hata verirse `eventBus` tüm sistemi durdurabilsin.
4.  **Test Stratejisi:** Mevcut testler (Vitest) sadece "kodun çalışıp çalışmadığını" ölçüyor; "verinin tutarlılığını" (data consistency) ölçen property-based testing (`fast-check`) sistemini ana hat haline getirin.
