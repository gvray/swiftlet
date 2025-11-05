import { InputPluginOption, ModuleFormat, RollupOptions } from 'rollup'
import { SyncHook } from 'tapable'

export enum SwiftJSTransformerTypes {
  BABEL = 'babel',
  ESBUILD = 'esbuild',
  SWC = 'swc'
}

export enum SwiftPlatformTypes {
  NODE = 'node',
  BROWSER = 'browser'
}

export enum SwiftBundlesTypes {
  ESM = 'esm',
  CJS = 'cjs'
}
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

export interface SwiftletOptions {
  input: string
  outDir?: string
  target?: ModuleFormat | ModuleFormat[]
  sourcemap?: boolean
  plugins?: InputPluginOption[]
  rollupOptions?: RollupOptions
  types?: boolean // dts
  // 新的 Swiftlet 插件配置：支持单个或数组
  plugin?: SwiftletPlugin | SwiftletPlugin[]
  // 向后兼容旧字段
  swiftletPlugins?: SwiftletPlugin[]
  // dev 模式支持
  watch?: boolean
}

export type ShellInputOptions = Partial<SwiftletOptions>
