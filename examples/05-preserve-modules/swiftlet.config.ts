import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  outDir: './dist',
  preserveModules: true,
});
