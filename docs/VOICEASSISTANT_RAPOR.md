# VoiceAssistantButton — Teknik Rapor

> Oluşturulma: 20 Haziran 2026
> Versiyon: PARSPEL v3.32.3
> Dosya: `src/components/VoiceAssistantButton.tsx`
> Hook: `src/hooks/useVoiceAssistant.ts`

---

## 1. Genel Bakış

**VoiceAssistantButton**, sayfanın sağ alt köşesinde sabitlenmiş yuvarlak bir **mikrofon butonu**dur. Kullanıcıların **sesli komutlarla** doğrudan satış kaydı oluşturmasını sağlar.

**Temel özellikler:**
- Sabit pozisyonlu (sağ alt, `bottom: 24px; right: 24px`)
- Dinamik renk: dinlerken kırmızı (#ef4444), bekleirken turuncu (#ff5722)
- Nabız animasyonu (listening sırasında)
- Web Speech API entegrasyonu
- Text-to-Speech (TTS) geribildirim
- SatışAgent üzerinden sesli satış kaydı

---

## 2. Konum ve Erişim

```
src/components/VoiceAssistantButton.tsx  (53 satır)
src/hooks/useVoiceAssistant.ts          (68 satır)
```

### 2.1 Sayfa Bazlı Kullanım

VoiceAssistantButton şu sayfalarda render ediliyor:

| Sayfa | Dosya Yolu | Satır |
|---|---|---|
| Cari | `src/pages/Cari/index.tsx` | 278 |
| Stok | `src/pages/Stock.tsx` | 484 |
| Kasa | `src/pages/Kasa.tsx` | 475 |
| Satışlar | `src/pages/Sales.tsx` | 442 |
| Ürünler | `src/pages/Products.tsx` | 618 |

**Not:** QuantumLink'ten farklı olarak bu buton **sayfa bazlı** olarak ekleniyor, App.tsx'te global değil.

### 2.2 Pozisyon

```css
position: fixed;
bottom: 24px;   /* QuantumLink'ten 66px daha aşağıda */
right: 24px;    /* QuantumLink'ten 4px daha sağda */
width: 56px;    /* QuantumLink'ten 4px daha büyük */
height: 56px;
```

---

## 3. Görsel Durumlar

### 3.1 Dinleme Durumu (isListening: true)
- **Background:** `#ef4444` (kırmızı)
- **Scale:** `1.1` (büyümüş)
- **Animasyon:** `voice-pulse` — nabız efekti (sınır 1.6x büyüyüp kayboluyor)
- **Mic ikonu:** Aktif

### 3.2 Bekleme Durumu (isListening: false)
- **Background:** `#ff5722` (turuncu)
- **Scale:** `1` (normal)
- **Animasyon:** Yok
- **Mic ikonu:** Pasif

---

## 4. Mimarisi

### 4.1 Veri Akışı (Sesliden Yazıya)

```
Kullanıcı Mikrofona Basar
         │
         ▼
  startListening()
         │
         ▼
  voiceEngine.start()
         │
         ▼
  Web Speech API (tarayıcı)
         │
         ▼ (speech detected)
  parseVoiceIntent(text)
         │
    ┌────┴────┐
    │         │
 intent?   yok
    │         │
    ▼         ▼
 SatisAgent  TTS: "Sizi anlayamadım"
 .islemYap()
    │
    ▼
 save() → DB
    │
    ▼
 TTS: "İşlem başarıyla tamamlandı"
```

### 4.2 State Yönetimi (useVoiceAssistant)

```typescript
const [isListening, setIsListening] = useState(false);
const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
```

### 4.3 Komut Çıkarma (voiceIntent)

```typescript
// voiceIntent.parseVoiceIntent(text)
// Dönüş: { action: 'satış', payload: { ... } } veya null
```

---

## 5. Bağımlılıklar

### 5.1 Hooks & Modüller

| Modül | Kullanım Amacı |
|---|---|
| `@/hooks/useVoiceAssistant` | Sesli asistan state ve kontrolü |
| `@/lib/voiceEngine` | Web Speech API sarmalayıcı |
| `@/lib/voiceIntent` | Sesli komutu intent'e çevirme |
| `@/agents` | `getAgent('satis')` — Satış agent'ı |
| `@/lib/logger` | Ses tanıma logları |

### 5.2 UI Bileşenleri

| Bileşen | Kullanım |
|---|---|
| `lucide-react/Mic` | Mikrofon ikonu |
| `window.speechSynthesis` | TTS (tarayıcı native) |

---

## 6. Text-to-Speech Geribildirim

```typescript
// Başarılı işlem
const msg = `İşlem başarıyla tamamlandı: ${intent.action}`;
window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));

// Hata durumu
window.speechSynthesis.speak(new SpeechSynthesisUtterance('Üzgünüm, işlemi yapamadım.'));

// Anlaşılmayan komut
window.speechSynthesis.speak(new SpeechSynthesisUtterance('Sizi anlayamadım, lütfen tekrar deneyin.'));
```

---

## 7. QuantumLink ile Karşılaştırma

| Özellik | VoiceAssistantButton | QuantumLink |
|---|---|---|
| **Pozisyon** | bottom: 24px, right: 24px | bottom: 90px, right: 20px |
| **Boyut** | 56x56px | 52x52px |
| **Renk** | Turuncu/Kırmızı (dinlerken) | Tema bazlı (blue/amber/green) |
| **Kapsam** | Sayfa bazlı (5 sayfa) | Global (tüm sayfalar) |
| **Giriş türü** | Sadece ses | Metin + ses |
| **Agent** | SatisAgent | KasaAgent + CariAgent |
| **Komut seti** | Serbest (intent parsing) | Hardcoded regex |
| **İşlem türü** | Sadece satış | Kasa gelir/gider, tahsilat |
| **UI tasarım** | Basit, native | Glassmorphism, animasyonlu |
| **Test durumu** | ❌ Test yok | ❌ Test yok |

---

## 8. Bilinen Sınırlamalar

### 8.1 Sadece Satış İşlemi
❌ VoiceAssistantButton **sadece satış kaydı** oluşturabilir.
- Kasa gelir/gider için QuantumLink kullanılmalı
- Cari işlemleri için QuantumLink kullanılmalı

### 8.2 Tarayıcı Bağımlılığı
⚠️ Web Speech API tüm tarayıcılarda desteklenmiyor:
- Chrome/Edge: ✅ Destekliyor
- Safari: ⚠️ Kısmi destek
- Firefox: ❌ Desteklenmiyor (veya flag gerektirir)

### 8.3 Test Yok
❌ Ne `VoiceAssistantButton` ne de `useVoiceAssistant` için test dosyası yok.

### 8.4 Session Bağımlılığı
❌ `intent.action` undefined olursa TTS mesajı garip görünür:
```typescript
const msg = `İşlem başarıyla tamamlandı: ${intent.action}`;
// intent.action = undefined ise → "İşlem başarıyla tamamlandı: undefined"
```

---

## 9. Öneriler

### 9.1 Yapılacaklar (v3.33.0)
- [ ] `voiceIntent.ts` dosyasını incele — intent parsing mantığını anla
- [ ] VoiceAssistantButton için unit test yazılmalı
- [ ] `intent.action` undefined kontrolü eklenmeli
- [ ] Tarayıcı destek kontrolü eklenmeli (SpeechRecognition destek mi?)

### 9.2 İyileştirme Önerileri
- [ ] VoiceAssistantButton'ı global yap (App.tsx'e taşı) — her sayfada tekrarlanıyor
- [ ] QuantumLink + VoiceAssistantButton birleştirilebilir mi? İkisi de sesli komut işliyor
- [ ] Hata durumunda daha açıklayıcı TTS mesajları

