# PARSPEL — Kullanıcı Senaryoları

> Versiyon: 3.7.0 | Tarih: 29 Mayıs 2026

## Senaryo 1: Müşteri Soba Satın Alır (Nakit)

```
1. Kullanıcı "Hızlı Satış" butonuna tıklar
2. Ürün: "Model X Soba" seçilir (stok: 5, fiyat: 15.000 ₺)
3. Miktar: 1, Ödeme: Nakit
4. Sistem:
   a. SatisAgent.yeniSatis() → Sale kaydı oluşturur
   b. StokAgent → stok 5→4 düşer, StockMovement kaydedilir
   c. KasaAgent → Nakit kasasına 15.000 ₺ gelir eklenir
   d. RaporAgent → Aktivite kaydı oluşturur
5. Rule Engine: stok ≥ 0 ✔, kasa ≥ 0 ✔, tutar > 0 ✔
6. Audit Engine: diff kaydedilir
7. localStorage güncellenir, IndexedDB snapshot alınır
8. 1.2sn sonra Firebase senkron
```

## Senaryo 2: Müşteri Cari Hesaba Soba Alır (Vadeli)

```
1. Kullanıcı Satış sayfasından "Ahmet Pel" müşterisi seçilir
2. Ürün: "P Remix Soba", Miktar: 2, Toplam: 30.000 ₺
3. Ödeme: Cari (vadeli)
4. Müşteri peşinat olarak 5.000 ₺ nakit verir
5. Sistem:
   a. SatisAgent → Sale (30.000 ₺, cariId bağlı)
   b. StokAgent → stok düşer
   c. KasaAgent → Nakit kasası +5.000 ₺ (tahsilat)
   d. CariAgent → Cari.balance 0→25.000 ₺ artar
   e. FaturaAgent → Fatura (taslak, 30.000 ₺) oluşturulur
   f. RaporAgent → log kaydı
6. Kullanıcı faturayı "onaylandı" yapar
```

## Senaryo 3: Gün Sonu Kasa Sayımı ve Anomali Tespiti

```
1. Kullanıcı Dashboard → "Kasa Sayım" butonuna tıklar
2. Kasa sayım penceresi açılır: her kasa için (Nakit, Banka, POS...)
3. Kullanıcı fiziki bakiyeleri girer
4. Sistem:
   a. Hesaplanan bakiye ile girilen bakiye karşılaştırılır
   b. Fark varsa düzeltme kaydı oluşturulur
   c. AnomalyEngine: olağandışı farklar tespit edilirse uyarı
5. Kullanıcı farkı kabul eder / reddeder
```

## Senaryo 4: Firebase Bağlantısı ve Bulut Senkron

```
1. Kullanıcı Entegrasyonlar sayfasına gider
2. Firebase API anahtarlarını girer (veya .env'den otomatik yüklenir)
3. Sistem:
   a. connConfig localStorage'a kaydedilir
   b. Firebase Firestore bağlantısı test edilir
   c. Start sync → her save()'den 1.2sn sonra debounce ile Firestore'a yazar
   d. Sync durumu header'da gösterilir (idle/saving/saved/error/loading)
4. İkinci cihazda oturum açılınca:
   a. loadFromFirebase() en yüksek _version'ı çeker
   b. Bulut verisi daha güncelse → localStorage ve IndexedDB güncellenir
```

## Senaryo 5: Tedarikçi Siparişi ve Stok Girişi

```
1. Tedarikçi sayfası → Yeni Sipariş
2. Tedarikçi: "Kömürcü A.Ş.", Ürün: "Model X Soba", Miktar: 10
3. Sipariş durumu: "bekliyor"
4. Sipariş gelince → "tamamlandı" yapılır
5. Sistem:
   a. StokAgent → 10 adet stok girişi
   b. StockMovement kaydedilir
   c. Sipariş "tamamlandı"
6. Ödeme: KasaAgent → Banka kasasından tedarikçi ödemesi düşer
7. CariAgent → Tedarikçi bakiyesi güncellenir
```

## Senaryo 6: Yedekten Geri Yükleme

```
1. Dashboard → Yedekler → Listeden bir yedek seçilir
2. Sistem:
   a. Otomatik olarak MEVCUT durumun yedeğini alır (önlem)
   b. Seçilen yedeği Firebase'den çeker
   c. fullRestoreDB() ile default DB şemasına merge eder
   d. localStorage, IndexedDB, Firebase üçüne de yazar
3. Kullanıcıya RestoreReport gösterilir (kaç kayıt geldi, referans hataları)
```
