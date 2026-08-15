# Swiftlet

[![npm version](https://img.shields.io/npm/v/swiftlet.svg)](https://www.npmjs.com/package/swiftlet)
[![license](https://img.shields.io/npm/l/swiftlet.svg)](https://github.com/gvray/swiftlet/blob/main/LICENSE)

A modern, zero-config build tool for JavaScript/TypeScript libraries. Powered by Rollup with sensible defaults.

[中文文档](./README.zh-CN.md)

## Features

- **Zero Config** — Works out of the box for most library projects
- **TypeScript First** — Native TS support with automatic `.d.ts` generation
- **Multiple Formats** — Output ESM, CJS, UMD, and IIFE in one build
- **Rollup Powered** — Full access to Rollup's plugin ecosystem
- **Unified Config** — Single config file supporting JS/TS, CJS/ESM (via jiti)
- **Clean Hooks API** — Extensible plugin system with compiler hooks

## Quick Start

```bash
# Install
pnpm add -D swiftlet

# Build
swiftlet build

# Dev mode (watch + sourcemap)
swiftlet dev
```

Create `swiftlet.config.ts` (optional):

```ts
import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs', 'umd'],
  outDir: 'dist',
});
```

## Configuration

All options are optional with sensible defaults.

| Option            | Type                                    | Default                          | Description                                      |
| ----------------- | --------------------------------------- | -------------------------------- | ------------------------------------------------ |
| `entry`           | `string \| string[]`                    | `src/index.ts` or `src/index.js` | Build entry point(s)                             |
| `outDir`          | `string`                                | `'dist'`                         | Output directory                                 |
| `format`          | `('esm' \| 'cjs' \| 'umd' \| 'iife')[]` | `['esm']`                        | Output format(s)                                 |
| `dts`             | `boolean`                               | `true`                           | Generate TypeScript declarations                 |
| `target`          | `string`                                | —                                | TypeScript compile target (e.g. `'esnext'`)      |
| `sourcemap`       | `boolean`                               | `false`                          | Generate source maps                             |
| `minify`          | `boolean \| 'terser'`                   | `false`                          | Minify output                                    |
| `splitting`       | `boolean`                               | `false`                          | Enable code splitting / multi-file output        |
| `preserveModules` | `boolean`                               | `false`                          | Preserve source module directory structure       |
| `entryFileNames`  | `string`                                | `'[name].js'`                    | Entry chunk file name pattern in multi-file mode |
| `external`        | `string[] \| (id: string) => boolean`   | —                                | External dependencies                            |
| `clean`           | `boolean`                               | `true`                           | Clean output directory before build              |
| `globalName`      | `string`                                | derived from package name        | UMD/IIFE global variable name                    |
| `globals`         | `Record<string, string>`                | —                                | UMD/IIFE external globals mapping                |
| `plugins`         | `SwiftletPlugin[]`                      | `[]`                             | Swiftlet plugins (compiler hooks)                |
| `pluginsRollup`   | `RollupPlugin[]`                        | `[]`                             | Raw Rollup plugins                               |
| `rollupOptions`   | `(config) => config`                    | —                                | Low-level Rollup config customization            |

### Example: Full Configuration

```ts
import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: ['esm', 'cjs', 'umd'],
  dts: true,
  target: 'es2020',
  sourcemap: true,
  minify: true,
  clean: true,
  external: ['react', 'vue'],
  globalName: 'MyLibrary',
  globals: {
    react: 'React',
    vue: 'Vue',
  },
});
```

## Multi-entry & Code Splitting

By default Swiftlet emits a single file per format. To emit multiple files, use one of the following:

```ts
import { defineConfig } from 'swiftlet';

// Multiple named entries
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
});

// Code splitting for dynamic imports
export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  splitting: true,
});

// Preserve source directory structure
export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  preserveModules: true,
});
```

## Examples

The [`examples/`](./examples) directory contains scenario-based projects:

| Example                                                               | What it demonstrates                |
| --------------------------------------------------------------------- | ----------------------------------- |
| [`01-single-entry-library`](./examples/01-single-entry-library)       | Basic single-entry JS library       |
| [`02-typescript-library`](./examples/02-typescript-library)           | TypeScript library with `.d.ts`     |
| [`03-multi-entry-library`](./examples/03-multi-entry-library)         | Multiple entries → multiple files   |
| [`04-code-splitting`](./examples/04-code-splitting)                   | Dynamic imports → separate chunks   |
| [`05-preserve-modules`](./examples/05-preserve-modules)               | Preserve source directory structure |
| [`06-react-component-library`](./examples/06-react-component-library) | JSX/TSX + external peer deps        |
| [`07-custom-plugin`](./examples/07-custom-plugin)                     | Custom compiler-hooks plugin        |

Run any example:

```bash
cd examples/03-multi-entry-library
pnpm install
pnpm build
```

## CLI

```bash
# Build for production
swiftlet build

# Development mode with watch
swiftlet dev

# Print resolved Rollup config
swiftlet build --print-rollup

# Run command after successful build
swiftlet build --on-success "echo done"
```

## License

MIT © [GavinRay](https://github.com/gvray)
