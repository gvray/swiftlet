import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';

import tsConfig from 'eslint-config-lavy/ts';

const tsExamples = [
  '02-typescript-library',
  '03-multi-entry-library',
  '04-code-splitting',
  '05-preserve-modules',
  '06-react-component-library',
  '07-custom-plugin',
];

export default defineConfig([
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  ...tsConfig,
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    languageOptions: {
      parserOptions: { project: 'tsconfig.lint.json' },
    },
  },
  ...tsExamples.flatMap((name) => [
    {
      files: [`examples/${name}/**/*.ts`],
      languageOptions: {
        parserOptions: { project: `examples/${name}/tsconfig.json` },
      },
    },
    {
      files: [`examples/${name}/**/*.tsx`],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          project: `examples/${name}/tsconfig.json`,
          ecmaFeatures: { jsx: true },
        },
      },
    },
  ]),
  {
    files: ['**/*.{ts}'],
    rules: {
      // You can add project-specific rules here.
    },
  },
]);
