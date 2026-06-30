# 前端构建工具对比实验室

> 用同一套源代码，对比 Webpack 5 / Vite / Rollup / Rolldown / Rspack 五种主流构建工具在配置方式、功能支持和构建性能上的差异。

## 学习文档

- [**全方位深度对比表格**](docs/full-comparison.md) — 九大维度（基础信息、架构设计、配置体验、核心能力、构建性能、产物质量、插件生态、工程化集成、迁移与趋势）对比 7 种构建工具（含 esbuild、Turbopack）
- [**性能测试报告**](docs/benchmark-report.md) — 基于本项目 1000 模块的实测数据

## 项目结构

```
pack-test/
├── src/
│   ├── index.tsx                     # React 入口
│   ├── App.tsx                       # 主应用（路由 + 懒加载 + 1000 模块渲染）
│   ├── core/                         # 手写核心模块（功能对比用）
│   │   ├── components/
│   │   │   ├── Header/               # antd Button + zustand 状态管理
│   │   │   ├── Dashboard/            # echarts 图表 + lodash-es + dayjs
│   │   │   └── LazyPage/             # React.lazy 代码分割测试
│   │   ├── hooks/                    # 自定义 hooks
│   │   ├── utils/                    # 工具函数（含 unused.ts 测 tree shaking）
│   │   ├── store/                    # zustand 状态管理
│   │   └── styles/                   # 全局样式
│   ├── generated/                    # 脚本批量生成的 1000 个模块
│   │   ├── modules/                  # GenModule0000~9999.tsx + .module.css
│   │   └── index.tsx                 # 统一导出
│   └── assets/                       # 静态资源（logo.svg）
│
├── configs/                          # 五套构建工具配置
│   ├── webpack/webpack.config.ts     # Webpack 5
│   ├── vite/vite.config.ts           # Vite
│   ├── rollup/rollup.config.ts       # Rollup
│   ├── rolldown/rolldown.config.mjs  # Rolldown
│   └── rspack/rspack.config.ts       # Rspack
│
├── scripts/
│   ├── generate.ts                   # 批量生成 1000 个模块的脚本
│   └── bench.ts                      # 性能测试脚本
│
├── docs/                             # 生成的对比报告
└── package.json
```

## 快速开始

```bash
# 1. 安装依赖（需要 Node 18+）
npm install

# 2. 生成 1000 个测试模块（已预先生成，可跳过）
npx tsx scripts/generate.ts

# 3. 单独运行某个构建工具
npm run build:webpack     # Webpack 5
npm run build:vite        # Vite
npm run build:rollup      # Rollup
npm run build:rolldown    # Rolldown
npm run build:rspack      # Rspack

# 4. 运行性能对比测试（5 个工具各跑 3 次取中位数）
npm run bench
```

## 测试场景覆盖

这套源代码专门设计来覆盖构建工具的核心能力差异：

| 场景 | 实现方式 | 测试目的 |
|------|---------|---------|
| TypeScript + TSX | 所有组件使用 TSX | TS 转译方式差异（tsc / esbuild / SWC / oxc） |
| CSS Modules | `.module.css` 文件 | 样式处理能力差异 |
| 静态资源导入 | `import logo from './logo.svg'` | 资源处理方式差异 |
| Tree Shaking | `unused.ts` 导出但未被引用 | 死代码消除能力 |
| Code Splitting | `React.lazy()` 动态导入 | 分包策略差异 |
| 第三方依赖 | antd / echarts / lodash-es / dayjs | node_modules 处理和预构建 |
| 大规模模块 | 1000 个生成模块（2000 个文件） | 构建性能压力测试 |
| 状态管理 | zustand | ESM 依赖解析 |
| 环境变量 | `process.env.NODE_ENV` | 变量注入方式 |

## 五种构建工具对比

### Webpack 5

最成熟的构建工具，配置量大但灵活度最高。需要手动配置每个 loader（ts-loader、css-loader、style-loader 等），插件生态最丰富。底层用 JavaScript 实现，构建速度在大项目中较慢。SplitChunksPlugin 处理代码分割，TerserPlugin 做压缩。

**配置文件：** `configs/webpack/webpack.config.ts`

**关键配置点：**
- `ts-loader` + `transpileOnly: true` 处理 TSX（跳过类型检查提升速度）
- `css-loader` + `modules` 选项处理 CSS Modules
- `MiniCssExtractPlugin` 生产环境提取 CSS
- `SplitChunksPlugin` 代码分割
- `asset/resource` 处理静态资源
- `HtmlWebpackPlugin` 生成 HTML

### Vite

极简配置，大部分能力开箱即用。开发模式基于 ESM 无需打包（unbundled），冷启动极快。生产构建底层使用 Rollup。依赖预构建用 esbuild。CSS Modules 内置支持。

**配置文件：** `configs/vite/vite.config.ts`

