import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // ─── TypeScript ─────────────────────────────────────────────────────

      // Warn on unused vars (ignore prefixed with _)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],

      // Allow `any` — useful during rapid iteration, tighten later
      "@typescript-eslint/no-explicit-any": "off",

      // Allow empty interfaces (common with component prop extensions)
      "@typescript-eslint/no-empty-interface": "off",

      // ─── React ──────────────────────────────────────────────────────────

      // Exhaustive deps — warn, don't error (intentional omissions exist)
      "react-hooks/exhaustive-deps": "warn",

      // React 19 compiler rules — too strict for current codebase, disable
      // These will be re-enabled when migrating to React Compiler
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",

      // Allow unescaped quotes in JSX (common in conversational copy)
      "react/no-unescaped-entities": "off",

      // ─── TypeScript extras ──────────────────────────────────────────────

      // Allow empty interfaces (used for component prop extensions)
      "@typescript-eslint/no-empty-object-type": "off",

      // ─── General ────────────────────────────────────────────────────────

      // Prefer const — auto-fixable, enforce it
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
