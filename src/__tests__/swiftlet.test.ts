import swiftlet from '../swiftlet'
import type { SwiftletPlugin } from '../types'

describe('swiftlet core', () => {
  test('exposes hooks and applies user plugin (plugin field)', () => {
    const calls: string[] = []
    const plugin: SwiftletPlugin = {
      name: 'TestPlugin',
      apply(compiler) {
        compiler.hooks.run.tap('TestPlugin', () => calls.push('run'))
        compiler.hooks.status.tap('TestPlugin', (text: string) => calls.push(`status:${text}`))
      }
    }
    const compiler = swiftlet({ input: 'noop.js', plugin })
    // 模拟生命周期
    compiler.hooks.run.call()
    compiler.hooks.status.call('hello')
    expect(calls).toEqual(['run', 'status:hello'])
  })

  test('supports legacy swiftletPlugins', () => {
    const calls: string[] = []
    const plugin: SwiftletPlugin = {
      name: 'LegacyPlugin',
      apply(compiler) {
        compiler.hooks.done.tap('LegacyPlugin', () => calls.push('done'))
      }
    }
    const compiler = swiftlet({ input: 'noop.js', swiftletPlugins: [plugin] })
    compiler.hooks.done.call()
    expect(calls).toEqual(['done'])
  })

  test('dev flags propagate via argv (watch & sourcemap)', () => {
    const origArgv = [...process.argv]
    try {
      process.argv.push('watch=true', 'sourcemap=true')
      const compiler = swiftlet({ input: 'noop.js' })
      expect((compiler as any).inputOptions.watch).toBe(true)
      expect((compiler as any).inputOptions.sourcemap).toBe('true' as any)
    } finally {
      process.argv.length = 0
      Array.prototype.push.apply(process.argv, origArgv)
    }
  })
})
