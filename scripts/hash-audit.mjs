#!/usr/bin/env node
/**
 * Hash Utility for PARSPEL Audit System
 *
 * Usage: node scripts/hash-audit.mjs [file|dir]
 *   - file: compute SHA-256 hash for a single file
 *   - dir:  compute hashes recursively for all files in directory
 *
 * Used by: parspel-audit skill, incremental audit checks
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const GLOB_BLACKLIST = [
  'node_modules',
  '.git',
  'dist',
  '.next',
  'coverage',
  '.tmp',
  '*.min.js',
  '*.map',
  '*.lock',
  '*.lockb',
  'pnpm-lock.yaml',
  'package-lock.json',
];

function isBlacklisted(filePath) {
  const rel = relative(process.cwd(), filePath);
  return GLOB_BLACKLIST.some((pattern) => {
    if (pattern.startsWith('*')) {
      return rel.endsWith(pattern.slice(1));
    }
    return rel.includes(pattern);
  });
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function fileHash(filePath) {
  try {
    const content = readFileSync(filePath);
    return sha256(content);
  } catch {
    return null;
  }
}

function dirHashes(dirPath, basePath = dirPath, results = {}) {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    if (isBlacklisted(fullPath)) continue;
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        dirHashes(fullPath, basePath, results);
      } else if (stat.isFile()) {
        const hash = fileHash(fullPath);
        if (hash) {
          const relPath = relative(basePath, fullPath);
          results[relPath] = hash;
        }
      }
    } catch {
      // skip unreadable files
    }
  }
  return results;
}

const target = process.argv[2] || '.';

if (!target) {
  console.error('Usage: node scripts/hash-audit.mjs <file-or-dir>');
  process.exit(1);
}

const fullPath = resolve(target);
try {
  const stat = statSync(fullPath);
  if (stat.isFile()) {
    const hash = fileHash(fullPath);
    if (hash) {
      console.log(JSON.stringify({ [fullPath]: hash }));
    }
  } else if (stat.isDirectory()) {
    const hashes = dirHashes(fullPath);
    console.log(JSON.stringify(hashes, null, 2));
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
