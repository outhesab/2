# PARSPEL — Mimari Dokümanı

> Versiyon: 3.31.0 | Tarih: 17 Haziran 2026
> İçerik: Agent Sistemi, Bileşen Mimarisi, Navigasyon

---

# Bölüm 1: Agent Sistemi

## 1. Mimarî (v3.23+)

```
src/
├── agents/           # 7 agent — thin wrapper (islemYap → processIntent)
│   ├── BaseAgent.ts      # Soyut sınıf — bagla(), islemYap(), yayinla()
│   ├── AgentBus.ts       # mitt event emitter singleton
│   ├── index.ts          # Agent registry + getAgent() overloads
│   ├── SatisAgent.ts     # Satış işlemleri
│   ├── StokAgent.ts      # Stok güncelleme
│   ├── KasaAgent.ts      # Kasa hareketleri
│   ├── CariAgent.ts      # Cari hesap yönetimi
│   ├── FaturaAgent.ts    # Fatura oluşturma
│   ├── RaporAgent.ts     # Raporlama / aktivite kaydı
│   ├── DeepSeekAgent.ts  # AI destekli analiz
│   └── AGENTS.md         # Dokümantasyon
│
├── domain/           # Domain-Driven katmanı
│   ├── types.ts          # Intent, IntentResult, DBUpdates, SaleIntent
│   ├── eventBus.ts       # DomainEventBus (typed pub/sub)
│   ├── intentEngine.ts   # Central router: processIntent(intent, db)
│   └── services/
│       ├── saleCompletion.ts  # completeSale, cancelSale, returnSale
│       ├── cashService.ts     # processCashTransaction
│       ├── stockService.ts    # processStockUpdate, processProductAdd
│       └── cariService.ts     # processCariTahsilat, processCariAdd
│
├── lib/              # Utility kütüphaneleri
├── hooks/db/         # Veri katmanı (7 dosya)
├── pages/            # Sayfalar + alt modüller
├── components/       # UI bileşenleri
├── stores/           # Zustand agentStore
└── theme/            # Premium temalar
```

## 2. AgentId'ler ve İzinler

```
AgentId: "stok" | "kasa" | "cari" | "satis" | "fatura" | "rapor" | "deep_seek"

AgentPermission: "{agentId}.{read|write}"
  Örn: stok.read, stok.write, kasa.read, kasa.write
```

## 3. Agent Orchestration — Flow Şeması

```
┌─────────────────────────────────────────────────────────────────────┐
│  SATIŞ AKIŞI                                                        │
│                                                                     │
│  satis → stok → kasa (nakit/kart ise) → cari (vadeli ise)         │
│       → fatura (opsiyonel) → rapor                                  │
│                                                                     │
│  Adım 1: SatisAgent.yeniSatis()                                     │
│    - Sale kaydı oluşturur                                           │
│    - AgentBus.emit('satis', 'sale_created', {sale})                 │
│                                                                     │
│  Adım 2: StokAgent (dinler: sale_created)                           │
│    - Her SaleItem için stok düşer                                   │
│    - StockMovement kaydedilir                                       │
│    - AgentBus.emit('stok', 'stock_updated', {productId, qty})       │
│                                                                     │
│  Adım 3a: KasaAgent (nakit/kart ise)                                │
│    - KasaEntry ekler (gelir)                                        │
│    - AgentBus.emit('kasa', 'entry_created', {entry})                │
│                                                                     │
│  Adım 3b: CariAgent (vadeli ise)                                    │
│    - Cari.balance += total                                         │
│    - AgentBus.emit('cari', 'balance_updated', {cariId, amount})     │
│                                                                     │
│  Adım 4: FaturaAgent (opsiyonel)                                    │
│    - Invoice oluşturur (taslak)                                     │
│                                                                     │
│  Adım 5: RaporAgent                                                 │
│    - Aktivite kaydı, istatistik güncelleme                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  KASA GELİR/GİDER AKIŞI                                            │
│  kasa → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STOK GÜNCELLEME / ÜRÜN EKLEME AKIŞI                               │
│  stok → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CARİ TAHSİLAT / CARİ EKLEME AKIŞI                                  │
│  cari → rapor                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Agent Sorumlulukları

| Agent | Görevi | Önemli Metotlar |
|-------|--------|-----------------|
| **SatisAgent** | Satış yaşam döngüsü | `yeniSatis()`, `iptalEt()`, `iadeYap()`, `fiyatDuzelt()` |
| **StokAgent** | Stok güncelleme, hareket kaydı | `stokGuncelle(productId, miktar, tip)` |
| **KasaAgent** | Kasa giriş/çıkış, bakiye | `kasaGelirGider(params)`, `bakiyeSorgula(kasaId)` |
| **CariAgent** | Cari bakiye güncelleme | `cariGuncelle(cariId, tutar)`, `cariEkle(params)` |
| **FaturaAgent** | Fatura oluşturma | `faturaOlustur(sale)` |
| **RaporAgent** | Aktivite kaydı, istatistik | `raporKaydet(action, detail)` |
| **DeepSeekAgent** | AI analiz, öneri | `analizYap(soru, db)`, `oneriGetir(db)` |

## 5. İletişim Modeli (v3.23+)

```
AgentBus (mitt singleton):
  - agentBus.emit(from: AgentId, type: string, payload?: object)
  - agentBus.on(type: string, handler: (event: AgentEvent) => void)
  - AgentEvent: { from, type, payload?, createdAt }

