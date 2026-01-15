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

| Option          | Type                                    | Default                          | Description                                 |
| --------------- | --------------------------------------- | -------------------------------- | ------------------------------------------- |
| `entry`         | `string \| string[]`                    | `src/index.ts` or `src/index.js` | Build entry point(s)                        |
| `outDir`        | `string`                                | `'dist'`                         | Output directory                            |
| `format`        | `('esm' \| 'cjs' \| 'umd' \| 'iife')[]` | `['esm']`                        | Output format(s)                            |
| `dts`           | `boolean`                               | `true`                           | Generate TypeScript declarations            |
| `target`        | `string`                                | —                                | TypeScript compile target (e.g. `'esnext'`) |
| `sourcemap`     | `boolean`                               | `false`                          | Generate source maps                        |
| `minify`        | `boolean \| 'terser'`                   | `false`                          | Minify output                               |
| `external`      | `string[] \| (id: string) => boolean`   | —                                | External dependencies                       |
| `clean`         | `boolean`                               | `true`                           | Clean output directory before build         |
| `globalName`    | `string`                                | derived from package name        | UMD/IIFE global variable name               |
| `globals`       | `Record<string, string>`                | —                                | UMD/IIFE external globals mapping           |
| `plugins`       | `SwiftletPlugin[]`                      | `[]`                             | Swiftlet plugins (compiler hooks)           |
| `pluginsRollup` | `RollupPlugin[]`                        | `[]`                             | Raw Rollup plugins                          |
| `rollupOptions` | `(config) => config`                    | —                                | Low-level Rollup config customization       |

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
