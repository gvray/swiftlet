const path = require('path')
const { defineConfig } = require('swiftlet')
const { SimpleStatusPlugin } = require('./custom-plugin')

const entry = path.resolve('./src/', 'index.js')

module.exports = defineConfig({
  entry,
  format: ['es', 'cjs', 'umd'],
  outDir: './dist',
  plugins: [() => new SimpleStatusPlugin()],
  // external（函数形式，按组织前缀）
  external: (id) => id.startsWith('@gvray/'),
  globals: {
    '@gvray/mathkit': 'mathkit'
  },
  globalName: 'SwiftletExampleJs'
})
