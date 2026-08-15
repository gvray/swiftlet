import path from 'node:path';
import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: path.resolve('./src/', 'index.ts'),
  format: ['esm', 'cjs', 'umd'],
  outDir: './dist',
  dts: true,
  globalName: 'TypeScriptLibrary',
});
