# PARSPEL — Haftalık İyileştirme Planı (GÜNCELLENMİŞ)

> **Güncelleme:** 12 Haziran 2026  
> **Değişiklik:** Kod taraması sonucu gerçek durum yansıtıldı  

---

## ÖZET (Gerçek Durum)

| Hafta | Toplam Görev | Tamamlanan | Kalan | Durum |
|-------|-------------|------------|-------|-------|
| 1. Hafta — Güvenlik | 7 | 7 | 0 | ✅ |
| 2. Hafta — Hata Yönetimi | 5 | 5 | 0 | ✅ |
| 3. Hafta — Tip Güvenliği | 5 | 5 | 0 | ✅ |
| 4. Hafta — Test (1) | 13 | 13 | 0 | ✅ |
| 5. Hafta — Test (2) | 12 | 8 | 4 | ⚠️ |
| 6. Hafta — Refactor | 15 | **6** | **9** | ⚠️ |
| **TOPLAM** | **57** | **44** | **13** | **77%** |

---

## 6. Hafta — REFACTOR (GÜNCELLENMİŞ)

| # | Görev | Dosya | Gerçek Durum |
|---|-------|-------|--------------|
| ✅ 6.1 | Settings.tsx → 6 modül | `src/pages/Settings/` | **TAMAMLANDI** (292 satır, 19 modül) |
| ⬜ 6.2 | AIAsistan.tsx → 3 modül | `src/pages/AIAsistan.tsx` | **BEKLEYEN** (1354 satır) |
| ✅ 6.3 | Fatura.tsx → 3 modül | `src/pages/Fatura.tsx` | **GEREKSİZ** (698 satır, OK) |
| ✅ 6.4 | fast-check → devDependencies | `package.json` | TAMAMLANDI |
| ✅ 6.5 | Capacitor ML Kit ^8.x | `package.json` | TAMAMLANDI |
| ✅ 6.6 | react-hook-form ^7.54.0 | `package.json` | TAMAMLANDI |
| ⬜ 6.7 | Inline CSS → CSS module | `src/pages/` | BEKLEYEN |
| ⬜ 6.8 | Dead code temizliği | Farklı dosyalar | BEKLEYEN |

---

## YENİ KEŞFEDİLEN GÖREVLER (Kod Taraması)

### P — SAYFA BOYUT İHLALLERİ (11 dosya)

**Kural:** Page component max 800 satır

| # | Dosya | Satır | Öncelik | Tahmini Süre |
|---|-------|-------|---------|--------------|
| **P1** | Reports.tsx | 1755 | 🔴 KRİTİK | 6 saat |
| **P2** | Dashboard.tsx | 1425 | 🔴 KRİTİK | 5 saat |
| **P3** | AIAsistan.tsx | 1354 | 🔴 KRİTİK | 4 saat |
| **P4** | Suppliers.tsx | 1265 | 🔴 YÜKSEK | 4 saat |
| **P5** | SettingsBackup.tsx | 1156 | 🔴 YÜKSEK | 4 saat |
| **P6** | Monitor.tsx | 1147 | 🟡 ORTA | 3 saat |
| **P7** | BugHunter.tsx | 1070 | 🟡 ORTA | 3 saat |
| **P8** | Bank.tsx | 1010 | 🟡 ORTA | 3 saat |
| **P9** | Cari.tsx | 977 | 🟡 ORTA | 3 saat |
| **P10** | Products.tsx | 811 | 🟢 DÜŞÜK | 2 saat |
| **P11** | AnomaliOneri.tsx | 793 | 🟢 İZLE | - |

**Toplam:** ~37 saat refactor işi

---

## YENİ ÖNCELİK PLANI

### **Faz 1: Kritik Buglar (3 saat)**
```
1. G4 — Firebase sync setTimeout fix
2. G5 — Kasa/POS routing fix
```

### **Faz 2: Kritik Sayfa Refactor (19 saat)**
```
3. P1 — Reports.tsx → 3 modül (ReportList, ReportChart, ReportExport)
4. P2 — Dashboard.tsx → 4 modül (DashboardLayout, WidgetGrid, DataFetcher, Charts)
5. P3 — AIAsistan.tsx → 3 modül (ChatPanel, MessageList, ActionHistory)
6. P4 — Suppliers.tsx → 3 modül (SupplierList, SupplierForm, SupplierDetail)
```

### **Faz 3: Yüksek Öncelik Refactor (17 saat)**
```
7. P5 — SettingsBackup.tsx → 3 modül
8. P6 — Monitor.tsx → 2 modül
9. P7 — BugHunter.tsx → 2 modül
10. P8 — Bank.tsx → 2 modül
11. P9 — Cari.tsx → 2 modül
```

### **Faz 4: Hızlı İyileştirmeler (5 saat)**
```
12. 6.7 — Inline CSS → CSS Module
13. 6.8 — Dead code temizliği
14. J1 — aria-label ekleme
15. 5.12 — Vitest exclude temizliği
```

---

## TAMAMLANAN GÖREVLER (Kod Taraması Doğrulaması)

### ✅ **useDB Refactor (C3)**
**İddia:** 640 satır monolit  
**Gerçek:** 7 dosyaya bölünmüş
```
hooks/db/
├── index.ts (192 satır)
├── backup.ts (451 satır)
├── sync.ts (123 satır)
├── useDBActions.ts (50 satır)
├── useDBBackup.ts (131 satır)
├── useDBQueries.ts (21 satır)
└── dbHelpers.ts (91 satır)
```

### ✅ **Settings Refactor (6.1)**
**İddia:** 4394 satır  
**Gerçek:** 292 satır + 19 modül
```
pages/
├── Settings.tsx (292 satır)
└── settings/ (19 dosya)
    ├── SettingsAboutPanel.tsx
    ├── SettingsActivity.tsx
    ├── SettingsAgentPanel.tsx
    ├── SettingsBackup.tsx (1156 satır ← büyük!)
    ├── SettingsCompany.tsx
    └── ... (14 dosya daha)
```

---

## SONUÇ

**Eski Tahmin:** 57 görev, 38 tamamlandı, 19 kaldı  
**Yeni Gerçek:** 57 görev, **44 tamamlandı**, **13 kaldı** + **11 yeni keşfedildi**

**İş Yükü:**
- Önceki tahmin: ~100 saat
- Gerçek durum: ~40 saat

**En Acil:**
1. G4, G5 (kritik buglar) — 3 saat
2. P1-P4 (kritik sayfa refactor) — 19 saat
3. P5-P9 (yüksek öncelik) — 17 saat

---

> Bu plan `12 Haziran 2026` tarihinde kod taraması sonucu güncellendi.
