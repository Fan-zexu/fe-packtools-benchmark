/**
 * 性能测试脚本
 *
 * 对 5 种构建工具进行统一的性能基准测试：
 * 1. 冷启动构建时间（清除缓存后首次 build）
 * 2. 热启动构建时间（有缓存时的 build）
 * 3. 产物总大小（gzip 前/后）
 * 4. 分包数量
 * 5. Tree Shaking 效果（检查 unused 模块是否被移除）
 *
 * 测试方式：多次运行取中位数，减少误差
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, readdirSync, statSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { gzipSync } from 'zlib';

const PROJECT_ROOT = resolve(__dirname, '..');
const RUNS = 3; // 每个工具运行 3 次取中位数

interface BenchResult {
  tool: string;
  coldBuildTime: number; // 冷启动构建时间（秒）
  warmBuildTime: number; // 热启动构建时间（秒）
  totalSize: number; // 产物总大小（字节）
  gzipSize: number; // gzip 后大小（字节）
  chunkCount: number; // 分包数量
  treeShakingPassed: boolean; // unused 模块是否被正确移除
  error?: string; // 如果构建失败，记录错误
}

const tools = [
  { name: 'webpack5', cmd: 'npx webpack --config configs/webpack/webpack.config.ts', dist: 'dist-webpack', env: { TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}' } },
  { name: 'vite', cmd: 'npx vite build --config configs/vite/vite.config.ts', dist: 'dist-vite', env: {} },
  { name: 'rollup', cmd: 'npx rollup -c configs/rollup/rollup.config.ts --configPlugin typescript', dist: 'dist-rollup', env: {} },
  { name: 'rspack', cmd: 'npx rspack build --config configs/rspack/rspack.config.ts', dist: 'dist-rspack', env: {} },
];

// Rolldown 单独处理（可能不可用）
const rolldownConfig = {
  name: 'rolldown',
  cmd: 'npx rolldown -c configs/rolldown/rolldown.config.mjs',
  dist: 'dist-rolldown',
  env: {},
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  return `${seconds.toFixed(2)} s`;
}

// 计算目录总大小
function getDirSize(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let totalSize = 0;
  const files = readdirSync(dirPath);
  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      totalSize += getDirSize(filePath);
    } else {
      totalSize += stat.size;
    }
  }
  return totalSize;
}

// 计算所有 JS/CSS 文件的 gzip 大小
function getGzipSize(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let totalGzip = 0;
  const files = readdirSync(dirPath);
  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      totalGzip += getGzipSize(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.css')) {
      const content = readFileSync(filePath);
      totalGzip += gzipSync(content).length;
    }
  }
  return totalGzip;
}

// 统计 chunk 数量（递归搜索子目录）
function countChunks(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  let count = 0;
  const files = readdirSync(dirPath);
  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      count += countChunks(filePath);
    } else if (file.endsWith('.js')) {
      count++;
    }
  }
  return count;
}

// 检查 Tree Shaking 效果（递归搜索子目录）
function checkTreeShaking(dirPath: string): boolean {
  if (!existsSync(dirPath)) return false;
  const files = readdirSync(dirPath);
  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!checkTreeShaking(filePath)) return false;
    } else if (file.endsWith('.js')) {
      const content = readFileSync(filePath, 'utf-8');
      // 如果产物中包含 unusedLargeArray 或 unusedExpensiveFunction，说明 tree shaking 没生效
      if (content.includes('unusedLargeArray') || content.includes('unusedExpensiveFunction')) {
        return false;
      }
    }
  }
  return true;
}

// 运行构建命令并计时
function runBuild(cmd: string, env?: Record<string, string>): { time: number; success: boolean; stderr: string } {
  const start = performance.now();
  try {
    const result = spawnSync('bash', ['-c', cmd], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ...env },
      // stdout 输出量大（5000+ warnings），用 pipe 会撑满缓冲区导致死锁
      // 只捕获 stderr，stdout 丢弃
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 300000, // 5 分钟超时
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    const end = performance.now();
    const stderr = result.stderr?.toString() || '';
    return {
      time: (end - start) / 1000,
      success: result.status === 0,
      stderr,
    };
  } catch (err) {
    const end = performance.now();
    return {
      time: (end - start) / 1000,
      success: false,
      stderr: String(err),
    };
  }
}

// 取中位数
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// 测试单个工具
async function benchTool(tool: { name: string; cmd: string; dist: string; env?: Record<string, string> }): Promise<BenchResult> {
  const { name, cmd, dist } = tool;
  const distPath = join(PROJECT_ROOT, dist);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Benchmarking: ${name}`);
  console.log(`${'='.repeat(60)}`);

  // 清除产物和缓存
  console.log('  Cleaning dist & cache...');
  if (existsSync(distPath)) rmSync(distPath, { recursive: true, force: true });
  // 清除 webpack/rspack 缓存
  const cacheDirs = ['node_modules/.cache'];
  for (const cache of cacheDirs) {
    const cachePath = join(PROJECT_ROOT, cache);
    if (existsSync(cachePath)) rmSync(cachePath, { recursive: true, force: true });
  }

  // 冷启动构建（多次运行取中位数）
  const coldTimes: number[] = [];
  let lastError = '';

  for (let i = 0; i < RUNS; i++) {
    if (existsSync(distPath)) rmSync(distPath, { recursive: true, force: true });
    if (i > 0) {
      // 后续运行不清缓存（测试热启动）
    }
    console.log(`  Cold build run ${i + 1}/${RUNS}...`);
    const result = runBuild(cmd, { NODE_ENV: 'production', ...(tool.env || {}) });
    if (result.success) {
      coldTimes.push(result.time);
      console.log(`    -> ${formatTime(result.time)}`);
    } else {
      console.log(`    -> FAILED`);
      lastError = result.stderr.split('\n').filter((l) => l.trim()).slice(-15).join('\n');
      break;
    }
  }

  if (coldTimes.length === 0) {
    return {
      tool: name,
      coldBuildTime: 0,
      warmBuildTime: 0,
      totalSize: 0,
      gzipSize: 0,
      chunkCount: 0,
      treeShakingPassed: false,
      error: lastError,
    };
  }

  // 热启动构建（有缓存的情况）
  console.log('  Warm build (with cache)...');
  const warmResult = runBuild(cmd, { NODE_ENV: 'production', ...(tool.env || {}) });
  const warmTime = warmResult.success ? warmResult.time : 0;
  if (warmResult.success) {
    console.log(`    -> ${formatTime(warmTime)}`);
  }

  // 测量产物
  const totalSize = getDirSize(distPath);
  const gzipSize = getGzipSize(distPath);
  const chunkCount = countChunks(distPath);
  const treeShakingPassed = checkTreeShaking(distPath);

  console.log(`  Results:`);
  console.log(`    Cold build (median): ${formatTime(median(coldTimes))}`);
  console.log(`    Warm build:          ${formatTime(warmTime)}`);
  console.log(`    Total size:          ${formatBytes(totalSize)}`);
  console.log(`    Gzip size:           ${formatBytes(gzipSize)}`);
  console.log(`    Chunks:              ${chunkCount}`);
  console.log(`    Tree shaking:        ${treeShakingPassed ? 'PASS' : 'FAIL'}`);

  return {
    tool: name,
    coldBuildTime: median(coldTimes),
    warmBuildTime: warmTime,
    totalSize,
    gzipSize,
    chunkCount,
    treeShakingPassed,
  };
}

// 生成报告
function generateReport(results: BenchResult[]): string {
  const lines: string[] = [];

  lines.push('# 构建工具性能对比报告');
  lines.push('');
  lines.push(`> 生成时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`> 测试次数: 每个工具 ${RUNS} 次取中位数`);
  lines.push(`> 模块数量: 1000 个生成模块 + 核心模块`);
  lines.push(`> Node 版本: ${process.version}`);
  lines.push('');

  // 性能表格
  lines.push('## 构建性能');
  lines.push('');
  lines.push('| 构建工具 | 冷启动构建 | 热启动构建 | 产物大小 | Gzip 大小 | 分包数 | Tree Shaking |');
  lines.push('|----------|-----------|-----------|---------|----------|-------|-------------|');

  for (const r of results) {
    if (r.error) {
      lines.push(`| ${r.tool} | ❌ 构建失败 | - | - | - | - | - |`);
    } else {
      lines.push(
        `| ${r.tool} | ${formatTime(r.coldBuildTime)} | ${formatTime(r.warmBuildTime)} | ${formatBytes(r.totalSize)} | ${formatBytes(r.gzipSize)} | ${r.chunkCount} | ${r.treeShakingPassed ? '✅' : '❌'} |`
      );
    }
  }
  lines.push('');

  // 性能排名
  const successful = results.filter((r) => !r.error && r.coldBuildTime > 0);
  if (successful.length > 0) {
    const ranked = [...successful].sort((a, b) => a.coldBuildTime - b.coldBuildTime);
    lines.push('## 冷启动构建速度排名');
    lines.push('');
    ranked.forEach((r, i) => {
      lines.push(`${i + 1}. **${r.tool}** - ${formatTime(r.coldBuildTime)}`);
    });
    lines.push('');

    const sizeRanked = [...successful].sort((a, b) => a.gzipSize - b.gzipSize);
    lines.push('## 产物体积排名（Gzip）');
    lines.push('');
    sizeRanked.forEach((r, i) => {
      lines.push(`${i + 1}. **${r.tool}** - ${formatBytes(r.gzipSize)}`);
    });
    lines.push('');
  }

  // 错误信息
  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    lines.push('## 构建失败详情');
    lines.push('');
    for (const r of failed) {
      lines.push(`### ${r.tool}`);
      lines.push('```');
      lines.push(r.error!);
      lines.push('```');
      lines.push('');
    }
  }

  // 功能对比
  lines.push('## 功能对比总表');
  lines.push('');
  lines.push('| 维度 | Webpack 5 | Vite | Rollup | Rolldown | Rspack |');
  lines.push('|------|-----------|------|--------|----------|--------|');
  lines.push('| 底层语言 | JavaScript | JavaScript (dev) / Rollup (build) | JavaScript | Rust | Rust |');
  lines.push('| 开发模式 | Bundle-based | ESM unbundled | 无内置 dev server | 无内置 dev server | Bundle-based |');
  lines.push('| TS 转译 | ts-loader / babel | esbuild | @rollup/plugin-typescript | oxc (内置) | SWC (内置) |');
  lines.push('| CSS Modules | css-loader options | 内置 | rollup-plugin-postcss | 内置 | 内置 css/module |');
  lines.push('| Tree Shaking | production mode | Rollup 内置 | 原生 ESM | 原生 ESM | production mode |');
  lines.push('| 代码分割 | SplitChunksPlugin | manualChunks | manualChunks | advancedChunks | SplitChunks |');
  lines.push('| 配置复杂度 | 高 | 低 | 中 | 低 | 中（兼容 webpack） |');
  lines.push('| 缓存策略 | filesystem cache | esbuild pre-bundle | 无 | 内置 | 内置 |');
  lines.push('| 插件生态 | 最丰富 | 丰富（兼容 Rollup） | 丰富 | 兼容 Rollup | 兼容 webpack |');
  lines.push('| 适用场景 | 大型应用 | 通用应用 | 库 | 库 / Vite 生产构建 | 大型应用 |');
  lines.push('');

  return lines.join('\n');
}

// 主函数
async function main() {
  console.log('🚀 Build Tools Benchmark');
  console.log(`   Node: ${process.version}`);
  console.log(`   Runs per tool: ${RUNS}`);
  console.log(`   Project: ${PROJECT_ROOT}`);

  const allTools = [...tools];

  // 检查 rolldown 是否可用
  try {
    execSync('npx rolldown --version', { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 30000 });
    allTools.push(rolldownConfig);
    console.log('   Rolldown: available ✓');
  } catch {
    console.log('   Rolldown: not available, skipping');
  }

  const results: BenchResult[] = [];
  for (const tool of allTools) {
    const result = await benchTool(tool);
    results.push(result);
  }

  // 生成报告
  const report = generateReport(results);
  const reportPath = join(PROJECT_ROOT, 'docs', 'benchmark-report.md');
  const { writeFileSync } = await import('fs');
  writeFileSync(reportPath, report, 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log('📊 Benchmark complete!');
  console.log(`   Report saved to: ${reportPath}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
