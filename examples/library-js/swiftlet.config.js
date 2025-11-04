const path = require('path')
const { defineConfig } = require('swiftlet')
const { SimpleStatusPlugin } = require('./custom-plugin')

const input = path.resolve('./src/', 'index.js')

module.exports = defineConfig({
  input,
  target: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  plugin: [new SimpleStatusPlugin()]
})
