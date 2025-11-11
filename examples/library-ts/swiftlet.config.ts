import path from 'node:path'
import { defineConfig } from 'swiftlet'
import { SimpleStatusPlugin } from './custom-plugin'

const entry = path.resolve('./src/', 'index.ts')

export default defineConfig({
  entry,
  format: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  plugins: [() => new SimpleStatusPlugin()],
  external: ['@gvray/mathkit'],
  globals: {
    '@gvray/mathkit': 'mathkit'
  },
  globalName: 'SwiftletExampleTs'
})
