# 前端构建工具全方位深度对比

> 对比工具：Webpack 5 / Vite / Rollup / Rolldown / Rspack / esbuild / Turbopack
> 更新时间：2026 年 6 月
> 数据来源：GitHub、npm、官方文档、本项目实测

---

## 一、基础信息

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **定位** | 通用应用打包器 | 下一代前端开发与构建工具 | ES 模块打包器（偏库） | Rollup 的 Rust 替代品 | Webpack 的 Rust 替代品 | 极速 JS/TS 打包与转译器 | Next.js 专用增量打包器 |
| **实现语言** | JavaScript | JavaScript（底层用 Rolldown/esbuild） | JavaScript（部分 Rust 用于解析） | Rust | Rust | Go | Rust |
| **首次发布** | 2012 | 2020 | 2015 | 2024 | 2023 | 2020 | 2022 |
| **当前版本** | 5.108.1 | 8.1.0 | 4.61.1 | 1.1.1 | 2.1.1 | 0.28.1 | 随 Next.js 16 发布 |
| **开源协议** | MIT | MIT | MIT | MIT | MIT | MIT | MIT |
| **GitHub Stars** | ~65.8K | ~81.7K | ~26.3K | ~13.8K | ~12.8K | ~40.0K | ~30.6K（含 Turborepo） |
| **npm 周下载量** | ~49.5M | ~141M | ~122M | ~67.9M（含 Vite 间接依赖） | ~5.9M | ~197.5M（被大量工具依赖） | 无独立包 |
| **核心团队** | Tobias Koppers + 社区 | 尤雨溪 + VoidZero 团队 | Lukas Taegert-Atkinson + 社区 | 尤雨溪 + VoidZero 团队 | 字节跳动 Web Infra 团队 | Evan Wallace（Figma 前 CTO） | Tobias Koppers + Vercel |
| **适用场景** | 大型应用、复杂工程 | 通用 Web 应用、库 | 库、npm 包、框架 | Vite 底层引擎、库 | 大型 Webpack 项目迁移 | 底层转译工具、简单打包 | Next.js 应用 |

### 关键洞察

Webpack 和 Rollup 是 JS 时代的开拓者，分别定义了"应用打包"和"库打包"两条路线。Rspack 和 Rolldown 分别是它们的 Rust 重写版，API 兼容但速度提升数十倍。Vite 站在中间做整合——开发用 ESM 原生加载，生产用 Rolldown（从 v8 开始）打包。esbuild 是底层基础设施，被 Vite、tsup、tsx 等大量工具依赖。Turbopack 目前与 Next.js 强绑定，无法独立使用。

---

## 二、架构设计

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **打包策略** | Bundle-based | 开发 Unbundled + 生产 Bundle | Bundle-based | Bundle-based | Bundle-based | Bundle-based | 增量 Bundle |
| **开发/生产架构是否统一** | ✅ 统一（都走打包） | ❌ 不统一（开发 ESM，生产 Rolldown） | ❌ 无内置 dev server | ❌ 无内置 dev server | ✅ 统一（都走打包） | ❌ 无内置 dev server | ✅ 统一（增量构建） |
| **模块解析方式** | 自实现 enhanced-resolve | 开发用浏览器原生 ESM，生产用 Rolldown 解析 | 自实现 @rollup/pluginutils | oxc 解析器（Rust） | Rust 实现的 enhanced-resolve 兼容 | Go 实现的自有解析器 | Rust 实现的增量解析 |
| **ESM 支持** | ✅ 输入输出均支持 | ✅ 原生 ESM 驱动 | ✅ ESM 优先 | ✅ 原生 ESM | ✅ 同 Webpack | ✅ ESM 优先 | ✅ ESM 支持 |
| **CJS 支持** | ✅ 原生支持 | ✅ 通过预构建转换 | ⚠️ 需要 @rollup/plugin-commonjs | ✅ 原生支持 | ✅ 原生支持 | ✅ 原生支持 | ✅ 原生支持 |
| **输出格式** | ESM / CJS / UMD / AMD / SystemJS | ESM / CJS / UMD（通过 Rolldown） | ESM / CJS / UMD / IIFE / AMD / SystemJS | ESM / CJS / IIFE | ESM / CJS / UMD（同 Webpack） | ESM / CJS / IIFE | ESM（Next.js 内部） |
| **HMR 实现** | 自有 HMR 运行时 + WebSocket | 原生 ESM HMR（精确到模块级别） | 无内置 | 无内置 | 兼容 Webpack HMR 协议 | 无内置 | Turbo HMR（增量） |
| **缓存机制** | filesystem cache（持久化） | esbuild 预构建缓存 | 无内置缓存 | 内置增量缓存 | 内置持久化缓存 | 无内置缓存 | 增量计算引擎（函数级别缓存） |
| **并行能力** | 有限（JS 单线程，TerserPlugin 可多线程压缩） | esbuild 多线程转译 | 单线程 | Rust 原生多线程 | Rust 原生多线程 | Go 原生多线程 | Rust 原生多线程 |

