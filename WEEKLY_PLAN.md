# PARSPEL — Haftalık İyileştirme Planı

Proje analizi sonucu tespit edilen eksikliklerin giderilmesi için 6 haftalık plan.

---

## 1. Hafta — GÜVENLİK (Kritik)

| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 1.1 | DOMPurify kurulacak (`pnpm add dompurify @types/dompurify`) | `package.json` | ✅ |
| 1.2 | `dangerouslySetInnerHTML` önüne sanitization eklenecek | `src/pages/AIAsistan.tsx:71`, `src/pages/excelmerge/ai-asistan.tsx:402` | ✅ (zaten vardı) |
| 1.3 | `document.write()` kaldırılacak — safe innerHTML + DOMPurify | `src/pages/Fatura.tsx:1879`, `src/pages/Kasa.tsx:39` | ✅ (zaten vardı) |
| 1.4 | `.env` API key'leri rotate edilecek (Firebase, Gemini, DeepSeek) | `.env` | ✅ |
| 1.5 | CSP meta tag eklenecek | `index.html` | ✅ |
| 1.6 | Firebase API key URL query'den çıkarılacak — POST body veya SDK | `src/lib/userManager.ts` | ✅ |
| 1.7 | `__audit_login.mjs` `.gitignore`'a eklenecek veya silinecek | Proje root | ✅ |


---

## 2. Hafta — HATA YÖNETİMİ

| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 2.1 | Boş `catch {}` bloklarına `console.error` eklenecek (109 adet) | Tüm proje | ⬜ |
| 2.2 | `catch (e) {}` bloklarına logger entegre edilecek (40 adet) | Tüm proje | ⬜ |
| 2.3 | `logger.ts`'e crash reporting fonksiyonu eklenecek | `src/lib/logger.ts` | ✅ |
| 2.4 | DB katmanına error boundary eklenecek | `src/hooks/db/core.ts`, `src/hooks/db/backup.ts` | ✅ |
| 2.5 | `/* ignore */` yorumlu catch blokları gözden geçirilecek (5 dosya) | `dataIntegrityChecker.ts`, `offline-ai.ts`, `appConfig.ts`, `db/sync.ts`, `AnomaliOneri.tsx` | ✅ |

---

## 3. Hafta — TİP GÜVENLİĞİ

| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 3.1 | `Cari.tsx` `note` alanı type tanımlamasına eklenecek | `src/types/index.ts`, `src/pages/Cari.tsx` | ✅ |
| 3.2 | SpeechRecognition için `window` type genişletme | `src/types/global.d.ts`, `src/lib/audio.ts`, `src/hooks/useSpeech.ts` | ✅ |
| 3.3 | `eslint-disable no-explicit-any` azaltılacak (34 → 10 hedef) | 11 dosya | ✅ |
| 3.4 | `tsconfig.json`'a `noUnusedLocals: true` eklenecek | `tsconfig.json` | ✅ |
| 3.5 | `KontrolHalkasi.tsx` `as any` cast'leri temizlenecek (4 adet) | `src/pages/KontrolHalkasi.tsx` | ✅ |

---

## 4. Hafta — TEST KAPSAMI

| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 4.1 | `@testing-library/react` kurulacak | `package.json` | ⬜ |
| 4.2 | `anomalyEngine.ts` test yazılacak | `src/lib/anomalyEngine.test.ts` | ⬜ |
| 4.3 | `aiActions.ts` test yazılacak | `src/lib/aiActions.test.ts` | ⬜ |
| 4.4 | `notificationEngine.ts` test yazılacak | `src/lib/notificationEngine.test.ts` | ⬜ |
| 4.5 | `permissions.ts` test yazılacak | `src/lib/permissions.test.ts` | ⬜ |
| 4.6 | `firebase.ts` test yazılacak | `src/lib/firebase.test.ts` | ⬜ |
| 4.7 | `excelExport.ts` test yazılacak | `src/lib/excelExport.test.ts` | ⬜ |
| 4.8 | `safeXlsx.ts` test yazılacak | `src/lib/safeXlsx.test.ts` | ⬜ |
| 4.9 | `storageQuota.ts` test yazılacak | `src/lib/storageQuota.test.ts` | ⬜ |
| 4.10 | `logger.ts` test yazılacak | `src/lib/logger.test.ts` | ⬜ |
| 4.11 | `healthCheck.ts` test yazılacak | `src/lib/healthCheck.test.ts` | ⬜ |
| 4.12 | `connConfig.ts` test yazılacak | `src/lib/connConfig.test.ts` | ⬜ |
| 4.13 | `dbDefaults.ts` test yazılacak | `src/lib/dbDefaults.test.ts` | ⬜ |

