// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "no-empty-function": "off",
      "@typescript-eslint/no-empty-function": "off",

      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "off"
    }
  }
);