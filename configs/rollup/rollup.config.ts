/**
 * Rollup 配置
 *
 * 特点：
 * - 定位是「库构建工具」，但也能构建应用
 * - 基于插件的模块处理，配置相对简洁
 * - Tree Shaking 能力强（Rollup 是 ESM Tree Shaking 的先驱）
 * - 不内置开发服务器，需要额外插件
 * - HTML 处理需要额外插件
 */
import path from 'path';
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import url from '@rollup/plugin-url';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  input: path.resolve(__dirname, '../../src/index.tsx'),
  output: {
    dir: path.resolve(__dirname, '../../dist-rollup'),
    format: 'es',
    entryFileNames: isProd ? '[name].[hash:8].js' : '[name].js',
    chunkFileNames: isProd ? '[name].[hash:8].chunk.js' : '[name].chunk.js',
    assetFileNames: '[name].[hash:8][extname]',
    sourcemap: true,
    // 代码分割
    manualChunks(id) {
      if (id.includes('node_modules')) {
        if (id.includes('react')) return 'react';
        if (id.includes('antd')) return 'antd';
        if (id.includes('echarts')) return 'echarts';
        if (id.includes('lodash')) return 'lodash';
        return 'vendors';
      }
    },
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      preventAssignment: true,
    }),
    nodeResolve({
      browser: true,
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
    }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(__dirname, '../../tsconfig.json'),
      declaration: false,
      outDir: path.resolve(__dirname, '../../dist-rollup'),
    }),
    postcss({
      // CSS Modules 支持
      modules: true,
      // 提取 CSS 到单独文件
      extract: true,
      autoModules: true,
    }),
    // 静态资源（SVG、PNG 等）转 base64 data URI
    url({
      include: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
      limit: 0, // 所有资源都转为文件 URL
    }),
  ],
  // Tree Shaking
  treeshake: {
    moduleSideEffects: false,
  },
});