---

## 5. Hafta — TEST KAPSAMI (Devam) + Ajan Testleri

| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 5.1 | `StokAgent.ts` test yazılacak | `src/agents/StokAgent.test.ts` | ⬜ |
| 5.2 | `KasaAgent.ts` test yazılacak | `src/agents/KasaAgent.test.ts` | ⬜ |
| 5.3 | `CariAgent.ts` test yazılacak | `src/agents/CariAgent.test.ts` | ⬜ |
| 5.4 | `FaturaAgent.ts` test yazılacak | `src/agents/FaturaAgent.test.ts` | ⬜ |
| 5.5 | `RaporAgent.ts` test yazılacak | `src/agents/RaporAgent.test.ts` | ⬜ |
| 5.6 | `DeepSeekAgent.ts` test yazılacak | `src/agents/DeepSeekAgent.test.ts` | ⬜ |
| 5.7 | `AgentBus.ts` test yazılacak | `src/agents/AgentBus.test.ts` | ⬜ |
| 5.8 | `orchestrator.ts` test yazılacak | `src/agents/orchestrator.test.ts` | ⬜ |
| 5.9 | `db/core.ts` test yazılacak | `src/hooks/db/core.test.ts` | ⬜ |
| 5.10 | `db/backup.ts` test yazılacak | `src/hooks/db/backup.test.ts` | ⬜ |
| 5.11 | `db/sync.ts` test yazılacak | `src/hooks/db/sync.test.ts` | ⬜ |
| 5.12 | `Vitest config`'ten hariç testler aktif edilecek | `vite.config.ts` | ⬜ |

---

## 6. Hafta — REFACTOR + BAĞIMLILIK + TEMİZLİK

| # | Görev | Dosya | Durum |
|---|-------|-------|-------|
| 6.1 | **Settings.tsx → 6 modüle ayrılacak** | `src/pages/Settings/` | ⬜ |
| | ├─ CompanySettings.tsx | | ⬜ |
| | ├─ UserSettings.tsx | | ⬜ |
| | ├─ ThemeSettings.tsx | | ⬜ |
| | ├─ FirebaseSettings.tsx | | ⬜ |
| | ├─ BackupSettings.tsx | | ⬜ |
| | └─ ChangelogView.tsx | | ⬜ |
| 6.2 | **AIAsistan.tsx → 3 parçaya** | `src/pages/AIAsistan.tsx` | ⬜ |
| | ├─ ChatPanel.tsx | | ⬜ |
| | ├─ MessageList.tsx | | ⬜ |
| | └─ ActionHistory.tsx | | ⬜ |
| 6.3 | **Fatura.tsx → 3 parçaya** | `src/pages/Fatura.tsx` | ⬜ |
| | ├─ FaturaList.tsx | | ⬜ |
| | ├─ FaturaForm.tsx | | ⬜ |
| | └─ FaturaPDF.tsx | | ⬜ |
| 6.4 | **`fast-check` → devDependencies** | `package.json` | ⬜ |
| 6.5 | **Capacitor ML Kit versiyon** ^8.x'e yükselt | `package.json` | ⬜ |
| 6.6 | **`react-hook-form` versiyon** sabitlenecek `^7.54.0` | `package.json` | ⬜ |
| 6.7 | **Inline CSS → CSS module** (üst 10 dosya) | `src/pages/` | ⬜ |
| 6.8 | **Dead code temizliği** (5 adet yorum bloğu) | Farklı dosyalar | ⬜ |

---

## Durum Takip Özeti

| Hafta | Toplam Görev | Tamamlanan | Kaldı |
|-------|-------------|------------|-------|
| 1. Hafta — Güvenlik | 7 | 6 | 1 |
| 2. Hafta — Hata Yönetimi | 5 | 5 | 0 |
| 3. Hafta — Tip Güvenliği | 5 | 0 | 5 |
| 4. Hafta — Test (1) | 13 | 0 | 13 |
| 5. Hafta — Test (2) | 12 | 0 | 12 |
| 6. Hafta — Refactor | 15 | 0 | 15 |
| **TOPLAM** | **57** | **0** | **57** |

---

> Bu plan `29 Mayıs 2026` tarihinde oluşturulmuştur.
> Her hafta sonunda bu dosyadaki Durum sütununu `⬜ → ✅` olarak güncelleyin.
