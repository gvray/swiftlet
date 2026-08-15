import { defineConfig, CompilerHooks, StatusPayload } from 'swiftlet';

class BuildInfoPlugin {
  name = 'BuildInfoPlugin';

  apply(compiler: { hooks: CompilerHooks }) {
    compiler.hooks.run.tap(this.name, () => {
      console.log('[BuildInfoPlugin] build started');
    });

    compiler.hooks.compile.tap(this.name, (format: string) => {
      console.log(`[BuildInfoPlugin] compiling format: ${format}`);
    });

    compiler.hooks.status.tap(this.name, (payload: StatusPayload) => {
      console.log(`[BuildInfoPlugin] status: ${payload.message}`);
    });

    compiler.hooks.done.tap(this.name, () => {
      console.log('[BuildInfoPlugin] build finished');
    });
  }
}

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  outDir: './dist',
  plugins: [() => new BuildInfoPlugin()],
});
