# CODER TASK — SESSION 1 (Hızlı Kazanımlar)

> **Agent:** qwen3-coder:free  
> **Tahmini Süre:** 2-3 saat  
> **Dosya Sayısı:** ~25 dosya  
> **Risk Seviyesi:** 🟢 Düşük  

---

## GENEL TALİMATLAR

### Zorunlu Okuma
1. `AGENTS.md` — tüm kurallar
2. `WEEKLY_PLAN.md` — görev detayları
3. Her görev için **DEĞİŞİKLİK PROTOKOLÜ** takip et:
   - ADIM 1: Baseline al (`pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build`)
   - ADIM 2: Kapsam belirle
   - ADIM 3: Değişikliği yap
   - ADIM 4: `src/lib/changelog.ts` güncelle
   - ADIM 5: Doğrulama (CI pipeline tekrar çalıştır)
   - ADIM 6: Commit

### Kritik Kurallar
- ❌ Korunan dosyalara dokunma (ruleEngine.ts, AgentBus.ts, vb.)
- ❌ `any` tip kullanma
- ❌ console.log bırakma — `logger.ts` kullan
- ❌ Inline style (dinamik değerler hariç)
- ✅ Her değişiklikten sonra CI pipeline çalıştır
- ✅ `src/lib/changelog.ts` güncellemeyi unutma

---

## GÖREV 1: Vitest Exclude Listesi Temizliği (5.12)

### Hedef
`vite.config.ts` içindeki test exclude listesinden çıkarılabilir testleri aktif et.

### Adımlar
1. `vite.config.ts` dosyasını oku
2. `test.exclude` array'ini kontrol et
3. Şu dosyaların test versiyonları varsa ve çalışır durumdaysa exclude'dan çıkar:
   - Tüm `.test.ts` dosyaları tarama
   - Exclude listesinde olan ama artık mevcut olmayan dosyaları temizle
4. Test suite çalıştır: `pnpm run test:run`
5. Başarılı ise commit

### Başarı Kriteri
- ✅ Exclude listesi minimal
- ✅ Tüm testler pass ediyor
- ✅ CI pipeline temiz

### Changelog Entry
```typescript
{
  version: '3.7.4',
  date: '12 Haziran 2026',
  title: 'Vitest exclude listesi temizlendi',
  summary: 'Artık gerekmeyen test exclude kuralları kaldırıldı.',
  changes: [
    { type: 'duzeltme', text: 'Vitest config exclude listesi optimize edildi (Görev 5.12)' },
  ],
}
```

### Tahmini Süre
⏱️ 15-20 dakika

---

## GÖREV 2: Dead Code Temizliği (6.8)

### Hedef
Projede bulunan 5 yorum bloğunu ve kullanılmayan kodu temizle.

### Adımlar
1. Şu pattern'leri ara:
   ```typescript
   // TODO: ...
   // FIXME: ...
   // XXX: ...
   /* 
      Çok satırlı yorum blokları
      Kullanılmayan eski kodlar
   */
   ```

2. Şu dosyalarda özellikle kontrol et:
   - `src/pages/*.tsx` — eski component kalıntıları
   - `src/lib/*.ts` — kullanılmayan utility fonksiyonlar
   - `src/agents/*.ts` — deprecated metodlar

3. **Dikkat:** 
   - JSDoc yorumları silme
   - `AGENTS.md` referans edilen korunan metodları silme
   - Sadece gerçekten kullanılmayan kodu sil

4. Her silme sonrası test çalıştır

### Başarı Kriteri
- ✅ En az 5 yorum bloğu/dead code temizlendi
- ✅ Testler pass ediyor
- ✅ Lint temiz

### Changelog Entry
```typescript
{
  version: '3.7.4',
  date: '12 Haziran 2026',
  title: 'Dead code temizliği',
  summary: 'Kullanılmayan kod blokları ve yorumlar temizlendi.',
  changes: [
    { type: 'duzeltme', text: 'Dead code ve yorum blokları temizlendi (Görev 6.8)' },
  ],
}
```

### Tahmini Süre
⏱️ 30-45 dakika

---

## GÖREV 3: aria-label Toplu Ekleme (J1)

### Hedef
Tüm icon button'lara accessibility için `aria-label` ekle.