### 关键洞察

Vite 的"开发 Unbundled + 生产 Bundle"双架构设计是一把双刃剑：开发体验极好（毫秒级启动），但开发和生产行为不完全一致可能导致"开发没问题、上线才暴露"的情况。Webpack/Rspack 的统一架构虽然开发启动慢一些，但开发和生产的行为一致性更强。Turbopack 的增量计算引擎是最激进的设计——只重新构建真正变化的部分，理论上 HMR 速度不随项目规模增长。

---

## 三、配置与开发体验

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **零配置能力** | ❌ 几乎必须手写配置 | ✅ 大部分场景零配置 | ❌ 需要配置插件链 | ⚠️ 基础场景可零配置 | ⚠️ 兼容 Webpack 配置 | ✅ CLI 直接使用 | ✅ Next.js 内置 |
| **配置文件格式** | JS / TS（需 ts-node） | JS / TS（原生支持） | JS / TS（需 --configPlugin） | JS / MJS | JS / TS（需 ts-node） | JS (API) / CLI flags | next.config.js |
| **TypeScript 配置支持** | 需要 ts-node / esbuild-register | 内置支持 | 需要 @rollup/plugin-typescript 加载配置 | 原生支持 .ts（实验性） | 需要 ts-node | API 调用（原生 TS） | 内置 |
| **类型提示** | ✅ `Configuration` 类型 | ✅ `defineConfig` 辅助 | ✅ `defineConfig` 辅助 | ✅ `defineConfig` 辅助 | ✅ `Configuration` 类型 | ✅ `BuildOptions` 类型 | ✅ Next.js 类型 |
| **学习曲线** | 🔴 陡峭（概念多、配置复杂） | 🟢 平缓（约定优于配置） | 🟡 中等（插件系统需理解） | 🟢 平缓（兼容 Rollup） | 🟡 中等（熟悉 Webpack 则简单） | 🟢 平缓（API 简洁） | 🟢 平缓（Next.js 接管） |
| **CLI 工具** | webpack-cli（独立包） | 内置 CLI | 内置 CLI | 内置 CLI | @rspack/cli | 内置 CLI | next CLI 集成 |
| **错误信息可读性** | 🟡 中等（stack trace 较长） | 🟢 好（彩色高亮、精确定位） | 🟡 中等 | 🟢 好（Rust 风格精确报错） | 🟢 好（Rust 风格精确报错） | 🟢 好（简洁直接） | 🟢 好（Next.js 封装） |
| **dev server** | webpack-dev-server（独立包） | 内置（基于 Connect） | 无（需要 rollup-plugin-serve） | 无（通过 Vite 使用） | @rspack/dev-server | 内置 serve 模式 | 内置（Next.js dev） |

### 关键洞察

Webpack 的配置复杂度是它最大的痛点——一个标准的 React 项目需要配置 ts-loader、css-loader、style-loader、MiniCssExtractPlugin、HtmlWebpackPlugin、TerserPlugin 等一整套工具链。同样的事情在 Vite 里只需要一个 `@vitejs/plugin-react`。但 Webpack 的灵活性也是无可替代的：当你需要定制非标准的构建流程时（比如 Module Federation、自定义资源处理流水线），Webpack 的可配置性远超其他工具。

---

## 四、核心能力对比

