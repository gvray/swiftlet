# Swiftlet

Web dev build tool

## Usage

Install the package:

```shell
npm install --save-dev swiftlet

yarn add --dev swiftlet

pnpm add --save-dev swiftlet
```

Create a `swiftlet.config.js` (or `.ts`) file in your project root:

```js
const path = require('path')
const { defineConfig } = require('swiftlet')

const input = path.resolve('./src/', 'index.js')

module.exports = defineConfig({
  input,
  target: ['esm', 'cjs', 'umd'],
  outDir: './dist'
  // External deps
  // Option A: array
  // rollupOptions: { external: ['@scope/pkg'] },
  // Option B: predicate
  // rollupOptions: { external: (id) => id.startsWith('@scope/') },

  // UMD/IIFE globals mapping for externals
  // rollupOptions: {
  //   output: {
  //     globals: {
  //       '@gvray/mathkit': 'mathkit'
  //     }
  //   }
  // },

  // Swiftlet plugins (built-in LoadingPlugin is enabled by default)
  // Support single or array
  // plugin: [new MySwiftletPlugin()]
})
```

## CLI

Start building an app

```shell
swiftlet build
```

Development (watch + sourcemap):

```shell
swiftlet dev
```

```text
Usage: swiftlet [options] [command]

Web dev build tool

Options:
  -v, --version   output the version number
  -h, --help      display help for command

Commands:
  build           build an app
  dev             start dev build with watch and sourcemap
  help [command]  display help for command
```

## API

Import and run programmatically:

```ts
import swiftlet, { defineConfig, Compiler, LoadingPlugin } from 'swiftlet'

const config = defineConfig({
  input: './src/index.ts',
  target: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  plugin: [
    // Optional: user plugins (LoadingPlugin is built-in by default)
  ],
  rollupOptions: {
    external: (id) => id.startsWith('@scope/')
  }
})

// Quick start
await swiftlet(config).run()

// Advanced
const compiler = new Compiler(config)
compiler.hooks.status.tap('logger', ({ scope, message }) => {
  console.log(`${scope ? `[${scope}] ` : ''}${message}`)
})
await compiler.run()
```

### Hooks

The compiler exposes tapable `SyncHook`s:

- entryOption: () => void
- run: () => void
- compile: (format: string) => void
- afterCompile: () => void
- emit: () => void
- done: () => void
- status: ({ message, scope?, phase? }) => void
- failed: (error?) => void

Status payload fields:

- message: string (required)
- scope: string | undefined (e.g. 'clean' | 'build' | 'esm')
- phase: 'clean' | 'build' | 'compile' | 'finalize' | string
