import Compiler from './Compiler'
import { Options, ShellInputOptions, SwiftletPlugin, PluginFactory } from './types'
import LoadingPlugin from './plugins/LoadingPlugin'

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

function createCompiler(options: Options) {
  const shellOptions: ShellInputOptions = parseShellOptions(process.argv.slice(2))

  const finalOptions: Options = { ...options, ...shellOptions }
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
