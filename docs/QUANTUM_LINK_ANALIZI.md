# 🔬 QuantumLink — Kapsamlı Analiz Raporu

**Tarih:** 2026-06-20
**Kaynak:** `src/components/QuantumLink.tsx` (642 satır, 24KB)

---

## Kimlik Kartı

| Özellik | Değer |
|---------|-------|
| **Dosya** | `src/components/QuantumLink.tsx` |
| **Boyut** | 642 satır, 24KB (projenin en büyük UI bileşeni) |
| **Tanım** | Floating AI asistan paneli (Web Speech API + Agent sistemi) |
| **Kullanıldığı yer** | `App.tsx:499` — `<QuantumLink db={db} />` |
| **Tema** | 3 seçilebilir renk paleti: Mavi (varsayılan), Amber, Yeşil |
| **Animasyon** | Framer Motion (`AnimatePresence`, spring geçişler) |
| **İkonlar** | lucide-react (`BrainCircuit`, `X`, `Mic`, `MicOff`, `Palette`) |
| **Changelog referansları** | 12 ayrı entry (varlık, agent entegrasyonu, tema yenileme, tip düzeltmeleri) |
| **İlk eklenme** | changelog: "QuantumLink Aktif" |
| **Son büyük değişiklik** | Güvenlik düzeltmeleri + 3 tema paleti (Mavi/Amber/Yeşil) |
| **Kod metrikleri** | ~605 satır (CODE_ANALYSIS.csv), inline-style ağırlıklı |

---

## 🏗 Mimari (3 Katman)

```
┌────────────────────────────────────────────────┐
│  KATMAN 1: Ses Giriş/Çıkış (Web Speech API)   │
│  src/lib/audio.ts                              │
│  • SpeechRecognition → tr-TR, continuous=false │
│  • SpeechSynthesisUtterance → rate 1.1, tr-TR  │
│  • speak() / hasSpeechRecognition() / create() │
└────────────────────┬───────────────────────────┘
                     │ transcript
┌────────────────────▼───────────────────────────┐
│  KATMAN 2: QuantumLink Bileşeni (642 satır)   │
│  • processCommand() — komut ayrıştırma motoru  │
│  • quickReply() — yerel soru-cevap (LLM'siz)   │
│  • Sesli/giriş çıkış yönetimi                  │
│  • Tema palet sistemi + localStorage kalıcılık │
└────────────────────┬───────────────────────────┘
                     │ islemYap()
┌────────────────────▼───────────────────────────┐
│  KATMAN 3: Agent Sistemi (7 uzman agent)      │
│  src/agents/index.ts — lazy-init singleton     │
│  ├─ kasa: KasaAgent (gelir/gider)             │
│  ├─ cari: CariAgent (tahsilat/alacak)         │
│  ├─ satis: SatisAgent                          │
│  ├─ stok: StokAgent                            │
│  ├─ fatura: FaturaAgent                        │
│  ├─ rapor: RaporAgent                          │
│  └─ deep_seek: DeepSeekAgent                   │
└────────────────────────────────────────────────┘
```

---

## ⚙️ `processCommand()` — Komut İşleme Motoru

**Konum:** `QuantumLink.tsx:178-263`
**Mekanizma:** `useCallback` ile memoize edilmiş, `db` dependency'si var.

Sesli veya yazılı komutu alır, metin analizi yaparak 5 kategoriden birine yönlendirir:

