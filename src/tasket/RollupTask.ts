import { OutputOptions, RollupBuild, RollupOptions, RollupWatcher, RollupWatcherEvent } from 'rollup'
import SwiftletTask from './SwiftletTask'
import type { CompilerHooks } from '../types'

class RollupTask extends SwiftletTask {
  rollupOptions: RollupOptions
  outputOptionsList?: OutputOptions[]
  private hooks: CompilerHooks | undefined
  constructor(options: RollupOptions, hooks?: CompilerHooks) {
    super()
    this.rollupOptions = options
    const out = options.output as OutputOptions | OutputOptions[] | undefined
    this.outputOptionsList = Array.isArray(out) ? out : out ? [out] : []
    this.hooks = hooks
  }

  async build(options: RollupOptions): Promise<boolean> {
    let bundle: RollupBuild | undefined
    let buildFailed = false
    try {
      // watch 模式：使用 rollup.watch
      const hasWatch = Object.prototype.hasOwnProperty.call(options as object, 'watch')
      if (hasWatch) {
        const { watch } = await import('rollup')
        const watcher: RollupWatcher = watch(options as unknown as import('rollup').RollupWatchOptions)
        const format = this.outputOptionsList?.[0]?.format ? String(this.outputOptionsList?.[0]?.format) : 'unknown'
        this.hooks?.status.call({ message: 'Entering watch mode...', scope: 'watch', phase: 'build' })
        watcher.on('event', (event: RollupWatcherEvent) => {
          switch (event.code) {
            case 'START': {
              this.hooks?.status.call({ message: 'Rebuild started...', scope: 'watch', phase: 'build' })
              break
            }
            case 'BUNDLE_START': {
              this.hooks?.compile.call(format)
              this.hooks?.status.call({ message: `Compiling (${format})...`, scope: 'watch', phase: 'compile' })
              break
            }
            case 'BUNDLE_END': {
              const duration = (event as any).duration
              this.hooks?.status.call({ message: `Compiled in ${duration}ms`, scope: 'watch', phase: 'finalize' })
              break
            }
            case 'END': {
              this.hooks?.done.call()
              this.hooks?.status.call({ message: 'Watching for file changes...', scope: 'watch', phase: 'finalize' })
              break
            }
            case 'ERROR': {
              buildFailed = true
              const err = (event as { code: 'ERROR'; error: unknown }).error as Error | undefined
              this.hooks?.failed.call(err)
              console.error(err)
              break
            }
          }
        })
        // 进入 watch 后，立即返回（不中断进程）
        return false
      } else {
        const { rollup } = await import('rollup')
        bundle = await rollup(options)
        await this.generateOutputs(bundle)
      }
    } catch (error) {
      buildFailed = true
      this.hooks?.failed.call(error as Error)
      console.error(error)
    } finally {
      if (bundle) await bundle.close()
    }
    // process.exit(buildFailed ? 1 : 0)
    return buildFailed
  }
  async generateOutputs(bundle: RollupBuild) {
    if (!this.outputOptionsList || this.outputOptionsList.length === 0) return
    for (const outputOptions of this.outputOptionsList) {
      await bundle.write(outputOptions)
    }
  }
  async runImpl(): Promise<boolean> {
    const buildFailed = await this.build(this.rollupOptions)
    return buildFailed
  }
}

export default RollupTask
