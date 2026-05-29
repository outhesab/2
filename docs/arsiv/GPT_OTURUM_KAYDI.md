# PARSPEL — GPT Çalışma Davranışı Analizi

> Tarih: 26 Mayıs 2026
> Bağlam: Codex CLI (GPT-5.5, reasoning: xhigh) ile Faz 1 geliştirme oturumu
> Oturum: 16:16 - 17:55 (yerel), ~7.6M token tüketildi, rate limit nedeniyle sonlandı

---

## 1. Çalışma Ortamı

### 1.1 Platform
- **Agent**: Codex CLI v0.128.0
- **Model**: GPT-5.5 → GPT-5.4 (plan mode, oturum sonu)
- **Reasoning effort**: `xhigh` (aşırı yüksek) → `medium` (plan mode geçişi)
- **Sandbox**: `workspace-write` (yalnızca proje + memories dizinlerine yazma)
- **Network**: Kısıtlı (erişim yok)
- **İzin modeli**: `prefix_rule` escalation ile komut onayları kalıcı hale getiriliyor

### 1.2 Proje
- **Kök dizin**: `C:\Users\PARS\Desktop\clean-project\`
- **Framework**: React + TypeScript + Vite (PWA)
- **State yönetimi**: useDB hook (localStorage + IndexedDB + Firebase)
- **Routing**: wouter (lazy loading ile)
- **Test**: `kapsamli-senaryo.test.ts` (kapsamlı senaryo testi)
- **Build**: pnpm, esbuild minify, manualChunks

---

## 2. Oturum Akışı

```
16:16  Oturum başlangıcı (PID 9456)
      ↓
16:16  Proje analizi: SYSTEM_CONTEXT.md, PARSPEL_SITEMAP_v1.md okundu
      ↓
      Faz 1 planlaması: 5 yeni sayfa + veri modeli + routing
      ↓
16:xx  aiActionLog veri modeli eklemesi (types/index.ts)
      ↓
16:xx  Migration: core.ts, dbDefaults.ts, changelog.ts güncellendi
      ↓
16:xx  App.tsx routing güncellemesi: 5 yeni rota + TAB_PATHS navigation sistemi
      ↓
16:45  ProductDetail.tsx yazıldı (10.908 bayt)
      ↓
16:47  SaleDetail.tsx yazıldı (11.548 bayt)
      ↓
16:49  CariDetail.tsx yazıldı (10.172 bayt)
      ↓
16:52  AIEylemLog.tsx yazıldı (8.356 bayt)
      ↓
16:55  Products.tsx, Sales.tsx, Cari.tsx bağlantı güncellemeleri
      ↓
17:11  OrtakEmanet.tsx yazıldı (11.405 bayt) [en son sayfa]
      ↓
17:xx  ESLint doğrulaması: 0 hata, 5 warning (önceden varolan)
      ↓
17:xx  ESLint warning'leri temizleme çalışması (kapsamli-senaryo.test.ts)
      ↓
17:55  "2.faza başla" komutu → rate limit hatası → PLAN MODE (GPT-5.4) → tekrar limit
      ↓
17:55  Oturum sonu. "31 Mayıs 2026 11:14'ten sonra tekrar dene" mesajı
```

---

## 3. Yapılan Değişiklikler (Detaylı)

### 3.1 Yeni Dosyalar (5 adet, untracked)

| Dosya | Boyut | Açıklama |
|-------|-------|----------|
| `src/pages/ProductDetail.tsx` | 10.9 KB | Ürün detay: stok, satış kâr analizi, stok hareketleri, alarm eşiği |
| `src/pages/SaleDetail.tsx` | 11.5 KB | Satış detay: ürünler, bağlı kayıtlar (kasa/fatura/stok), denetim izi, iade/iptal |
| `src/pages/CariDetail.tsx` | 10.2 KB | Cari detay: kronolojik ekstre, bakiye trend grafiği, gecikmiş taksit uyarısı |
| `src/pages/OrtakEmanet.tsx` | 11.4 KB | Ortak emanet takibi: emanet/iade kaydı, kasa + cari senkron, bakiye karşılaştırma |
| `src/pages/AIEylemLog.tsx` | 8.4 KB | AI aksiyon günlüğü: filtreleme, durum/model etiketleri, geri alma |

### 3.2 Değiştirilen Dosyalar (13 adet)

| Dosya | Değişiklik |
|-------|------------|
| `src/App.tsx` | 5 yeni lazy import + 5 rota + TAB_PATHS navigation sistemi (function getActiveTabFromLocation) + undo geçişi |
| `src/types/index.ts` | AIActionLogEntry arayüzü eklendi + DB.aiActionLog alanı |
| `src/hooks/db/core.ts` | aiActionLog: [] default + loadFromStorage migration |
| `src/lib/dbDefaults.ts` | aiActionLog: [] eklendi |
| `src/lib/changelog.ts` | v3.3.0 sürümü: Faz 1 değişiklikleri belgelendi |
| `src/pages/Products.tsx` | useLocation import + "Detay" butonu (yeşil, `/urunler/:id` yönlendirme) |
| `src/pages/Sales.tsx` | useLocation import + "Detay" butonu (mavi, `/satis/:id` yönlendirme) + iade/iptal butonları aynı container |
| `src/pages/Cari.tsx` | useLocation import + satır tıklaması `/cari/:id` yönlendirme |
| `src/pages/AIAsistan.tsx` | ESLint düzeltmeleri (lf crlf) |
| `src/lib/kapsamli-senaryo.test.ts` | ESLint düzeltmeleri |
| `src/lib/deepseek.test.ts` | ESLint düzeltmeleri |
| `src/lib/vite-manual-chunks.ts` | ESLint düzeltmeleri |
| `README.md`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vite.config.ts` | CRLF normalizasyonu |

