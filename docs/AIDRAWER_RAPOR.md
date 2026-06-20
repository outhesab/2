# AIDrawer (Soba AI Asistan) — Teknik Rapor

> Oluşturulma: 20 Haziran 2026
> Versiyon: PARSPEL v3.32.3
> Ana Dosya: `src/components/layout/AIDrawer.tsx`
> İçerik: `src/pages/AIAsistan/index.tsx`
> Alt Bileşenler: `ChatPanel.tsx`, `MessageList.tsx`, `ActionHistory.tsx`

---

## 1. Genel Bakış

**AIDrawer**, PARSPEL'in en kapsamlı AI asistanıdır. "Soba AI Asistan" olarak adlandırılır ve **4 farklı AI modelini** destekler: DeepSeek, Claude, Gemini ve Çevrimdışı (offline) mod.

Diğer iki sesli asistan bileşeninden (**QuantumLink**, **VoiceAssistantButton**) farklı olarak bu bileşen:
- Tam **LLM tabanlı sohbet** sağlar
- AI yanıtlarından **aksiyon çıkarır** ve **DB'ye uygular**
- **Admin modu** ile otomatik işlem yapabilir
- **Çevrimdışı** çalışabilir

---

## 2. Konum ve Erişim

```
App.tsx (satır 496)
  └── <AIDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} db={db} save={save} />

src/components/layout/AIDrawer.tsx (43 satır) — Wrapper
src/pages/AIAsistan/index.tsx (562 satır) — Ana mantık
src/pages/AIAsistan/ChatPanel.tsx — Üst bar (stats, model seçici)
src/pages/AIAsisten/MessageList.tsx — Mesaj listesi
src/pages/AIAsistan/ActionHistory.tsx — Bekleyen aksiyonlar UI
```

**Açılış:** `aiDrawerOpen` state'i ile kontrol edilir (App.tsx'ten).

---

## 3. Desteklenen AI Modelleri

| Model | Mod Kaynağı | Açıklama |
|---|---|---|
| **DeepSeek** | `askDeepSeek()` | Çin merkezli LLM, hızlı |
| **Claude** | `askClaude()` | Anthropic Claude API |
| **Gemini** | `askGemini()` | Google Gemini API |
| **Çevrimdışı** | `offlineReply()` | İnternetsiz çalışır, yerleşik yanıtlar |

### 3.1 API Anahtar Yönetimi
```typescript
// keysRef içinde saklanan anahtarlar
keysRef.current = { claude: '', gemini: '', deepseek: '', huggingface: '', opencodeNvidia: '', opencodeHf: '' };

// Yükleme durumları
setKeyLoadError: API anahtarı yüklenemedi
setKeyAccessForbidden: Erişim kısıtlanmış
```

### 3.2 Fallback Mantığı
```
Kullanıcı mesajı gönder
        │
        ▼
   API çağrısı dene (modelSource'a göre)
        │
    ┌───┴───┐
  Başarılı  Başarısız
    │         │
    ▼         ▼
 Yanıtı göster  Sonraki modeli dene
                    │
                Tüm başarısız
                    │
                    ▼
         offlineReply() ile yanıt ver
         + "API hatası" uyarısı göster
```

---

## 4. Yetenekler

### 4.1 Sohbet (Chat)
- Serbest metin girişi
- Mesaj geçmişi
- Mesaj kopyalama
- Yanıt yazma animasyonu (streaming)

### 4.2 AI → DB Aksiyon Sistemi (Critical Feature!)

**AI yanıtlarından `{{ACTION:...}}` formatında aksiyon çıkarılır:**

```typescript
// parseActions() — AI yanıtından aksiyon çıkarma
const actions = parseActions(reply);

// applyActionWithFallback() — DB'ye uygulama
const attempted = applyActionWithFallback(next, action);
```

