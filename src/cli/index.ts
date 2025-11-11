import { Command } from 'commander'
import { appRoot, getMainConfigFile } from '../utils'
import { createCompiler } from '../index'
import { exec } from 'node:child_process'

function parseList(input?: string | string[]): string[] | undefined {
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

function parseGlobals(input?: string): Record<string, string> | undefined {
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

function mergeOptions(config: any, cliArgs: any) {
  const merged: any = {
    ...config,
    ...cliArgs
  }
  // entry: string | list
  if (cliArgs.entry) {
    const list = parseList(cliArgs.entry)
    merged.entry = list && list.length === 1 ? list[0] : list
  }
  // format: comma-separated
  if (cliArgs.format) merged.format = parseList(cliArgs.format)
  // external: repeat or comma-separated
  if (cliArgs.external) merged.external = parseList(cliArgs.external)
  // globals: mapping
  if (cliArgs.globals) merged.globals = parseGlobals(cliArgs.globals)
  // minify: flag or engine
  if (Object.prototype.hasOwnProperty.call(cliArgs, 'minify')) {
    merged.minify = cliArgs.minify === true ? true : typeof cliArgs.minify === 'string' ? cliArgs.minify : true
  }
  // onSuccess: create runtime plugin to execute command after done
  if (cliArgs.onSuccess && typeof cliArgs.onSuccess === 'string') {
    const cmd = cliArgs.onSuccess
    const pluginFactory = () => ({
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
    merged.plugins = [...(merged.plugins || []), pluginFactory]
  }
  return merged
}

export async function run({ _opts = process.argv.slice(2), pck }: any) {
  const program = new Command()
  program.name(pck.name).description(pck.description).version(pck.version, '-v, --version')

  program
    .command('build')
    .description('Build your project')
    .option('--entry <entry>', 'Entry file(s) or glob, comma separated for multiple')
    .option('--out-dir <dir>', 'Output directory')
    .option('--format <formats>', 'Output format list, e.g. esm,cjs,umd')
    .option('--target <target>', 'Build target, e.g. esnext,node18')
    .option('--platform <platform>', 'node | browser | neutral')
    .option('--dts', 'Generate .d.ts files')
    .option('--sourcemap', 'Generate source maps')
    .option('--minify [engine]', 'Enable minification (true, esbuild, terser)')
    .option('--watch', 'Watch mode')
    .option(
      '--external <pkg>',
      'External dependency (repeat or comma separated)',
      (val, prev: string[] | undefined) => [...(prev || []), val],
      []
    )
    .option('--globals <mapping>', 'Globals mapping, e.g. react=React,vue=Vue or JSON')
    .option('--global-name <name>', 'Global name for UMD/IIFE')
    .option('--on-success <cmd>', 'Command to run after build success')
    .action(async (args) => {
      try {
        const mainConfigFile = getMainConfigFile({ cwd: appRoot })
        if (!mainConfigFile)
          throw Error('Check if your project is missing a configuration file (swiftlet.config.(ts|js))')
        // Use jiti to load config with universal import/TS support (like ESLint 9)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const jiti = require('jiti')(process.cwd(), { interopDefault: true, esmResolve: true })
        const mod: any = jiti(mainConfigFile)
        const config = (mod && (mod.default || mod)) as any
        const merged = mergeOptions(config, args)
        const compiler = createCompiler(merged)
        await compiler.run()
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })

  program
    .command('dev')
    .description('Start dev build with watch and sourcemap')
    .option('--entry <entry>', 'Entry file(s) or glob, comma separated for multiple')
    .option('--out-dir <dir>', 'Output directory')
    .option('--format <formats>', 'Output format list, e.g. esm,cjs,umd')
    .option('--target <target>', 'Build target, e.g. esnext,node18')
    .option('--platform <platform>', 'node | browser | neutral')
    .option('--dts', 'Generate .d.ts files')
    .option('--minify [engine]', 'Enable minification (true, esbuild, terser)')
    .option('--external <pkg>', 'External dependency (comma separated)')
    .option('--globals <mapping>', 'Globals mapping, e.g. react=React,vue=Vue or JSON')
    .option('--global-name <name>', 'Global name for UMD/IIFE')
    .option('--on-success <cmd>', 'Command to run after build success')
    .action(async (args: any) => {
      try {
        const mainConfigFile = getMainConfigFile({ cwd: appRoot })
        if (!mainConfigFile)
          throw Error('Check if your project is missing a configuration file (swiftlet.config.(ts|js))')
        // Use jiti to load config with universal import/TS support (like ESLint 9)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const jiti = require('jiti')(process.cwd(), { interopDefault: true, esmResolve: true })
        const mod: any = jiti(mainConfigFile)
        const config = (mod && (mod.default || mod)) as any
        const merged = mergeOptions(config, { ...args, watch: true, sourcemap: true })
        const compiler = createCompiler(merged)
        await compiler.run()
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })

  program.parse()
}