### 4.1 TypeScript 处理

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **转译器** | ts-loader / babel-loader / swc-loader | esbuild（开发） / Rolldown oxc（生产） | @rollup/plugin-typescript (tsc) | oxc（内置） | SWC（内置 builtin:swc-loader） | esbuild（内置） | SWC（内置） |
| **类型检查** | ts-loader 可选开启（影响速度） | ❌ 不做（需单独 tsc / vue-tsc） | ✅ 默认做（可关闭） | ❌ 不做 | ❌ 不做 | ❌ 不做 | ❌ 不做 |
| **Decorator 支持** | ✅（取决于 loader） | ✅ esbuild 支持提案版本 | ✅（取决于 TS 版本） | ✅ oxc 支持 | ✅ SWC 支持 | ⚠️ 仅支持 TC39 提案 | ✅ SWC 支持 |
| **const enum 支持** | ✅（ts-loader） | ❌（esbuild 限制） | ✅（tsc） | ❌ | ❌ | ❌ | ❌ |
| **Path Alias（paths）** | ✅ resolve.alias | ✅ resolve.alias | ✅ @rollup/plugin-alias | ✅ resolve.alias | ✅ resolve.alias | ✅ alias | ✅ tsconfig paths |
| **转译速度** | 🔴 慢（ts-loader + tsc） | 🟢 快（esbuild） | 🔴 慢（tsc） | 🟢 极快（oxc） | 🟢 快（SWC） | 🟢 极快（Go 原生） | 🟢 快（SWC） |

### 4.2 CSS 处理

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **CSS Modules** | css-loader options | ✅ 内置 | rollup-plugin-postcss | 需插件 | css-loader / 内置 css/module（v2） | ⚠️ 有限支持 | ✅ 内置 |
| **PostCSS** | postcss-loader | ✅ 内置（自动读取 postcss.config） | rollup-plugin-postcss | 需插件 | postcss-loader | ❌ 不支持 | ✅ 内置 |
| **Sass/Less/Stylus** | 对应 loader | ✅ 内置（安装预处理器即可） | rollup-plugin-postcss | 需插件 | 对应 loader | ❌ 不支持 | ✅ 内置 |
| **CSS 提取** | MiniCssExtractPlugin | ✅ 生产自动提取 | 插件配置 extract: true | 需配置 | CssExtractRspackPlugin | ❌ | ✅ 自动 |
| **CSS 压缩** | css-minimizer-webpack-plugin | ✅ 内置（esbuild / lightningcss） | 需额外配置 | 内置 | 内置 Lightning CSS | ✅ 内置 | ✅ 内置 |
| **Tailwind CSS** | postcss-loader 配合 | ✅ 开箱即用 | 需 PostCSS 插件链 | 需配置 | postcss-loader 配合 | ❌ | ✅ 内置 |

### 4.3 静态资源与代码分割

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **图片/字体处理** | asset/resource, asset/inline | ✅ 内置（小文件自动 base64） | @rollup/plugin-url | 需插件 | 同 Webpack asset modules | ✅ loader 配置 | ✅ 内置 |
| **SVG 组件化** | @svgr/webpack | vite-plugin-svgr | rollup-plugin-svgr | 需插件 | @svgr/webpack | 不支持 | @svgr/webpack |
| **JSON 导入** | ✅ 内置 | ✅ 内置（支持 named export） | ✅ @rollup/plugin-json | ✅ 内置 | ✅ 内置 | ✅ 内置 | ✅ 内置 |
| **Web Worker** | worker-loader / new Worker() | ✅ 内置 `?worker` 后缀 | 需插件 | 需插件 | new Worker()（同 Webpack） | 不支持 | ✅ 内置 |
| **WASM** | ✅ asyncWebAssembly 实验性 | ✅ `?init` 后缀 | @rollup/plugin-wasm | 支持 | ✅ 同 Webpack | 不支持 | ✅ 支持 |
| **Code Splitting 方式** | SplitChunksPlugin（自动） + import() | output.manualChunks + import() | output.manualChunks + import() | advancedChunks + import() | SplitChunks（同 Webpack） | splitting: true（有限） | 自动（增量） |
| **Code Splitting 灵活度** | 🟢 最灵活（cacheGroups 精细控制） | 🟡 中等（manualChunks 手动分包） | 🟡 中等 | 🟡 中等（advancedChunks） | 🟢 最灵活（同 Webpack） | 🔴 有限 | 🟡 自动化（不可手动） |
| **Tree Shaking** | ✅ production mode 启用 | ✅ Rolldown 内置 | ✅ 原生 ESM 静态分析（最强） | ✅ 原生 ESM | ✅ production mode | ✅ 内置 | ✅ 内置 |
| **环境变量注入** | DefinePlugin / EnvironmentPlugin | ✅ import.meta.env.* | @rollup/plugin-replace | define 配置 | DefinePlugin（同 Webpack） | define 配置 | ✅ process.env / NEXT_PUBLIC_ |
| **HTML 处理** | HtmlWebpackPlugin | ✅ 内置（index.html 为入口） | 需插件 | 需插件 | HtmlRspackPlugin | 不支持 | ✅ 内置（Next.js 接管） |
| **Source Map** | devtool 选项（10+ 种变体） | ✅ 内置（build.sourcemap） | ✅ output.sourcemap | ✅ output.sourcemap | devtool（同 Webpack） | ✅ sourcemap: true | ✅ 内置 |

