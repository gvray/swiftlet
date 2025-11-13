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
export type BundleFormat = 'esm' | 'cjs' | 'umd' | 'iife'
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

// 插件创建函数：返回 SwiftletPlugin 的工厂函数（与生态命名更一致）
export type PluginCreator = () => SwiftletPlugin

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
  plugins?: (PluginCreator | SwiftletPlugin)[]
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