**Aksiyon Türleri:**
- `{{ACTION:satis}}` — Satış kaydı
- `{{ACTION:kasa_gelir}}` — Kasa geliri
- `{{ACTION:kasa_gider}}` — Kasa gideri
- `{{ACTION:cari_tahsilat}}` — Cari tahsilatı

### 4.3 Admin Modu

```typescript
// 3 mod: read-only | manual | auto
const actionMode: 'read-only' | 'manual' | 'auto' =
  !isAdminUser || !adminMode ? 'read-only' : autoApplyActions ? 'auto' : 'manual';
```

| Mod | Açıklama |
|---|---|
| **read-only** | Normal kullanıcılar sadece soru sorabilir |
| **manual** | Admin onayı ile aksiyon uygulanır |
| **auto**** | Otomatik olarak aksiyonlar uygulanır (max limit var) |

### 4.4 Sesli Özellikler

| Özellik | Kullanım |
|---|---|
| **Mikrofon** | `useSpeechRecognition` — konuşmayı metne çevirir |
| **Text-to-Speech** | `useSpeechSynthesis` — yanıtları sesli okur |
| **Auto-speak** | Yanıt geldiğinde otomatik sesli okuma |

### 4.5 İstatistikler (Üst Bar)

```typescript
// Bu Ay Ciro — Yeşil (#10b981)
const monthStart = new Date();
monthStart.setDate(1);
// ... satışları filtrele, toplam ciro

// Kasa — Cyan (#06b6d2)
db.kasa.filter(k => !k.deleted)
  .reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0)

// Alacak — Amber (#f59e0b)
db.cari.filter(c => !c.deleted && c.type === 'musteri' && c.balance > 0)
  .reduce((s, c) => s + c.balance, 0)
```

### 4.6 Hızlı Komutlar (Quick Prompts)
```typescript
QUICK_PROMPTS — Önceden tanımlanmış 5 adet hızlı soru
// Örn: "En çok satan ürünler", "Bu ayın raporu", vb.
```

---

## 5. Mimarisi

### 5.1 Veri Akışı

```
Kullanıcı Mesajı
        │
        ▼
   rate limit (3sn) ──── yoksay ──── ⏳ "Lütfen bekleyin"
        │
        ▼
  API çağrısı (modelSource'a göre)
        │
   ┌────┴────┐
   │         │
Streaming   Final
Yanıt       Yanıt
   │         │
   ▼         ▼
chunk       parseActions()
ekle        │
            ▼
     ┌──────┴──────┐
     │             │
  Aksiyon var   Aksiyon yok
     │             │
     ▼             ▼
adminMode?     Yanıtı göster
     │
  ┌──┴──┐
  │     │
auto   manual
 │      │
 ▼      ▼
hemen  UI'de
uygula  onayla
```

### 5.2 State Yönetimi

```typescript
const [messages, setMessages] = useState<Message[]>([]);           // Mesaj geçmişi
const [input, setInput] = useState('');                          // Input
const [loading, setLoading] = useState(false);                   // Yükleniyor
const [apiStatus, setApiStatus] = useState(...);                // Hangi API
const [modelSource, setModelSource] = useState(...);             // Seçili model
const [adminMode, setAdminMode] = useState(false);               // Admin mod
const [autoApplyActions, setAutoApplyActions] = useState(false); // Otomatik uygula
const [pendingActions, setPendingActions] = useState(null);      // Bekleyen aksiyonlar
const [actionResult, setActionResult] = useState(null);          // Sonuç
const [autoSpeak, setAutoSpeak] = useState(false);              // Sesli okuma
const [isOnline, setIsOnline] = useState(true);                // İnternet durumu
```

### 5.3 Offline Mod
```typescript
// İnternet yoksa veya API başarısız olursa:
const reply = offlineReply(db, userMsg);
// buildContext() ile DB context'i oluşturulur
// offlineReply() yerleşik yanıtlar döner
```

---

## 6. UI Yapısı

