import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.vite/**"]
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  // Vue (SFC)
  ...vue.configs["flat/recommended"].map((cfg) => ({
    ...cfg,
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: "latest",
        sourceType: "module"
      }
    }
  })),

  // TypeScript/JS common rules
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs,vue}"],
    languageOptions: {
      globals: {
        WebSocket: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-console": "off",
      "no-debugger": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  },

  // Must be last => disables conflicting formatting rules
  prettier
];
