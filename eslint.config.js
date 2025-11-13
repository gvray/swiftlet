import { defineConfig } from 'eslint/config'

import tsConfig from 'eslint-config-lavy/ts'

export default defineConfig([
  ...tsConfig,
  {
    files: ['**/*.{ts}'],
    rules: {
      // You can add project-specific rules here.
    }
  }
])