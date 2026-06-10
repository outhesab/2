1|# PARSPEL — Haftalık İyileştirme Planı
2|
3|Proje analizi sonucu tespit edilen eksikliklerin giderilmesi için 6 haftalık plan.
4|
5|---
6|
7|## 1. Hafta — GÜVENLİK (Kritik)
8|
9|| # | Görev | Dosya | Durum |
10||---|-------|-------|-------|
11|| 1.1 | DOMPurify kurulacak (`pnpm add dompurify @types/dompurify`) | `package.json` | ✅ |
12|| 1.2 | `dangerouslySetInnerHTML` önüne sanitization eklenecek | `src/pages/AIAsistan.tsx:71`, `src/pages/excelmerge/ai-asistan.tsx:402` | ✅ (zaten vardı) |
13|| 1.3 | `document.write()` kaldırılacak — safe innerHTML + DOMPurify | `src/pages/Fatura.tsx:1879`, `src/pages/Kasa.tsx:39` | ✅ (zaten vardı) |
14|| 1.4 | `.env` API key'leri rotate edilecek (Firebase, Gemini, DeepSeek) | `.env` | ✅ |
15|| 1.5 | CSP meta tag eklenecek | `index.html` | ✅ |
16|| 1.6 | Firebase API key URL query'den çıkarılacak — POST body veya SDK | `src/lib/userManager.ts` | ✅ |
17|| 1.7 | `__audit_login.mjs` `.gitignore`'a eklenecek veya silinecek | Proje root | ✅ |
18|
19|
20|---
21|
22|## 2. Hafta — HATA YÖNETİMİ
23|
24|| # | Görev | Dosya | Durum |
25||---|-------|-------|-------|
26||| 2.1 | Boş `catch {}` bloklarına `console.error` eklenecek (109 adet) | Tüm proje | ✅ (v3.7.1) |
27||| 2.2 | `catch (e) {}` bloklarına logger entegre edilecek (40 adet) | Tüm proje | ✅ (v3.7.1) |
28||| 2.3 | `logger.ts`'e crash reporting fonksiyonu eklenecek | `src/lib/logger.ts` | ✅ |
29||| 2.4 | DB katmanına error boundary eklenecek | `src/hooks/db/core.ts`, `src/hooks/db/backup.ts` | ✅ |
30||| 2.5 | `/* ignore */` yorumlu catch blokları gözden geçirilecek (5 dosya) | `dataIntegrityChecker.ts`, `offline-ai.ts`, `appConfig.ts`, `db/sync.ts`, `AnomaliOneri.tsx` | ✅ |
31|
32|---
33|
34|## 3. Hafta — TİP GÜVENLİĞİ
35|
36|| # | Görev | Dosya | Durum |
37||---|-------|-------|-------|
38|| 3.1 | `Cari.tsx` `note` alanı type tanımlamasına eklenecek | `src/types/index.ts`, `src/pages/Cari.tsx` | ✅ |
39|| 3.2 | SpeechRecognition için `window` type genişletme | `src/types/global.d.ts`, `src/lib/audio.ts`, `src/hooks/useSpeech.ts` | ✅ |
40|| 3.3 | `eslint-disable no-explicit-any` azaltılacak (34 → 10 hedef) | 11 dosya | ✅ |
41|| 3.4 | `tsconfig.json`'a `noUnusedLocals: true` eklenecek | `tsconfig.json` | ✅ |
42|| 3.5 | `KontrolHalkasi.tsx` `as any` cast'leri temizlenecek (4 adet) | `src/pages/KontrolHalkasi.tsx` | ✅ |
43|
44|---
45|
46|## 4. Hafta — TEST KAPSAMI
47|
48|| # | Görev | Dosya | Durum |
49||---|-------|-------|-------|
50|| 4.1 | `@testing-library/react` kurulacak | `package.json` | ✅ |
51|| 4.2 | `anomalyEngine.ts` test yazılacak | `src/lib/anomalyEngine.test.ts` | ✅ |
52|| 4.3 | `aiActions.ts` test yazılacak | `src/lib/aiActions.test.ts` | ✅ |
53|| 4.4 | `notificationEngine.ts` test yazılacak | `src/lib/notificationEngine.test.ts` | ✅ |
54|| 4.5 | `permissions.ts` test yazılacak | `src/lib/permissions.test.ts` | ✅ |
55|| 4.6 | `firebase.ts` test yazılacak | `src/lib/firebase.test.ts` | ✅ |
56|| 4.7 | `excelExport.ts` test yazılacak | `src/lib/excelExport.test.ts` | ✅ |
57|| 4.8 | `safeXlsx.ts` test yazılacak | `src/lib/safeXlsx.test.ts` | ✅ |
58|| 4.9 | `storageQuota.ts` test yazılacak | `src/lib/storageQuota.test.ts` | ✅ (silindi) |
59|| 4.10 | `logger.ts` test yazılacak | `src/lib/logger.test.ts` | ✅ |
60|| 4.11 | `healthCheck.ts` test yazılacak | `src/lib/healthCheck.test.ts` | ✅ |
61|| 4.12 | `connConfig.ts` test yazılacak | `src/lib/connConfig.test.ts` | ✅ |
62|| 4.13 | `dbDefaults.ts` test yazılacak | `src/lib/dbDefaults.test.ts` | ✅ |
63|
64|---
65|
66|## 5. Hafta — TEST KAPSAMI (Devam) + Ajan Testleri
67|
68|| # | Görev | Dosya | Durum |
69||---|-------|-------|-------|
70|| 5.1 | `StokAgent.ts` test yazılacak | `src/agents/StokAgent.test.ts` | ✅ |
71|| 5.2 | `KasaAgent.ts` test yazılacak | `src/agents/KasaAgent.test.ts` | ✅ |
72|| 5.3 | `CariAgent.ts` test yazılacak | `src/agents/CariAgent.test.ts` | ✅ |
73|| 5.4 | `FaturaAgent.ts` test yazılacak | `src/agents/FaturaAgent.test.ts` | ✅ |
74|| 5.5 | `RaporAgent.ts` test yazılacak | `src/agents/RaporAgent.test.ts` | ✅ |
75|| 5.6 | `DeepSeekAgent.ts` test yazılacak | `src/agents/DeepSeekAgent.test.ts` | ✅ |
76|| 5.7 | `AgentBus.ts` test yazılacak | `src/agents/AgentBus.test.ts` | ✅ |
77|| 5.8 | `orchestrator.ts` test yazılacak | `src/agents/orchestrator.test.ts` | ✅ |
78|| 5.9 | `db/core.ts` test yazılacak | `src/hooks/db/core.test.ts` | ⬜ |
79|| 5.10 | `db/backup.ts` test yazılacak | `src/hooks/db/backup.test.ts` | ⬜ |
80|| 5.11 | `db/sync.ts` test yazılacak | `src/hooks/db/sync.test.ts` | ⬜ |
81|| 5.12 | `Vitest config`'ten hariç testler aktif edilecek | `vite.config.ts` | ⬜ |
82|
83|---
84|
85|## 6. Hafta — REFACTOR + BAĞIMLILIK + TEMİZLİK
86|
87|| # | Görev | Dosya | Durum |
88||---|-------|-------|-------|
89|| 6.1 | **Settings.tsx → 6 modüle ayrılacak** | `src/pages/Settings/` | ⬜ |
90|| | ├─ CompanySettings.tsx | | ⬜ |
91|| | ├─ UserSettings.tsx | | ⬜ |
92|| | ├─ ThemeSettings.tsx | | ⬜ |
93|| | ├─ FirebaseSettings.tsx | | ⬜ |
94|| | ├─ BackupSettings.tsx | | ⬜ |
95|| | └─ ChangelogView.tsx | | ⬜ |
96|| 6.2 | **AIAsistan.tsx → 3 parçaya** | `src/pages/AIAsistan.tsx` | ⬜ |
97|| | ├─ ChatPanel.tsx | | ⬜ |
98|| | ├─ MessageList.tsx | | ⬜ |
99|| | └─ ActionHistory.tsx | | ⬜ |
100|| 6.3 | **Fatura.tsx → 3 parçaya** | `src/pages/Fatura.tsx` | ⬜ |
101|| | ├─ FaturaList.tsx | | ⬜ |
102|| | ├─ FaturaForm.tsx | | ⬜ |
103|| | └─ FaturaPDF.tsx | | ⬜ |
104|| 6.4 | **`fast-check` → devDependencies** | `package.json` | ✅ (zaten devDep) |
105|| 6.5 | **Capacitor ML Kit versiyon** ^8.x'e yükselt | `package.json` | ✅ |
106|| 6.6 | **`react-hook-form` versiyon** sabitlenecek `^7.54.0` | `package.json` | ✅ |
107|| 6.7 | **Inline CSS → CSS module** (üst 10 dosya) | `src/pages/` | ⬜ |
108|| 6.8 | **Dead code temizliği** (5 adet yorum bloğu) | Farklı dosyalar | ⬜ |
109|
110|---
111|
112|## Durum Takip Özeti
113|
114||| Hafta | Toplam Görev | Tamamlanan | Kaldı |
115|||-------|-------------|------------|-------|
116||| 1. Hafta — Güvenlik | 7 | 7 | 0 |
117||| 2. Hafta — Hata Yönetimi | 5 | 5 | 0 |
118||| 3. Hafta — Tip Güvenliği | 5 | 5 | 0 |
119||| 4. Hafta — Test (1) | 13 | 13 | 0 |
120||| 5. Hafta — Test (2) | 12 | 8 | 4 |
121||| 6. Hafta — Refactor | 15 | 0 | 15 |
122||| **TOPLAM** | **57** | **38** | **19** |
123|
124|---
125|
126|> Bu plan `29 Mayıs 2026` tarihinde oluşturulmuştur.
127|> Her hafta sonunda bu dosyadaki Durum sütununu `⬜ → ✅` olarak güncelleyin.
128|