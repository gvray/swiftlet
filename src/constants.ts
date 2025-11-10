import type { Options } from './types'

export const DEFAULT_CONFIG_FILES = [
  'swiftlet.config.ts',
  'swiftlet.config.js',
  'swiftlet.config.mts',
  'swiftlet.config.mjs',
  'swiftlet.config.cjs',
  'swiftlet.config.cts'
] as const

// Swiftlet 默认配置（集中定义，避免散落在各处）
export const DEFAULT_OPTIONS: Partial<Options> = {
  format: ['es'],
  outDir: 'dist',
  sourcemap: false,
  dts: true
}