### 关键洞察

现代构建工具已经彻底放弃 tsc 做构建转译。ts-loader 调用 tsc 做完整编译（含类型检查）是最慢的方案；esbuild / SWC / oxc 只做语法转换不做类型检查，速度快几十倍。最佳实践是：构建时用快速转译器，类型检查放在 IDE 实时检查 + CI 流水线的 `tsc --noEmit` 中。

CSS 处理是 Webpack 配置复杂度的重灾区。同一个"导入 CSS"的需求，Webpack 需要 style-loader + css-loader + postcss-loader + MiniCssExtractPlugin 四层配置；Vite 零配置开箱即用。这也是为什么新项目越来越倾向于选择 Vite。

---

## 五、构建性能（基于本项目 1000 模块实测数据）

### 测试环境

- 机器：Apple Silicon Mac
- Node：v20.18.0
- 源代码：1000 个生成的 React 组件 + 核心模块（共 4600+ 模块含依赖）
- 第三方依赖：React、antd、echarts、lodash-es、dayjs、zustand 等
- 每个工具运行 3 次取中位数

### 构建速度对比

| 工具 | 冷启动构建 | 热启动构建 | 速度排名 | 相对最快（Rolldown）的倍数 |
|------|-----------|-----------|---------|-------------------------|
| **Rolldown** | **635 ms** | 647 ms | 🥇 1st | 1× |
| **Rspack** | 2.36 s | 2.36 s | 🥈 2nd | 3.7× |
| **Vite** | 5.39 s | 5.31 s | 🥉 3rd | 8.5× |
| **Webpack 5** | 13.18 s | 13.35 s | 4th | 20.8× |
| **Rollup** | 25.01 s | 23.82 s | 5th | 39.4× |
| **esbuild** | 未在本项目测试 | — | — | 预期接近 Rolldown |
| **Turbopack** | 未在本项目测试 | — | — | 仅 Next.js 环境 |

### 产物体积对比

| 工具 | 产物总大小 | Gzip 大小 | 分包数 | Tree Shaking |
|------|----------|----------|-------|-------------|
| **Rspack** | 12.62 MB | **570.2 KB** | 3 | ✅ PASS |
| **Webpack 5** | 2.45 MB | 577.4 KB | 3 | ✅ PASS |
| **Vite** | 2.46 MB | 632.6 KB | 6 | ✅ PASS |
| **Rolldown** | 23.90 MB | 1.61 MB | 6 | ✅ PASS |
| **Rollup** | 33.09 MB | 2.04 MB | 14 | ✅ PASS |

### 关键洞察

速度方面，Rust/Go 实现的工具（Rolldown、Rspack）与 JS 实现的工具（Webpack、Rollup）之间存在数量级的差距。Rolldown 比 Rollup 快 40 倍，这不是优化能弥补的——是底层语言的性能天花板决定的。

体积方面需要注意：Rspack 产物原始大小 12.62 MB 看着很大，但 Gzip 后只有 570 KB（最小），这说明它的压缩效率最高（SWC 压缩器）。Rollup/Rolldown 产物偏大主要因为 sourcemap 文件被计入了总大小。实际用户感知的体积应该看 Gzip 后的数值。

Webpack 的热启动（有缓存）和冷启动几乎没有速度差异（13.18s vs 13.35s），说明在这个规模下 filesystem cache 的收益不明显。Rspack 的冷热启动完全一致（2.36s），因为 Rust 本身就够快，缓存带来的边际收益很小。