---

## 10. İlgili Dosyalar

| Dosya | Açıklama |
|---|---|
| `src/components/VoiceAssistantButton.tsx` | Ana buton bileşeni (53 satır) |
| `src/hooks/useVoiceAssistant.ts` | Sesli asistan hook (68 satır) |
| `src/lib/voiceEngine.ts` | Web Speech API sarmalayıcı |
| `src/lib/voiceIntent.ts` | Ses → Intent çevirici |
| `src/agents/SatisAgent.ts` | Satış işlemleri agent'ı |
| `src/components/QuantumLink.tsx` | Alternatif sesli asistan (daha kapsamlı) |

---

## 11. Karşılaştırmalı Kullanım Senaryoları

| Senaryo | Kullanılacak Bileşen | Neden |
|---|---|---|
| "2 adet soba sattım" (sesli) | VoiceAssistantButton | Hızlı, tek tap |
| "kasa durumu ne?" (sesli) | QuantumLink | Komut tanıyor |
| "1500 TL gelir" (yazılı) | QuantumLink | Metin girişi |
| Stok sorgulama (sesli) | QuantumLink | quickReply destekli |
| Ürün bazlı satış (sesli) | ❌ Yok | İkisi de desteklemiyor |

## 12. QuantumLink ile Karşılaştırması — Paradoks Tespiti

