const path = require('path')
const { defineConfig } = require('swiftlet')
const { SimpleStatusPlugin } = require('./custom-plugin')

const input = path.resolve('./src/', 'index.ts')

module.exports = defineConfig({
  input,
  target: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  // 自定义 Swiftlet 插件示例（内置 LoadingPlugin 已默认启用）
  plugin: [new SimpleStatusPlugin()],
  // external（数组形式）
  rollupOptions: {
    external: ['@gvray/mathkit'],
    output: {
      globals: {
        '@gvray/mathkit': 'mathkit'
      }
    }
  }
})
