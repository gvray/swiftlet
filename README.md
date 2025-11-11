# Swiftlet

A modern build tool for libraries and apps. Focused, fast, and extensible.

- Unified config loader (JS/TS, CJS/ESM) powered by jiti
- Clean hooks API with built-in professional spinner
- Rollup under the hood with sensible defaults
- First-class TypeScript support

## Quick Start

Install:

```bash
pnpm add -D swiftlet
```

Create `swiftlet.config.ts`:

```ts
import path from 'node:path'
import { defineConfig } from 'swiftlet'

export default defineConfig({
  entry: path.resolve('./src', 'index.ts'),
  format: ['es', 'cjs', 'umd'],
  outDir: './dist',
  external: (id) => id.startsWith('@scope/')
})
```

Build:

```bash
swiftlet build
```

Dev (watch + sourcemap):

```bash
swiftlet dev
```
