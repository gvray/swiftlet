import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    utils: 'src/utils.ts',
  },
  format: ['esm', 'cjs'],
  outDir: './dist',
});
