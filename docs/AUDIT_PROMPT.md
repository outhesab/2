# Proje Denetim Promptu

Aşağıdaki denetimi PARSPEL projesi için yap. Proje bir **offline-first PWA** (React + TypeScript + Vite), IndexedDB (Dexie) ile veri depolama, Firebase Firestore ile senkronizasyon, ve multi-AI-agent (DeepSeek, Claude, Gemini) mimarisi kullanıyor. 36+ sayfa, wouter routing, CSS variable token tema sistemi.

Sen bir **web geliştirme ve tasarım uzmanısın**. Bulgularını sistematik, önceliklendirilmiş ve uygulanabilir şekilde raporla.

## 1. Proje Yapısı & Mimari (Folder Structure & Architecture)

- `src/` dizin yapısını haritala (pages, components, hooks, lib, agents, types, stores)
- Eksik organizasyon pattern'lerini veya best practice ihlallerini tespit et (örn. sayfa içinde şişmiş bileşenler, tek sorumluluk ihlali)
- Yanlış yerleştirilmiş veya ait olmadığı yerde duran dosyaları işaretle
- Klasör hiyerarşisi iyileştirme önerileri sun
- `src/pages/excelmerge/` alt dizin yapısını ayrı değerlendir
- `src/components/ui/` (shadcn) ile `src/components/` (özel bileşenler) ayrışmasını kontrol et

## 2. Görsel / UI Analizi (Visual/UI Analysis)

- CSS variable token sistemi tutarlı mı? (`src/index.css` — 40+ değişken)
- Hardcoded renkler (inline style) hala kullanılıyor mu? Hangi sayfalarda?
- Tema geçişleri (3 QuantumLink teması) sorunsuz çalışıyor mu?
- Erişilebilirlik sorunları: kontrast oranları, alt text eksikleri, semantik HTML kullanımı
- Tasarım borcu: güncellenmemiş, eski veya tutarsız stiller
- Responsive tasarım sorunları (özellikle mobil PWA görünümü)
- Karanlık/aydınlık tema geçişinde kopma veya flicker var mı?
- Yazdırma görünümleri (Fatura, Kasa gün sonu) düzgün çalışıyor mu?
- Eski tipografi/boşluk stilleriyle yenileri arasında tutarsızlık var mı?
- **Inline style analizi:**
  - 30 sayfada toplam **2640 hardcoded hex/rgba renk değeri** var — bunlar tema sistemini işlevsiz kılıyor
  - Sadece 3 sayfada (Dashboard varyantları + Settings) CSS variable (`var(--...)`) kullanılıyor
  - Inline style kullanımını sayfa bazında raporla, en çok hardcoded renk içeren ilk 5 sayfayı belirt
  - Hardcoded renkleri CSS variable'a çevirmenin iş yükü/risk tahminini yap (sayfa bazında saat tahmini)
  - Kademeli geçiş stratejisi öner: yeni sayfalarda CSS variable zorunlu, eski sayfalara dokunma

## 3. Performans Testi (Comprehensive Performance Testing)

### 3a. IndexedDB Performansı (En Kritik)
- `db.products.filter()`, `db.sales.filter()` gibi linear scan'ler büyük veri setlerinde (1000+ kayıt) nasıl performans gösteriyor?
- `useDB()` hook'u her sayfada tüm DB'i okuyor — gereksiz re-render var mı?
- `useMemo` ve `useCallback` kullanımı yeterli mi? Eksik Memorizasyon tespit et
- IndexedDB sorgularında index kullanımı var mı? (Dexie index önerileri)

### 3b. Firebase Firestore Sync
- Offline→online geçişte çakışma yönetimi nasıl çalışıyor?
- Firestore okuma/yazma sayısı optimize edilmiş mi?
- Firebase SDK chunk'ı ayrılmış mı? (mevcut: `firebase` ayrı chunk)

### 3c. AI Agent Performansı
- DeepSeek/Claude/Gemini API çağrıları UI blocking yapıyor mu?
- Streaming response kullanılıyor mu?
- API timeout/retry stratejisi var mı?
- Fallback zinciri (offline→online) bekleme süresi kabul edilebilir mi?

### 3d. Build & Bundle Analizi
- CSS/JS dosya boyutları (mevcut: ana bundle 245KB + Firebase 163KB)
- Kullanılmayan bağımlılıklar veya dead code var mı?
- Render-blocking kaynaklar var mı?
- Code splitting stratejisi yeterli mi? (mevcut: React.lazy() + manualChunks)
- Tree-shaking engelleri var mı?

## 4. Service Worker & PWA Sağlığı
- Service Worker asset cache policy (CacheFirst, NetworkOnly) doğru yapılandırılmış mı?
- Offline navigasyon çalışıyor mu?
- PWA manifest eksiksiz mi?
- Önbellek temizleme/boyut yönetimi var mı?

## 5. Optimizasyon Fırsatları (Performance Optimization)

Önceliklendir: **Hızlı kazançlar** vs. **Büyük yeniden yazımlar**

| Öncelik | Kategori | Örnek |
|---------|----------|-------|
| High | IndexedDB index ekleme | Linear scan → Dexie index |
| High | useDB selector optimizasyonu | Tüm DB yerine sadece ihtiyaç duyulan koleksiyon |
| Medium | AI API streaming | Blok yanıt yerine stream |
| Medium | Lazy loading genişletme | Tüm page'ler zaten lazy, component seviyesine indir |
| Low | CSS purify | Kullanılmayan CSS variable'ları temizle |

## 6. Rapor Formatı (Deliverable)

Yapılandırılmış rapor:

1. **Yönetici Özeti** — Kritik bulgular (max 5 madde)
2. **Kategoriye Göre Detaylı Bulgular** (yukarıdaki 5 bölüm)
3. **Öneriler** — Her öneri için: etki tahmini + uygulama zorluğu + öncelik
4. **Hızlı Kazançlar** — 1 saat altında çözülebilecek sorunlar
5. **Uygulama Yol Haritası** — Haftalık/kısa/orta plan
