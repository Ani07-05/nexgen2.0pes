import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
});