DomainEventBus (typed event bus):
  - domainEventBus.emit(event: DomainEvent)
  - Her domain servis işlem sonucunda event yayınlar

BaseAgent:
  - bagla(ctx: AgentContext) → { getDB, save } atar
  - yayinla(type, payload) → AgentBus.emit()
  - islemYap(talep) → mapRequestToIntent() → processIntent() → applyIntentResult() → save()

İşlem Pipeline'ı:
  Page → agent.islemYap({ action, payload })
       → mapRequestToIntent() → Intent
       → processIntent(intent, db) → domain service → { dbUpdates, events }
       → applyIntentResult(prevDB, dbUpdates) → save()
       → return result to page
```

---

# Bölüm 2: Bileşen Mimarisi

## 1. Bileşen Türleri

```
src/components/
├── ui/             # 55 shadcn/ui primitives — DOKUNMA
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/         # 8 layout bileşeni
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── ...
└── *.tsx           # 15 custom bileşen
    ├── ConfirmDialog.tsx
    ├── ErrorBoundary.tsx
    └── ...
```

| Tür | Klasör | Kural |
|-----|--------|-------|
| shadcn/ui | `ui/` | Hiçbir şekilde değiştirilmez |
| Layout | `layout/` | Sayfa iskeleti, app'te 1 kez kullanılır |
| Custom | root | Projeye özel, reusable bileşenler |

## 2. Stil Kuralları

```tsx
// DOĞRU: CSS class + Tailwind
<div className="flex items-center gap-2 p-4 rounded-lg bg-elevated">
  {children}
</div>

// DOĞRU: CSS Module (sadece sayfalar için)
// Settings.module.css → Settings.tsx

// KABUL EDİLEBİLİR: inline style (dinamik değerler)
<div style={{ color: theme.accent, width: `${pct}%` }}>

// YANLIŞ: inline style statik değerler için
<div style={{ display: 'flex', alignItems: 'center' }}>  // → className kullan
```

| Stil yöntemi | Ne zaman | Örnek |
|-------------|----------|-------|
| Tailwind class | Varsayılan | `className="flex gap-2"` |
| CSS Module | Sayfa özel stiller | `Settings.module.css` |
| Inline style | Sadece dinamik değerler | `style={{ width: pct + '%' }}` |
| CSS variable | Tema renkleri | `var(--text-primary)` |

## 3. Import Kuralları

```tsx
// DOĞRU: @/ alias kullan
import { Button } from '@/components/ui/button';
import { useDB } from '@/hooks/useDB';

// DOĞRU: component içinde component import
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

// YANLIŞ: relative path ile component çağırmak
import { Button } from '../../../components/ui/button';

// YANLIŞ: direkt shadcn/ui import
import { Button } from '@/components/ui/button';  // sadece re-export için
```

## 4. State Kaldırma

```
┌────────────────────────────────────────────────────┐
│                  Page (sayfa)                        │
│  • db verisini useDB() ile okur                     │
│  • save() ile yazar                                │
│  • kendi UI state'ini useState ile yönetir          │
├────────────────────────────────────────────────────┤
│                  Component (çocuk)                   │
│  • props alır, state'i yukarıda                     │
│  • kendi UI state'i olabilir (accordion, dropdown)  │
│  • asla doğrudan DB yazmaz                          │
└────────────────────────────────────────────────────┘
```

**Kural:** Veri aşağı akar (props), olay yukarı akar (callback).

```tsx
// DOĞRU: Component sadece props alır
<StatCard icon="💰" label="Kasa" value={formatMoney(kasaBakiye)}
  onClick={() => onTabChange('kasa')}
/>

