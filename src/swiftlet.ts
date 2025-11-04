import Compiler from './Compiler'
import { SwiftletOptions, ShellInputOptions, SwiftletPlugin } from './types'
import LoadingPlugin from './plugins/LoadingPlugin'

function swiftlet(options: SwiftletOptions) {
  const shellOptions: ShellInputOptions = process.argv.slice(2).reduce<ShellInputOptions>((config: any, arg) => {
    const [key, value] = arg.split('=')
    // TODO
    config[key] = value
    return config
  }, {})
  const finalOptions = { ...options, ...shellOptions }
  const compiler = new Compiler(finalOptions)

  // 内置插件：默认启用 LoadingPlugin
  try {
    new LoadingPlugin().apply(compiler as any)
  } catch (e) {
    console.error(e)
  }

  // 收集用户插件：支持新字段 plugin（单个或数组）与兼容旧字段 swiftletPlugins
  const userPlugins: SwiftletPlugin[] = []
  const candidate = (finalOptions as any).plugin
  if (candidate) {
    if (Array.isArray(candidate)) userPlugins.push(...candidate)
    else userPlugins.push(candidate)
  }
  if (finalOptions.swiftletPlugins && finalOptions.swiftletPlugins.length > 0) {
    userPlugins.push(...finalOptions.swiftletPlugins)
  }
  for (const plugin of userPlugins) {
    try {
      plugin.apply(compiler as any)
    } catch (e) {
      console.error(e)
    }
  }

  return compiler
}

export default swiftlet
