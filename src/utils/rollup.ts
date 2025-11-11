import path from 'path'
import { RollupOptions, OutputOptions, defineConfig, InputPluginOption, ModuleFormat, RollupWatchOptions } from 'rollup'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import { appRoot, isTypeScript, transformPackageName } from './swiftlet'
import { Options } from '../index'

export async function createRollupOptions(options: Options): Promise<RollupOptions[]> {
  const {
    entry,
    format,
    outDir,
    sourcemap,
    dts: genDts,
    rollupOptions,
    pluginsRollup,
    watch,
    external,
    minify,
    globals,
    globalName,
    target
  } = options

  const pck = require(path.resolve(appRoot, 'package.json'))
  const { name = 'bundle' } = pck

  const normalizeFormat = (fmt: string): ModuleFormat => {
    return fmt as ModuleFormat
  }

  const fileSuffix = (fmt: ModuleFormat): string => {
    switch (fmt) {
      case 'esm':
        return 'esm'
      case 'umd':
        return 'min'
      default:
        return String(fmt)
    }
  }

  const genOutput = (format: ModuleFormat): OutputOptions => {
    const outputBase: OutputOptions = {
      format,
      file: `./${path.join(outDir as string, `${name}.${fileSuffix(format)}.js`)}`,
      sourcemap: sourcemap ?? false
    }
    if (format === 'umd' || format === 'iife') {
      const out: OutputOptions = {
        ...outputBase,
        name: globalName ?? transformPackageName(name),
        noConflict: true
      }
      if (globals) {
        out.globals = globals
      }
      return out
    }
    return outputBase
  }

  const normalizedFormats: ModuleFormat[] = Array.isArray(format)
    ? (format.map((f) => normalizeFormat(f)) as ModuleFormat[])
    : [normalizeFormat(format as unknown as string)]

  const outputs: OutputOptions[] = normalizedFormats.map(genOutput)

  const innerPlugins: InputPluginOption[] = []
  if (minify === true || minify === 'terser') {
    innerPlugins.push(terser())
  } else if (minify === 'esbuild') {
    // TODO: optional esbuild minification
  }

  const configs: RollupOptions[] = []

  const appliedRollupOptions = rollupOptions?.({ input: entry, output: outputs } as RollupOptions)
  const {
    output: _userOutput,
    external: userExternal,
    plugins: userPlugins,
    ...restRollupOptions
  } = (appliedRollupOptions || {}) as any

  // external 合并策略：兼容 Options.external (string[] | (id)=>boolean) 和 rollupOptions.external (string | RegExp | Array<string|RegExp> | (id)=>boolean)
  const toPredicate = (ext?: unknown): ((id: string) => boolean) | undefined => {
    if (ext == null) return undefined
    if (typeof ext === 'function') return ext as (id: string) => boolean
    if (typeof ext === 'string') return (id: string) => id === ext
    if (ext instanceof RegExp) return (id: string) => (ext as RegExp).test(id)
    if (Array.isArray(ext)) {
      const arr = ext as Array<string | RegExp>
      return (id: string) => arr.some((it) => (typeof it === 'string' ? it === id : (it as RegExp).test(id)))
    }
    return undefined
  }

  let finalExternal: RollupOptions['external']
  const pa = toPredicate(external)
  const pb = toPredicate(userExternal)
  if (external && userExternal) {
    if (Array.isArray(external) && Array.isArray(userExternal)) {
      finalExternal = Array.from(new Set([...(external as string[]), ...(userExternal as string[])]))
    } else {
      finalExternal = (id: string) => (pa?.(id) ?? false) || (pb?.(id) ?? false)
    }
  } else {
    finalExternal = (external as RollupOptions['external']) ?? (userExternal as RollupOptions['external'])
  }

  const rollupInput = entry

  if (isTypeScript()) {
    outputs.forEach((item) => {
      const cfg: RollupOptions = {
        input: rollupInput,
        output: [item],
        external: finalExternal,
        plugins: [
          // 用户可控的前置插件（例如 alias/resolve）
          ...(pluginsRollup || []),
          // TypeScript 编译尽量靠前，让后续 JS 插件接收到已转译的代码
          typescript({
            compilerOptions: {
              declaration: false,
              sourceMap: sourcemap ?? false,
              ...(target ? { target } : {})
            }
          }),
          // 用户提供的 rollupOptions.plugins（通常用于后置如 babel）
          ...(userPlugins || []),
          // 压缩应尽量放在最后
          ...innerPlugins
        ],
        ...restRollupOptions,
        ...(watch ? ({ watch: {} } as RollupWatchOptions) : {})
      }
      configs.push(cfg)
    })
  } else {
    const cfg: RollupOptions = {
      input: rollupInput,
      output: outputs,
      external: finalExternal,
      plugins: [
        ...(pluginsRollup || []),
        ...(userPlugins || []),
        // 压缩应尽量放在最后
        ...innerPlugins
      ],
      ...restRollupOptions,
      ...(watch ? ({ watch: {} } as RollupWatchOptions) : {})
    }
    configs.push(cfg)
  }

  if (genDts && isTypeScript()) {
    const dtsOutput: RollupOptions = {
      input: rollupInput,
      plugins: [dts()],
      output: [
        {
          format: 'esm' as ModuleFormat,
          file: `${path.join(outDir as string, `${name}.d.ts`)}`
        }
      ]
    }
    configs.push(dtsOutput)
  }

  return defineConfig(configs)
}
