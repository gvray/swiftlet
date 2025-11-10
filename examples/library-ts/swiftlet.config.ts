const path = require('path')
const { defineConfig } = require('swiftlet')
const { SimpleStatusPlugin } = require('./custom-plugin')

const entry = path.resolve('./src/', 'index.ts')

module.exports = defineConfig({
  entry,
  format: ['es', 'cjs', 'umd'],
  outDir: './dist',
  // 自定义 Swiftlet 插件示例（内置 LoadingPlugin 已默认启用）
  plugins: [() => new SimpleStatusPlugin()],
  // external（数组形式）
  external: ['@gvray/mathkit'],
  globals: {
    '@gvray/mathkit': 'mathkit'
  },
  globalName: 'SwiftletExampleTs'
})
