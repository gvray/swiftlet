import type { OutputOptions } from 'rollup';
import { createRollupOptions } from '../utils/rollup';
import { mergeConfigWithCliArgs } from '../utils/cli';
import type { Options } from '../types';

function firstOutput(config: { output?: OutputOptions | OutputOptions[] }): OutputOptions {
  const out = config.output;
  return Array.isArray(out) ? out[0] : out!;
}

describe('createRollupOptions output strategy', () => {
  const baseOptions: Options = {
    entry: 'src/index.ts',
    outDir: 'dist',
    format: ['esm'],
    dts: false,
  };

  test('single entry produces single-file output', async () => {
    const configs = await createRollupOptions(baseOptions);
    expect(configs).toHaveLength(1);
    const output = firstOutput(configs[0]);
    expect(output.file).toMatch(/swiftlet\.esm\.js$/);
    expect(output.dir).toBeUndefined();
  });

  test('multi-entry array produces dir-based output', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: ['src/index.ts', 'src/utils.ts'],
      format: ['esm', 'cjs'],
    });
    const esm = configs.find((c) => firstOutput(c).format === 'esm');
    const cjs = configs.find((c) => firstOutput(c).format === 'cjs');
    expect(esm).toBeDefined();
    expect(cjs).toBeDefined();
    expect(firstOutput(esm!).dir).toMatch(/dist[/\\]esm$/);
    expect(firstOutput(esm!).entryFileNames).toBe('[name].js');
    expect(firstOutput(cjs!).dir).toMatch(/dist[/\\]cjs$/);
  });

  test('multi-entry record preserves entry names', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts',
      },
      format: ['esm'],
    });
    const cfg = configs[0];
    expect((cfg.input as Record<string, string>).index).toBe('src/index.ts');
    expect((cfg.input as Record<string, string>).cli).toBe('src/cli.ts');
    expect(firstOutput(cfg).dir).toMatch(/dist[/\\]esm$/);
    expect(firstOutput(cfg).entryFileNames).toBe('[name].js');
  });

  test('splitting true enables dir-based output', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: 'src/index.ts',
      splitting: true,
    });
    const output = firstOutput(configs[0]);
    expect(output.dir).toMatch(/dist[/\\]esm$/);
    expect(output.entryFileNames).toBe('[name].js');
    expect(output.chunkFileNames).toBe('_shared/[name]-[hash].js');
  });

  test('preserveModules enables Rollup preserveModules', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: 'src/index.ts',
      preserveModules: true,
    });
    const output = firstOutput(configs[0]);
    expect(output.dir).toMatch(/dist[/\\]esm$/);
    expect(output.preserveModules).toBe(true);
  });

  test('custom entryFileNames is respected', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: ['src/index.ts', 'src/utils.ts'],
      entryFileNames: '[name].[format].js',
    });
    const output = firstOutput(configs[0]);
    expect(output.entryFileNames).toBe('[name].[format].js');
  });

  test('multi-entry with umd generates per-entry configs', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: {
        index: 'src/index.ts',
        utils: 'src/utils.ts',
      },
      format: ['umd'],
      globalName: 'MyLib',
    });
    expect(configs).toHaveLength(2);
    configs.forEach((cfg) => {
      const out = firstOutput(cfg);
      expect(out.file).toBeDefined();
      expect(out.dir).toBeUndefined();
      expect(typeof cfg.input).toBe('string');
    });
    const files = configs.map((c) => firstOutput(c).file);
    expect(files.some((f) => f?.includes('index.min.js'))).toBe(true);
    expect(files.some((f) => f?.includes('utils.min.js'))).toBe(true);
  });

  test('dts single entry uses file output', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: 'src/index.ts',
      dts: true,
    });
    const dtsConfig = configs[configs.length - 1];
    const output = firstOutput(dtsConfig);
    expect(output.file).toMatch(/swiftlet\.d\.ts$/);
    expect(output.dir).toBeUndefined();
  });

  test('dts multi entry uses dir + preserveModules', async () => {
    const configs = await createRollupOptions({
      ...baseOptions,
      entry: ['src/index.ts', 'src/utils.ts'],
      dts: true,
    });
    const dtsConfig = configs[configs.length - 1];
    const output = firstOutput(dtsConfig);
    expect(output.dir).toMatch(/dist$/);
    expect(output.preserveModules).toBe(true);
    expect(output.entryFileNames).toBe('[name].d.ts');
  });
});

describe('mergeConfigWithCliArgs multi-file flags', () => {
  test('parses splitting and preserveModules flags', () => {
    const merged = mergeConfigWithCliArgs({ entry: 'src/index.ts' } as Options, {
      splitting: true,
      preserveModules: true,
      entryFileNames: '[name].mjs',
    }) as Options;
    expect(merged.splitting).toBe(true);
    expect(merged.preserveModules).toBe(true);
    expect(merged.entryFileNames).toBe('[name].mjs');
  });
});
