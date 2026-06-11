# CODER QUICK TASK — 1-2 Saatlik Hızlı Görev

> **Agent:** qwen3-coder:free  
> **Süre:** 1-2 saat  
> **Dosya:** 6-8 dosya  
> **Risk:** 🟢 Çok Düşük  

---

## GÖREV PACKAGE: Hızlı Kazanımlar (3 Mini Görev)

### 📋 Görev Listesi
1. **Vitest exclude temizliği** (15 dk)
2. **Dead code temizliği** (30 dk)
3. **Loading spinner ekle** (20 dk)

**Toplam:** ~1 saat 5 dakika

---

## ⚙️ BAŞLAMADAN ÖNCE

### Zorunlu Okuma
- `AGENTS.md` — bölüm 0, 1, 2 (kurallar, protokol, komutlar)

### Baseline Kontrol
```bash
cd 2
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```

Hepsi **pass** olmalı. Fail varsa **DUR**, kullanıcıya bildir.

---

## GÖREV 1: Vitest Exclude Temizliği (5.12)

### Hedef
`vite.config.ts` içindeki test exclude listesini temizle.

### Adımlar

1. **Dosyayı oku:**
   ```bash
   # Lokasyon: ./2/vite.config.ts
   ```

2. **Exclude array'ini bul:**
   ```typescript
   test: {
     exclude: [
       '**/node_modules/**',
       '**/dist/**',
       // ... diğer excludes
     ]
   }
   ```

3. **Temizle:**
   - Artık mevcut olmayan dosyaları çıkar
   - `node_modules`, `dist` gibi standart excludes kalsın
   - Gereksiz glob pattern'leri sil

4. **Test çalıştır:**
   ```bash
   pnpm run test:run
   ```

5. **Commit:**
   ```bash
   git add vite.config.ts
   git commit -m "chore: vitest exclude listesi temizlendi (5.12)"
   ```

### Başarı Kriteri
- ✅ Exclude listesi minimal
- ✅ Testler pass ediyor

### Tahmini Süre
⏱️ 15 dakika

---

## GÖREV 2: Dead Code Temizliği (6.8)

### Hedef
5 yorum bloğu veya kullanılmayan kodu temizle.

### Pattern'ler

Şunları ara ve sil:

```typescript
// TODO: eski not
// FIXME: yapılacak
// XXX: dikkat
// HACK: geçici çözüm

/* 
   Çok satırlı yorum bloğu
   Kullanılmayan eski kod
*/

// Commented out code:
// function oldFunction() { ... }
```

### Arama Stratejisi

```bash
# TODO'ları bul
grep -r "// TODO" src/

# FIXME'leri bul
grep -r "// FIXME" src/

# Commented out code bul
grep -r "// function" src/
grep -r "// const" src/
```

### Dikkat

❌ **SILME:**
- JSDoc yorumları (`/** ... */`)
- Fonksiyon açıklamaları
- License header'ları
- `AGENTS.md`'de belirtilen korunan kod

✅ **SIL:**
- Eski TODO notları
- Yorum satırına alınmış kod
- "Geçici" işaretli eski kodlar

### Hedef Dosyalar (öncelik sırasıyla)

1. `src/pages/*.tsx` — eski UI kodları
2. `src/lib/*.ts` — kullanılmayan utility
3. `src/agents/*.ts` — deprecated metodlar

### Adımlar

1. Yukarıdaki grep komutlarıyla tara
2. Her bulduğun yorum/kodu incele
3. Gerçekten gereksizse sil
4. Her silmeden sonra: `pnpm run lint`
5. Tüm siler bitince: `pnpm run test:run`

### Commit

```bash
git add .
git commit -m "chore: dead code ve yorum blokları temizlendi (6.8)"
```

### Başarı Kriteri
- ✅ En az 5 yorum/kod bloğu silindi
- ✅ Lint temiz
- ✅ Testler pass

### Tahmini Süre
⏱️ 30 dakika

---

## GÖREV 3: Loading Spinner Ekle (J5)

### Hedef
`index.html`'de boş `<div id="root"></div>` yerine loading spinner göster.

### Mevcut Durum

```html
<!-- index.html -->
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

### Yeni Durum

```html
<body>
  <div id="root">
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
      font-family: system-ui, -apple-system, sans-serif;
      color: #374151;
    ">
      <div style="
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <p style="margin-top: 16px; font-size: 14px;">Yükleniyor...</p>
    </div>
  </div>
  
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  
  <script type="module" src="/src/main.tsx"></script>
</body>
```

### Adımlar

1. `index.html` dosyasını aç
2. `<div id="root">` içine yukarıdaki spinner HTML'i ekle
3. `<style>` tag'ini `</body>`'den önce ekle
4. Tarayıcıda test et:
   ```bash
   pnpm run dev
   # http://localhost:3000 aç, sayfa yüklenirken spinner görünmeli
   ```

### Commit

```bash
git add index.html
git commit -m "feat: loading spinner eklendi (J5)"
```

### Başarı Kriteri
- ✅ Spinner görünüyor
- ✅ React yüklendikten sonra kaybolur
- ✅ Mobilde de düzgün

### Tahmini Süre
⏱️ 20 dakika

---

## CHANGELOG GÜNCELLE

Tüm görevler bitince `src/lib/changelog.ts` dosyasına ekle:

```typescript
{
  version: '3.7.4',
  date: '12 Haziran 2026',
  title: 'Hızlı iyileştirmeler',
  summary: 'Vitest config temizlendi, dead code silindi, loading spinner eklendi.',
  changes: [
    { type: 'duzeltme', text: 'Vitest exclude listesi optimize edildi (5.12)' },
    { type: 'duzeltme', text: 'Dead code ve yorum blokları temizlendi (6.8)' },
    { type: 'iyilestirme', text: 'Loading spinner eklendi - UX iyileştirmesi (J5)' },
  ],
}
```

**Konum:** `./2/src/lib/changelog.ts` — **EN ÜSTE** ekle.

---

## FİNAL KONTROL

### CI Pipeline
```bash
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm run build
```

Hepsi **PASS** olmalı. Herhangi biri fail ederse:
```bash
git revert HEAD
# Hatayı düzelt, tekrar dene
```

### Commit
```bash
git add .
git commit -m "chore: hızlı iyileştirmeler tamamlandı (5.12, 6.8, J5)"
```

---

## BAŞARI KRİTERLERİ

- [ ] Vitest exclude temizlendi
- [ ] En az 5 dead code/yorum silindi
- [ ] Loading spinner eklendi ve çalışıyor
- [ ] `changelog.ts` güncellendi
- [ ] CI pipeline pass etti (lint, typecheck, test, build)
- [ ] Commit yapıldı

---

## SORUN GİDERME

### Eğer Test Fail Ederse
```bash
# Hangi test?
pnpm run test:run --reporter=verbose

# Tek test çalıştır
pnpm exec vitest run <test-file>
```

### Eğer Lint Fail Ederse
```bash
pnpm run lint:fix
```

### Eğer Build Fail Ederse
```bash
pnpm run typecheck
# Type hatalarını düzelt
```

---

## NOT

Bu 3 görev **bağımsız** — herhangi biri fail ederse, diğerlerine geç.

**Toplam süre:** 1-1.5 saat

**Coder agent çalışırken,** kullanıcı benimle başka analiz yapabilir (paralel çalışma).
