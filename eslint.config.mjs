import { defineConfig } from 'eslint/config';

import tsConfig from 'eslint-config-lavy/ts';

export default defineConfig([
  ...tsConfig,
  {
    files: ['examples/library-ts/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { project: 'examples/library-ts/tsconfig.json' },
    },
  },
  {
    files: ['**/*.{ts}'],
    rules: {
      // You can add project-specific rules here.
    },
  },
]);