---

## 六、产物质量

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **压缩方案** | TerserPlugin（JS 实现，最慢但压缩率最高） | esbuild（快但压缩率略低） / Rolldown | terser / @rollup/plugin-terser | 内置 oxc 压缩 | SwcJsMinimizerRspackPlugin（Rust） | esbuild 内置（Go） | SWC（Rust） |
| **压缩率** | 🟢 最高 | 🟡 中等 | 🟢 高（terser） | 🟡 中等 | 🟢 高 | 🟡 中等 | 🟢 高 |
| **Scope Hoisting** | ✅ ModuleConcatenationPlugin | ✅ Rolldown 内置 | ✅ 原生支持（Rollup 发明） | ✅ 内置 | ✅ 内置 | ⚠️ 有限 | ✅ 内置 |
| **产物可读性** | 🟡 中等（大量运行时代码） | 🟢 好 | 🟢 最好（最干净的 ESM 输出） | 🟢 好 | 🟡 中等（同 Webpack） | 🟡 中等 | 🟡 中等 |
| **Polyfill 方案** | babel-loader + core-js / browserslist | @vitejs/plugin-legacy | @rollup/plugin-babel | 需插件 | 同 Webpack（babel/SWC） | 不支持 | Next.js 内置 |
| **browserslist 支持** | ✅ 读取 .browserslistrc | ✅ build.target 或 browserslist | 需 @rollup/plugin-babel | 需配置 | ✅ 支持 | ✅ target 选项 | ✅ Next.js 内置 |
| **产物运行时** | 有较重的 Webpack runtime | 无额外 runtime | 极少 runtime | 少量 runtime | 有 runtime（同 Webpack） | 无额外 runtime | 有 runtime |

### 关键洞察

Rollup 的产物可读性是所有工具中最好的——输出的代码最接近手写的 ESM 模块，几乎没有注入额外的运行时代码。这是它作为库打包工具的核心优势：最终用户拿到的代码是干净的。Webpack/Rspack 会在产物中注入自己的模块加载运行时（`__webpack_require__`），体积更大但兼容性更强。

压缩器的选择体现了速度和压缩率的权衡：Terser 压缩率最高但最慢（JS 实现），esbuild 最快但压缩率略低（Go 实现），SWC 是折中方案（Rust 实现，接近 Terser 的压缩率但快得多）。

---

## 七、插件与生态

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **插件架构** | Tapable 钩子系统（最复杂） | Rollup 插件 API + Vite 专用钩子 | 标准插件 hooks（transform、resolveId 等） | 兼容 Rollup 插件 API | 兼容 Webpack 插件 API | 简洁的 plugin API | 私有 API（无公开插件系统） |
| **插件生态丰富度** | 🟢 最丰富（数万个 loader/plugin） | 🟢 丰富（兼容 Rollup 生态 + Vite 插件） | 🟢 丰富（大量社区插件） | 🟡 兼容 Rollup 插件（部分不兼容） | 🟡 兼容 Webpack 大部分 loader/plugin | 🟡 有限（插件 API 较简单） | 🔴 封闭（无公开插件系统） |
| **插件 API 稳定性** | 🟢 成熟稳定 | 🟢 稳定 | 🟢 成熟稳定 | 🟡 仍在演进 | 🟡 快速迭代中 | 🟢 稳定（但功能有限） | ❌ 无公开 API |
| **Loader 机制** | ✅ Loader chain（多 loader 串联） | ❌ 无 loader 概念 | ❌ 无 loader 概念 | ❌ 无 loader 概念 | ✅ 兼容 Webpack loader | ❌ 无 loader 概念 | ❌ 无公开 loader |
| **常用插件数量** | 10000+ | 1000+ | 500+ | 兼容 Rollup 生态 | 兼容 Webpack 生态 | 100+ | Next.js 内置 |
| **自定义插件开发难度** | 🔴 高（Tapable 概念复杂） | 🟡 中等 | 🟢 低（hooks 清晰） | 🟢 低（同 Rollup） | 🔴 高（同 Webpack） | 🟢 低 | ❌ 不支持 |

### 生态兼容关系图

