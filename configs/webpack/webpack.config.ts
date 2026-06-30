/**
 * Webpack 5 配置
 *
 * 特点：
 * - 需要手动配置每个 loader（ts-loader、css-loader、asset modules）
 * - 插件生态最成熟（HtmlWebpackPlugin、MiniCssExtractPlugin 等）
 * - 配置量大但灵活度最高
 * - SplitChunksPlugin 处理代码分割
 */
import path from 'path';
import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';

const isProd = process.env.NODE_ENV === 'production';

const config: Configuration & { devServer?: Record<string, unknown> } = {
  mode: isProd ? 'production' : 'development',
  entry: path.resolve(__dirname, '../../src/index.tsx'),
  output: {
    path: path.resolve(__dirname, '../../dist-webpack'),
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
      // TypeScript / TSX
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // 跳过类型检查，只做转译（提升速度）
          },
        },
      },
      // CSS Modules
      {
        test: /\.module\.css$/,
        use: [
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
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
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
      // 静态资源（SVG、PNG 等）
      {
        test: /\.(svg|png|jpg|jpeg|gif|woff2?)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../../public/index.html'),
    }),
    ...(isProd
      ? [
          new MiniCssExtractPlugin({
            filename: '[name].[contenthash:8].css',
            chunkFilename: '[name].[contenthash:8].chunk.css',
          }),
        ]
      : []),
  ],
  optimization: {
    // 代码分割配置
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
    minimizer: isProd
      ? [
          new TerserPlugin({
            parallel: true,
          }),
        ]
      : [],
  },
  // 开发服务器配置
  devServer: {
    hot: true,
    port: 9001,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, '../../public'),
    },
  },
  // 性能提示阈值调高（1000个模块的项目产物较大是正常的）
  performance: {
    hints: false,
  },
};

export default config;