**关键配置点：**
- `@vitejs/plugin-react` 处理 React JSX
- `css.modules` CSS Modules 配置
- `build.rollupOptions.output.manualChunks` 代码分割
- `optimizeDeps.include` 依赖预构建
- 开箱即用的 TSX / CSS Modules / 静态资源处理

### Rollup

定位是「库构建工具」，但也能构建应用。ESM Tree Shaking 的先驱，Tree Shaking 能力强。基于插件的模块处理。不内置开发服务器和 HTML 处理，需要额外插件。

**配置文件：** `configs/rollup/rollup.config.ts`

**关键配置点：**
- `@rollup/plugin-typescript` 处理 TypeScript
- `@rollup/plugin-node-resolve` 解析 node_modules
- `@rollup/plugin-commonjs` CommonJS 转 ESM
- `rollup-plugin-postcss` 处理 CSS Modules
- `@rollup/plugin-url` 处理静态资源
- `output.manualChunks` 代码分割
- `treeshake.moduleSideEffects` Tree Shaking 配置

### Rolldown

Vite 团队开发的下一代 Rust 构建工具，旨在替代 Rollup 成为 Vite 的生产构建引擎。兼容 Rollup 插件 API，但底层用 Rust 实现。内置 oxc 转换器（Rust 实现的 TS/JSX 解析器），原生支持 Tree Shaking 和代码分割。目前仍处于快速发展阶段。

**配置文件：** `configs/rolldown/rolldown.config.mjs`

**关键配置点：**
- 内置 oxc 转换器，无需 TS 插件
- `advancedChunks` 代码分割
- 自定义 CSS Modules 插件（Rollup 插件兼容）
- `define` 环境变量注入
- `treeshake` Tree Shaking

### Rspack

Rust 实现的 Webpack 兼容构建工具。API 与 Webpack 几乎一致，迁移成本低。内置 SWC 替代 babel/ts-loader，构建速度快。CSS 处理兼容 webpack loader 生态。

**配置文件：** `configs/rspack/rspack.config.ts`

**关键配置点：**
- `builtin:swc-loader` 处理 TSX（比 ts-loader 快很多）
- `css-loader` + `CssExtractRspackPlugin` 处理 CSS Modules
- `SplitChunks` 代码分割（与 webpack 一致）
- `SwcJsMinimizerRspackPlugin` SWC 压缩
- 配置方式与 Webpack 几乎一致

## 性能测试维度

| 维度 | 说明 |
|------|------|
| 冷启动构建时间 | 清除缓存后首次 build 耗时 |
| 热启动构建时间 | 有缓存时的 build 耗时 |
| 产物总大小 | 构建产物总体积 |
| Gzip 大小 | JS/CSS 文件 gzip 后体积 |
| 分包数量 | 自动分包的 chunk 数量 |
| Tree Shaking | unused 模块是否被正确移除 |

## 架构原理对比

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack |
|------|-----------|------|--------|----------|--------|
| 底层语言 | JavaScript | JS (dev) + Rollup (build) | JavaScript | Rust | Rust |
| 开发模式 | Bundle-based | ESM unbundled | 无内置 dev server | 无内置 dev server | Bundle-based |
| TS 转译 | ts-loader / babel | esbuild | @rollup/plugin-typescript | oxc (内置) | SWC (内置) |
| CSS Modules | css-loader options | 内置 | rollup-plugin-postcss | 自定义插件 | css-loader |
| Tree Shaking | production mode | Rollup 内置 | 原生 ESM | 原生 ESM | production mode |
| 代码分割 | SplitChunksPlugin | manualChunks | manualChunks | advancedChunks | SplitChunks |
| 配置复杂度 | 高 | 低 | 中 | 低 | 中（兼容 webpack） |
| 缓存策略 | filesystem cache | esbuild pre-bundle | 无 | 内置 | 内置 |
| 插件生态 | 最丰富 | 丰富（兼容 Rollup） | 丰富 | 兼容 Rollup | 兼容 webpack |
| 适用场景 | 大型应用 | 通用应用 | 库 | 库 / Vite 生产构建 | 大型应用 |

## 各工具定位总结

**Webpack 5** — 生态最成熟、灵活度最高，适合需要精细控制构建流程的大型应用。配置量大是主要缺点，构建速度在大型项目中较慢。

**Vite** — 开发体验最好的通用应用构建工具。开发模式基于 ESM 无需打包，冷启动极快。生产构建用 Rollup，质量有保障。配置量少，开箱即用。

**Rollup** — 库构建的首选工具。ESM Tree Shaking 能力最强，产物干净。但不适合构建完整应用（缺少 HTML 处理、开发服务器等）。

**Rolldown** — Rollup 的 Rust 替代品，兼容 Rollup 插件 API。构建速度极快（Rust 实现），未来将成为 Vite 的生产构建引擎。目前仍处于早期阶段。

**Rspack** — Webpack 的 Rust 替代品，API 几乎一致。适合从 Webpack 迁移的大型项目，无需大量改配置即可获得数倍构建速度提升。