```
Webpack 生态 ──兼容──▶ Rspack
                         （大部分 webpack loader/plugin 可直接使用）

Rollup 插件生态 ──兼容──▶ Vite
                    └──部分兼容──▶ Rolldown
                         （部分老插件的 API 调用方式不完全兼容）

esbuild ──被依赖──▶ Vite（开发模式转译 + 预构建）
                └──被依赖──▶ tsup, tsx, vitest 等工具
```

### 关键洞察

Webpack 的 Tapable 钩子系统是最强大但也最复杂的插件架构——它暴露了编译过程的几乎每个阶段（从模块解析到代码生成），开发者可以在任意时机介入。这赋予了 Webpack 极大的灵活性（Module Federation、DLL Plugin 等高级特性都基于此），但也让插件开发门槛很高。Rollup 的插件 API 则更加直观——核心就是 `resolveId`（怎么找模块）、`load`（怎么读模块）、`transform`（怎么转换模块）三个 hook，大部分人 10 分钟就能理解。

Turbopack 没有公开的插件系统是它最大的生态短板——你只能在 Next.js 的框架约束内使用它。

---

## 八、工程化集成

| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack | esbuild | Turbopack |
|------|-----------|------|--------|----------|--------|---------|-----------|
| **Monorepo 支持** | ✅ 需手动配置 resolve | ✅ 良好（配合 pnpm workspaces） | ✅ 需手动配置 | ✅ 支持 | ✅ 同 Webpack | ✅ 需手动配置 | ✅ Turborepo 原生集成 |
| **SSR 支持** | ✅ 需手动配置 target: 'node' | ✅ 内置 SSR 模式（vite.ssrBuild） | ⚠️ 需手动配置输出格式 | ⚠️ 需手动配置 | ✅ 同 Webpack | ⚠️ 需手动配置 platform: 'node' | ✅ Next.js 原生 SSR |
| **Library Mode** | ✅ output.library 配置 | ✅ build.lib 模式 | 🟢 最佳选择 | ✅ 支持 | ✅ 同 Webpack | ✅ 支持 | ❌ 不支持 |
| **Module Federation** | ✅ 原生支持（v5 新增） | ⚠️ 需插件（@originjs/vite-plugin-federation） | ❌ 不支持 | ❌ 不支持 | ✅ 原生支持 | ❌ 不支持 | ❌ 不支持 |
| **微前端集成** | 🟢 最成熟（qiankun、Module Federation） | 🟡 可用（需社区方案） | ❌ 不适合 | ❌ 不适合 | 🟢 良好（兼容 Webpack 方案） | ❌ 不适合 | ❌ 仅 Next.js |
| **React 集成** | babel-loader / ts-loader | @vitejs/plugin-react | @rollup/plugin-babel | 内置 JSX 支持 | builtin:swc-loader | 内置 JSX | Next.js 原生 |
| **Vue 集成** | vue-loader | @vitejs/plugin-vue（最佳） | rollup-plugin-vue | 需插件 | vue-loader | 不支持 .vue | 不支持 |
| **Svelte 集成** | svelte-loader | @sveltejs/vite-plugin-svelte | rollup-plugin-svelte | 需插件 | 需社区支持 | 不支持 | 不支持 |
| **CI/CD 友好度** | 🟢 成熟 | 🟢 良好 | 🟢 良好 | 🟡 较新 | 🟢 良好 | 🟢 良好 | 🟡 依赖 Next.js |
| **测试框架集成** | Jest（需配置 transform） | Vitest（原生集成，共享配置） | — | — | Jest / Vitest | — | Next.js testing |

### 关键洞察

如果你在做微前端或者 Module Federation，Webpack 5 和 Rspack 是目前唯一成熟的选择。Vite 的 Vue 集成是最好的（毕竟同一个团队），React 集成各工具差距不大。

Library Mode（打包 npm 库）方面，Rollup 仍然是业界标准——React、Vue、Svelte 这些框架自身的构建都用 Rollup。Vite 的 `build.lib` 底层也是调用 Rolldown/Rollup。

Turbopack 的生态集成最窄：只支持 React（通过 Next.js），不支持 Vue、Svelte，不支持 Library Mode，不支持 Module Federation。它是一个强绑定 Next.js 的工具。

---

## 九、迁移成本与未来趋势

