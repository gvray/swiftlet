import { Command } from 'commander'
import { appRoot, getMainConfigFile } from '../utils'
import swiftlet from '../index'

export async function run({ _opts = process.argv.slice(2), pck }: any) {
  const program = new Command()
  program.name(pck.name).description(pck.description).version(pck.version, '-v, --version')
  program
    .command('build')
    .description('build an app')
    .action(async () => {
      try {
        const mainConfigFile = getMainConfigFile({ cwd: appRoot })
        if (!mainConfigFile)
          throw Error('Check if your project is missing a configuration file (swiftlet.config.(ts|js))')
        const config = await import(mainConfigFile)
        // const swiftlet = await import('../index')
        const compiler = swiftlet(config)
        compiler.run()
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })

  program
    .command('dev')
    .description('start dev build with watch and sourcemap')
    .action(async () => {
      try {
        const mainConfigFile = getMainConfigFile({ cwd: appRoot })
        if (!mainConfigFile)
          throw Error('Check if your project is missing a configuration file (swiftlet.config.(ts|js))')
        // 注入 shell 覆盖项：watch=true sourcemap=true
        process.argv.push('watch=true', 'sourcemap=true')
        const config = await import(mainConfigFile)
        const compiler = swiftlet(config)
        compiler.run()
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    })

  program.parse()
}
