import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import { configs } from "typescript-eslint";

export default [
  { ignores: ["dist", "eslint.config.js"] },
  js.configs.recommended,
  ...configs.recommended,
  ...configs.stylisticTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      "react-hooks": reactHooks,
      "react": react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
];
