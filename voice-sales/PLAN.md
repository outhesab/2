# 🎤 Sesli Satış Sistemi — Opus Planı

> Tarih: 13 Haziran 2026  
> Mevcut versiyon: v3.23.2  
> Prensip: **Mevcut sisteme SIFIR dokunuş. Domain servisleri olduğu gibi kullanılır.**

---

## 1. mevcut Mimarinin Analizi (Doğrulanmış)

### Satış İşlem Akışı (Production'da çalışıyor)

```
Kullanıcı (Sales.tsx form)
  → getAgent('satis').islemYap({ action: 'yeniSatis', payload })
  → SatisAgent.mapRequestToIntent() → SaleIntent
  → processIntent(intent, db)
  → completeSale(intent, db)     ← PURE FUNCTION, 367 satır
  → IntentResult { dbUpdates, events }
  → applyIntentResult(prevDB, dbUpdates)
  → processSave: RuleEngine → Audit → localStorage → IndexedDB → Firebase
```

### completeSale() Girdisi (SaleIntent)

```typescript
interface SaleIntent {
  items: Array<{
    productId: string;     // ZORUNLU — ürün ID
    productName: string;   // ZORUNLU — ürün adı
    quantity: number;      // ZORUNLU — miktar
    unitPrice: number;     // ZORUNLU — birim fiyat
    cost: number;          // ZORUNLU — maliyet
  }>;
  payment: "nakit" | "kart" | "havale" | "cari";  // ZORUNLU
  cariId?: string;         // OPSİYONEL — cari ID (vadeli ise)
  cariName?: string;       // OPSİYONEL
  customerName?: string;   // OPSİYONEL
  discount?: number;       // OPSİYONEL — %"lik iskonto
  discountAmount?: number; // OPSİYONEL — TL iskonto
  tahsilat?: number;       // OPSİYONEL — vadeli satışta peşinat
  saleDate?: string;       // OPSİYONEL
}
```

### completeSale() Çıktısı (IntentResult)

```typescript
{
  ok: true/false,
  error?: string,
  data?: {
    dbUpdates: {
      sale: Sale,                              // Yeni satış kaydı
      stockMovements: [{ id, productId, newStock }],  // Stok güncellemeleri
      cashTransaction?: CashTransaction[],    // Kasa hareketi (nakit/kart)
      cari?: CariUpdate[],                    // Cari bakiye güncellemesi
    },
    events: DomainEvent[]
  }
}
```

---

## 2. Sesli Satış Mimarisi (Sıfır Entegrasyon Riski)

### Prensip

```
┌─────────────────────────────────────────────────────────────┐
│                    SESLI SATIŞ MODÜLÜ                        │
│                    (bağımsız geliştirilir)                    │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Speech   │ → │   NLP    │ → │  Intent  │ → │ Executor │ │
│  │ Recognizer│   │  Parser  │   │ Builder  │   │          │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                      │       │
│                                              completeSale()  │
│                                              (mevcut domain) │
└─────────────────────────────────────────────────────────────┘
```

**Kritik tasarım kararı:** Executor, mevcut `completeSale()` fonksiyonunu **doğrudan import eder**. Agent'a, useDB'ye, Sales sayfasına DOKUNMAZ. 

```typescript
// voice-sales/executor/voiceSaleExecutor.ts
import { completeSale } from '@/domain/services/saleCompletion';
import { getDB } from '@/db';      // Mevcut DB okuma
import { save } from '@/db/helpers'; // Mevcut save pipeline
```

### Neden Bu Yaklaşım?

| Yaklaşım | Risk | Sorun |
|----------|------|-------|
| Agent üzerinden | 🟡 ORTA | SatisAgent TOCTOU riski taşıyor |
| processIntent + agent | 🟡 ORTA | Aynı TOCTOU riski + gereksiz katman |
| **completeSale() direkt** | **🟢 DÜŞÜK** | Pure function, TOCTOU yok, test edilmiş, tip-güvenli |

---

## 3. Detaylı Geliştirme Planı

### AŞAMA 1: Ses Tanına Motoru (SpeechRecognizer)

**Dosya:** `voice-sales/speech/speechRecognizer.ts`

```typescript
interface SpeechConfig {
  lang: string;           // 'tr-TR'
  continuous: boolean;    // tek cümle mi, sürekli mi
  interimResults: boolean; // ara sonuçlar gösterilsin mi
  maxAlternatives: number;
}

interface TranscriptResult {
  text: string;           // "İki tane 80'lik soba nakit"
  confidence: number;     // 0.85
  isFinal: boolean;       // true = sonuç, false = ara
}

class SpeechRecognizer {
  start(): Promise<void>
  stop(): void
  onTranscript: (result: TranscriptResult) => void
  onTimeout: () => void
  onError: (error: SpeechError) => void
}
```

**Gereksinimler:**
- Web Speech API (Chrome/Edge/Safari destekli)
- Türkçe dil desteği
- 3 sn sessizlik → timeout
- Noise gate (çok düşük confidence → gözardı)
- Fallback: desteklemiyorsa sesli giriş butonunu gizle