### 12.1 Temel Farklar

| Özellik | VoiceAssistantButton | QuantumLink |
|---|---|---|
| **Giriş türü** | Sadece ses | Metin + ses |
| **Kapsam** | Sayfa bazlı (5 sayfa) | Global (tüm sayfalar) |
| **Agent'lar** | SatisAgent | KasaAgent + CariAgent |
| **Komut türü** | Intent parsing | Hardcoded regex |
| **İşlem türü** | Sadece satış | Gelir/Gider/Tahsilat/Sorgu |
| **Kasa sorgulama** | ❌ Hayır | ✅ Evet |
| **Stok sorgulama** | ❌ Hayır | ✅ Evet |
| **Ürün bazlı satış** | ❌ Hayır | ❌ Hayır |

### 12.2 Kritik Tespit — Paradoks

> ⚠️ **Her iki bileşen de "sesli asistan" olarak konumlandırılmış olsa da, aslında tamamen farklı işlevlere hizmet ediyorlar.**

```
VoiceAssistantButton ──→ Sadece satış kaydı
                    │
                    └── "2 adet soba sattım" → SatisAgent

QuantumLink ──→ Kasa yönetimi + Cari işlemleri + Sorgular
                    │
                    ├── "1500 TL gider"  → KasaAgent
                    ├── "1000 TL tahsilat Ahmet" → CariAgent
                    └── "kasa durumu" → quickReply()
```

**Paradoks:** Kullanıcı her iki butona da aynı şeyi sorabilir:
- VoiceAssistantButton'a `"kasa durumu ne?"` → ❌ Çalışmaz
- QuantumLink'e `"kasa durumu ne?"` → ✅ Çalışır

Ama her iki buton da "🎤 Mikrofon" ikonuna sahip ve her ikisi de "sesli asistan" olarak anılıyor.

### 12.3 UX Paradoksu — Kullanıcı Beklentisi

```
Kullanıcı senaryosu:
1. Kullanıcı "Sesli Asistan" butonuna basar (hangisi olduğunu bilmiyor)
2. "Stok kontrolü" diye sesli komut verir
3. Eğer VoiceAssistantButton açıldıysa → ❌ "Sizi anlayamadım"
4. Eğer QuantumLink açıldıysa → ✅ Stok özeti döner

Sorun: İki farklı buton, aynı ikon, farklı davranış.
```

### 12.4 Öneri: Birleştirme veya Net Ayrım

**Seçenek A — Birleştir (Tavsiye Edilen):**
VoiceAssistantButton'ın sesli satış yeteneklerini QuantumLink'e entegre et. Tek bir "Sesli Asistan" butonu olsun.

**Seçenek B — Net Ayrım:**
- VoiceAssistantButton → **"Hızlı Sesli Satış"** olarak yeniden markalaştır
- İsmini ve tooltip'ini değiştir: "Sesli Satış Yap" gibi

**Seçenek C — Kaldır:**
VoiceAssistantButton'ı tamamen kaldır, QuantumLink yeterli.

### 12.5 Sonuç

| Bileşen | Amacı | Yeterlilik |
|---|---|---|
| QuantumLink | Kasa/Cari yönetimi + Sorgular | ✅ Yeterli ama ürün satışı yok |
| VoiceAssistantButton | Sadece satış | ⚠️ Yetersiz — sadece 1 işlevi var |
| **理想的** | **Tek birleşik sesli asistan** | QuantumLink + SatisAgent |

---

*Bu rapor otomatik oluşturulmuştur. Son güncelleme: 20 Haziran 2026*
