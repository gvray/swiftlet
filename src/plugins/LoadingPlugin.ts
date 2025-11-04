import ora from 'ora'
import { SyncHook } from 'tapable'
import { SwiftletPlugin, CompilerHooks } from '../types'

export class LoadingPlugin implements SwiftletPlugin {
  name?: string
  private spinner = ora({ text: 'Initializing...', color: 'cyan' })

  constructor(name: string = 'LoadingPlugin') {
    this.name = name
  }

  apply(compiler: { hooks: CompilerHooks }) {
    compiler.hooks.run.tap(this.name as string, () => {
      this.spinner.start('Building...')
    })

    compiler.hooks.status.tap(this.name as string, (text: string) => {
      if (this.spinner.isSpinning) {
        this.spinner.text = text
      } else {
        this.spinner.start(text)
      }
    })

    compiler.hooks.compile.tap(this.name as string, () => {
      this.spinner.text = 'Compiling...'
    })

    compiler.hooks.afterCompile.tap(this.name as string, () => {
      this.spinner.text = 'Finalizing...'
    })

    compiler.hooks.failed.tap(this.name as string, (err?: Error) => {
      if (this.spinner.isSpinning) this.spinner.fail(err ? err.message : 'Build failed')
    })

    compiler.hooks.done.tap(this.name as string, () => {
      if (this.spinner.isSpinning) this.spinner.succeed('Build finished!')
    })
  }
}

export default LoadingPlugin
