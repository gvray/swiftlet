import { InputOptions, OutputOptions, RollupBuild, RollupOptions, RollupWatcher, RollupWatcherEvent } from 'rollup'
import SwiftletTask from './SwiftletTask'
import type { CompilerHooks } from '../types'

class RollupTask extends SwiftletTask {
  rollupOptions: RollupOptions
  inputOptions: InputOptions
  outputOptionsList?: OutputOptions[]
  private hooks: CompilerHooks | undefined
  constructor(options: RollupOptions, hooks?: CompilerHooks) {
    super()
    this.rollupOptions = options
    const out = options.output as OutputOptions | OutputOptions[] | undefined
    this.outputOptionsList = Array.isArray(out) ? out : out ? [out] : []
    // 初始化 inputOptions，贴近 Rollup 的 API 语义（inputOptions 与 outputOptions 分离）
    const { output: _outIgnored, watch: _watchIgnored, ...inputLike } = options as any
    this.inputOptions = inputLike as InputOptions
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
        // 构造 watch 配置：使用 inputOptions + outputOptionsList + 原始 watch 选项
        const watcher: RollupWatcher = watch({
          ...(this.inputOptions as unknown as import('rollup').RollupWatchOptions),
          output: this.outputOptionsList || [],
          watch: (options as any).watch
        })
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
              const { duration } = event as any
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
        // 语义化：rollup(inputOptions)
        bundle = await rollup(this.inputOptions)
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
