import path from 'path';
import {
  RollupOptions,
  OutputOptions,
  defineConfig,
  InputPluginOption,
  ModuleFormat,
  RollupWatchOptions,
  LogLevel,
  RollupLog,
  LogOrStringHandler,
} from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { appRoot, isTypeScript, kebabCase, transformPackageName } from './swiftlet';
import { Options } from '../index';
import chalk from 'chalk';

const COLORS: Record<string, (msg: string) => string> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.cyan,
  debug: chalk.gray,
};

const loggedMessages = new Set<string>();

const onLog = (level: LogLevel, log: RollupLog, handler: LogOrStringHandler) => {
  const key = `${level}:${log.message}`;
  if (loggedMessages.has(key)) return;
  loggedMessages.add(key);

  const colorize = COLORS[level];
  if (colorize) {
    handler(level, {
      ...log,
      message: colorize(log.message),
    });
  } else {
    handler(level, log);
  }
};

function isMultiEntry(entry: Options['entry']): boolean {
  if (Array.isArray(entry)) return entry.length > 1;
  if (entry && typeof entry === 'object') return Object.keys(entry).length > 0;
  return false;
}

function isMultiFileMode(options: Options): boolean {
  return (
    options.splitting === true || options.preserveModules === true || isMultiEntry(options.entry)
  );
}