### 3.3 Veri Modeli

```typescript
interface AIActionLogEntry {
  id: string;
  createdAt: string;
  model: 'deepseek' | 'claude' | 'gemini' | 'offline';
  mode: 'manual' | 'auto';
  messageIndex?: number;
  actionType: string;
  label: string;
  status: 'applied' | 'blocked' | 'failed';
  dangerous?: boolean;
  affectedIds?: string[];
  notes?: string[];
  error?: string;
}
```

DB'e eklendi: `aiActionLog?: AIActionLogEntry[]`

### 3.4 Yeni Rotalar

```
/urunler/:id       → ProductDetail   [{id, label: "Ürün Detay"}]
/satis/:id         → SaleDetail      [{id, label: "Satış Detay"}]
/cari/:id           → CariDetail      [{id, label: "Cari Detay"}]
/ortak-emanet       → OrtakEmanet     [{id: "ortakEmanet", label: "Ortak Emanet", group: "Tedarik"}]
/ai/eylem-log       → AIEylemLog      [{id: "aiEylemLog", label: "AI Eylem Log", group: "Sistem"}]
```

### 3.5 Navigation Sistemi

TAB_PATHS sözlüğü eklendi → tüm sidebar navigasyonu `/tabId` yerine tanımlı path'leri kullanıyor.
`getActiveTabFromLocation()` → detay sayfalarında (örn `/urunler/:id`) doğru sidebar highlight'ı için.

---

## 4. GPT Çalışma Davranışı (Codex CLI)

### 4.1 Güçlü Yönler
- **Yüksek token tüketimi**: Her adımda reasoning yaparak doğru kararlar alıyor (xhigh effort)
- **Proje bağlamını derinlemesine anlama**: SYSTEM_CONTEXT.md, types/index.ts, mevcut page'leri tarayarak tutarlı kod yazıyor
- **Veri modeli + UI + routing entegrasyonu**: Tek seansta tüm katmanları güncelliyor
- **ESLint doğrulaması**: Kod yazdıktan sonra mutlaka lint + typecheck çalıştırıyor
- **Changelog disiplini**: Her sürümde changelog.ts güncellemesi yapıyor
- **İzin yönetimi**: prefix_rule ile komut onaylarını kalıcı hale getiriyor

### 4.4 Sınırlamalar
- **Rate limit**: Free plan'de ~7.6M token sonrası bloke (31 Mayıs'a kadar beklemeli)
- **Sandbox kısıtlamaları**: Network erişimi yok (npm install / API çağrıları çalışmaz)
- **CRLF sorunu**: Git'te LF→CRLF uyarıları (Windows ortamı)
- **Context penceresi**: 258K token; 88% dolulukta yavaşlama başlıyor

---

## 5. Eksik / Bekleyen İşler

### 5.1 Faz 1 Tamamlanmamış
- [ ] ESLint warning'leri temizlenecekti (`_createdAt`, `_receiptId`, `InfoRow`, `genId`, `useSyncExternalStore`)
- [ ] `pnpm run typecheck` çalıştırılmadı
- [ ] `pnpm run test:run` çalıştırılmadı
- [ ] Derleme doğrulaması (`pnpm run build`) yapılmadı

### 5.2 Başlanmamış (Faz 2+)
- [ ] Satış listesinde "Detay" butonunun iade/iptal ile yan yana durması (Sales.tsx:500-510)
- [ ] Cari listesinde eski `setDetailId` fonksiyonu artık kullanılmıyor olabilir
- [ ] ProductDetail'de `save` prop'u geçiliyor ama kullanımı sadece minStock güncellemede
- [ ] AIEylemLog'daki `undo` fonksiyonunun gerçek DB geri alma ile entegrasyon testi

---

## 6. Kritik Notlar

### 6.1 Rate Limit Durumu
```
Kullanım: ~88% (7.6M / ~8.6M token)
Sıfırlanma: 31 Mayıs 2026, 11:14 UTC
```

### 6.2 Önerilen Devam Stratejisi
1. **Manuel doğrulama**: `pnpm run typecheck`, `pnpm run build`, `pnpm run test:run`
2. **CRLF düzeltme**: `.gitattributes` ile `* text=auto` normalize
3. **Faz 2 planı**: Rate limit sıfırlanınca (31 Mayıs) Codex CLI ile devam
4. **Alternatif**: opencode CLI ile (bu araç) manuel kodlama

### 6.3 Commits
Son commit: `41d12be chore: remove workflow files from git`
Tüm Faz 1 değişiklikleri henüz commit'lenmemiş (untracked + modified)

---

## 7. Kod Şablonları (Design Pattern)

Tüm yeni sayfalarda kullanılan ortak pattern:

```typescript
interface Props { db: DB; save?: (fn: (prev: DB) => DB) => void; undo?: () => boolean; }

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
};

const muted: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.86rem",
};

// Metric bileşeni (tüm sayfalarda ortak)
// row bileşeni (liste satırları)
// useLocation + setLocation ile navigasyon
```