### 6.1 Header (ChatPanel'den)
```
┌─────────────────────────────────────────────┐
│ 🤖 │ Soba AI Asistan            │   │ ×  │
│    │ DeepSeek · Claude · Gemini  │   │    │
├─────────────────────────────────────────────┤
│ [ Ciro ]  [ Kasa ]  [ Alacak ]             │
│   ₺0,00    ₺0,00     ₺0,00                │
│                                              │
│ [Model Seçici ▼] [🔒 Admin] [⚙️]           │
└─────────────────────────────────────────────┘
```

### 6.2 Mesaj Alanı
```
┌─────────────────────────────────────────────┐
│ [AI] Yanıt mesajı...                        │
│                    [📋 Kopyala]              │
├─────────────────────────────────────────────┤
│ [Kullanıcı] Benim sorum...                  │
└─────────────────────────────────────────────┘
```

### 6.3 Aksiyon Onayı (ActionHistory)
```
┌─────────────────────────────────────────────┐
│ ⚠️ AI 3 aksiyon önergedi:                   │
│                                              │
│ [1] Satış: Soba 80lik x2 — ₺20,000         │
│ [2] Kasa Gelir: ₺20,000                     │
│                                              │
│ [ Onayla ]  [ İptal ]                       │
└─────────────────────────────────────────────┘
```

### 6.4 Input Alanı
```
┌─────────────────────────────────────────────┐
│ [ textarea: Sorunuzu yazın...         ] [🎤]│
│                                          [↑]│
├─────────────────────────────────────────────┤
│ [🔇 Sesli Kapalı]        [▶ Son Cevabı Oku] │
│                                              │
│ [Hızlı1] [Hızlı2] [Hızlı3] [Hızlı4]...   │
└─────────────────────────────────────────────┘
```

---

## 7. Karşılaştırmalı Analiz — 3 Sesli Asistan

| Özellik | AIDrawer (Soba AI) | QuantumLink | VoiceAssistantButton |
|---|---|---|---|
| **Tip** | Tam LLM sohbet | Quick reply + işlem | Sadece ses girişi |
| **Giriş** | Metin + Ses | Metin + Ses | Sadece ses |
| **AI Modelleri** | DeepSeek, Claude, Gemini, Offline | Yok (hardcoded) | Yok |
| **Veritabanı İşlemi** | ✅ Aktion çıkarma + uygulama | ✅ İşlem komutları | ✅ Satış kaydı |
| **Admin Modu** | ✅ Evet | ❌ Hayır | ❌ Hayır |
| **Otomatik Uygulama** | ✅ Evet (ayarlanabilir) | ❌ Hayır | ❌ Hayır |
| **Sorgu Yanıtı** | ✅ Serbest LLM | ✅ Sınırlı (quickReply) | ❌ Hayır |
| **Kapsam** | Global | Global | Sayfa bazlı (5 sayfa) |
| **Kullanıcı** | Admin + Normal | Herkes | Herkes |
| **Çevrimdışı** | ✅ Evet (offlineReply) | ❌ Hayır | ❌ Hayır |
| **Test Durumu** | ❌ Yok | ❌ Yok | ❌ Yok |

### 7.1 Hiyerarşi

```
AIDrawer (Soba AI Asistan)
    │
    ├── En kapsamlı: LLM + DB aksiyon + Çevrimdışı
    │
QuantumLink
    │
    ├── Orta kapsam: Hızlı sorgular + Kasa/Cari işlemleri
    │
VoiceAssistantButton
    │
    └── En basit: Sadece sesli satış kaydı
```

---

## 8. Bilinen Sınırlamalar

### 8.1 Test Yok
❌ `AIDrawer`, `AIAsistan`, `ChatPanel`, `MessageList`, `ActionHistory` — **hiçbiri için test yok**.

### 8.2 Rate Limiting
⚠️ 3 saniye aralıkla sınırlı:
```typescript
const lastReq = parseInt(sessionStorage.getItem('ai_last_req') || '0');
if (now - lastReq < 3000 && lastReq > 0) {
  // "⏳ Lütfen biraz bekleyin" mesajı
}
```

