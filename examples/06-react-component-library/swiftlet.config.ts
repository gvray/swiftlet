import { defineConfig } from 'swiftlet';

export default defineConfig({
  entry: 'src/index.tsx',
  format: ['esm', 'cjs'],
  outDir: './dist',
  dts: true,
  external: ['react', 'react/jsx-runtime'],
  globals: {
    react: 'React',
  },
});
