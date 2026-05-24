# PARSPEL — UI Bileşenleri

55 shadcn/ui + 12 custom bileşen.

## Yapı

```
src/components/
├── ui/               # 55 shadcn/ui bileşeni (Radix UI tabanlı)
├── Modal.tsx         # Genel modal (inline style var — yenisini ekleme)
├── ConfirmDialog.tsx # Onay diyaloğu
├── ErrorBoundary.tsx # Global hata sınırı
├── IconPicker.tsx    # İkon seçici
├── LoginScreen.tsx   # Giriş ekranı
├── MobileSelect.tsx  # Mobil seçim
├── NotificationCenter.tsx # Bildirim merkezi
├── QuantumLink.tsx   # Özel bağlantı bileşeni
├── SetupWizard.tsx   # Kurulum sihirbazı
├── SystemMap.tsx     # Sistem haritası
├── Toast.tsx         # Toast bildirimi
```

## Kurallar

- **Yeni bileşenler**: CSS class kullan, `style={}` kullanma
- **shadcn/ui bileşenleri**: `src/components/ui/` altında, dokunma
- **Inline style**: Sadece Modal.tsx'te mevcut. Yenisini ekleme
- **Import**: `@/components/...` ile çağır
- **Empty state**: `<Empty>` bileşeni mevcut (`ui/empty.tsx`), kullan