### 8.3 API Bağımlılığı
⚠️ Online modeller için internet + API anahtarı gerekli. Anahtar yoksa veya internet yoksa offline mod'a düşer.

### 8.4 Admin İzni
⚠️ DB aksiyonları için kullanıcı `admin` rolünde olmalı. Normal kullanıcılar sadece sorgu yapabilir.

### 8.5 Otomatik Uygulama Riski
⚠️ `autoApplyActions` açıkken AI yanlış aksiyon önerebilir ve otomatik uygulanabilir. `stopOnViolation` ve `maxAutoActions` ile koruma var ama risk mevcut.

---

## 9. Öneriler

### 9.1 Yapılacaklar
- [ ] Tüm AI asistan bileşenleri için unit test yazılmalı
- [ ] `offlineReply()` fonksiyonu genişletilmeli — daha fazla senaryo
- [ ] Action parsing regex'i dokümante edilmeli
- [ ] Kullanıcıya "AI bu işlemi yapmak istiyor" onayı her zaman gösterilmeli

### 9.2 Birleştirme Önerisi

**Mevcut durum:** 3 farklı sesli asistan var, her biri farklı şey yapıyor.

**Ideal durum:** Tek birleşik "AI Asistan" — AIDrawer zaten bunu yapıyor, diğer ikisi gereksiz.

**QuantumLink kaldırılabilir mi?** — ❌ Belki, çünkü QuantumLink sesli giriş için daha hızlı (sadece mikrofona bas, konuş). AIDrawer daha ağır.

**VoiceAssistantButton kaldırılabilir mi?** — ✅ Evet, çünkü AIDrawer zaten sesli giriş yapabiliyor.

---

## 10. İlgili Dosyalar

| Dosya | Açıklama |
|---|---|
| `src/components/layout/AIDrawer.tsx` | Wrapper (43 satır) |
| `src/pages/AIAsistan/index.tsx` | Ana mantık (562 satır) |
| `src/pages/AIAsistan/ChatPanel.tsx` | Üst bar UI |
| `src/pages/AIAsistan/MessageList.tsx` | Mesaj listesi |
| `src/pages/AIAsistan/ActionHistory.tsx` | Aksiyon onay UI |
| `src/lib/aiApi.ts` | Claude + Gemini API |
| `src/lib/deepseek.ts` | DeepSeek API |
| `src/lib/aiOffline.ts` | offlineReply() |
| `src/lib/aiActions.ts` | Action parsing + applying |
| `src/hooks/useSpeech.ts` | Speech recognition + synthesis |
| `src/hooks/useVoiceAgent.ts` | Voice agent hook |

---

## 11. Paradoks Tespiti — 3 Bileşen Karşılaştırması

### 11.1 Paradoks Özeti

| Bileşen | Gerçek İşlev | Kullanıcı Beklentisi |
|---|---|---|
| **AIDrawer** | LLM sohbet + DB aksiyon | ✅ Karşılıyor |
| **QuantumLink** | Hızlı komut + kasa işlemleri | ⚠️ Kısmen |
| **VoiceAssistantButton** | Sadece sesli satış | ❌ Beklentiyi karşılamıyor |

### 11.2 Kullanıcı Senaryosu

```
Kullanıcı: "Sesli asistan istiyorum" der

  → AIDrawer (Soba AI) açılırsa:
    ✅ Her şey yapılabilir — sorgu, işlem, ses, metin

  → QuantumLink açılırsa:
    ⚠️ Sorgu yapılabilir ama ürün satışı yok

  → VoiceAssistantButton açılırsa:
    ❌ Sadece "X TL sattım" kabul eder
```

### 11.3 Sonuç

**AIDrawer = Ideal Sesli Asistan** — Diğer ikisi gereksiz veya yeniden konumlandırılmalı.

---

*Bu rapor otomatik oluşturulmuştur. Son güncelleme: 20 Haziran 2026*
