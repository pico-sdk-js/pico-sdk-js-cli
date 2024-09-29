// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
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