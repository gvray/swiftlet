import { RollupOptions } from 'rollup'
import RollupTask from './tasket/RollupTask'
import { CompilerHooks, SwiftletOptions } from './types'
import DeleteTask from './tasket/DeleteTask'
import path from 'node:path'
import { SyncHook } from 'tapable'
import { appRoot } from './utils'
import { createRollupOptions } from './utils/rollup'
import chalk from 'chalk'

class Compiler {
  readonly inputOptions: SwiftletOptions
  public readonly hooks: CompilerHooks

  constructor(options: SwiftletOptions) {
    this.inputOptions = {
      ...options,
      outDir: options.outDir ?? 'dist'
    }
    this.hooks = {
      entryOption: new SyncHook(), // start
      compile: new SyncHook(), // compile
      afterCompile: new SyncHook(), // end
      run: new SyncHook(),
      emit: new SyncHook(),
      done: new SyncHook(),
      status: new SyncHook<[string]>(),
      failed: new SyncHook<[Error | undefined]>()
    }
  }

  async run() {
    const { outDir } = this.inputOptions
    this.hooks.entryOption.call()
    this.hooks.run.call()
    this.hooks.status.call(`clean ${outDir} ...`)
    const cleanTask = new DeleteTask([path.resolve(appRoot, outDir as string)])
    await cleanTask.run()
    this.hooks.status.call(chalk.green(`clean success`))
    this.hooks.compile.call()
    this.hooks.status.call(`build ...`)
    const rollupOptions: RollupOptions[] = await createRollupOptions(this.inputOptions)
    for (const options of rollupOptions) {
      const rollupTask = new RollupTask(options)
      const buildFailed = await rollupTask.run()
      if (buildFailed) {
        this.hooks.failed.call(undefined)
        process.exit(1)
      }
    }
    this.hooks.afterCompile.call()
    this.hooks.status.call(chalk.green(`build success`))
    this.hooks.done.call()
  }
}

export default Compiler
