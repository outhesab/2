# PARSPEL — Katkı Rehberi

Teşekkürler! PARSPEL'e katkıda bulunmak istiyorsanız bu rehberi okuyun.

## Geliştirme Ortamı Kurulumu

### Gereksinimler

- Node.js >= 22
- pnpm >= 9
- Git

### Kurulum

```bash
# Depoyu clone edin
git clone https://github.com/parspel/parspel.git
cd parspel

# Bağımlılıkları kurun
pnpm install

# Geliştirme sunucusunu başlatın
pnpm run dev
```

### Faydalı Komutlar

```bash
pnpm run dev          # Geliştirme sunucusu (port 3000)
pnpm run build        # Production build
pnpm run test         # Testleri izle (watch mode)
pnpm run test:run     # Testleri tek seferlik çalıştır
pnpm run typecheck    # TypeScript tip kontrolü
pnpm run lint         # ESLint ile kod kontrolü
pnpm run lint:fix     # ESLint otomatik düzeltme
```

## Branş Modeli

- `main` — Kararlı sürüm, production
- `dev` — Geliştirme dalı, tüm PR'lar buraya açılır

### Yeni Branş Oluşturma

```bash
# Feature
git checkout dev
git checkout -b feat/ozellik-adi

# Bug fix
git checkout -b fix/hata-aciklamasi

# Chore
git checkout -b chore/guncelleme
```

## Commit Kuralları

[Conventional Commits](https://www.conventionalcommits.org/) formatı kullanılır:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Tipler

| Tip | Kullanım |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltmesi |
| `chore` | Bakım, yapılandırma |
| `docs` | Doküman güncellemesi |
| `style` | Kod formatlama (mantıksal değişiklik yok) |
| `refactor` | Yeniden düzenleme |
| `test` | Test ekleme/düzeltme |
| `perf` | Performans iyileştirmesi |

### Örnekler

```bash
git commit -m "feat(satis): yapisatis modalina iskonto alani eklendi"
git commit -m "fix(kasa): negatif bakiye hesaplama hatasi duzeltildi"
git commit -m "docs: README guncellendi"
```

### Changelog Zorunluluğu

Her kaynak kod değişikliğinde `src/lib/changelog.ts` güncellenmelidir. Pre-commit hook bunu kontrol eder.

## Pull Request Süreci

1. `dev` dalından yeni bir dal oluşturun
2. Değişikliklerinizi yapın
3. `src/lib/changelog.ts`'i güncelleyin
4. Testleri çalıştırın: `pnpm run test:run`
5. Type kontrolü: `pnpm run typecheck`
6. Lint: `pnpm run lint`
7. PR açın (aşağıdaki PR şablonunu kullanın)
8. En az 1 onay alın
9. CI geçtikten sonra merge edin

## Kod Standartları

- TypeScript ile yazın, `any` kullanımından kaçının
- `save((prev: DB) => next: DB)` pattern'ini kullanın
- Inline CSS yerine Tailwind CSS sınıfı kullanın
- Yeni bileşenler için mevcut shadcn/ui bileşenlerini tercih edin
- Test yazın: `prevDB → işlem → nextDB` pattern'i

## Sorun Bildirme

GitHub Issues üzerinden hata bildirimi yapın. Lütfen şablonu doldurun:

- Hatanın ne olduğunu açıklayın
- Tekrar adımlarını yazın
- Beklenen ve gerçek davranışı belirtin
- Ortam bilgisi ekleyin (tarayıcı, işletim sistemi)

## Lisans

Bu projeye katkıda bulunarak katkılarınızın MIT lisansı altında yayınlanmasını kabul edersiniz.
