import { Command } from 'commander'
import { appRoot, getMainConfigFile } from '../utils'
import { createCompiler, Options } from '../index'
import { mergeConfigWithCliArgs, formatRollupForPrint } from '../utils/cli'
export async function run({ pck }: { pck: { name: string; description?: string; version: string } }) {
  const program = new Command()
  const description = pck.description ?? ''
  program.name(pck.name).description(description).version(pck.version, '-v, --version')

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
    .option('--print-rollup', 'Print final Rollup config and exit')
    .action(async (args) => {
      try {
        const mainConfigFile = getMainConfigFile({ cwd: appRoot })
        if (!mainConfigFile)
          throw Error('Check if your project is missing a configuration file (swiftlet.config.(ts|js))')
        // Use jiti to load config with universal import/TS support (like ESLint 9)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const jiti = require('jiti')(process.cwd(), { interopDefault: true, esmResolve: true })
        const mod = jiti(mainConfigFile)
        const config = (mod && (mod.default || mod)) as Options
        const merged = mergeConfigWithCliArgs(config, args)
        if (args.printRollup) {
          // 生成最终 Swiftlet 选项，再转换为 Rollup 配置，打印并退出
          const { resolveSwiftletOptions } = await import('../core/swiftlet')
          const finalOptions = resolveSwiftletOptions(merged)
          const { createRollupOptions } = await import('../utils/rollup')
          const rollupConfigs = await createRollupOptions(finalOptions)
          const printable = formatRollupForPrint(Array.isArray(rollupConfigs) ? rollupConfigs : [rollupConfigs])
          process.stdout.write(`${JSON.stringify(printable, null, 2)}\n`)
          return
        }
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
        const merged = mergeConfigWithCliArgs(config, { ...args, watch: true, sourcemap: true })
        const compiler = createCompiler(merged)
        await compiler.run()
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })

  program.parse()
}
