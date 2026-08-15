const path = require('path');
const { defineConfig } = require('swiftlet');

module.exports = defineConfig({
  entry: path.resolve('./src/', 'index.js'),
  format: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  globalName: 'SingleEntryLibrary',
});
