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
  format: ['esm', 'cjs', 'umd'],
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

## Configuration (Full Options)

Swiftlet uses a single config file `swiftlet.config.ts` with the following options. Unless stated as “required”, options are optional and have sensible defaults.

```ts
import { defineConfig } from 'swiftlet'

export default defineConfig({
  // Required in TypeScript config: entry of your build
  // (JS config can omit; runtime falls back to src/index.ts or src/index.js)
  // Entry（可选）：未提供时会根据是否存在 tsconfig.json 自动使用
  // - 有 tsconfig.json: 默认 'src/index.ts'
  // - 无 tsconfig.json: 默认 'src/index.js'
  entry: 'src/index.ts',

  // Output directory (default: 'dist')
  outDir: 'dist',

  // Output formats (default: ['esm'])
  // Supported: 'esm' | 'cjs' | 'umd' | 'iife'
  format: ['esm', 'cjs', 'umd'],

  // Generate type declarations for TS projects (default: true)
  // Only effective if your project has tsconfig.json
  dts: true,

  // TypeScript compile target (fed to @rollup/plugin-typescript)
  // e.g. 'esnext' | 'es2020' | 'node18' ...
  target: 'esnext',

  // Platform hint (reserved for future use)
  // 'node' | 'browser' | 'neutral'
  platform: 'neutral',

  // Source maps (default: false)
  sourcemap: false,

  // Minification (default: false)
  // true | 'terser' | 'esbuild' ('esbuild' planned)
  minify: true,

  // Code splitting (reserved for future use)
  splitting: false,

  // Swiftlet plugin factories (run via compiler hooks)
  plugins: [],

  // Raw Rollup plugins (pre-TS stage; e.g. alias/resolve)
  pluginsRollup: [],

  // Watch mode (usually enabled via `swiftlet dev`)
  watch: false,

  // External dependencies
  // - Array form: ['react', 'vue']
  // - Function form: (id) => boolean
  // Merges with rollupOptions.external: arrays deduped; functions OR'ed
  external: (id) => id.startsWith('@scope/'),

  // Clean output dir before build (default: true)
  clean: true,

  // Customize Rollup config at low level
  // You can return fields like external/plugins/etc.
  rollupOptions: (base) => ({
    ...base,
    // external: ['react'],
    // plugins: [...(base.plugins || [])]
  }),

  // UMD/IIFE global name for bundle (default: derived from package.json name)
  globalName: 'MyLibrary',

  // UMD/IIFE external globals mapping
  // e.g. react -> React, vue -> Vue
  globals: { react: 'React', vue: 'Vue' },
  // Print final Rollup config (建议使用 CLI: --print-rollup)
  printRollup: false,

  // Run a function after build (当前建议使用 CLI: --on-success "<cmd>")
  // 注意：配置中的 onSuccess（函数）暂未在编译流程中接入
  onSuccess: () => {
    // e.g. notify()
  }
})
```

### Options Reference（是否可选 / 默认值 / 功能）

- entry
  - 是否可选：
    - TypeScript 配置文件：类型层面必填（defineConfig 的类型为 Options）
    - JavaScript 配置文件：可选；运行时会自动回退
  - 默认值：有 tsconfig.json 则默认 'src/index.ts'；否则默认 'src/index.js'
  - 功能：构建入口；支持字符串、字符串数组或多入口对象（Rollup input）

- outDir
  - 是否可选：可选
  - 默认值：'dist'
  - 功能：输出目录

- format
  - 是否可选：可选
  - 默认值：['esm']
  - 功能：输出格式列表（'esm' | 'cjs' | 'umd' | 'iife'）

- dts
  - 是否可选：可选（仅 TS 项目有效）
  - 默认值：true
  - 功能：生成类型声明文件（额外产出一个 `${name}.d.ts`）

- target
  - 是否可选：可选
  - 默认值：无（遵循 tsconfig 或 TypeScript 插件默认）
  - 功能：传递给 @rollup/plugin-typescript 的编译目标（如 'esnext'、'node18'）

- platform
  - 是否可选：可选
  - 默认值：无
  - 功能：平台提示（预留，将来用于生成环境差异）

- sourcemap
  - 是否可选：可选
  - 默认值：false
  - 功能：是否生成源码映射

- minify
  - 是否可选：可选
  - 默认值：false（未设置即不压缩）
  - 功能：代码压缩；true 或 'terser' 使用 @rollup/plugin-terser；'esbuild' 预留

- splitting
  - 是否可选：可选
  - 默认值：无
  - 功能：代码分割（预留）

- plugins
  - 是否可选：可选
  - 默认值：[]
  - 功能：Swiftlet 插件工厂列表（通过 Compiler hooks 执行）

- pluginsRollup
  - 是否可选：可选
  - 默认值：[]
  - 功能：原生 Rollup 插件（在 TypeScript 编译之前应用，例如 alias/resolve）

- watch
  - 是否可选：可选（通常通过 CLI dev 启用）
  - 默认值：false
  - 功能：启用监听模式；在 Rollup 配置中设置 watch

- external
  - 是否可选：可选
  - 默认值：无
  - 功能：外部依赖声明；支持数组或函数；与 `rollupOptions.external` 合并（数组去重，函数按 OR 组合）

- clean
  - 是否可选：可选
  - 默认值：true
  - 功能：构建前清理输出目录（删除 outDir）

- rollupOptions
  - 是否可选：可选
  - 默认值：无
  - 功能：低层级定制 Rollup 配置（传入基础配置，返回覆盖后的配置）

- globalName
  - 是否可选：可选
  - 默认值：由 package.json 的 name 推导（转为驼峰/无作用域）
  - 功能：UMD/IIFE 的全局名称

- globals
  - 是否可选：可选
  - 默认值：无
  - 功能：UMD/IIFE 的外部映射（例如 react -> React）

- printRollup
  - 是否可选：可选
  - 默认值：false
  - 功能：打印最终 Rollup 配置并退出；当前仅通过 CLI 参数生效（`--print-rollup`）

- onSuccess
  - 是否可选：可选
  - 默认值：无
  - 功能：构建成功后执行逻辑；当前建议通过 CLI 参数（`--on-success "<cmd>"`），配置中的函数暂未接入编译流程
