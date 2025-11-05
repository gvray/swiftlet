const path = require('path')
const { defineConfig } = require('swiftlet')
const { SimpleStatusPlugin } = require('./custom-plugin')

const input = path.resolve('./src/', 'index.js')

module.exports = defineConfig({
  input,
  target: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  plugin: [new SimpleStatusPlugin()],
  // external（函数形式，按组织前缀）
  rollupOptions: {
    external: (id) => id.startsWith('@gvray/'),
    output: {
      globals: {
        '@gvray/mathkit': 'mathkit'
      }
    }
  }
})