| # | Kategori | Anahtar Kelimeler | Agent Çağrısı | Örnek |
|---|----------|-------------------|---------------|-------|
| 1 | **Satış** | `satış`, `sattım`, `satis` + `tutar > 0` | `kasa` → `kasa_gelir` | "sattım 1500 nakit" |
| 2 | **Gelir** | `gelir`, `tahsilat` (isimsiz) + `tutar > 0` | `kasa` → `kasa_gelir` | "5000 gelir" |
| 3 | **Gider** | `gider` + `tutar > 0` | `kasa` → `kasa_gider` | "200 gider" |
| 4 | **Tahsilat** | `tahsilat` + isim + `tutar > 0` | `cari` → `cari_tahsilat` | "tahsilat ali 3000" |
| 5 | **Soru** | Hiçbiri değilse | `quickReply()` (yerel, LLM'siz) | "kasa durumu" |

### Satış Komutu Detayı

```
"1500 nakit sattım"
    │
    ├─ Ödeme tipi çıkar: q.includes('kart') → kart / 'cari' → cari / else → nakit
    ├─ Tutar: regex (\d+[\d.,]*)\s*(tl|lira)?
    ├─ Agent çağrısı: getAgent('kasa').islemYap({
    │     action: 'kasa_gelir',
    │     payload: { amount, kasa, category: 'satis', description }
    │   })
    └─ Yanıt: speak("İşlem tamamlandı" veya "Hata oluştu")
```

### Soru Tipleri (quickReply)

Soru kategorilerinde LLM çağrısı **yok** — doğrudan `db` üzerinden hesaplama:

| Sorgu | Hesaplama | Çıktı |
|-------|-----------|-------|
| `kasa`, `para`, `bakiye` | Kasa gelir/gider net bakiyesi + nakit/banka ayrımı | 💰 Kasa Durumu |
| `stok`, `ürün` | Aktif ürünler, stok bitenler, az stoklular (ilk 3) | 📦 Stok Özeti |
| `satış`, `ciro`, `bu ay` | Ay başından itibaren satış sayısı, ciro, kâr | 📊 Bu Ay |
| `alacak`, `cari`, `müşteri` | Toplam alacak + en yüksek 3 müşteri | 👤 Alacaklar |
| Hiçbiri | Kullanılabilir komut listesi | 🤖 Quantum Link |

---

## 🎤 Ses Sistemi

### Ses Girişi (`audio.ts:18-33`)

```typescript
createSpeechRecognition(onResult, onEnd, onError) {
  instance.continuous = false;    // Tek komut, bekleme yok
  instance.lang = "tr-TR";
  instance.onresult = (e) => onResult(e.results[0][0].transcript);
  instance.onend = onEnd;
  instance.onerror = onError;
}
```

- `hasSpeechRecognition()` → browser'da `SpeechRecognition` var mı kontrolü
- YOKSA → mikrofon butonu gizlenir, sadece yazılı input kalır
- `continuous: false` → her dinleme seansı tek seferlik, otomatik durur

### Ses Çıkışı (`audio.ts:3-12`)

```typescript
speak(text: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "tr-TR";
  u.rate = 1.1;        // Hafif hızlı
  window.speechSynthesis.speak(u);
}
```

- Başarılı işlem: `speak("İşlem tamamlandı")`
- Başarısız işlem: `speak("Hata oluştu")`
- Soru yanıtı: `speak(response.replace(/[•\n]/g, ' '))`

---

## 🎨 Tema Sistemi (3 Palet)

### Palet Tanımları

```typescript
type PaletteId = 'blue' | 'amber' | 'green';
```

| Palet | `--ql-accent` (oklch) | RGB Glow | Gradient (135°) |
|-------|----------------------|----------|-----------------|
| **🔵 Mavi** (default) | `oklch(0.60 0.14 260)` | `59,130,246` | `oklch(0.60 0.14 260)` → `oklch(0.50 0.18 265)` |
| **🟠 Amber** | `oklch(0.70 0.18 85)` | `245,158,11` | `oklch(0.70 0.18 85)` → `oklch(0.60 0.18 70)` |
| **🟢 Yeşil** | `oklch(0.65 0.18 160)` | `16,185,129` | `oklch(0.65 0.18 160)` → `oklch(0.55 0.18 150)` |

### Kalıcılık

```typescript
const PALETTE_KEY = 'parspel-ql-palette';
// localStorage.getItem/setItem ile kayıt
// Hata durumunda logger.warn + varsayılan 'blue'
```

### Kullanım

```typescript
const qlStyles = {
  '--ql-accent':         /* paletteId'ye göre oklch değeri */
  '--ql-accent-rgb':     /* paletteId'ye göre RGB triplet */
  '--ql-gradient':       /* paletteId'ye göre linear-gradient */
  '--ql-accent-glow':    `rgba(var(--ql-accent-rgb), 0.4)`
} as CSSProperties;
```

Tüm alt bileşenler bu CSS variable'larını `var(--ql-*)` ile referans alır.

---

## 🧩 UI Bileşenleri (Detaylı)

### 1. Trigger Buton (sağ alt köşe)

| Property | Değer |
|----------|-------|
| **Pozisyon** | `fixed`, bottom:90, right:20 |
| **Boyut** | 52×52px, border-radius:50% |
| **Background** | `var(--ql-gradient)` |
| **Shadow** | `0 0 30px var(--ql-accent-glow)` |
| **Hover** | scale(1.1) + 40px glow |
| **Z-index** | 140 |
| **İkon** | `BrainCircuit` (22px) |

### 2. Panel

| Property | Değer |
|----------|-------|
| **Pozisyon** | `fixed`, bottom:152, right:20 |
| **Boyut** | 380×520px (responsive: max-width calc(100vw-40px)) |
| **Z-index** | 149 |
| **Class** | `quantum-glass-panel` (cam efekti) |
| **Giriş animasyonu** | opacity 0→1, y:40→0, scale:0.9→1, blur(10px)→0 (spring: damping=20, stiffness=300) |
| **Çıkış animasyonu** | opacity 1→0, y:0→20, scale:1→0.95 (0.2s easeIn) |
| **Arka plan overlay** | `fixed inset:0, z-index:148, --surface-overlay` |

### 3. Header Bileşeni

```
┌──────────────────────────────────────┐
│ ● Quantum Link       [🎨] [✕]       │
└──────────────────────────────────────┘
```

- **Nabız LED'i**: 8px daire, `var(--ql-accent)`, `pulse 2s infinite`
- **Başlık**: 0.65rem, weight:900, uppercase, letter-spacing:0.4em
- **Tema butonu**: `Palette` ikonu (14px), aktifken accent background
- **Kapatma**: `X` ikonu (14px), hover'da renk değişimi

### 4. Palette Picker (toggle ile açılıp kapanır)

```
┌──────────────────────────────────────┐
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ Mavi │  │Amber │  │Yeşil │      │
│  └──────┘  └──────┘  └──────┘      │
└──────────────────────────────────────┘
```

- 3 buton, `flex:1` ile eşit genişlik
- Seçili palet: gradient background + glow shadow
- Seçili değil: `--bg-elevated` arka plan
- Animasyon: height 0→auto, opacity 0→1

### 5. Mesaj Alanı

- Scrollable container (`overflow-y:auto`, scrollbar-width:none)
- Kullanıcı mesajları: sağa hizalanmış, `--ql-accent` arka plan
- Asistan mesajları: sola hizalanmış, glass arka plan (`--glass-bg`, `--glass-border-bright`)
- `pre-line` whitespace ile çok satırlı destek
- Auto-scroll: `useEffect` ile son mesaja kaydırma

### 6. Loading Animasyonu

```
● ● ●  (bouncing dots, 1.2s cycle, 0.15s stagger)
```

- 3 adet 5px daire
- `bounce 1.2s ease ${i * 0.15}s infinite`

### 7. Input Bölümü

```
┌──────────────────────────────────────────┐
│ [🎤]  Komut yazın...                 [↑] │
└──────────────────────────────────────────┘
```

- **Mikrofon butonu**: 40×40px, varsayılan gri, dinlerken accent (sadece SpeechRecognition varsa)
- **Text input**: `flex:1`, transparent background, weight:600
- **Gönder butonu**: Sadece input doluysa görünür, gradient background + "↑"
- **Placeholder**: Dinlerken "🎤 Dinleniyor...", normalde "Komut yazın..."
- **Enter** tuşu ile gönderme (`onKeyDown`)

---

## 📋 Teknik Borçlar & İyileştirme Önerileri

| # | Sorun | Açıklama | Öneri |
|---|-------|----------|-------|
| 1 | **Tüm stiller inline** | 40+ ayrı `style={{}}` objesi, sadece 3 CSS class'ı var | CSS module'lerine veya `styled-components`'a taşı |
| 2 | **Icon boyutları tutarsız** | `BrainCircuit`=22, `Mic`=16, `X`=14, `Palette`=14 — 4 farklı boyut | Sabit bir ikon boyut sistemi tanımla (sm/md/lg) |
| 3 | **`any` tip kalıntısı** | `onMouseEnter` callback'lerinde `as HTMLButtonElement` cast'i | Tip genişletme veya `RefObject` kullan |
| 4 | **Quick Reply yetersiz** | Soru tiplerinde LLM yok, derin analiz için başka sayfaya yönlendiriyor | İsteğe bağlı `deep_seek` agent çağrısı ekle |
| 5 | **Recognition tek seferlik** | `continuous=false`, her komut için yeniden başlatma gerek | Push-to-talk veya continuous mode seçeneği |
| 6 | **Framer Motion ağır** | Spring hesaplama + staggerChildren, düşük cihazlarda kasılma | Gerekirse `reducedMotion` tercihine saygı duy |
| 7 | **Mesaj tipi sınırlı** | Sadece `user`/`assistant`, hata/sistem ayrımı yok | `role: 'user' | 'assistant' | 'error' | 'system'` genişletmesi |
| 8 | **Scroll yönetimi primitive** | `useEffect` ile her mesaj değişiminde scroll | `IntersectionObserver` veya daha akıllı scroll behavior |

---

## 🔗 Referanslar (Diğer Dosyalar)

| Dosya | İlişki |
|-------|--------|
| `src/App.tsx:498-499` | QuantumLink'i render eder (`<QuantumLink db={db} />`) |
| `src/lib/audio.ts` | Web Speech API wrapper (speak/create/hasSpeechRecognition) |
| `src/agents/index.ts` | Agent singleton fabrikası (kasa/cari/satis/stok/fatura/rapor/deep_seek) |
| `src/agents/KasaAgent.ts` | Gelir/gider işlemleri |
| `src/agents/CariAgent.ts` | Tahsilat/alacak işlemleri |
| `src/lib/changelog.ts` | 12 adet QuantumLink değişiklik kaydı |
| `src/lib/specs/data-rules.ts` | QuantumLink.tsx veri kuralları referansı |
| `docs/PARSPEL-DESIGN-SYSTEM.figma.json` | AI ses giriş bileşeni tanımı |
| `docs/archive/AUDIT_PROMPT.md` | 3 tema geçişi test maddesi |
| `docs/archive/CODE_ANALYSIS.csv` | ~605 satır, %23.7 oran |

---

## 📜 Changelog Geçmişi (Önemli Kilometre Taşları)

| Tarih (yaklaşık) | Değişiklik |
|-----------------|------------|
| **Varlık** | QuantumLink bileşeni App.tsx'e eklendi, FAB ile çakışmadan çalışır |
| **CSS Variable Geçişi** | Hardcoded renk/kenarlık değerleri CSS variable referanslarına dönüştürüldü |
| **Agent Entegrasyonu** | `processCommand()` → `dispatchAgentFlow()` — satış/kasa/cari komutları artık agent sistemi üzerinden |
| **Tip Düzeltmeleri** | 6 adet `any` tip kaldırıldı, SpeechRecognition interface eklendi, processCommand useCallback ile sarıldı |
| **Güvenlik + Yeniden Tasarım** | XSS koruması, CSP meta tag, 3 seçilebilir tema paleti (Mavi/Amber/Yeşil). Tema localStorage'a kaydedilir. Trigger butonu, mesaj balonları, input butonu tema rengiyle uyumlu hale getirildi. |

---

## 📊 Kod Metrikleri

| Metrik | Değer |
|--------|-------|
| Toplam satır | 642 |
| İşlevsel satır | ~605 |
| Proje içi oran | %23.7 (en büyük UI bileşeni) |
| Dosya sayısı (referans) | 8 |
| Changelog entry | 12 |
| Dependency | react, framer-motion, lucide-react |

---

_Rapor oluşturma: 2026-06-20 — Hermes Agent (codebase-radar skill)_
