#!/bin/bash
# PARSPEL Git Hooks Kurulum Script'i
# Windows (Git Bash) ve Linux/macOS uyumlu

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 PARSPEL Git Hooks Kurulumu"
echo "================================"
echo ""

# 1. Husky kurulumu
echo "📦 Husky kuruluyor..."
cd "$PROJECT_DIR"

if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm bulunamadı! Lütfen pnpm'i yükleyin:"
  echo "  npm install -g pnpm"
  exit 1
fi

pnpm install

# 2. Husky init
echo "🔗 Husky başlatılıyor..."
pnpm exec husky init 2>/dev/null || pnpm exec husky install

# 3. Hook dosyalarını kontrol et
HOOKS_DIR="$PROJECT_DIR/.husky"
REQUIRED_HOOKS=("pre-commit" "pre-push" "commit-msg" "post-merge" "post-checkout")

echo ""
echo "📋 Hook'lar kontrol ediliyor..."

for hook in "${REQUIRED_HOOKS[@]}"; do
  if [ -f "$HOOKS_DIR/$hook" ]; then
    chmod +x "$HOOKS_DIR/$hook"
    echo "  ✅ $hook"
  else
    echo "  ⚠️  $hook eksik!"
  fi
done

# 4. Helper dosyalarını kontrol et
HELPERS_DIR="$HOOKS_DIR/helpers"
REQUIRED_HELPERS=("colors.sh" "staged-files.sh" "git-context.sh")

for helper in "${REQUIRED_HELPERS[@]}"; do
  if [ -f "$HELPERS_DIR/$helper" ]; then
    chmod +x "$HELPERS_DIR/$helper"
    echo "  ✅ helpers/$helper"
  else
    echo "  ⚠️  helpers/$helper eksik!"
  fi
done

# 5. Çalıştırılabilir izinleri ver
echo ""
echo "🔐 İzinler ayarlanıyor..."
find "$HOOKS_DIR" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
find "$HOOKS_DIR" -type f -not -name ".*" -not -path "*/_/*" -exec chmod +x {} \; 2>/dev/null || true

# 6. lint-staged kontrolü
if [ -f "$PROJECT_DIR/lint-staged.config.js" ]; then
  echo "  ✅ lint-staged.config.js mevcut"
else
  echo "  ⚠️  lint-staged.config.js eksik!"
fi

# 7. .hook_cache oluştur
mkdir -p "$PROJECT_DIR/.hook_cache"
touch "$PROJECT_DIR/.hook_cache/.gitkeep"

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "Hook'ları test etmek için:"
echo "  pnpm exec husky run pre-commit"
echo "  pnpm exec husky run pre-push"
