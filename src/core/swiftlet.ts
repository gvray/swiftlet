import Compiler from './Compiler'
import { Options, SwiftletPlugin, PluginCreator } from '../types'
import LoadingPlugin from '../plugins/LoadingPlugin'
import SizePlugin from '../plugins/SizePlugin'
import { DEFAULT_OPTIONS } from '../constants'
import { isTypeScript } from '../utils'
import type { RollupOptions } from 'rollup'

// 1) 应用默认配置到用户配置
function applyDefaultOptions(userOptions: Options): Options {
  return {
    ...DEFAULT_OPTIONS,
    ...userOptions
  } as Options
}

// 2) 基于最终的 Swiftlet 选项创建 Rollup 初始配置（未应用用户 rollupOptions）
function createBaseRollupConfig(swiftletOptions: Options): RollupOptions {
  const outputs = [] as RollupOptions['output']
  return { input: swiftletOptions.entry, output: outputs } as RollupOptions
}

// 3) 让用户的 rollupOptions 函数在 Rollup 配置层进行覆盖与返回
function applyUserRollupOptions(swiftletOptions: Options, baseRollup: RollupOptions): Options {
  const userFn = swiftletOptions.rollupOptions
  if (!userFn) return swiftletOptions
  const mergedRollup = userFn(baseRollup) || {}
  return {
    ...swiftletOptions,
    ...(mergedRollup as any)
  } as Options
}

// 4) 最终生成 Swiftlet 使用的选项（不再触碰 CLI，这里只面向传入的 userOptions）
export function resolveSwiftletOptions(userOptions: Options): Options {
  const withDefaults = applyDefaultOptions(userOptions)
  const baseRollup = createBaseRollupConfig(withDefaults)
  const withUserRollup = applyUserRollupOptions(withDefaults, baseRollup)

  if (!withUserRollup.entry) {
    withUserRollup.entry = isTypeScript() ? 'src/index.ts' : 'src/index.js'
  }
  return withUserRollup
}

function createCompiler(userOptions: Options) {
  const finalOptions = resolveSwiftletOptions(userOptions)

  const compiler = new Compiler(finalOptions as any)

  try {
    new LoadingPlugin().apply(compiler as any)
    new SizePlugin().apply(compiler as any)
  } catch (e) {
    console.error(e)
  }

  const userPlugins = finalOptions.plugins || []
  for (const item of userPlugins as (PluginCreator | SwiftletPlugin)[]) {
    try {
      const plugin: SwiftletPlugin = typeof item === 'function' ? (item as PluginCreator)() : (item as SwiftletPlugin)
      plugin.apply(compiler as any)
    } catch (e) {
      console.error(e)
    }
  }

  return compiler
}

export default createCompiler
