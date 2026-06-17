#!/usr/bin/env node
/**
 * Sync Agent Instruction Files
 *
 * AGENTS.md'yi canonical source olarak kullanarak diğer AI tool'ların
 * beklediği dosya formatlarını üretir:
 *   - CLAUDE.md       (Claude Code)
 *   - .cursor/rules/rules.mdc  (Cursor IDE)
 *   - .windsurfrules  (Windsurf, opsiyonel)
 *
 * Bu script pre-commit hook ve CI tarafından çağrılır.
 * Drift tespit edilirse hata koduyla çıkar.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const SOURCE = resolve(ROOT, 'AGENTS.md');
const TARGETS = [
  {
    path: resolve(ROOT, 'CLAUDE.md'),
    tool: 'Claude Code',
    header: '<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY -->',
    footer: '<!-- Source: AGENTS.md (canonical) — Run: pnpm run sync:agents -->',
  },
  {
    path: resolve(ROOT, '.cursor/rules/rules.mdc'),
    tool: 'Cursor IDE',
    header: '---',
    extraFrontmatter: [
      'description: "PARSPEL proje kuralları (AGENTS.md\'den otomatik üretildi)"',
      'alwaysApply: true',
      'globs: ["**/*.{ts,tsx,js,jsx,json,md}"]',
      '---',
    ].join('\n'),
    footer: '<!-- Source: AGENTS.md (canonical) — Run: pnpm run sync:agents -->',
  },
];

const SOURCE_NOTICE = `

> **Bu dosya otomatik üretilmiştir.** Asıl kaynak: \`AGENTS.md\`.
> Manuel düzenleme yapma — değişiklikler üzerine yazılır.
> Senkron için: \`pnpm run sync:agents\`
`;

let hasError = false;

function readSource() {
  if (!existsSync(SOURCE)) {
    console.error(`❌ Source dosyası bulunamadı: ${SOURCE}`);
    process.exit(1);
  }
  return readFileSync(SOURCE, 'utf-8');
}

function syncTarget(source, target) {
  const { path, tool, header, extraFrontmatter, footer } = target;
  const dir = dirname(path);

  // Hedef dizini oluştur
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Yeni içerik
  const lines = [
    header,
    extraFrontmatter ? extraFrontmatter : '',
    '',
    SOURCE_NOTICE.trim(),
    '',
    '---',
    '',
  ];
  const newContent = lines.join('\n') + source;

  // Mevcut içerikle karşılaştır
  let needsUpdate = true;
  if (existsSync(path)) {
    const current = readFileSync(path, 'utf-8');
    if (current === newContent) {
      console.log(`✓ ${tool}: zaten senkron`);
      needsUpdate = false;
    } else {
      console.log(`⚠ ${tool}: drift tespit edildi, güncelleniyor...`);
    }
  } else {
    console.log(`+ ${tool}: yeni dosya oluşturuluyor...`);
  }

  if (needsUpdate) {
    writeFileSync(path, newContent, 'utf-8');
    console.log(`✓ ${tool}: senkronize edildi → ${path.replace(ROOT + '\\', '')}`);
  }
}

function main() {
  const isCheck = process.argv.includes('--check');

  if (isCheck) {
    console.log('🔍 Agent instruction dosyaları drift kontrolü...\n');
  } else {
    console.log('🔄 Agent instruction dosyaları senkronize ediliyor...\n');
  }
  console.log(`📄 Kaynak: AGENTS.md\n`);

  const source = readSource();
  let driftCount = 0;

  for (const target of TARGETS) {
    if (isCheck) {
      // Sadece kontrol et, yazma
      if (!existsSync(target.path)) {
        console.error(`❌ ${target.tool}: dosya yok → ${target.path.replace(ROOT + '\\', '')}`);
        hasError = true;
        driftCount++;
        continue;
      }
      const current = readFileSync(target.path, 'utf-8');
      const lines = [
        target.header,
        target.extraFrontmatter ? target.extraFrontmatter : '',
        '',
        SOURCE_NOTICE.trim(),
        '',
        '---',
        '',
      ];
      const expected = lines.join('\n') + source;
      if (current === expected) {
        console.log(`✓ ${target.tool}: senkron`);
      } else {
        console.error(`❌ ${target.tool}: DRIFT! → ${target.path.replace(ROOT + '\\', '')}`);
        console.error(`   Çözüm: pnpm run sync:agents`);
        hasError = true;
        driftCount++;
      }
    } else {
      try {
        syncTarget(source, target);
      } catch (err) {
        console.error(`❌ ${target.tool} senkron hatası:`, err.message);
        hasError = true;
      }
    }
  }

  console.log('');
  if (isCheck) {
    if (hasError) {
      console.error(`❌ ${driftCount} dosyada drift tespit edildi`);
      console.error(`   Çözüm: pnpm run sync:agents`);
      process.exit(1);
    } else {
      console.log('✅ Tüm dosyalar senkron (drift yok)');
    }
  } else {
    if (hasError) {
      console.error('❌ Senkronizasyon başarısız');
      process.exit(1);
    } else {
      console.log('✅ Tüm agent instruction dosyaları senkron');
    }
  }
}

main();
