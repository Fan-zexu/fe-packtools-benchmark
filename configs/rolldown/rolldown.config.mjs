/**
 * Rolldown 配置
 *
 * 特点：
 * - Vite 团队开发的下一代 Rust 构建工具
 * - 兼容 Rollup 插件 API，但底层用 Rust 实现
 * - 旨在替代 Rollup 成为 Vite 的生产构建引擎
 * - 原生支持 ESM 和 CommonJS
 * - 内置 Tree Shaking 和代码分割
 * - 内置 oxc 转换器（Rust 实现的 TS/JSX 解析器）
 *
 * 注意：Rolldown 仍处于快速发展阶段，配置 API 可能变化
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

/**
 * 自定义 CSS Modules 插件
 * 将 .module.css 文件转换为 JS 模块，导出类名映射
 */
function cssModulesPlugin() {
  return {
    name: 'css-modules',
    resolveId(source, importer) {
      if (source.endsWith('.module.css')) {
        return { id: path.resolve(path.dirname(importer || ''), source) };
      }
    },
    load(id) {
      if (id.endsWith('.module.css')) {
        const content = readFileSync(id, 'utf-8');
        // 提取 CSS 类名
        const classNames = content.match(/\.([\w-]+)/g)?.map(c => c.slice(1)) || [];
        const uniqueNames = [...new Set(classNames)];
        // 生成导出对象
        const exports = uniqueNames.reduce((acc, name) => {
          acc[name] = isProd ? `${name}_${Math.random().toString(36).slice(2, 8)}` : `${name}`;
          return acc;
        }, {});
        return `const styles = ${JSON.stringify(exports)};\nexport default styles;`;
      }
      // 静态资源返回空模块
      if (/\.(svg|png|jpg|jpeg|gif)$/.test(id)) {
        return `export default ""`;
      }
    },
  };
}

/** @type {import('rolldown').RolldownOptions} */
export default {
  input: path.resolve(__dirname, '../../src/index.tsx'),
  output: {
    dir: path.resolve(__dirname, '../../dist-rolldown'),
    format: 'es',
    entryFileNames: isProd ? '[name].[hash:8].js' : '[name].js',
    chunkFileNames: isProd ? '[name].[hash:8].chunk.js' : '[name].chunk.js',
    assetFileNames: '[name].[hash:8][extname]',
    sourcemap: true,
    advancedChunks: {
      groups: [
        { name: 'react', test: /node_modules\/(react|react-dom|react-router)/ },
        { name: 'antd', test: /node_modules\/antd/ },
        { name: 'echarts', test: /node_modules\/(echarts|zrender)/ },
        { name: 'lodash', test: /node_modules\/lodash/ },
      ],
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  plugins: [
    cssModulesPlugin(),
  ],
  // Tree Shaking
  treeshake: true,
  // 环境变量注入
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
  },
};
