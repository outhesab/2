# PARSPEL — Geliştirme Rehberi

Bu belge, PARSPEL projesinin teknik yapısını ve geliştirme akışını açıklar.

## Proje Yapısı

```
clean-project/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component (routing, auth, layout)
│   ├── index.css             # Design tokens + global styles
│   │
│   ├── agents/               # 7 ajanlı multi-agent sistemi
│   │   ├── BaseAgent.ts      # Soyut temel sınıf
│   │   ├── AgentBus.ts       # mitt event emitter
│   │   ├── orchestrator.ts   # Ajan orkestrasyonu
│   │   └── *Agent.ts         # Satis, Stok, Kasa, Cari, Fatura, Rapor, DeepSeek
│   │
│   ├── components/           # Bileşenler
│   │   ├── ui/               # 55 shadcn/ui primitive
│   │   ├── layout/           # 8 layout bileşeni (Sidebar, Header, FAB, vb.)
│   │   └── *.tsx             # 15 özel bileşen
│   │
│   ├── pages/                # 36 sayfa + 8 excelmerge alt sayfası
│   ├── hooks/                # 11 hook + db/ alt modülleri
│   ├── lib/                  # 41 yardımcı modül
│   ├── stores/               # Zustand agentStore
│   ├── theme/                # 3 premium tema
│   ├── types/                # Tip tanımları
│   ├── db/                   # IndexedDB/Dexie şeması
│   └── config/               # Tab konfigürasyonu
│
├── docs/                     # Teknik dokümanlar
├── e2e/                      # Playwright testleri
├── scripts/                  # Test ve yardımcı scriptler
├── .github/workflows/        # CI/CD
└── .simple-git-hooks/        # Pre-commit hook
```

## Mimari Kararlar

### Veri Akışı

```
localStorage (birincil) → save() → RuleEngine → AuditEngine → localStorage + IndexedDB → (ops.) Firebase
```

- **localStorage**: Birincil depolama, hızlı erişim
- **IndexedDB**: Snapshot yedekleme (Dexie)
- **Firebase**: Opsiyonel bulut senkronizasyonu

### State Yönetimi

- **Ana state**: `useDB` hook'u ile `useState<DB>` — tüm veri bu hook üzerinden akar
- **Agent state**: Zustand `agentStore` — aktif ajan, meşguliyet durumu
- **UI state**: Component-local `useState` — form değerleri, modal durumları

### Veri Yazma Pattern'i

```typescript
// Her mutasyon bu pattern ile çalışır:
save((prevDB: DB) => {
  // prevDB'yi mutasyona uğrat (immutable)
  return { ...prevDB, products: [...prevDB.products, newProduct] };
});

// saveGuarded — kural motoru korumalı
saveGuarded((prevDB) => {
  // Bu işlem ruleEngine tarafından kontrol edilir
  return nextDB;
});
```

### Multi-Agent Sistemi

7 ajan, mitt tabanlı AgentBus ile iletişim kurar:

```
Satış akışı: satis → stok → kasa → cari → fatura → rapor
```

Her ajan `BaseAgent`'dan türemiş, `islemYap(talep): Promise<AgentResponse>` implemente eder.

### Kural Motoru

Her `save()` çağrısı öncesi `validateTransaction(prevDB, nextDB)` çalışır:
- `severity: 'block'` → işlem engellenir
- `severity: 'warn'` → uyarı gösterilir ama işlem devam eder

### Offline-First

Uygulama Firebase olmadan tamamen çalışır:
- Çevrimdışı: localStorage + IndexedDB yeterli
- Çevrimiçi: 1.2sn debounce ile Firebase'e senkronize

## Geliştirme İpuçları

### Yeni Sayfa Eklemek

1. `src/pages/YeniSayfa.tsx` oluşturun
2. `React.lazy()` ile import edin
3. `src/App.tsx`'e route ekleyin
4. `src/config/tabs.ts`'e tab ekleyin
5. `src/lib/changelog.ts`'i güncelleyin

### Yeni Bileşen Eklemek

1. shadcn/ui bileşeniyse `src/components/ui/` altına ekleyin
2. Özel bileşense `src/components/` altına ekleyin
3. CSS class kullanın, inline style kullanmayın
4. `@/components/...` ile import edin

### Test Yazma

```typescript
// Saf fonksiyon testi (UI yok)
import { validateTransaction } from './ruleEngine';

test('stok negatife düşemez', () => {
  const prev = makeDefaultDB();
  const next = { ...prev, products: [{ ...product, stock: -1 }] };
  const violations = validateTransaction(prev, next);
  expect(violations.some(v => v.rule === 'negative_stock')).toBe(true);
});
```

### Veritabanı Şeması Değişikliği

1. `src/types/index.ts`'e yeni tip ekleyin
2. `src/lib/dbDefaults.ts`'e varsayılan değer ekleyin
3. `src/hooks/db/core.ts`'e migration ekleyin
4. `src/db/indexeddb.ts`'e Dexie tablosu ekleyin

## Debugging

### VS Code ile

`.vscode/launch.json` dosyası henüz yok. Manuel olarak:
- Chrome'da `F12` → Sources → breakpoints
- React Developer Tools tarayıcı eklentisi

### Test ile

```bash
# Tek test dosyası
pnpm exec vitest run src/lib/ruleEngine.test.ts

# Watch mode
pnpm exec vitest src/lib/ruleEngine.test.ts

# Coverage
pnpm exec vitest run --coverage
```

## Performans

- Ana JS bundle: ~245 KB (hedef: < 300 KB)
- Toplam JS: ~3.0 MB
- Lazy loading: Tüm sayfalar `React.lazy()` ile
- PWA: 53 asset precache, offline çalışma

## Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|-------|-------|
| `pnpm install` hata veriyor | `node -v` ile Node 22+ kullandığınızdan emin olun |
| Build yavaş | `vite.config.ts`'te sourcemap false olmalı |
| Firebase bağlanmıyor | `Entegrasyonlar` sayfasından API key'leri girin veya `.env`'i kontrol edin |
| Testler çalışmıyor | `pnpm run test:run` ile tek seferlik çalıştırın |
| Pre-commit reddediyor | `src/lib/changelog.ts`'i güncelleyin |
