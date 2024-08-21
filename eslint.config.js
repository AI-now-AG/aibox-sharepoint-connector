import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginSvelte from "eslint-plugin-svelte";

const eslintPluginSvelteWithTS = {
  files: ["*.svelte"],
  extends: [...eslintPluginSvelte.configs["flat/recommended"]],
  parser: eslintPluginSvelte,
  parserOptions: {
    parser: tseslint.parser,
    project: ["./tsconfig.json"],
  },
};

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  eslintPluginSvelteWithTS,

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
);
