# CRITICAL FIXES — Gerçekten Yapılması Gerekenler

> **Süre:** 3 saat  
> **Risk:** 🔴 Yüksek (bug'lar mevcut)  
> **Fayda:** 🟢 Yüksek (veri kaybı ve iş mantığı)  

---

## GÖREV 1: Firebase Sync setTimeout Düzelt (G4)

### Sorun
`core.ts:332` — `setTimeout` içinde promise uncached, sync hatası sessizce kaybolur.

### Konum
`src/hooks/db/core.ts:332`

### Mevcut Kod
```typescript
setTimeout(() => {
  syncToFirebase(nextDB); // Promise ignore ediliyor
}, 1200);
```

### Düzeltme
```typescript
setTimeout(() => {
  syncToFirebase(nextDB).catch((error) => {
    logger.error('Firebase sync hatası', { error });
    // Retry logic veya user notification
  });
}, 1200);
```

### Test
```bash
# Firebase sync'i test et
pnpm exec vitest run src/hooks/db/sync.test.ts
```

### Başarı Kriteri
- ✅ Promise catch edildi
- ✅ Hata loglanıyor
- ✅ Test pass ediyor

### Süre
⏱️ 1 saat

---

## GÖREV 2: Kasa/POS Ödeme Routing Düzelt (G5)

### Sorun
`aiActions.ts:432` — Tüm kasa/POS ödemeleri bankaya gidiyor, nakit/kart ayrımı yok.

### Konum
`src/lib/aiActions.ts:432`

### Mevcut Kod
```typescript
// Tüm ödemeler 'banka' hesabına
const payment = {
  method: 'kart', // veya 'nakit'
  account: 'banka', // HER ZAMAN banka ❌
};
```

### Düzeltme
```typescript
const payment = {
  method: paymentMethod, // 'nakit', 'kart', 'vadeli'
  account: paymentMethod === 'nakit' ? 'kasa' : 'banka', // ✅ Doğru routing
};
```

### Detaylı Fix
```typescript
function getPaymentAccount(method: PaymentMethod): string {
  switch (method) {
    case 'nakit':
      return 'kasa'; // Nakit kasaya
    case 'kart':
      return 'pos';  // Kart POS'a
    case 'vadeli':
      return 'cari'; // Vadeli cariye
    default:
      return 'banka'; // Fallback
  }
}

// Kullanım
const payment = {
  method: paymentMethod,
  account: getPaymentAccount(paymentMethod),
};
```

### Test
```typescript
// src/lib/aiActions.test.ts — yeni test ekle
describe('Payment routing', () => {
  it('nakit ödeme kasaya gitmeli', () => {
    const result = processPayment({ method: 'nakit', amount: 100 });
    expect(result.account).toBe('kasa');
  });
  
  it('kart ödeme POS\'a gitmeli', () => {
    const result = processPayment({ method: 'kart', amount: 100 });
    expect(result.account).toBe('pos');
  });
});
```

### Başarı Kriteri
- ✅ Nakit → kasa
- ✅ Kart → pos
- ✅ Vadeli → cari
- ✅ Test pass ediyor
- ✅ Mevcut satışlar etkilenmiyor

### Süre
⏱️ 2 saat

---

## CHANGELOG

```typescript
{
  version: '3.7.5',
  date: '12 Haziran 2026',
  title: 'Kritik bug düzeltmeleri',
  summary: 'Firebase sync ve ödeme routing hataları düzeltildi.',
  changes: [
    { type: 'duzeltme', text: 'Firebase sync setTimeout promise catch edildi (G4)' },
    { type: 'duzeltme', text: 'Kasa/POS ödeme routing düzeltildi - nakit kasaya gidiyor (G5)' },
  ],
}
```

---

## TOPLAM

- **Süre:** 3 saat
- **Risk:** Yüksek (bug mevcut)
- **Fayda:** Yüksek (veri ve iş mantığı)
- **Dosya:** 2 dosya (core.ts, aiActions.ts + testler)

Bu 2 görev **gerçek bug**, diğer 17 görev **nice-to-have**.
