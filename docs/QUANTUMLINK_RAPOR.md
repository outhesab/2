# QuantumLink Bileşeni — Teknik Rapor

> Oluşturulma: 20 Haziran 2026
> Versiyon: PARSPEL v3.32.3
> Dosya: `src/components/QuantumLink.tsx`

---

## 1. Genel Bakış

**QuantumLink**, PARSPEL uygulamasında bulunan **floating AI asistan paneli** bileşenidir. Sağ alt köşede sabitlenmiş 💠 `BrainCircuit` ikonu ile açılır. Kullanıcıların sesli veya metinsel komutlarla hızlıca veritabanı işlemleri yapmasını sağlar.

**Ana özellikler:**
- Metin girişi ile komut işleme
- Sesli komut girişi (Web Speech API)
- 3 adet tema paleti (Mavi, Amber, Yeşil)
- Glassmorphism UI tasarımı
- Framer Motion animasyonları
- Text-to-Speech (TTS) geribildirim

---

## 2. Konum ve Erişim

```
App.tsx (satır 498-499)
  └── QuantumLink db={db}

src/components/QuantumLink.tsx (642 satır)
```

**Trigger:** Sağ alt köşede `position: fixed`, `bottom: 90px`, `right: 20px` koordinatlarında 52x52px yuvarlak buton.

**Panel:** `bottom: 152px`, `right: 20px`, genişlik 380px, yükseklik 520px.

---

## 3. Desteklenen Komutlar

### 3.1 Sorgu Komutları (Okuma — DB değişikliği yok)

| Komut Anahtar Kelimeleri | Döndürülen Veri |
|---|---|
| `kasa`, `para`, `bakiye` | Toplam, nakit ve banka kasa bakiyesi |
| `stok`, `ürün` | Toplam ürün sayısı, stok bitenler, az stoklular (ilk 3) |
| `satış`, `ciro`, `bu ay` | Bu ayın satış sayısı, cirosu ve kârı |
| `alacak`, `cari`, `müşteri` | Toplam alacak ve en çok alacağı olan 3 müşteri |

### 3.2 İşlem Komutları (Yazma — DB değişikliği var)

| Komut Deseni | Agent | Action | Açıklama |
|---|---|---|---|
| `1500 TL sattım` | KasaAgent | `kasa_gelir` | Satış geliri kaydı |
| `500 TL gelir` | KasaAgent | `kasa_gelir` | Genel gelir kaydı |
| `300 TL gider` | KasaAgent | `kasa_gider` | Gider kaydı |
| `1000 TL tahsilat Ahmet` | CariAgent | `cari_tahsilat` | Müşteri tahsilatı |

### 3.3 Regex Desenleri

```typescript
// Para çıkarma: "1500 TL", "1.500 lira" → 1500
const paraMatch = q.match(/(\d+[\d.,]*)\s*(tl|lira)?/);

// İsim çıkarma (tahsilat için): "tahsilat Ahmet 1000" → "Ahmet"
const isimMatch = q.match(/tahsilat\s+(.+?)(\s+\d|$)/i);
```

---

## 4. Mimari

### 4.1 Veri Akışı

```
Kullanıcı Komutu (Metin veya Ses)
           │
           ▼
   processCommand()
           │
     ┌─────┴─────┐
     │           │
  İşlem mi?  Sorgu mu?
     │           │
     ▼           ▼
getAgent()   quickReply()
  │               │
  ▼               ▼
KasaAgent    Metin Yanıt
  │
  ▼
save() → DB
  │
  ▼
speak() [TTS]
```

### 4.2 State Yönetimi

```typescript
const [isOpen, setIsOpen] = useState(defaultOpen);           // Panel açık mı?
const [isListening, setIsListening] = useState(false);       // Mikrofon aktif mi?
const [isProcessing, setIsProcessing] = useState(false);    // İşlem yapılıyor mu?
const [showPalette, setShowPalette] = useState(false);     // Tema paleti görünür mü?
const [paletteId, setPaletteId] = useState<PaletteId>();     // Seçili tema
const [messages, setMessages] = useState<Message[]>();        // Mesaj geçmişi
const [inputText, setInputText] = useState('');              // Input değeri
```

### 4.3 Tema Sistemi

