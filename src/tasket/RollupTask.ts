import { OutputOptions, RollupBuild, RollupOptions, RollupWatcher, RollupWatcherEvent } from 'rollup'
import SwiftletTask from './SwiftletTask'

class RollupTask extends SwiftletTask {
  rollupOptions: RollupOptions
  outputOptionsList?: OutputOptions[]
  constructor(options: RollupOptions) {
    super()
    this.rollupOptions = options
    const out = options.output as OutputOptions | OutputOptions[] | undefined
    this.outputOptionsList = Array.isArray(out) ? out : out ? [out] : []
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
        watcher.on('event', (event: RollupWatcherEvent) => {
          switch (event.code) {
            case 'START':
            case 'BUNDLE_START':
            case 'BUNDLE_END':
            case 'END':
              break
            case 'ERROR':
              buildFailed = true
              console.error((event as { code: 'ERROR'; error: unknown }).error)
              break
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
