import { RollupOptions } from 'rollup'
import RollupTask from '../tasket/RollupTask'
import { CompilerHooks, Options, StatusPayload } from '../types'
import DeleteTask from '../tasket/DeleteTask'
import path from 'node:path'
import { SyncHook } from 'tapable'
import { appRoot } from '../utils'
import { createRollupOptions } from '../utils/rollup'
import chalk from 'chalk'

class Compiler {
  readonly inputOptions: Options
  public readonly hooks: CompilerHooks

  constructor(options: Options) {
    this.inputOptions = {
      ...options
    }
    this.hooks = {
      entryOption: new SyncHook<[]>([]), // start
      compile: new SyncHook<[string]>(['format']), // compile
      afterCompile: new SyncHook<[]>([]), // end
      run: new SyncHook<[]>([]),
      emit: new SyncHook<[]>([]),
      done: new SyncHook<[]>([]),
      status: new SyncHook<[StatusPayload]>(['payload']),
      failed: new SyncHook<[Error | undefined]>(['error'])
    }
  }

  async run() {
    const { outDir, clean } = this.inputOptions
    this.hooks.entryOption.call()
    this.hooks.run.call()
    if (clean !== false) {
      this.hooks.status.call({ message: `clean ${outDir} ...`, scope: 'clean', phase: 'clean' })
      const cleanTask = new DeleteTask([path.resolve(appRoot, outDir as string)])
      await cleanTask.run()
      this.hooks.status.call({ message: chalk.green(`clean success`), scope: 'clean', phase: 'finalize' })
    }
    this.hooks.status.call({ message: `build ...`, scope: 'build', phase: 'build' })
    const rollupOptions: RollupOptions[] = await createRollupOptions(this.inputOptions)
    for (const options of rollupOptions) {
      const outputs = (options.output || []) as any
      const firstOutput = Array.isArray(outputs) ? outputs[0] : outputs
      const currentFormat = firstOutput?.format ?? 'unknown'
      this.hooks.compile.call(String(currentFormat))
      const rollupTask = new RollupTask(options, this.hooks)
      const buildFailed = await rollupTask.run()
      if (buildFailed) {
        this.hooks.failed.call(undefined)
        process.exit(1)
      }
    }
    this.hooks.afterCompile.call()
    this.hooks.status.call({ message: chalk.green(`build success`), scope: 'build', phase: 'finalize' })
    this.hooks.done.call()
  }
}

export default Compiler