// YANLIŞ: Component doğrudan DB okur
// const { db } = useDB(); // ❌ component içinde
```

## 5. Empty Component Kullanımı

```tsx
<Empty>
  <EmptyMedia>📦</EmptyMedia>
  <EmptyHeader>
    <EmptyTitle>Liste boş</EmptyTitle>
  </EmptyHeader>
  <EmptyDescription>
    Henüz kayıt eklenmemiş.
  </EmptyDescription>
</Empty>
```

- Empty, boş liste/dizi durumlarında **zorunludur**
- Her sayfa boş durumunu yönetmelidir
- `EmptyDescription` yönlendirici olmalıdır ("İlk ürünü eklemek için + butonunu kullanın.")

## 6. Bileşen Boyutu Sınırı

| Bileşen | Max satır | Uyarı |
|---------|-----------|-------|
| Custom component | 150 satır | 150+ ise böl |
| Layout component | 100 satır | 100+ ise böl |
| Page | 800 satır | 800+ ise böl |
| shadcn/ui | — | hiç dokunma |

---

# Bölüm 3: Navigasyon & Route Yapısı

## 1. Routing Mimarisi

```
App.tsx (Router)
 └── Switch
      ├── Route path="/" → Dashboard (lazy)
      ├── Route path="/urunler" → Products (lazy)
      ├── Route path="/urunler/:id" → ProductDetail (lazy)
      ├── Route path="/satis" → Sales (lazy)
      ├── Route path="/satis/:id" → SaleDetail (lazy)
      ├── Route path="/cari" → Cari (lazy)
      ├── Route path="/cari/:id" → CariDetail (lazy)
      ├── ... (30+ route daha)
      └── Route → NotFound
```

Hepsi `React.lazy()` ile yüklenir → ana bundle'a dahil edilmez.

```typescript
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
```

## 2. Tab - Route İlişkisi

```
Tab ID              URL Path        Sayfa                    Detay Route
─────────────────────────────────────────────────────────────────────────
dashboard           /               Dashboard.tsx            —
dashboard-finans    /finans         DashboardFinans.tsx      —
products            /urunler        Products.tsx             /urunler/:id
sales               /satis          Sales.tsx                /satis/:id
cari                /cari           Cari.tsx                 /cari/:id
...
```

**Detay route kuralı:** `/kaynak/:id` pattern'i. `getActiveTabFromLocation()` path'i eşleştirir, detay route'larını ana tab'a yönlendirir.

## 3. Tab Grupları

| Grup | ID | Varsayılan expanded |
|------|----|-------------------|
| Ana | `ana` | Evet |
| Tedarik | `tedarik` | Hayır |
| Finans | `finans` | Evet |
| Analiz | `analiz` | Hayır |
| Sistem | `sistem` | Hayır |

## 4. Navigasyon

```typescript
// Programatik navigasyon
const [location, setLocation] = useLocation();
setLocation('/kasa');

// Tab'a navigasyon (stok sayfası güncellemelerinde)
onTabChange('stok');  // Dashboard kartlarından

// Link ile navigasyon
<a href="/urunler">Ürünler</a>
```

## 5. Lazy Loading

- Her sayfa `React.lazy()` ile import edilir
- `Suspense` ile sarılır (fallback: `<PageFallback />`)
- `preload` stratejisi: Favori tab'lar önceden yüklenir

```typescript
// App.tsx
<Suspense fallback={<PageFallback loading />}>
  <Route path="/" component={Dashboard} />
</Suspense>
```

## 6. Favorite Tab Sistemi

- Kullanıcı maksimum 6 tab'ı favori olarak işaretleyebilir
- Favori tab'lar localStorage'a (`sobaYonetim_favoriteTabs`) kaydedilir
- Favori tab'lar Sidebar'da üstte gösterilir
- Favori olmayan tab'lar grup altında gösterilir

## 7. Route Ekleme

Yeni bir sayfa eklemek için:
1. `src/pages/` altında sayfa dosyasını oluştur
2. `src/App.tsx`'e lazy import + Route ekle
3. `src/config/tabs.ts`'e tab tanımını ekle (opsiyonel)
4. Detay sayfası ise `/:id` pattern'ini kullan, `getActiveTabFromLocation`'da mapping yap

## 8. Route Kuralları

- [ ] Her route `React.lazy()` ile import edilir (direkt import yasak)
- [ ] Her route `<Suspense>` içinde tanımlanır
- [ ] Path'ler Türkçe: `/urunler`, `/satis`, `/cari` (İngilizce yasak)
- [ ] Detay route'ları `/:id` ile biter
- [ ] `getActiveTabFromLocation()` her yeni route için güncellenir
