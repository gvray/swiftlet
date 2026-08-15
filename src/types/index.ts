import { InputPluginOption, RollupOptions } from 'rollup';
import { SyncHook } from 'tapable';

// 构建状态与钩子类型（保持稳定，对外暴露）
export interface StatusPayload {
  message: string;
  scope?: string;
  phase?: 'clean' | 'build' | 'compile' | 'finalize' | string;
}

export interface CompilerHooks {
  entryOption: SyncHook<[]>;
  compile: SyncHook<[string]>;
  afterCompile: SyncHook<[]>;
  run: SyncHook<[]>;
  emit: SyncHook<[]>;
  done: SyncHook<[]>;
  status: SyncHook<[StatusPayload]>;
  failed: SyncHook<[Error | undefined]>;
}

export interface SwiftletPlugin {
  name?: string;
  apply(compiler: { hooks: CompilerHooks }): void;
}

// 新版打包格式、平台与目标定义
export type BundleFormat = 'esm' | 'cjs' | 'umd' | 'iife';
export type Platform = 'node' | 'browser' | 'neutral';
export type Target =
  | 'es5'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022'
  | 'esnext'
  | 'node12'
  | 'node14'
  | 'node16'
  | 'node18'
  | 'node20';

// 插件创建函数：返回 SwiftletPlugin 的工厂函数（与生态命名更一致）
export type PluginCreator = () => SwiftletPlugin;

// 统一的新配置类型（专业版 Options）
export interface Options {
  entry: string | string[] | Record<string, string>;
  outDir?: string;
  format?: BundleFormat[];
  dts?: boolean;
  target?: Target;
  platform?: Platform;
  sourcemap?: boolean;
  minify?: boolean | 'esbuild' | 'terser';

  /**
   * 启用代码分割。多入口或动态导入时自动生成 chunk。
   * 生效时 Rollup 使用 output.dir 而非 output.file。
   * 默认：单入口 false；多入口自动为 true（esm/cjs）。
   */
  splitting?: boolean;

  /**
   * 保留源码模块目录结构，每个源文件对应一个输出文件。
   * 生效时自动启用 splitting 语义并使用 output.preserveModules。
   */
  preserveModules?: boolean;

  /**
   * 多文件模式下自定义 entry chunk 文件名模板。
   * 默认：'[name].js'
   */
  entryFileNames?: string;

  plugins?: (PluginCreator | SwiftletPlugin)[];
  pluginsRollup?: InputPluginOption[];
  watch?: boolean;
  external?: string[] | ((id: string) => boolean);
  clean?: boolean;
  printRollup?: boolean;
  rollupOptions?: (options: RollupOptions) => RollupOptions;
  onSuccess?: () => void;
  globalName?: string;
  globals?: Record<string, string>;
}
