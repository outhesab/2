export default {
  // TypeScript/JavaScript files
  '*.{ts,tsx}': (files) => [
    `eslint --fix ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
  ],
  
  // JSON files
  '*.json': (files) => [
    `prettier --write ${files.join(' ')}`,
    // JSON validation via node (cross-platform, jq gerekmez)
    ...files.map(f => `node -e "JSON.parse(require('fs').readFileSync('${f}','utf8'))"`),
  ],
  
  // Markdown files
  '*.md': (files) => [
    `prettier --write ${files.join(' ')}`,
  ],
  
  // Lock files - never auto-format (lint-staged zaten stage'ler)
  'pnpm-lock.yaml': () => [],
  
  // Test files - extra strict
  '*.test.ts': (files) => [
    `eslint --fix ${files.join(' ')} --rule '@typescript-eslint/no-explicit-any: off'`,
    'vitest run --reporter=verbose',
  ],
};
