import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Zod 3 API yasaklama — codebase Zod 4'e geçti
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='errors'][object.property.name='error']",
          message: "Zod 4'te 'error.errors' undefined döner. 'error.issues' kullan.",
        },
        {
          selector: "CallExpression[callee.property.name='map'][callee.object.property.name='errors']",
          message: "Zod 3 API. Zod 4 'error.issues' gerektirir.",
        },
      ],
    },
  },
  {
    files: [
      "src/components/ui/*",
      "src/components/ConfirmDialog.tsx",
      "src/components/LoginScreen.tsx",
      "src/components/SetupWizard.tsx",
      "src/components/Toast.tsx",
      "src/theme/ThemeProvider.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
)
