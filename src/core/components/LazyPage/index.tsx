import React from 'react';
import { Card, Tag, Space } from 'antd';
import dayjs from 'dayjs';

// 懒加载页面 - 用于测试代码分割（Code Splitting）
export default function LazyPage() {
  return (
    <Card title="Lazy Loaded Page" extra={<Tag color="blue">Code Split</Tag>}>
      <Space direction="vertical">
        <p>This page was loaded via React.lazy() to test code splitting.</p>
        <p>Each build tool handles chunk splitting differently:</p>
        <ul>
          <li>Webpack: SplitChunksPlugin</li>
          <li>Vite: Rollup's manualChunks</li>
          <li>Rollup: output.manualChunks</li>
          <li>Rolldown: advanced chunking</li>
          <li>Rspack: built-in SplitChunks</li>
        </ul>
        <Tag color="green">Loaded at: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</Tag>
      </Space>
    </Card>
  );
}
