/**
 * 这个模块完全不被任何地方导入。
 * 用于测试各构建工具的 Tree Shaking 能力：
 * 如果 Tree Shaking 生效，此文件不应出现在最终产物中。
 */

export function unusedExpensiveFunction(): number {
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  return result;
}

export const unusedLargeArray = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: `item-${i}`,
  timestamp: Date.now(),
}));

export class UnusedClass {
  private data: Map<string, number> = new Map();

  add(key: string, value: number): void {
    this.data.set(key, value);
  }

  get(key: string): number | undefined {
    return this.data.get(key);
  }
}
