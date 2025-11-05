import path from 'path'
import { RollupOptions, OutputOptions, defineConfig, InputPluginOption, ModuleFormat, RollupWatchOptions } from 'rollup'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import { appRoot, isTypeScript, transformString } from './index'
import { SwiftletOptions } from '../index'

export async function createRollupOptions(options: SwiftletOptions): Promise<RollupOptions[]> {
  const { input, target = 'esm', outDir, sourcemap = false, types = true, rollupOptions = {}, plugins = [] } = options
  const pck = await import(path.resolve(appRoot, 'package.json'))
  const { name = 'bundle' } = pck
  // output
  let output: OutputOptions[]
  const mappingFileName = (name: string): string => {
    switch (name) {
      case 'umd':
        return 'min'
      case 'es':
        return 'esm'
      default:
        return name
    }
  }
  const genOutput = (format: ModuleFormat): OutputOptions => {
    switch (format) {
      case 'umd':
        return {
          format,
          file: `./${path.join(outDir as string, `${name}.${mappingFileName(format)}.js`)}`,
          name: transformString(name),
          noConflict: true,
          sourcemap
        }
        break
      default:
        return {
          format,
          file: `./${path.join(outDir as string, `${name}.${mappingFileName(format)}.js`)}`,
          sourcemap
        }
    }
  }
  if (Array.isArray(target)) {
    output = target.map(genOutput)
  } else {
    output = [genOutput(target)]
  }
  // apply user-defined globals for UMD/IIFE from rollupOptions.output.globals
  const configuredGlobals = (rollupOptions as any)?.output?.globals as Record<string, string> | undefined
  if (configuredGlobals) {
    output = output.map((item) => {
      if (item.format === 'umd' || item.format === 'iife') {
        return { ...item, globals: configuredGlobals }
      }
      return item
    })
  }
  // plugin
  const innerPlugins: InputPluginOption[] = [terser()]

  const configs: RollupOptions[] = []

  const { watch } = options

  // avoid overriding generated output by user rollupOptions.output
  const { output: _userOutput, ...restRollupOptions } = rollupOptions as any

  if (isTypeScript()) {
    output.forEach((item) => {
      configs.push({
        input,
        output: [item],
        plugins: [
          ...plugins,
          ...innerPlugins,
          typescript({
            compilerOptions: {
              declaration: false,
              // module: item.format === 'cjs' || item.format === 'commonjs' ? 'CommonJS' : 'ESNext'
              sourceMap: sourcemap
            }
          })
        ],
        ...restRollupOptions, // TODO merge plugins (output handled separately)
        ...(watch ? ({ watch: {} } as RollupWatchOptions) : {})
      })
    })
  } else {
    configs.push({
      input,
      output,
      plugins: [...plugins, ...innerPlugins],
      ...restRollupOptions, // TODO merge plugins (output handled separately)
      ...(watch ? ({ watch: {} } as RollupWatchOptions) : {})
    })
  }

  if (types && isTypeScript()) {
    const dtsOutput: RollupOptions = {
      input,
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
