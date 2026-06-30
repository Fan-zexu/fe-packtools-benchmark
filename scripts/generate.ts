/**
 * 批量生成模块脚本
 *
 * 生成 1000 个 React 组件文件，每个包含：
 * - TypeScript 类型定义
 * - CSS Module 导入
 * - lodash-es / dayjs 工具函数调用
 * - React 渲染逻辑
 *
 * 这些模块用于构建工具性能对比——
 * 模块数量足够大时，不同工具的构建速度差异才会明显体现。
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const MODULE_COUNT = 1000;
const OUTPUT_DIR = join(__dirname, '..', 'src', 'generated');
const MODULES_DIR = join(OUTPUT_DIR, 'modules');

// 确保目录存在
if (!existsSync(MODULES_DIR)) {
  mkdirSync(MODULES_DIR, { recursive: true });
}

// 生成模块内容
function generateModule(index: number): string {
  const paddedIndex = String(index).padStart(4, '0');
  const componentName = `GenModule${paddedIndex}`;
  const color = `hsl(${(index * 37) % 360}, 65%, 55%)`;
  const bgColor = `hsl(${(index * 37) % 360}, 65%, 95%)`;

  return `// Auto-generated module #${index}
import React from 'react';
import { Card, Tag } from 'antd';
import { chunk, random, uniq } from 'lodash-es';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  index?: number;
  timestamp?: Dayjs;
}

const mockData = uniq(Array.from({ length: ${10 + (index % 20)} }, () => random(1, 100)));
const chunked = chunk(mockData, 5);

export function ${componentName}(props: ${componentName}Props): JSX.Element {
  const { index = ${index}, timestamp = dayjs() } = props;
  return (
    <Card
      size="small"
      className={styles.card}
      title={<span style={{ color: '${color}' }}>${componentName}</span>}
      extra={<Tag color="blue">#{index}</Tag>}
    >
      <div className={styles.body} style={{ backgroundColor: '${bgColor}' }}>
        <p className={styles.text}>Data points: {mockData.length}</p>
        <p className={styles.text}>Chunks: {chunked.length}</p>
        <p className={styles.text}>{timestamp.format('HH:mm:ss.SSS')}</p>
      </div>
    </Card>
  );
}

export default ${componentName};
`;
}

// 生成 CSS Module 内容
function generateCSS(index: number): string {
  const paddedIndex = String(index).padStart(4, '0');
  const componentName = `GenModule${paddedIndex}`;

  return `/* Auto-generated CSS Module for ${componentName} */
.card {
  border-radius: 8px;
  overflow: hidden;
}

.body {
  padding: 8px 12px;
  border-radius: 6px;
}

.text {
  margin: 2px 0;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
}
`;
}

// 生成 index.ts 统一导出
function generateIndex(): string {
  const imports: string[] = [];
  const entries: string[] = [];

  for (let i = 0; i < MODULE_COUNT; i++) {
    const paddedIndex = String(i).padStart(4, '0');
    const name = `GenModule${paddedIndex}`;
    imports.push(`import { ${name} } from './modules/${name}';`);
    entries.push(`  { name: '${name}', Component: ${name} },`);
  }

  return `// Auto-generated index - ${MODULE_COUNT} modules
${imports.join('\n')}

export interface GeneratedModuleEntry {
  name: string;
  Component: React.ComponentType;
}

export const GeneratedModuleList: GeneratedModuleEntry[] = [
${entries.join('\n')}
];

export const totalGeneratedModules = ${MODULE_COUNT};
`;
}

// 执行生成
console.log(`Generating ${MODULE_COUNT} modules...`);

for (let i = 0; i < MODULE_COUNT; i++) {
  const paddedIndex = String(i).padStart(4, '0');
  const componentName = `GenModule${paddedIndex}`;

  const tsxContent = generateModule(i);
  const cssContent = generateCSS(i);

  writeFileSync(join(MODULES_DIR, `${componentName}.tsx`), tsxContent, 'utf-8');
  writeFileSync(join(MODULES_DIR, `${componentName}.module.css`), cssContent, 'utf-8');
}

// 生成 index.ts
writeFileSync(join(OUTPUT_DIR, 'index.tsx'), generateIndex(), 'utf-8');

console.log(`Done! Generated ${MODULE_COUNT} modules + ${MODULE_COUNT} CSS files + 1 index.tsx`);
console.log(`Output: ${MODULES_DIR}`);
