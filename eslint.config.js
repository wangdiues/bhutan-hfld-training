// ESLint for the Earth Engine scripts in scripts/gee/ (task M2-06).
// Correctness rules are errors; the Google JavaScript style rules are warnings, so the
// trainers' code stays close to the source while the drift stays visible.
import js from '@eslint/js';
import google from 'eslint-config-google';

const styleAsWarnings = Object.fromEntries(
  Object.entries(google.rules)
    .filter(([name]) => !['valid-jsdoc', 'require-jsdoc'].includes(name)) // removed in ESLint 9
    .map(([name, setting]) => [name, Array.isArray(setting) ? ['warn', ...setting.slice(1)] : 'warn']),
);

export default [
  {
    files: ['scripts/gee/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {ee: 'readonly', Map: 'writable', Export: 'readonly', ui: 'readonly', print: 'readonly', Chart: 'readonly', require: 'readonly'},
    },
    rules: {
      ...js.configs.recommended.rules,
      ...styleAsWarnings,
      'no-redeclare': 'off', // tutorials redefine variables step by step
      'no-unused-vars': 'warn',
    },
  },
];
