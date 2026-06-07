# PARSPEL — Değişiklik Günlüğü

Tüm önemli değişiklikler bu dosyada belgelenir.

Format: [Keep a Changelog](https://keepachangelog.com/)

---

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
