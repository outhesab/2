---
name: parspel-sayfa
description: >
  PARSPEL'e yeni sayfa/screen ekleme. wouter routing, React.lazy() lazy loading,
  tab sistemi, agent baglantisi, form validation, navigasyon kurallari, state
  yönetimi, test. Kullanici yeni bir ekran istediginde (ornek: "tedarikci detay
  sayfasi") kullan.
version: 1.1.0
author: PARSPEL
hooks:
  onComplete: true
  onError: true
requires:
  - parspel-bilesen
  - parspel-test
---

# PARSPEL — Sayfa Ekleme

## Overview

Yeni bir sayfa eklemek için 6 adımlık prosedür: dosya oluşturma → route ekleme → tab tanımı → agent bağlantısı → form validation → test.

## Instructions

### 1. Sayfa Dosyasını Oluştur

`src/pages/` altında yeni sayfa dosyası (ör: `YeniSayfa.tsx`):

```typescript
import { Suspense, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { useLocation } from "wouter";
import EmptyState from "@/components/EmptyState";
import PageFallback from "@/components/layout/PageFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function YeniSayfa() {
  const { db, save } = useDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <PageFallback loading />;
  if (error) return <ErrorFallback message={error} onRetry={() => setError(null)} />;
  if (!db?.veri?.length) return <EmptyState title="Liste boş" description="İlk öğeyi ekleyin." />;

  return <div>{/* içerik */}</div>;
}
```

### 2. App.tsx'e Route Ekle

```typescript
// Lazy import (direkt import yasak!)
const YeniSayfa = lazy(() => import("@/pages/YeniSayfa"));

// Switch içinde Suspense ile sar:
<Route path="/yeni">
  <Suspense fallback={<PageFallback />}>
    <YeniSayfa />
  </Suspense>
</Route>
```

**Detay sayfası için:**
```typescript
<Route path="/kaynak/:id">
  <Suspense fallback={<PageFallback />}>
    <KaynakDetay />
  </Suspense>
</Route>
```

### 3. Tab Tanımı Ekle (opsiyonel)

`src/config/tabs.ts`:

```typescript
{
  id: "yeni",
  label: "Yeni",
  icon: "✨",
  group: "ana", // ana | tedarik | finans | analiz | sistem
}
```

- `getActiveTabFromLocation()` fonksiyonuna mapping ekle

### 4. Agent Bağlantısı

Sayfa doğrudan agent çağıracaksa:

```typescript
import { getAllAgents } from "@/agents";
import { useToast } from "@/components/Toast";

export default function YeniSayfa() {
  const { db, save } = useDB();
  const { showToast } = useToast();

  const handleAction = async () => {
    const agent = getAllAgents().find(a => a.id === "ilgili-agent");
    if (!agent) return showToast("Agent bulunamadı", "error");

    const context = {
      getDB: () => db,
      save: (updater: any) => save(updater),
      showToast,
    };
    agent.bagla(context as any);
    const sonuc = await agent.islemYap({ action: "..." });
    if (!sonuc.ok) showToast(sonuc.error || "Hata", "error");
  };
}
```

### 5. Form Validation

Form içeren sayfalar için:

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

function validate(data: Record<string, any>): boolean {
  const newErrors: Record<string, string> = {};
  if (!data.ad || data.ad.trim().length === 0) newErrors.ad = "Ad zorunlu";
  if (data.fiyat != null && data.fiyat < 0) newErrors.fiyat = "Negatif fiyat olamaz";
  // ...
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}

// Kullanım:
const handleSubmit = () => {
  if (!validate(formData)) return;
  // save işlemi...
};
```

| Validasyon | Kural |
|-----------|-------|
| Zorunlu alan | `trim().length === 0` kontrolü |
| Sayısal | `typeof === "number"`, min/max |
| Negatif | `>= 0` kontrolü (fiyat/miktar) |
| Email | Basit regex veya `includes("@")` |
| Telefon | `mask` veya rakam kontrolü |

### 6. Sayfa Testi

`src/pages/YeniSayfa.test.tsx`:

```typescript
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import YeniSayfa from "./YeniSayfa";

describe("YeniSayfa", () => {
  it("render edilir ve boş state gösterir", () => {
    const { container } = render(<YeniSayfa />);
    expect(container).toBeTruthy();
  });
});
```

## Rules

| Kural | Açıklama |
|-------|----------|
| Lazy loading | `React.lazy()` ile import, direkt import **yasak** |
| Suspense | Her route `<Suspense fallback={<PageFallback />}>` ile sar |
| Türkçe path | `/urunler`, `/satis`, `/cari` — İngilizce yasak |
| Detay route | `/:id` ile bitmeli |
| useDB | `const { db, save } = useDB()` ile veri okuma/yazma |
| State yönetimi | loading, empty, error **zorunlu** |
| Bileşen boyutu | max 800 satır, geçerse alt bileşenlere böl |
| Form validation | Tüm formlarda validate fonksiyonu zorunlu |
| Agent bağlantısı | Agent çağıran sayfada hata yönetimi zorunlu |

## Navigasyon

```typescript
// Programatik
const [location, setLocation] = useLocation();
setLocation("/yeni");

// Link
<a href="/yeni">Yeni Sayfa</a>

// Tab'a yönlendirme
onTabChange("yeni");
```

## Hooks

### onComplete
- Lazy import kullanıldığını doğrula
- loading/empty/error state'leri var mı kontrol et
- Form sayfalarında validation var mı kontrol et

### onError
- Route doğru mu kontrol et (Türkçe path, `/:id` pattern'i)
- Eksik import varlarını kontrol et