```typescript
type PaletteId = 'blue' | 'amber' | 'green';

// CSS değişkenleri dinamik olarak ayarlanıyor
'--ql-accent'         // Ana vurgu rengi (oklch)
'--ql-accent-rgb'     // RGB formatı (glow efekti için)
'--ql-gradient'       // Gradient arka plan
'--ql-accent-glow'    // Glow efekti
```

**LocalStorage:** `parspel-ql-palette` key'inde saklanır.

---

## 5. Bağımlılıklar

### 5.1 Harici Modüller

| Modül | Kullanım Amacı |
|---|---|
| `framer-motion` | Panel animasyonları (AnimatePresence, motion) |
| `lucide-react` | İkonlar (BrainCircuit, X, Mic, MicOff, Palette) |
| `@/lib/audio` | `speak()`, `hasSpeechRecognition`, `createSpeechRecognition` |
| `@/agents` | `getAgent()` — KasaAgent, CariAgent erişimi |
| `@/lib/utils-tr` | `formatMoney()` — Para formatlama |
| `@/lib/logger` | Hata loglama |

### 5.2 Speech Recognition

```typescript
const recognitionRef = useRef<SpeechRecognition | null>(null);

recognitionRef.current = createSpeechRecognition(
  (transcript) => processCommand(transcript),  // Başarılı konuşma
  () => setIsListening(false),                  // Hata durumu
  () => setIsListening(false),                 // Sonlandırma
);
```

---

## 6. CSS Tasarımı

### 6.1 Panel Stilleri

- **Glassmorphism efekt:** `backdrop-filter: blur()`, yarı saydam arka plan
- **CSS değişkenleri:** `--surface-overlay`, `--ai-accent-glow`, `--glass-border`
- **Overflow:** `overflow-y: auto` — mesajlar kaydırılabilir
- **Input section:** Alt kısımda sabitlenmiş mikrofon ve metin girişi

### 6.2 Animasyonlar

```typescript
const panelVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0,  scale: 1,   filter: 'blur(0px)',
             transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit:    { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
};
```

---

## 7. Bilinen Sınırlamalar

### 7.1 Görüntü Desteği Yok
❌ QuantumLink **görüntü (image) girişini desteklemez**.
- Görüntü yüklemeye çalışırsanız hata alırsınız: `"this model does not support image input"`
- Sadece **metin** ve **ses** komutları desteklenir

### 7.2 Sınırlı Komut Seti
❌ Sadece hardcoded komutlar çalışır:
- `kasa`, `stok`, `satış`, `alacak` gibi anahtar kelimeler
- Serbest metin sorguları yanıtlanmaz
- Detaylı analiz için AI Asistan sayfası (`/ai`) kullanılmalı

### 7.3 Öğe Bazlı Satış Yok
❌ QuantumLink üzerinden **ürün adına göre satış** yapılamaz.
- Sadece `"1500 TL sattım"` gibi toplam tutar girişi mümkün
- Ürün seçimi için normal Satış sayfası kullanılmalı

### 7.4 Ödeme Yöntemi Tespiti
⚠️ Ödeme yöntemi (nakit/kart/banka) sadece komut metninde geçen kelimelere göre tespit edilir:
```typescript
const payment = q.includes('kart') ? 'kart'
  : q.includes('cari') ? 'cari'
  : 'nakit';
```

---

## 8. Test Durumu

**Test dosyası:** Bulunamadı (`QuantumLink.test.ts` yok)

Mevcut test kapsamı:
- `voice-sale-simulation.test.ts` — Sesli satış simülasyonu
- `spec-compliance.test.ts` — QuantumLink dahil, rule ihlali yok

---

## 9. Öneriler

### 9.1 Yapılacaklar (v3.33.0)
- [ ] QuantumLink için unit test yazılmalı (`processCommand` mock edilmeli)
- [ ] Ürün adı ile satış komutu eklenmeli (örn: `"2 adet soba 80lik sattım"`)
- [ ] Görüntü girişi için destek mesajı gösterilmeli (şu an crash veriyor)
- [ ] Serbest metin sorguları → DeepSeekAgent'a yönlendirilmeli

### 9.2 Kaldırılabilecekler
- [ ] `image.png` referansı araştırılmalı — hata kaynağı olabilir
- [ ] Mevcut hardcoded komutlar yerine LLM tabanlı intent parsing düşünülebilir