### Kapsam
`src/pages/` altındaki tüm sayfalarda:
- `<Button>` ile sadece ikon içeren
- `<IconButton>`
- `<button className="icon-*">`
- Metin içermeyen tüm button elementleri

### Pattern
```typescript
// ÖNCE
<Button onClick={handleSave}>
  <SaveIcon />
</Button>

// SONRA
<Button aria-label="Kaydet" onClick={handleSave}>
  <SaveIcon />
</Button>
```

```typescript
// ÖNCE
<button className="icon-btn" onClick={handleDelete}>
  <TrashIcon />
</button>

// SONRA
<button 
  className="icon-btn" 
  aria-label="Sil" 
  onClick={handleDelete}
>
  <TrashIcon />
</button>
```

### Label Önerileri (Context'e göre)
| Icon | aria-label |
|------|------------|
| SaveIcon | "Kaydet" |
| EditIcon | "Düzenle" |
| DeleteIcon / TrashIcon | "Sil" |
| CloseIcon / XIcon | "Kapat" |
| MenuIcon | "Menüyü aç" |
| SearchIcon | "Ara" |
| SettingsIcon | "Ayarlar" |
| PlusIcon | "Ekle" |
| DownloadIcon | "İndir" |
| UploadIcon | "Yükle" |
| RefreshIcon | "Yenile" |
| PrintIcon | "Yazdır" |

### Adımlar
1. `src/pages/` altındaki tüm `.tsx` dosyalarını tara
2. Icon-only button'ları tespit et
3. Her birine context'e uygun `aria-label` ekle
4. Lint çalıştır: `pnpm run lint:fix`
5. Build kontrol et: `pnpm run build`

### Özel Durumlar
- Eğer button zaten `title` prop'u varsa → `aria-label={title}` yap
- Eğer tooltip varsa → tooltip text'i kullan
- Eğer açıklayıcı text child'ı varsa → aria-label ekleme (zaten erişilebilir)

### Başarı Kriteri
- ✅ En az 50 button'a aria-label eklendi
- ✅ Lint warning kalmadı
- ✅ Accessibility kontrolleri geçiyor

### Changelog Entry
```typescript
{
  version: '3.7.4',
  date: '12 Haziran 2026',
  title: 'Accessibility iyileştirmesi',
  summary: 'Tüm icon button\'lara aria-label eklendi.',
  changes: [
    { type: 'iyilestirme', text: 'Icon button\'lara aria-label eklendi - accessibility (Görev J1)' },
  ],
}
```

### Tahmini Süre
⏱️ 1.5-2 saat

---

## SEANS SONU KONTROL LİSTESİ

### ✅ Tamamlanması Gerekenler
- [ ] Görev 1: Vitest exclude temizlendi
- [ ] Görev 2: Dead code temizlendi (5+ blok)
- [ ] Görev 3: aria-label eklendi (50+ button)
- [ ] `src/lib/changelog.ts` güncellendi (3 entry)
- [ ] CI pipeline pass etti: `pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build`
- [ ] Commit yapıldı: `git add . && git commit -m "chore: session 1 görevleri tamamlandı (5.12, 6.8, J1)"`

### 📊 Beklenen Metrikler
- Değişen dosya sayısı: ~25 dosya
- Eklenen satır: ~200 (aria-label'lar)
- Silinen satır: ~100 (dead code)
- Test durumu: ✅ Pass
- Build boyutu: Değişmez veya hafif azalır

---

## SORUN GİDERME

### Eğer Lint Fail Ederse
```bash
pnpm run lint:fix
# Manuel düzeltme gerekirse: import sırası, unused vars
```

### Eğer Test Fail Ederse
```bash
# Hangi test fail etti?
pnpm run test:run --reporter=verbose

# Tek test çalıştır
pnpm exec vitest run <dosya-yolu>
```

### Eğer Build Fail Ederse
```bash
# Type hataları kontrol et
pnpm run typecheck

# Hangi dosyada hata var?
pnpm run build --mode development
```

### Rollback Gerekirse
```bash
git revert HEAD --no-edit
# Problemi düzelt, tekrar dene
```

---

## NOT

Bu görevler **paralel yapılabilir** ama sırayla yapmak daha güvenli:
1. Vitest (en basit, warm-up)
2. Dead code (orta, kod okuma alıştırması)
3. aria-label (en büyük, pattern matching)

**Session 1 bitince** → `CODER_TASK_SESSION_2.md` başlat.
