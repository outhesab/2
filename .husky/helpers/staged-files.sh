#!/bin/bash

# Staged TS/TSX dosyaları getir
get_staged_ts_files() {
  git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true
}

# Staged JSON dosyaları
get_staged_json_files() {
  git diff --cached --name-only --diff-filter=ACM | grep -E '\.json$' || true
}

# Staged lock dosyaları
get_staged_lock_files() {
  git diff --cached --name-only --diff-filter=ACM | grep -E 'pnpm-lock\.yaml|package\.json$' || true
}

# Staged test dosyaları
get_staged_test_files() {
  git diff --cached --name-only --diff-filter=ACM | grep -E '\.test\.(ts|tsx)$' || true
}

export -f get_staged_ts_files
export -f get_staged_json_files
export -f get_staged_lock_files
export -f get_staged_test_files
