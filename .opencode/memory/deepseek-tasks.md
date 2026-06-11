# 🔵 DeepSeek — Mimari ve Kritik Altyapı Görevleri

Bu dosya, yüksek reasoning (muhakeme) kapasitesi gerektiren ve projenin çekirdek mantığını etkileyen "cerrahi" müdahaleleri içerir.

## 🛠️ Görev 1: `useDB` Monolitini Parçalamak (Sıfır Re-render Hedefi)
- **Mevcut Durum:** `useDB` tüm DB state'ini tek bir nesne olarak döner. Her `save()` işleminde tüm uygulama re-render olur.
- **Hedef:** Selector pattern'a geçiş yapmak veya state'i mantıksal parçalara (örneğin: `useProducts`, `useSales`, `useKasa`) bölmek.
- **Kritiklik:** Yüksek (Performans ve Ölçeklenebilirlik).

## 🛠️ Görev 2: Firebase Sync Queue (Sıralı Yazma Sistemi)
- **Mevcut Durum:** Senkronizasyon "fire-and-forget" mantığıyla çalışıyor; aynı anda birden fazla kayıt geldiğinde sıralama bozulabilir veya veri kaybı yaşanabilir.
- **Hedef:** Bir işlem kuyruğu (Queue) oluşturmak. Her yazma işlemi bir öncekini beklemeli ve hata durumunda retry mekanizması çalışmalı.
- **Kritiklik:** Yüksek (Veri Bütünlüğü).

## 🛠️ Görev 3: Undo (Geri Alma) Senkronizasyon Güvencesi
- **Mevcut Durum:** `undo()` sonrası Firebase senkronizasyonu `setTimeout` ile yapılıyor ve sonucu beklenmiyor.
- **Hedef:** Geri alma işleminin bulut tarafında da başarıyla tamamlandığını doğrulayan bir `Promise` zinciri kurmak.
- **Kritiklik:** Orta/Yüksek (Tutarlılık).

---
**Not:** Bu görevler, projenin "beyni"ne dokunduğu için en yüksek dikkatle ve kapsamlı testlerle (Vitest) uygulanmalıdır.