---

## 10. İlgili Dosyalar

| Dosya | Açıklama |
|---|---|
| `src/components/QuantumLink.tsx` | Ana bileşen (642 satır) |
| `src/App.tsx` | QuantumLink render edildiği yer |
| `src/agents/KasaAgent.ts` | Kasa işlemleri için agent |
| `src/agents/CariAgent.ts` | Cari işlemleri için agent |
| `src/lib/audio.ts` | TTS ve Speech Recognition |
| `src/lib/logger.ts` | Hata loglama |
| `src/pages/ai/AIAHelpers.tsx` | AI yardımcı bileşenleri |

---

## 11. VoiceAssistantButton ile Karşılaştırması

### 11.1 Temel Farklar

| Özellik | QuantumLink | VoiceAssistantButton |
|---|---|---|
| **Giriş türü** | Metin + ses | Sadece ses |
| **Kapsam** | Global (tüm sayfalar) | Sayfa bazlı (5 sayfa) |
| **Agent'lar** | KasaAgent + CariAgent | SatisAgent |
| **Komut türü** | Hardcoded regex | Intent parsing |
| **İşlem türü** | Gelir/Gider/Tahsilat/Sorgu | Sadece satış |
| **Ürün bazlı satış** | ❌ Hayır | ❌ Hayır |
| **Kasa sorgulama** | ✅ Evet | ❌ Hayır |
| **Stok sorgulama** | ✅ Evet | ❌ Hayır |

### 11.2 Kritik Tespit — Paradoks

> ⚠️ **Her iki bileşen de "sesli asistan" olarak konumlandırılmış olsa da, aslında tamamen farklı işlevlere hizmet ediyorlar.**

```
QuantumLink ──→ Kasa yönetimi + Cari işlemleri + Sorgular
                    │
                    ├── "1500 TL gider"  → KasaAgent
                    ├── "1000 TL tahsilat Ahmet" → CariAgent
                    └── "kasa durumu" → quickReply()

VoiceAssistantButton ──→ Sadece satış kaydı
                    │
                    └── "2 adet soba sattım" → SatisAgent
```

**Sorun:** Kullanıcı sesli asistan beklediği için her iki butona da aynı şeyi sorabilir, ancak:
- QuantumLink'e `"stok kontrolü"` sorulabilir → ✅ çalışır
- VoiceAssistantButton'a `"stok kontrolü"` sorulabilir → ❌ çalışmaz (sadece satış kabul eder)

### 11.3 Kullanıcı Deneyimi Paradoksu

```
Kullanıcı düşüncesi:
"Ben sesli asistan istiyorum, ne sorayım ne olsun."
     │
     ├── QuantumLink'e sorar → ✅ çalışır (kasa/stok/alacak)
     │
     └── VoiceAssistantButton'a sorar → ❌ başarısız
         (tek amacı: "X TL sattım")
```

**Bu bir UX paradoksudur:** İki farklı "sesli asistan" butonu var, ikisi de aynı amaca hizmet ediyor gibi görünüyor ama aslında **farklı şeyler yapıyorlar**.

### 11.4 Öneri: Birleştirme veya Net Ayrım

**Seçenek A — Birleştir:**
QuantumLink'e VoiceAssistantButton'ın yeteneklerini ekle (ürün bazlı sesli satış).

**Seçenek B — Net Ayrım:**
VoiceAssistantButton'ı "Hızlı Sesli Satış" olarak yeniden konumlandır ve ismini değiştir.

**Seçenek C — Birini Kaldır:**
Sadece QuantumLink'i tut, VoiceAssistantButton'ı kaldır (çünkü QuantumLink zaten sesli komutları destekliyor).

---

## 12. Hata Kaydı

### Bilinen Hata: Görüntü Girişi Crash
```
Mesaj: Cannot read "image.png" (this model does not support image input)
Kaynak: Kullanıcı QuantumLink paneline görüntü yüklemeye çalıştığında
Çözüm: Görüntü girişi UI'da disabled edilmeli veya desteklenmeli
```

---

*Bu rapor otomatik oluşturulmuştur. Son güncelleme: 20 Haziran 2026*