export async function createRollupOptions(options: Options): Promise<RollupOptions[]> {
  const {
    entry,
    format,
    outDir,
    sourcemap,
    dts: genDts,
    rollupOptions,
    pluginsRollup,
    watch,
    external,
    minify,
    globals,
    globalName,
    target,
    preserveModules,
    entryFileNames,
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pck = require(path.resolve(appRoot, 'package.json'));
  const { name = 'bundle' } = pck;

  const normalizeFormat = (fmt: string): ModuleFormat => {
    return fmt as ModuleFormat;
  };

  const fileSuffix = (fmt: ModuleFormat): string => {
    switch (fmt) {
      case 'esm':
        return 'esm';
      case 'umd':
        return 'min';
      default:
        return String(fmt);
    }
  };

  const multiFileMode = isMultiFileMode(options);

  /**
   * 生成单个 format 的 Rollup output 配置
   * @param fmt - 输出格式
   * @param namedEntry - 仅在 UMD/IIFE 多入口时使用，表示当前入口的名称
   */
  const genOutput = (fmt: ModuleFormat, namedEntry?: string): OutputOptions => {
    const outputBase: OutputOptions = {
      format: fmt,
      sourcemap: sourcemap ?? false,
    };

    if (fmt === 'umd' || fmt === 'iife') {
      const out: OutputOptions = {
        ...outputBase,
        name: globalName ?? transformPackageName(name),
        noConflict: true,
      };
      if (globals) {
        out.globals = globals;
      }

      if (namedEntry) {
        // UMD/IIFE 不支持多 chunk，多入口时每个入口独立生成一个文件
        out.file = `./${path.join(outDir as string, `${namedEntry}.${fileSuffix(fmt)}.js`)}`;
      } else if (multiFileMode) {
        // 单入口但启用 splitting / preserveModules，UMD/IIFE 退化为单文件
        out.file = `./${path.join(outDir as string, `${kebabCase(name)}.${fileSuffix(fmt)}.js`)}`;
      } else {
        out.file = `./${path.join(outDir as string, `${kebabCase(name)}.${fileSuffix(fmt)}.js`)}`;
      }
      return out;
    }

    // esm / cjs
    if (multiFileMode) {
      const out: OutputOptions = {
        ...outputBase,
        dir: path.join(outDir as string, String(fmt)),
        entryFileNames: entryFileNames ?? '[name].js',
        chunkFileNames: '_shared/[name]-[hash].js',
      };
      if (preserveModules) {
        out.preserveModules = true;
      }
      return out;
    }

    // 单文件模式（向后兼容）
    return {
      ...outputBase,
      file: `./${path.join(outDir as string, `${kebabCase(name)}.${fileSuffix(fmt)}.js`)}`,
    };
  };

  const normalizedFormats: ModuleFormat[] = Array.isArray(format)
    ? (format.map((f) => normalizeFormat(f)) as ModuleFormat[])
    : [normalizeFormat(format as unknown as string)];

  const innerPlugins: InputPluginOption[] = [];
  if (minify === true || minify === 'terser') {
    innerPlugins.push(terser());
  } else if (minify === 'esbuild') {
    // TODO: optional esbuild minification
  }

  // 预生成 outputs 供 rollupOptions 钩子查看
  const previewOutputs: OutputOptions[] = [];
  for (const fmt of normalizedFormats) {
    if ((fmt === 'umd' || fmt === 'iife') && isMultiEntry(entry)) {
      const entries = Array.isArray(entry)
        ? entry.map((e, i) => [`entry${i + 1}`, e] as [string, string])
        : Object.entries(entry as Record<string, string>);
      for (const [entryName] of entries) {
        previewOutputs.push(genOutput(fmt, entryName));
      }
    } else {
      previewOutputs.push(genOutput(fmt));
    }
  }

  const appliedRollupOptions = rollupOptions?.({
    input: entry,
    output: previewOutputs,
  } as RollupOptions);
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    output: _userOutput,
    external: userExternal,
    plugins: userPlugins,
    ...restRollupOptions
  } = (appliedRollupOptions || {}) as any;

  // external 合并策略：兼容 Options.external (string[] | (id)=>boolean) 和 rollupOptions.external (string | RegExp | Array<string|RegExp> | (id)=>boolean)
  const toPredicate = (ext?: unknown): ((id: string) => boolean) | undefined => {
    if (ext == null) return undefined;
    if (typeof ext === 'function') return ext as (id: string) => boolean;
    if (typeof ext === 'string') return (id: string) => id === ext;
    if (ext instanceof RegExp) return (id: string) => (ext as RegExp).test(id);
    if (Array.isArray(ext)) {
      const arr = ext as Array<string | RegExp>;
      return (id: string) =>
        arr.some((it) => (typeof it === 'string' ? it === id : (it as RegExp).test(id)));
    }
    return undefined;
  };

  let finalExternal: RollupOptions['external'];
  const pa = toPredicate(external);
  const pb = toPredicate(userExternal);
  if (external && userExternal) {
    if (Array.isArray(external) && Array.isArray(userExternal)) {
      finalExternal = Array.from(
        new Set([...(external as string[]), ...(userExternal as string[])])
      );
    } else {
      finalExternal = (id: string) => (pa?.(id) ?? false) || (pb?.(id) ?? false);
    }
  } else {
    finalExternal =
      (external as RollupOptions['external']) ?? (userExternal as RollupOptions['external']);
  }

  // 统一构建插件列表
  const buildPlugins = (): InputPluginOption[] => {
    const plugins: InputPluginOption[] = [
      // 用户可控的前置插件（例如 alias/resolve）
      ...(pluginsRollup || []),
    ];

    if (isTypeScript()) {
      plugins.push(
        typescript({
          compilerOptions: {
            declaration: false,
            sourceMap: sourcemap ?? false,
            ...(target ? { target } : {}),
          },
        })
      );
    }

    plugins.push(
      // 用户提供的 rollupOptions.plugins（通常用于后置如 babel）
      ...(userPlugins || []),
      // 压缩应尽量放在最后
      ...innerPlugins
    );

    return plugins;
  };

  const configs: RollupOptions[] = [];

  for (const fmt of normalizedFormats) {
    const plugins = buildPlugins();

    // UMD/IIFE 不支持多 chunk，多入口时需要拆成多个单 entry 的 config
    if ((fmt === 'umd' || fmt === 'iife') && isMultiEntry(entry)) {
      const entries = Array.isArray(entry)
        ? entry.map((e, i) => [`entry${i + 1}`, e] as [string, string])
        : Object.entries(entry as Record<string, string>);

      for (const [entryName, entryPath] of entries) {
        const cfg: RollupOptions = {
          input: entryPath,
          output: [genOutput(fmt, entryName)],
          external: finalExternal,
          onLog,
          plugins,
          ...restRollupOptions,
          ...(watch ? ({ watch: {} } as RollupWatchOptions) : {}),
        };
        configs.push(cfg);
      }
    } else {
      const cfg: RollupOptions = {
        input: entry,
        output: [genOutput(fmt)],
        external: finalExternal,
        onLog,
        plugins,
        ...restRollupOptions,
        ...(watch ? ({ watch: {} } as RollupWatchOptions) : {}),
      };
      configs.push(cfg);
    }
  }

  if (genDts && isTypeScript()) {
    const dtsOutput: RollupOptions = {
      input: entry,
      plugins: [dts()],
      output: multiFileMode
        ? [
            {
              format: 'esm' as ModuleFormat,
              dir: outDir as string,
              preserveModules: true,
              entryFileNames: (entryFileNames ?? '[name].js').replace(/\.js$/, '.d.ts'),
            },
          ]
        : [
            {
              format: 'esm' as ModuleFormat,
              file: `${path.join(outDir as string, `${kebabCase(name)}.d.ts`)}`,
            },
          ],
    };
    configs.push(dtsOutput);
  }

  return defineConfig(configs);
}
