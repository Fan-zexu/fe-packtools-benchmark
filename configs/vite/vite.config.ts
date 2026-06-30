/**
 * Vite 配置
 *
 * 特点：
 * - 极简配置，大部分能力开箱即用
 * - 开发模式基于 ESM，无需打包（unbundled）
 * - 生产构建底层使用 Rollup
 * - CSS Modules 内置支持
 * - 依赖预构建（pre-bundling）用 esbuild
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  css: {
    modules: {
      // CSS Modules 类名生成规则
      generateScopedName: '[name]__[local]--[hash:base64:5]',
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist-vite'),
    emptyOutDir: true,
    // 生产构建优化
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 代码分割配置
        manualChunks: {
          vendors: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd'],
          echarts: ['echarts', 'echarts-for-react'],
          lodash: ['lodash-es'],
        },
      },
    },
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 9002,
  },
  // 依赖预构建配置
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', 'echarts', 'echarts-for-react', 'lodash-es', 'dayjs'],
  },
});
