#!/usr/bin/env python3
"""Generate a clean project tree excluding noise."""
import os, fnmatch

ROOT = r"C:\Users\PARS PELET\Desktop\2\repo_2"

EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', '.pnpm', '.pnpm-store',
    'PAKET', 'android', '.opencode', '.hermes',
    '.playwright-mcp', 'playwright-report', 'screenshots',
    'test-results', '.kiro', '.fallow', '.sixth', '.storybook',
    '.cursor', '.vscode', '.github',
}

EXCLUDE_FILES = {
    'pnpm-lock.yaml', '.env', '.env.example', '.gitignore',
    '.editorconfig', '.prettierrc', '.prettierignore',
    '.npmrc', '.nvmrc', '.gitattributes',
    'pnpm-workspace.yaml',
}

EXCLUDE_PATTERNS = {
    '*.test.ts', '*.test.tsx', '*.log', '*.png', '*.jpg',
    '*.svg', '*.css', '*.json', '*.yml', '*.yaml',
    '*.mjs', '*.cjs', '.npmrc',
    'dev-server*.log', 'check_shortcut.ps1',
    'audit-*.png', 'debug-screenshot.png',
    'comprehensive-test.cjs', 'quick-test.cjs',
    'full-audit.cjs', 'run-tests.cjs', 'test-full.cjs',
    'test-playwright.cjs', 'screenshot-all.mjs',
    'test-output.txt',
    'opencode.json', 'state-registry.json',
    'capacitor.config.ts',
    'src-file-list.json',
}

def should_exclude(name, is_dir):
    if is_dir and name in EXCLUDE_DIRS:
        return True
    if not is_dir and name in EXCLUDE_FILES:
        return True
    for pat in EXCLUDE_PATTERNS:
        if fnmatch.fnmatch(name, pat):
            return True
    return False

def tree(dirpath, prefix=""):
    entries = []
    try:
        names = sorted(os.listdir(dirpath))
    except:
        return
    
    # Filter
    items = []
    for n in names:
        full = os.path.join(dirpath, n)
        is_dir = os.path.isdir(full)
        if should_exclude(n, is_dir):
            continue
        items.append((n, is_dir))
    
    # Separate dirs first
    dirs = [(n, d) for n, d in items if d]
    files = [(n, d) for n, d in items if not d]
    items = dirs + files
    
    for i, (name, is_dir) in enumerate(items):
        is_last = (i == len(items) - 1)
        connector = "└── " if is_last else "├── "
        print(f"{prefix}{connector}{'📁 ' if is_dir else '📄 '}{name}")
        
        if is_dir:
            extension = "    " if is_last else "│   "
            tree(os.path.join(dirpath, name), prefix + extension)

print("📁 PARSPEL PWA — Proje Ağacı")
print(f"📂 {ROOT}")
print("=" * 60)
tree(ROOT)
