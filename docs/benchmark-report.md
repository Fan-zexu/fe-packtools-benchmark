# 构建工具性能对比报告

> 生成时间: 2026/6/30 16:02:02
> 测试次数: 每个工具 3 次取中位数
> 模块数量: 1000 个生成模块 + 核心模块
> Node 版本: v20.18.0

## 构建性能

| 构建工具 | 冷启动构建 | 热启动构建 | 产物大小 | Gzip 大小 | 分包数 | Tree Shaking |
|----------|-----------|-----------|---------|----------|-------|-------------|
| webpack5 | 13.50 s | 15.12 s | 2.45 MB | 577.4 KB | 3 | ✅ |
| vite | 5.39 s | 5.64 s | 2.46 MB | 632.6 KB | 6 | ✅ |
| rollup | 23.99 s | 24.34 s | 33.09 MB | 2.04 MB | 14 | ✅ |
| rspack | 2.31 s | 2.37 s | 12.62 MB | 570.2 KB | 3 | ✅ |
| rolldown | 674 ms | 651 ms | 23.90 MB | 1.61 MB | 6 | ✅ |

## 冷启动构建速度排名

1. **rolldown** - 674 ms
2. **rspack** - 2.31 s
3. **vite** - 5.39 s
4. **webpack5** - 13.50 s
5. **rollup** - 23.99 s

## 产物体积排名（Gzip）

1. **rspack** - 570.2 KB
2. **webpack5** - 577.4 KB
3. **vite** - 632.6 KB
4. **rolldown** - 1.61 MB
5. **rollup** - 2.04 MB

## 功能对比总表

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack |
|------|-----------|------|--------|----------|--------|
| 底层语言 | JavaScript | JavaScript (dev) / Rollup (build) | JavaScript | Rust | Rust |
| 开发模式 | Bundle-based | ESM unbundled | 无内置 dev server | 无内置 dev server | Bundle-based |
| TS 转译 | ts-loader / babel | esbuild | @rollup/plugin-typescript | oxc (内置) | SWC (内置) |
| CSS Modules | css-loader options | 内置 | rollup-plugin-postcss | 内置 | 内置 css/module |
| Tree Shaking | production mode | Rollup 内置 | 原生 ESM | 原生 ESM | production mode |
| 代码分割 | SplitChunksPlugin | manualChunks | manualChunks | advancedChunks | SplitChunks |
| 配置复杂度 | 高 | 低 | 中 | 低 | 中（兼容 webpack） |
| 缓存策略 | filesystem cache | esbuild pre-bundle | 无 | 内置 | 内置 |
| 插件生态 | 最丰富 | 丰富（兼容 Rollup） | 丰富 | 兼容 Rollup | 兼容 webpack |
| 适用场景 | 大型应用 | 通用应用 | 库 | 库 / Vite 生产构建 | 大型应用 |
