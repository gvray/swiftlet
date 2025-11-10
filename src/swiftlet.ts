import Compiler from './Compiler'
import { Options, ShellInputOptions, SwiftletPlugin, PluginFactory } from './types'
import LoadingPlugin from './plugins/LoadingPlugin'
import { DEFAULT_OPTIONS } from './constants'
import { isTypeScript } from './utils'

function parseShellOptions(argv: string[]): ShellInputOptions {
  return argv.reduce<ShellInputOptions>((config: any, arg) => {
    const [key, value] = arg.split('=')
    if (!key) return config
    if (value === undefined) {
      config[key] = true
    } else if (value === 'true') {
      config[key] = true
    } else if (value === 'false') {
      config[key] = false
    } else {
      config[key] = value
    }
    return config
  }, {})
}

function mergeRollupOptions(base: Options): Options {
  const applied = base.rollupOptions
  if (!applied) return base
  const input = { input: base.entry, output: [] } as any
  const merged = typeof applied === 'function' ? applied(input) : applied
  return {
    ...base,
    ...(merged || {})
  } as Options
}

function createCompiler(userOptions: Options) {
  // Shell 注入（最高优先级）：用于兼容直接通过命令行传参的场景
  const shellOptions: ShellInputOptions = parseShellOptions(process.argv.slice(2))

  // 合并顺序：默认 < 配置文件(userOptions) < rollupOptions < CLI(shellOptions)
  const withDefaults: Options = {
    ...DEFAULT_OPTIONS,
    ...userOptions
  } as Options
  const withRollupMerged: Options = mergeRollupOptions(withDefaults)
  const finalOptions: Options = {
    ...withRollupMerged,
    ...shellOptions
  }

  // 为 entry 设置合理的默认值（根据是否为 TS 项目）
  if (!finalOptions.entry) {
    finalOptions.entry = isTypeScript() ? 'src/index.ts' : 'src/index.js'
  }

  const compiler = new Compiler(finalOptions as any)

  // 内置插件：默认启用 LoadingPlugin
  try {
    new LoadingPlugin().apply(compiler as any)
  } catch (e) {
    console.error(e)
  }

  // 用户插件（新版：plugins 为工厂列表）
  const factories = finalOptions.plugins || []
  for (const factory of factories as PluginFactory[]) {
    try {
      const plugin: SwiftletPlugin = factory()
      plugin.apply(compiler as any)
    } catch (e) {
      console.error(e)
    }
  }

  return compiler
}

export default createCompiler