**Bağımlılık yok** — saf Web API (navigator.mediaDevices + SpeechRecognition)

---

### AŞAMA 2: NLP Komut Ayrıştırıcı (VoiceNLPParser)

**Dosya:** `voice-sales/parser/voiceNlpParser.ts`

```typescript
interface ParsedCommand {
  action: 'satis' | 'iptal' | 'iade' | 'fiyat_duzelt' | 'unknown';
  items: Array<{
    productQuery: string;  // "80'lik soba" — fuzzy match için
    quantity: number;
  }>;
  payment?: "nakit" | "kart" | "havale" | "cari";
  confidence: number;      // 0.0 - 1.0
  rawText: string;         // Orijinal metin
}
```

**Türkçe komut kalıpları:**

| Konuşma | action | items | payment |
|---------|--------|-------|---------|
| "İki tane 80'lik soba, nakit" | satis | [{80'lik soba, 2}] | nakit |
| "Bir tane klima kart ile" | satis | [{klima, 1}] | kart |
| "Üçüne yüz TL indirim" | satis | (önceki satıştan) | - |
| "Son satışı iptal et" | iptal | - | - |
| "2 tane iade yap" | iade | [{80'lik soba, 2}] | - |

**Fuzzy ürün eşleştirme:**

```typescript
// voice-sales/parser/productMatcher.ts
function findBestMatch(
  query: string,           // "80'lik soba"
  products: Product[],    // Mevcut ürünler
  threshold: number = 0.6 // Min eşleşme
): { product: Product; score: number } | null {
  // Levenshtein + token overlap + exact substring
}
```

**Girdi/Çıktı Tipleri:**

```typescript
// voice-sales/types.ts

export interface VoiceCommand {
  action: VoiceCommandAction;
  items: VoiceItem[];
  payment: PaymentMethod;
  options: VoiceOptions;
  confidence: number;
  rawText: string;
}

export interface VoiceSaleResult {
  success: boolean;
  sale?: {
    id: string;
    total: number;
    itemCount: number;
  };
  error?: string;
  parsedCommand: VoiceCommand;
}

export interface VoiceItem {
  productQuery: string;
  quantity: number;
  matchedProduct?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    score: number;  // Eşleşme skoru
  };
}
```

---

### AŞAMA 3: Intent Builder (VoiceIntentBuilder)

**Dosya:** `voice-sales/parser/voiceIntentBuilder.ts`

```typescript
// VoiceCommand → SaleIntent (completeSale'in anladığı format)
function buildSaleIntent(
  command: VoiceCommand,
  db: DB
): SaleIntent | null {
  // 1. Ürünleri fuzzy match ile çöz
  // 2. Fiyat ve maliyeti DB'den al
  // 3. SaleIntent oluştur
  // 4. Eşleşme düşükse null döndür
}
```

---

### AŞAMA 4: Voice Sale Executor

**Dosya:** `voice-sales/executor/voiceSaleExecutor.ts`

```typescript
// TAMAMEN BAĞIMSIZ — mevcut domain servisini kullanır

import { completeSale } from '@/domain/services/saleCompletion';
import { applyIntentResult } from '@/db/dbHelpers';
import { getDB } from '@/db';           // Mevcut DB okuma

async function executeVoiceSale(intent: SaleIntent): Promise<VoiceSaleResult> {
  const db = getDB();
  
  // 1. Domain servis çağrısı (PURE FUNCTION — TOCTOU YOK)
  const result = completeSale(intent, db);
  
  if (!result.ok || !result.data) {
    return { success: false, error: result.error, parsedCommand };
  }
  
  // 2. applyIntentResult ile DB güncelle
  const nextDB = applyIntentResult(db, result.data);
  
  // 3. Mevcut save pipeline'ı kullan
  await saveToStorage(nextDB);
  
  // 4. Sonucu sesli döndür
  return {
    success: true,
    sale: {
      id: result.data.dbUpdates.sale!.id,
      total: result.data.dbUpdates.sale!.total,
      itemCount: intent.items.length,
    },
  };
}
```

**TOCTOU'dan KAÇINMA:** `executeVoiceSale` çağrıldığında, `getDB()` en güncel okur. `completeSale()` de bu en güncel veriyi işler. TOCTOU YOK.

---

### AŞAMA 5: UI + PARSPEL Entegrasyonu

**Dosya:** `src/pages/SesliSatis.tsx` (YENİ — var olan hiçbir sayfaya dokunmaz)

```typescript
// Kullanım:
// 1. Kullanıcı "🎤 Sesli Satış" butonuna basar
// 2. Mikrofon açılır
// 3. Kullanıcı konuşur: "İki tane 80'lik soba, nakit"
// 4. SpeechRecognizer → "İki tane 80'lik soba nakit"
// 5. NLP Parser → { action: 'satis', items: [{query: "80'lik soba", qty: 2}], payment: "nakit" }
// 6. IntentBuilder → { items: [{productId: "...", productName: "80'lik Soba", quantity: 2, unitPrice: 1700, cost: 1200}], payment: "nakit" }
// 7. VoiceSaleExecutor → completeSale(intent, db) → applyIntentResult → save
// 8. Sesli yanıt: "Satış kaydedildi! İki adet 80'lik soba, toplam 3.400 TL"
```

**Opsiyonel: Sales.tsx'e "Sesli" butonu eklemek**

```typescript
// Sales.tsx'e DOKUNMA — sadece yeni sayfaya yönlendir
// Yeni buton: "🎤 Sesli Satış"
// Tıklayınca: setLocation('/sesli-satis')
// Route: /sesli-satis → SesliSatis.tsx
```

---

## 4. Test Planı

### Unit Testler (her aşama için)

| Test | Beklenen | Dosya |
|------|----------|-------|
| SpeechRecognizer başlat/durdur | ✅ | `voice-sales/speech/speechRecognizer.test.ts` |
| NLP: "2 tane 80'lik soba nakit" | `{items:[{qty:2, query:"80'lik soba"}], payment:"nakit"}` | `voice-sales/parser/voiceNlpParser.test.ts` |
| NLP: "son satışı iptal" | `{action:"iptal"}` | |
| ProductMatcher: "80 lik soba" → products[0] | Score > 0.7 | `voice-sales/parser/productMatcher.test.ts` |
| IntentBuilder doğru SaleIntent üretir | ✅ | `voice-sales/parser/voiceIntentBuilder.test.ts` |
| VoiceSaleExecutor: başarılı satış | db'de yeni sale kaydı var | `voice-sales/executor/voiceSaleExecutor.test.ts` |
| VoiceSaleExecutor: yetersiz stok | error: "Yetersiz stok" | |

### Entegrasyon Testleri (minimum)
- ✅ Speech → NLP → Intent → executeVoiceSale → db kontrolü
- ✅ Fuzzy match doğru ürünü buluyor mu

---

## 5. Zamanlama

| Aşama | Süre | Bağımsız mı? |
|-------|------|--------------|
| Aşama 1: SpeechRecognizer | 1 saat | ✅ Evet |
| Aşama 2: NLP Parser | 2 saat | ✅ Evet |
| Aşama 3: Intent Builder | 45dk | ✅ Evet |
| Aşama 4: VoiceSaleExecutor | 30dk | ✅ Evet (mevcut domain'i kullanır) |
| Aşama 5: UI + Entegrasyon | 1 saat | ✅ Evet (yeni sayfa) |
| Testler | 1 saat | ✅ Evet |
| **TOPLAM** | **~6 saat** | |

---

## 6. Teknik Altyapı Gereksinimleri

```json
{
  "Web Speech API": "Chrome/Edge/Safari (Chrome en iyi destek)",
  "SpeechSynthesis API": "Sesli yanıt için (mevcut tarayıcı)",
  "Browser": "Chrome 66+, Edge 79+, Safari 14.1+",
  "Bağımlılık yok": "Tamamen Web API — ek paket gerektirmez"
}
```

---

## 7. Risk Matrisi

| Risk | Olasılık | Etki | Çözüm |
|------|----------|------|-------|
| Tarayıcı desteği yok | DÜŞÜK | YÜKSEK | Kontrol + butonu gizle |
| Yanlış ürün eşleşmesi | ORTA | ORTA | Confidence skoru göster, onay iste |
| Yanlış miktar anlama | DÜŞÜK | DÜŞÜK | Fuzzy + rakam sabitleme |
| Network yok (STT) | YÜKSEK | YÜKSEK | Web Speech API yerel çalışır — ✅ |
| TOCTOU | YOK | — | `completeSale(db, prev)` doğru yaklaşım |

---

## Dosya Yapısı

```
voice-sales/
├── PLAN.md                          # Bu dosya
├── types.ts                         # Tüm tip tanımları
├── speech/
│   ├── speechRecognizer.ts          # Web Speech API wrapper
│   └── speechRecognizer.test.ts
├── parser/
│   ├── voiceNlpParser.ts            # Doğal dil ayrıştırma
│   ├── voiceNlpParser.test.ts
│   ├── productMatcher.ts            # Fuzzy ürün eşleştirme
│   ├── productMatcher.test.ts
│   └── voiceIntentBuilder.ts        # VoiceCommand → SaleIntent
├── executor/
│   ├── voiceSaleExecutor.ts         # completeSale() çağırır
│   └── voiceSaleExecutor.test.ts
└── ui/
    ├── useVoiceSale.ts              # React hook: sesli satış state
    └── VoiceSaleButton.tsx          # Mikrofon butonu + dinleme UI
```

---

**Kurallar:**
1. PARSPEL'in hiçbir mevcut dosyasını değiştirme
2. Yalnızca `import { completeSale } from '@/domain/services/saleCompletion'` kullan
3. Yeni dosyalar yalnızca `voice-sales/` ve `src/pages/SesliSatis.tsx`'de
4. Her aşama bağımsız test edilir
5. Entegrasyon aşaması hiçbir eski kodu bozmaz
