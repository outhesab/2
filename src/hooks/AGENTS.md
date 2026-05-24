# PARSPEL — React Hook'ları

6 hook, en kritiği useDB (1321 satır).

## Yapı

```
src/hooks/
├── useDB.ts          # 1321 satır — veri katmanının kalbi
├── use-toast.ts      # sonner toast bildirimleri
├── use-mobile.tsx    # Mobil ekran algılama
├── useSoundFeedback.ts # Sesli geribildirim
├── useSpeech.ts      # Konuşma sentezi
└── useUIPrefs.ts     # UI tercihleri (tema, dil)
```

## useDB — Veri Katmanı

```
localStorage (sobaYonetim) → save() → RuleEngine → localStorage → IndexedDB → (ops.) Firebase
```

- `useDB()` → `{ data, save, loading, error, syncStatus }`
- `save(transformer: (prev: DB) => DB)` — pure transformer
- `SyncStatus`: `idle | saving | saved | error | loading`
- Firebase sync: 1.2s debounce, 3 retry (2s/4s/8s)
- Audit log her save'de otomatik

## Önemli

- useDB dışındaki hook'lar basit ve bağımsız
- use-toast → sonner wrapper'ı
- useUIPrefs → localStorage'a tema tercihi kaydeder
