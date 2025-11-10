import path from 'path'
import { RollupOptions, OutputOptions, defineConfig, InputPluginOption, ModuleFormat, RollupWatchOptions } from 'rollup'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import { appRoot, isTypeScript, transformString } from './index'
import { Options } from '../index'

export async function createRollupOptions(options: Options): Promise<RollupOptions[]> {
  const {
    entry,
    format = ['es'],
    outDir = 'dist',
    sourcemap = false,
    dts: genDts = true,
    rollupOptions = {},
    pluginsRollup = [],
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
    if (fmt === 'esm') return 'es'
    return fmt as ModuleFormat
  }

  const fileSuffix = (fmt: ModuleFormat): string => {
    switch (fmt) {
      case 'es':
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
      sourcemap
    }
    if (format === 'umd' || format === 'iife') {
      const out: OutputOptions = {
        ...outputBase,
        name: globalName ?? transformString(name),
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

  const appliedRollupOptions =
    typeof rollupOptions === 'function' ? rollupOptions({ input: entry, output: outputs }) : rollupOptions
  const {
    output: _userOutput,
    external: userExternal,
    plugins: userPlugins,
    ...restRollupOptions
  } = (appliedRollupOptions || {}) as any

  const finalExternal = external ?? userExternal

  const rollupInput = entry

  if (isTypeScript()) {
    outputs.forEach((item) => {
      const cfg: RollupOptions = {
        input: rollupInput,
        output: [item],
        external: finalExternal,
        plugins: [
          ...(pluginsRollup || []),
          ...(userPlugins || []),
          ...innerPlugins,
          typescript({
            compilerOptions: {
              declaration: false,
              sourceMap: sourcemap,
              ...(target ? { target } : {})
            }
          })
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
      plugins: [...(pluginsRollup || []), ...(userPlugins || []), ...innerPlugins],
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
          format: 'es',
          file: `${path.join(outDir as string, `${name}.d.ts`)}`
        }
      ]
    }
    configs.push(dtsOutput)
  }

  return defineConfig(configs)
}
