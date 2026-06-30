/**
 * Rspack 配置
 *
 * 特点：
 * - Webpack 兼容 API，迁移成本低
 * - 底层 Rust 实现，构建速度快
 * - 内置 SWC 替代 babel/ts-loader
 * - CSS 处理兼容 webpack loader 生态
 */
import path from 'path';
import { Configuration } from '@rspack/core';
import rspack from '@rspack/core';
import { HtmlRspackPlugin } from '@rspack/core';

const isProd = process.env.NODE_ENV === 'production';

const config: Configuration = {
  mode: isProd ? 'production' : 'development',
  entry: path.resolve(__dirname, '../../src/index.tsx'),
  output: {
    path: path.resolve(__dirname, '../../dist-rspack'),
    filename: isProd ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: isProd ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  module: {
    rules: [
      // TypeScript / TSX - 使用内置 SWC loader（比 ts-loader 快很多）
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
      // CSS Modules - 使用 css-loader（与 webpack 相同）
      {
        test: /\.module\.css$/,
        use: [
          isProd ? rspack.CssExtractRspackPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isProd ? '[hash:base64:6]' : '[name]__[local]--[hash:base64:5]',
              },
            },
          },
        ],
      },
      // 普通 CSS
      {
        test: /(?<!\.module)\.css$/,
        use: [
          isProd ? rspack.CssExtractRspackPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
      // 静态资源
      {
        test: /\.(svg|png|jpg|jpeg|gif|woff2?)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlRspackPlugin({
      template: path.resolve(__dirname, '../../public/index.html'),
    }),
    ...(isProd
      ? [
          new rspack.CssExtractRspackPlugin({
            filename: '[name].[contenthash:8].css',
            chunkFilename: '[name].[contenthash:8].chunk.css',
          }),
        ]
      : []),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    minimize: isProd,
    minimizer: [new rspack.SwcJsMinimizerRspackPlugin()],
  },
  devServer: {
    hot: true,
    port: 9005,
    historyApiFallback: true,
  },
  performance: {
    hints: false,
  },
};

export default config;
