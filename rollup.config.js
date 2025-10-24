import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'TextBlindWatermark',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // TextBlindWatermark 单独模块 - ES Module
  {
    input: 'src/text-blind-watermark.ts',
    output: {
      file: 'dist/text-blind-watermark.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // TextBlindWatermark 单独模块 - CommonJS
  {
    input: 'src/text-blind-watermark.ts',
    output: {
      file: 'dist/text-blind-watermark.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // ImageSteganography 单独模块 - UMD (浏览器版本，包含crypto-js)
  {
    input: 'src/image-steganography.ts',
    output: {
      file: 'dist/image-steganography.umd.js',
      format: 'umd',
      name: 'ImageSteganography',
      sourcemap: true,
      exports: 'named',
      globals: {
        'crypto-js': 'CryptoJS'
      }
    },
    external: ['crypto-js'], // 将crypto-js标记为外部依赖，通过CDN加载
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // ImageSteganography 单独模块 - ES Module (Node.js版本，crypto-js作为外部依赖)
  {
    input: 'src/image-steganography.ts',
    output: {
      file: 'dist/image-steganography.esm.js',
      format: 'es',
      sourcemap: true
    },
    external: ['crypto-js'], // crypto-js 作为外部依赖
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist'
      }),
      production && terser()
    ].filter(Boolean)
  },
  // ImageSteganography 单独模块 - CommonJS
  {
    input: 'src/image-steganography.ts',
    output: {
      file: 'dist/image-steganography.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external: ['crypto-js'], // crypto-js 作为外部依赖
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      production && terser()
    ].filter(Boolean)
  }
]