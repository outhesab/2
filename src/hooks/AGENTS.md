# PARSPEL — React Hook'ları

11 hook + 4 db alt modülü.

## Yapı

```
src/hooks/
├── useDB.ts              # Ana veri katmanı hook'u
├── use-toast.ts          # sonner toast bildirimleri
├── use-mobile.tsx        # Mobil ekran algılama
├── useSoundFeedback.ts   # Sesli geribildirim
├── useSpeech.ts          # Konuşma sentezi (TTS + STT)
├── useUIPrefs.ts         # UI tercihleri (tema, dil)
├── useDraggableButton.ts # Sürüklenebilir buton
├── useOnlineStatus.ts    # Çevrimiçi/çevrimdışı algılama
└── db/                   # IndexedDB/Dexie alt modülleri
    ├── core.ts           # DB state yönetimi (579 satır)
    ├── backup.ts         # Yedekleme fonksiyonları
    ├── sync.ts           # Firebase senkronizasyonu
    └── index.ts          # Toplu export
```

## useDB — Veri Katmanı

```
localStorage (sobaYonetim) → save() → RuleEngine → localStorage → IndexedDB → (ops.) Firebase
```

- `useDB()` → `{ db, save, saveWithLog, saveGuarded, logActivity, exportJSON, importJSON, getKasaBakiye, getTotalKasa, manualBackup, listBackups, restoreBackup }`
- `save(transformer: (prev: DB) => DB)` — pure transformer
- `SyncStatus`: `idle | saving | saved | error | loading`
- Firebase sync: 1.2s debounce, 3 retry (2s/4s/8s)
- Audit log her save'de otomatik

## db/ Alt Modülleri

- `core.ts` — Core DB state, save mekanizması, IndexedDB snapshot
- `backup.ts` — Firebase yedekleme/geri yükleme
- `sync.ts` — Firebase senkronizasyonu (debounce, retry)
- `index.ts` — Barrel export

## Önemli

- useDB dışındaki hook'lar basit ve bağımsız
- use-toast → sonner wrapper'ı
- useUIPrefs → localStorage'a tema tercihi kaydeder
- useOnlineStatus → navigator.onLine + event listener
