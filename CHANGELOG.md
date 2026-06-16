# PARSPEL — Değişiklik Günlüğü

Tüm önemli değişiklikler bu dosyada belgelenir.

Format: [Keep a Changelog](https://keepachangelog.com/)

---

## [3.23.3] - 13 Haziran 2026

### Hata Düzeltmeleri
- Agent islemYap pipeline fix: SatisAgent/StokAgent domain servislere yönlendirildi
- cancelSale: cari bakiyesi düzeltiliyor, kasa gider kaydı ekleniyor
- returnSale: returnedAt alanı eklendi
- applyIntentResult: CashTransaction → KasaEntry dönüşümü (id, createdAt, updatedAt)
- 411 test pass, 40/40 test dosyası

## [3.23.4] - 13 Haziran 2026

### Bakım
- Cari ve Ürün sayfaları Base-Nova standartlarına modernize edildi
- Tüm inline style'lar kaldırıldı, Tailwind CSS ve shadcn/ui bileşenleri entegre edildi

## [3.23.5] - 13 Haziran 2026

### Bakım
- Products.tsx: Ekleme/Düzenleme modalı ve Toplu Fiyat modalı Tailwind + shadcn/ui'ye dönüştürüldü
- Cari.tsx: debtColor ve alacak yaşlandırma bucket renkleri class-based yapıldı

## [3.25.0] - 13 Haziran 2026

### Bakım
- 4 paralel agent ile Suppliers/Monitor/BugHunter/Bank sayfaları modülerize edildi (toplam 3421 satır monolit temizlendi)

## [3.25.1] - 14 Haziran 2026

### Hata Düzeltmeleri
- Vite HMR WebSocket port çakışması giderildi
- Dashboard React key prop uyarısı düzeltildi
- Sidebar navigasyon helper E2E iyileştirmeleri

## [3.25.2] - 14 Haziran 2026

### Bakım
- 10 lint warning, 17 test hatası, typecheck fix'leri temizlendi
- Voice NLP parser action detection iyileştirildi

## [3.26.0] - 15 Haziran 2026

### Yeni
- Rule Engine: min_stock kuralı eklendi (severity: warn)
- 16 domain servis testi (saleCompletion.test.ts)
- DB core/backup/sync coverage artırıldı

## [3.26.1] - 15 Haziran 2026

### Bakım
- Dashboard.tsx 863→398 satır (WidgetRenderer + useStatCards)
- 3005 modül build

## [3.27.0] - 15 Haziran 2026

### Bakım
- C4 Agent sadeleştirme: 4 agent DomainAgent base class altında birleştirildi
- KasaAgent/CariAgent save bug fix (processIntent sonucu kaydedilmiyordu)

## [3.28.0] - 15 Haziran 2026

### Bakım
- P2 SettingsBackup: 1191→5 modüle bölündü
- D1: save/saveGuarded ortak _save helper
- E2: SatisAgent validasyon fonksiyonları
- F1/F2: SettingsBackup useCallback + className

## [3.29.0] - 16 Haziran 2026

### Yeni
- Receivables (Alacak Takip) sayfası — gecikmiş cari alacaklar
- SaleIntent.dueDays desteği

### Hata Düzeltmeleri
- completeSale: yanlış "status: iade" fix
- CariAgent/KasaAgent AgentResponse tip hatası düzeltildi
- Login sayfası renkleri @theme bloğu ile düzeltildi

## [3.29.1] - 16 Haziran 2026

### Hata Düzeltmeleri
- Sale.dueDate type eklendi (CI typecheck)
- auditEngine: sadece payment === "cari" satışları cari bakiyeye dahil et
- cari balance güncellemesi completeSale/cancelSale/returnSale'e eklendi
- 13 yeni domain test (29 test)
- C7: excel-merge.ts 3 modüle bölündü

## [3.23.2] - 13 Haziran 2026

### Firebase Config
- Firebase config değerleri .env'ye taşındı, Firebase sync çalışır durumda

## [3.23.1] - 13 Haziran 2026

### Bakım
- AIAsistan.tsx modülerizasyonu: ChatPanel, MessageList, ActionHistory, index.tsx
- any tipleri temizlendi
- orchestrator.ts silindi (C1), processIntent + applyIntentResult kullanılıyor
- dead code temizliği (6.8): not-found.tsx, utils-tr.ts, version.ts, appConfig.ts

## [3.22.1] - 12 Haziran 2026

### Bakım
- Reports.tsx bölündü (1755→124 satır + 7 modül)
- Dashboard.tsx bölündü (1425→851 satır + 7 modül)
- Fatura.tsx bölündü → 5 alt modül
- Inline CSS → CSS Module (16 dosya, ~162 inline style)
- G4: Firebase sync Queue ile düzeltildi
- G5: Kasa/POS routing payment alanından

## [3.7.1] - 6 Haziran 2026

### Güvenlik
- B2 — Firebase'deki API key'ler artık AES-GCM ile şifreleniyor (Web Crypto API)
- B4 — localStorage kullanıcı hash cache'i AES-GCM ile şifreleniyor

### Bakım
- 135 boş catch bloğuna `logger.warn` eklendi — sessiz hatalar artık loglanıyor
- Circular dependency kırıldı: `safeReadJSON`/`safeWriteJSON`/`safeRemove` → `src/lib/safeIO.ts`
- `storageQuota.ts` kaldırıldı (ölü kod): `listKeysBySize` kullanılmıyordu
- `src/lib/agentConfig.ts` → `src/config/agentConfig.ts` taşındı
- `src/db/indexeddb.ts` → `src/lib/db/indexeddb.ts` taşındı
- 5 unused export kaldırıldı (`saveAgentSettings`, `setAgentEnabled`, `ParspelDB`, `AgentAuditRecord`, `DbSnapshot`)
- Notlar bölümüne seed API notu eklendi (LLM anahtarları)

---

## [3.7.3] - 7 Haziran 2026

### Hata Düzeltmeleri
- `<form>` onSubmit yapısına geçirildi — native form davranışı, password manager uyumu iyileşti
- Caps Lock uyarısı eklendi (şifre alanında `getModifierState`)
- Misafir giriş butonu artık sadece hata durumunda değil, `ready` modunda da gösteriliyor
- Retry butonuna `disabled={loading}` eklendi — çift tıklama koruması
- Ölü CSS sınıfları temizlendi (`.login-connecting-dot`, `.login-connecting-row`)
- Demo/kayıt butonlarına `type="button"`, giriş butonuna `type="submit"` eklendi
- Remote URL `parspel/parspel` → `outhesab/2` düzeltildi (push hatası giderildi)

---

## [3.7.2] - 7 Haziran 2026

### Hata Düzeltmeleri
- Hızlı login (Demo Hesap) stale closure bug'ı giderildi: `handleLogin` artık parametre alıyor, demo butonu direkt `handleLogin('demo29605', 'demo1234')` çağırıyor

---

## [3.7.0] - 28 Mayıs 2026

### Eklenen
- Premium tema sistemi: 3 tema (Corporate Enterprise, Modern Dark, Elegant Light)
- CSS variable token sistemi (OKLCH): 40+ premium değişken
- Layout bileşen ayrıştırması: 7 bileşen ayrıldı

### İyileştirme
- Dashboard ve Settings sayfalarında hardcoded renkler CSS var ile değiştirildi

---

## [3.6.0] - 26 Mayıs 2026

### Eklenen
- Tedarikçi performans skoru
- Raporlar özel rapor oluşturucu
- Arama debounce (200ms)

---

## [3.5.0] - 26 Mayıs 2026

### Eklenen
- Toplu fiyat güncelleme
- Anlık kâr göstergesi
- PDF fatura yazdırma
- Müşteri segmentasyonu (VIP/Normal/Riskli)
- Banka CSV yükleme + AI eşleme
- Pelet tüketim sayacı

---

## [3.4.0] - 26 Mayıs 2026

### Eklenen
- Kasa gün sonu sayım formu
- Çizelge yaklaşan 7 gün paneli
- Stok ABC analizi + ölü stok tespiti
- Anomali sağlık skoru gauge
- Alacak yaşlandırma paneli
- Isı haritası (saat×gün)

---

## [3.3.0] - 26 Mayıs 2026

### Eklenen
- Ürün detay sayfası (/urunler/:id)
- Satış detay sayfası (/satis/:id)
- Cari ekstre sayfası (/cari/:id)
- Ortak emanet sayfası
- AI eylem günlüğü sayfası

---

## [3.2.0] - 26 Mayıs 2026

### İyileştirme
- Ana JS bundle %43 küçültüldü (433KB → 245KB)
- Firebase SDK ayrı chunk'a taşındı
- PWA reaktivasyonu (Service Worker + manifest)

---

## [3.1.0] - 21 Mayıs 2026

### Eklenen
- Android launcher ikonları
- Bildirim ikonu

### İyileştirme
- Android manifest izinleri tamamlandı
- Capacitor config production-safe yapıldı

---

## [3.0.0] - 9 Mayıs 2026

### Eklenen
- Multi-agent altyapısı
- IndexedDB snapshot yazma/geri yükleme
- AI aksiyon fallback zinciri

---

Daha eski değişiklikler için `src/lib/changelog.ts` dosyasına bakın.
