export default {
  // TypeScript/JavaScript files
  '*.{ts,tsx}': (files) => [
    `eslint --fix ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
  ],
  
  // JSON files
  '*.json': (files) => [
    `prettier --write ${files.join(' ')}`,
    // JSON validation via jq (optional)
    'jq . --exit-status >/dev/null 2>&1 || exit 1',
  ],
  
  // Markdown files
  '*.md': (files) => [
    `prettier --write ${files.join(' ')}`,
  ],
  
  // Lock files - never auto-format
  'pnpm-lock.yaml': (files) => [
    'git add pnpm-lock.yaml',
  ],
  
  // Test files - extra strict
  '*.test.ts': (files) => [
    `eslint --fix ${files.join(' ')} --rule '@typescript-eslint/no-explicit-any: off'`,
    'vitest run --reporter=verbose',
  ],
};
