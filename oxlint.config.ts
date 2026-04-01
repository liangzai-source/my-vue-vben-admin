import {defineConfig} from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  rules: {
    // ✅ 只放 oxlint 支持的规则
    'no-alert': 'error',
    'no-console': ['error', {allow: ['warn', 'error']}],
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
});
