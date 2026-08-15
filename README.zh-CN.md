# Swiftlet

[![npm version](https://img.shields.io/npm/v/swiftlet.svg)](https://www.npmjs.com/package/swiftlet)
[![license](https://img.shields.io/npm/l/swiftlet.svg)](https://github.com/gvray/swiftlet/blob/main/LICENSE)

现代化、零配置的 JavaScript/TypeScript 库构建工具。基于 Rollup，开箱即用。

[English](./README.md)

## 特性

- **零配置** — 大多数库项目开箱即用
- **TypeScript 优先** — 原生 TS 支持，自动生成 `.d.ts` 类型声明
- **多格式输出** — 一次构建输出 ESM、CJS、UMD、IIFE
- **Rollup 驱动** — 完整访问 Rollup 插件生态
- **统一配置** — 单一配置文件，支持 JS/TS、CJS/ESM（通过 jiti）
- **Hooks API** — 可扩展的插件系统，基于编译器钩子

## 快速开始

```bash
# 安装
pnpm add -D swiftlet

# 构建
swiftlet build

# 开发模式（监听 + sourcemap）
swiftlet dev
```

创建 `swiftlet.config.ts`（可选）：

```ts
import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs', 'umd'],
  outDir: 'dist',
});
```

## 配置项

所有配置项均为可选，具有合理的默认值。

| 配置项            | 类型                                    | 默认值                                                | 说明                                 |
| ----------------- | --------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| `entry`           | `string \| string[]`                    | `src/index.ts` 或 `src/index.js`                      | 构建入口                             |
| `outDir`          | `string`                                | `'dist'`                                              | 输出目录                             |
| `format`          | `('esm' \| 'cjs' \| 'umd' \| 'iife')[]` | `['esm']`                                             | 输出格式                             |
| `dts`             | `boolean`                               | `true`                                                | 生成 TypeScript 类型声明             |
| `target`          | `string`                                | —（优先继承 `tsconfig.json` 的 target，否则为 `ES5`） | TypeScript 编译目标（如 `'esnext'`） |
| `sourcemap`       | `boolean`                               | `false`                                               | 生成 source map                      |
| `minify`          | `boolean \| 'terser'`                   | `false`                                               | 代码压缩                             |
| `splitting`       | `boolean`                               | `false`                                               | 启用代码分割 / 多文件输出            |
| `preserveModules` | `boolean`                               | `false`                                               | 保留源码模块目录结构                 |
| `entryFileNames`  | `string`                                | `'[name].js'`                                         | 多文件模式下 entry chunk 文件名模板  |
| `external`        | `string[] \| (id: string) => boolean`   | —                                                     | 外部依赖                             |
| `clean`           | `boolean`                               | `true`                                                | 构建前清理输出目录                   |
| `globalName`      | `string`                                | 从 package.json name 推导                             | UMD/IIFE 全局变量名                  |
| `globals`         | `Record<string, string>`                | —                                                     | UMD/IIFE 外部依赖映射                |
| `plugins`         | `SwiftletPlugin[]`                      | `[]`                                                  | Swiftlet 插件（编译器钩子）          |
| `pluginsRollup`   | `RollupPlugin[]`                        | `[]`                                                  | 原生 Rollup 插件                     |
| `rollupOptions`   | `(config) => config`                    | —                                                     | 底层 Rollup 配置定制                 |

### 完整配置示例

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

## 多入口与代码分割

默认情况下 Swiftlet 每种格式输出一个文件。如果需要输出多个文件，可以使用以下任意一种方式：

```ts
import { defineConfig } from 'swiftlet';

// 多个命名入口
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
});

// 为动态导入启用代码分割
export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  splitting: true,
});

// 保留源码目录结构
export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  preserveModules: true,
});
```

## 示例

[`examples/`](./examples) 目录包含按场景组织的示例项目：

| 示例                                                                  | 说明                     |
| --------------------------------------------------------------------- | ------------------------ |
| [`01-single-entry-library`](./examples/01-single-entry-library)       | 单入口 JS 库             |
| [`02-typescript-library`](./examples/02-typescript-library)           | 带 `.d.ts` 的 TS 库      |
| [`03-multi-entry-library`](./examples/03-multi-entry-library)         | 多入口 → 多个输出文件    |
| [`04-code-splitting`](./examples/04-code-splitting)                   | 动态导入拆分为独立 chunk |
| [`05-preserve-modules`](./examples/05-preserve-modules)               | 保留源码目录结构         |
| [`06-react-component-library`](./examples/06-react-component-library) | JSX/TSX + 外部 peer 依赖 |
| [`07-custom-plugin`](./examples/07-custom-plugin)                     | 自定义编译器钩子插件     |

运行任意示例：

```bash
cd examples/03-multi-entry-library
pnpm install
pnpm build
```

## CLI 命令

```bash
# 生产构建
swiftlet build

# 开发模式（监听）
swiftlet dev

# 打印 Rollup 配置
swiftlet build --print-rollup

# 构建成功后执行命令
swiftlet build --on-success "echo done"
```

## 许可证

MIT © [GavinRay](https://github.com/gvray)
