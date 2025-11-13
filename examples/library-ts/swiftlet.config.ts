import path from 'node:path'
import { defineConfig } from 'swiftlet'
import { simpleStatusPlugin } from './custom-plugin'

const entry = path.resolve('./src/', 'index.ts')

export default defineConfig({
  entry,
  format: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  plugins: [simpleStatusPlugin()],
  external: ['@gvray/mathkit'],
  globals: {
    '@gvray/mathkit': 'mathkit'
  },
  globalName: 'SwiftletExampleTs'
})
