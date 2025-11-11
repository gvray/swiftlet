import { InputPluginOption, RollupOptions } from 'rollup'
import { SyncHook } from 'tapable'

// 构建状态与钩子类型（保持稳定，对外暴露）
export interface StatusPayload {
  message: string
  scope?: string
  phase?: 'clean' | 'build' | 'compile' | 'finalize' | string
}

export interface CompilerHooks {
  entryOption: SyncHook<[]>
  compile: SyncHook<[string]>
  afterCompile: SyncHook<[]>
  run: SyncHook<[]>
  emit: SyncHook<[]>
  done: SyncHook<[]>
  status: SyncHook<[StatusPayload]>
  failed: SyncHook<[Error | undefined]>
}

export interface SwiftletPlugin {
  name?: string
  apply(compiler: { hooks: CompilerHooks }): void
}

// 新版打包格式、平台与目标定义
export type BundleFormat = 'es' | 'cjs' | 'umd' | 'iife'
export type Platform = 'node' | 'browser' | 'neutral'
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
  | 'node20'

// 插件工厂：用于创建 Swiftlet 插件实例
export type PluginFactory = () => SwiftletPlugin

// 统一的新配置类型（专业版 Options）
export interface Options {
  entry: string | string[] | Record<string, string>
  outDir?: string
  format?: BundleFormat[]
  dts?: boolean
  target?: Target
  platform?: Platform
  sourcemap?: boolean
  minify?: boolean | 'esbuild' | 'terser'
  splitting?: boolean
  plugins?: PluginFactory[]
  pluginsRollup?: InputPluginOption[]
  watch?: boolean
  external?: string[] | ((id: string) => boolean)
  clean?: boolean
  printRollup?: boolean
  rollupOptions?: (options: RollupOptions) => RollupOptions
  onSuccess?: () => void
  globalName?: string
  globals?: Record<string, string>
}

// Shell 注入项（兼容新版）
export type ShellInputOptions = Partial<Options>
