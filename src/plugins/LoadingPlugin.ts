import ora from 'ora'
import chalk from 'chalk'
import { SwiftletPlugin, CompilerHooks, StatusPayload } from '../types'

export class LoadingPlugin implements SwiftletPlugin {
  name?: string
  private spinner = ora({ text: 'Initializing...', color: 'cyan' })
  private phase = 'Building'
  private lastStatus = ''

  private formatStatus(payload: StatusPayload): string {
    const scope = payload.scope ? `${chalk.cyan(`[${payload.scope}]`)} ` : ''
    return `${scope}${payload.message}`
  }

  private printStatus(payload: StatusPayload) {
    const line = this.formatStatus(payload)
    if (this.spinner.isSpinning) {
      const current = this.spinner.text
      this.spinner.stop()
      console.log(line)
      this.spinner.start(current)
    } else {
      console.log(line)
    }
  }

  constructor(name = 'LoadingPlugin') {
    this.name = name
  }

  apply(compiler: { hooks: CompilerHooks }) {
    // 全局日志护栏：避免与 spinner 同行搅合
    const originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    }
    const wrap =
      (fn: (...args: any[]) => void) =>
      (...args: any[]) => {
        if (this.spinner.isSpinning) {
          const current = this.spinner.text
          this.spinner.stop()
          fn(...args)
          this.spinner.start(current)
        } else {
          fn(...args)
        }
      }
    console.log = wrap(originalConsole.log) as any
    console.warn = wrap(originalConsole.warn) as any
    console.error = wrap(originalConsole.error) as any

    compiler.hooks.run.tap(this.name as string, () => {
      this.phase = 'Building'
      this.spinner.start('Building...')
    })

    compiler.hooks.status.tap(this.name as string, (payload: StatusPayload) => {
      // 其他阶段：整洁的一行日志
      this.printStatus(payload)
      this.lastStatus = payload.message
    })

    compiler.hooks.compile.tap(this.name as string, (format: string) => {
      this.phase = 'Compiling'
      const suffix = format ? ` (${format})` : ''
      this.spinner.text = `Compiling${suffix}...`
    })

    compiler.hooks.afterCompile.tap(this.name as string, () => {
      this.phase = 'Finalizing'
      this.spinner.text = 'Finalizing...'
    })

    compiler.hooks.failed.tap(this.name as string, (err?: Error) => {
      if (this.spinner.isSpinning) this.spinner.fail(err ? err.message : 'Build failed')
      // 失败后恢复 console
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
    })

    compiler.hooks.done.tap(this.name as string, () => {
      if (this.spinner.isSpinning) this.spinner.succeed('Build finished!')
      // 完成后恢复 console
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
    })
  }
}

export default LoadingPlugin
