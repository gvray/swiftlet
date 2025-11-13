import { exec } from 'node:child_process'
import type { Options } from '../types'

export function parseList(input?: string | string[]): string[] | undefined {
  if (!input) return undefined
  if (Array.isArray(input)) {
    return input.flatMap((i) =>
      String(i)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  }
  return String(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseGlobals(input?: string): Record<string, string> | undefined {
  if (!input) return undefined
  const str = String(input).trim()
  if (str.startsWith('{')) {
    try {
      const obj = JSON.parse(str)
      return obj && typeof obj === 'object' ? (obj as Record<string, string>) : undefined
    } catch (e) {
      // ignore JSON parse error, fallback to key=value parsing
    }
  }
  const entries = str
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf('=')
      if (idx === -1) return [pair, pair]
      const k = pair.slice(0, idx).trim()
      const v = pair.slice(idx + 1).trim()
      return [k, v]
    })
  return Object.fromEntries(entries)
}

function flattenPluginNames(plugins: any): string[] {
  const names: string[] = []
  const walk = (pl: any) => {
    if (!pl) return
    if (Array.isArray(pl)) {
      pl.forEach(walk)
      return
    }
    if (typeof pl === 'object') {
      if (typeof pl.name === 'string') {
        names.push(pl.name)
      } else {
        names.push('(anonymous plugin)')
      }
      return
    }
  }
  walk(plugins)
  return names
}

export function formatRollupForPrint(rollupConfigs: any[]): any[] {
  return rollupConfigs.map((cfg) => ({
    ...cfg,
    plugins: flattenPluginNames(cfg.plugins),
    external: typeof cfg.external === 'function' ? '[Function external]' : cfg.external
  }))
}

export function mergeConfigWithCliArgs(config: Options, cliArgs: any) {
  const merged: any = {
    ...config,
    ...cliArgs
  }
  // entry: string | list
  if (cliArgs.entry) {
    const list = parseList(cliArgs.entry)
    merged.entry = list && list.length === 1 ? list[0] : list
  }
  // format: comma-separated（与配置合并，去重）
  if (cliArgs.format) {
    const cliFmt = parseList(cliArgs.format) || []
    const cfgFmt = Array.isArray(config.format)
      ? (config.format as string[])
      : config.format
      ? [String(config.format)]
      : []
    merged.format = Array.from(new Set([...cfgFmt, ...cliFmt]))
  }
  // external: repeat or comma-separated（CLI 传入应与配置文件 external 合并，而非简单覆盖）
  if (cliArgs.external) {
    const cliExt = parseList(cliArgs.external) || []
    const cfgExt = config.external as Options['external']
    if (typeof cfgExt === 'function') {
      merged.external = (id: string) => cfgExt(id) || cliExt.includes(id)
    } else if (Array.isArray(cfgExt)) {
      merged.external = Array.from(new Set([...(cfgExt as string[]), ...cliExt]))
    } else {
      merged.external = cliExt
    }
  }
  // globals: mapping
  if (cliArgs.globals) merged.globals = parseGlobals(cliArgs.globals)
  // minify: flag or engine
  if (Object.prototype.hasOwnProperty.call(cliArgs, 'minify')) {
    merged.minify = cliArgs.minify === true ? true : typeof cliArgs.minify === 'string' ? cliArgs.minify : true
  }
  // onSuccess: create runtime plugin to execute command after done
  if (cliArgs.onSuccess && typeof cliArgs.onSuccess === 'string') {
    const cmd = cliArgs.onSuccess
    const pluginCreator = () => ({
      name: 'SwiftletCLIOnSuccess',
      apply(compiler: any) {
        compiler.hooks.done.tap('SwiftletCLIOnSuccess', () => {
          exec(cmd, (err, stdout, stderr) => {
            if (err) {
              console.error(err)
              return
            }
            if (stdout) process.stdout.write(stdout)
            if (stderr) process.stderr.write(stderr)
          })
        })
      }
    })
    merged.plugins = [...(merged.plugins || []), pluginCreator]
  }
  return merged
}