### 工具传承关系

```
2012 ──────── Webpack ──────────────────────────────────────────────────────▶
                  │                     2020                    2023
                  │                       │                       │
                  │                  Webpack 5 ─── API 兼容 ──▶ Rspack
                  │               (持久化缓存     (Rust 重写)
                  │                Module Fed)
                  │
                  └── Webpack 作者 ──────────────────────── 2022 ──▶ Turbopack
                     Tobias Koppers                           (Rust 全新设计)

2015 ──────── Rollup ──────────────────────────────────────────────────────▶
                  │                     2020          2024
                  │                       │             │
                  │                    Vite ◀── 底层 ── Rolldown
                  │              (dev: ESM + esbuild    (Rust 重写)
                  │               prod: Rollup→Rolldown)
                  │
2020 ──────── esbuild ──── 被 Vite 依赖 ──────────────────────────────────▶
                 (Go 实现，定义了"极速构建"的标杆)
```

### 从 Webpack 迁移的难度

| 迁移到 | 难度 | 说明 |
|--------|------|------|
| **Rspack** | 🟢 低 | API 几乎 100% 兼容，大部分项目改包名即可。是 Webpack 项目提速的最低成本方案。 |
| **Vite** | 🟡 中 | 配置需要完全重写，loader → plugin 概念转换。但源代码基本不需要改。 |
| **Rollup** | 🔴 高 | 需要重新设计整个构建流程，处理 HTML、dev server 等应用级需求。不推荐应用项目迁移。 |
| **Rolldown** | 🟡 中 | 兼容 Rollup 配置。但目前仍处于早期阶段，直接用不如通过 Vite 间接使用。 |
| **esbuild** | 🔴 高 | 功能覆盖面窄，缺少 CSS Modules、HTML 处理等，不适合直接替代 Webpack。 |
| **Turbopack** | 🔴 高 | 必须迁移到 Next.js 框架。不是纯构建工具的替换，而是整个技术栈的迁移。 |

### 未来发展趋势

| 工具 | 趋势方向 | 前景判断 |
|------|---------|---------|
| **Webpack 5** | 维护模式，不再有大的特性更新。社区逐步向 Rspack/Vite 迁移。 | 存量项目会长期存在，但新项目选型越来越少。 |
| **Vite** | v8 底层切换到 Rolldown，开发和生产架构将逐步统一。生态持续扩大。 | 🟢 目前最有前景的通用构建工具，社区势头最强。 |
| **Rollup** | 继续作为库打包的标准工具。但下载量中大量是被 Vite 间接依赖。 | 稳定但不会再有爆发式增长，逐步被 Rolldown 替代。 |
| **Rolldown** | 作为 Vite 的生产构建引擎已进入稳定阶段。独立使用场景在扩展。 | 🟢 前景好，但主要通过 Vite 间接使用，独立用户有限。 |
| **Rspack** | 字节跳动内部大规模使用，持续完善 Webpack 兼容性。 | 🟢 Webpack 存量项目的最佳迁移方案，有明确的用户群。 |
| **esbuild** | 作者 Evan Wallace 已离开 Figma，项目更新节奏放缓。版本号仍为 0.x。 | 🟡 作为底层工具仍被广泛依赖，但上层工具（Vite、Rolldown）在逐步减少对它的依赖。 |
| **Turbopack** | 继续深度绑定 Next.js，短期内不会成为独立工具。 | 🟡 Next.js 用户会受益，但不会成为通用构建工具。 |

### 新项目如何选型

| 场景 | 推荐 | 理由 |
|------|------|------|
| 通用 Web 应用（React/Vue/Svelte） | **Vite** | 开发体验最好，生态丰富，社区最活跃 |
| 大型 Webpack 存量项目提速 | **Rspack** | API 兼容，迁移成本最低，立竿见影 |
| 打包 npm 库 / 框架 | **Rollup**（或 Vite lib mode） | 产物最干净，Tree Shaking 最强 |
| Next.js 应用 | **Turbopack** | Next.js 原生集成，开箱即用 |
| 需要极致构建速度的 CI/CD | **esbuild**（简单场景） / **Rolldown**（复杂场景） | 速度优先 |
| 新项目且不确定 | **Vite** | 社区趋势、生态、性能的最佳平衡点 |
