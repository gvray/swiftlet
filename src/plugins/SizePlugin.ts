import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import chalk from 'chalk'
import type { SwiftletPlugin, CompilerHooks } from '../types'

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`
}

function collectFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full))
    } else {
      // 仅统计常见产物：.js/.mjs/.cjs/.umd/.iife/.d.ts/.map
      if (/\.(js|mjs|cjs|umd|iife|d\.ts|map)$/.test(entry.name)) {
        results.push(full)
      }
    }
  }
  return results
}

class SizePlugin implements SwiftletPlugin {
  name?: string
  private boxen?: any
  constructor(name = 'SizePlugin') {
    this.name = name
  }
  apply(compiler: { hooks: CompilerHooks; inputOptions?: any }) {
    // 预取 boxen，使 afterCompile 中的渲染为同步调用，保证输出顺序可控
    compiler.hooks.run.tap(this.name as string, () => {
      try {
        const importer = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<any>
        importer('boxen')
          .then((mod) => {
            this.boxen = (mod as any).default || (mod as any)
          })
          .catch(() => {
            this.boxen = undefined
          })
      } catch {
        this.boxen = undefined
      }
    })

    compiler.hooks.afterCompile.tap(this.name as string, () => {
      try {
        const outDir: string | undefined = compiler?.inputOptions?.outDir || 'dist'
        if (!outDir) return
        const files = collectFiles(path.resolve(process.cwd(), outDir))
        if (files.length === 0) return
        const lines: string[] = []
        for (const file of files) {
          const buf = fs.readFileSync(file)
          const size = buf.length
          let gz = 0
          try {
            gz = zlib.gzipSync(buf).length
          } catch {
            // ignore gzip errors
          }
          const rel = path.relative(process.cwd(), file)
          lines.push(`${chalk.cyan(rel)}  ${chalk.green(formatBytes(size))}  ${chalk.gray(formatBytes(gz))}`)
        }
        const heading = 'Build Artifacts (size / gzip)'
        if (this.boxen) {
          const content = lines.join('\n')
          const box = this.boxen(content, {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            title: chalk.bold(heading),
            titleAlignment: 'left'
          })
          console.log(box)
        } else {
          console.log(chalk.bold(heading))
          console.log(lines.join('\n'))
        }
      } catch (e) {
        // 不影响构建流程
        console.error(e)
      }
    })
  }
}

export default SizePlugin
