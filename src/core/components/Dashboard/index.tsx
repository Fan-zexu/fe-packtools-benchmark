import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Statistic, Row, Col } from 'antd';
import { chunk, sum } from 'lodash-es';
import dayjs from 'dayjs';
import { formatCurrency, formatDate } from '../../utils/format';
import { fibonacci, isPrime } from '../../utils/math';
import styles from './Dashboard.module.css';

const mockData = Array.from({ length: 12 }, (_, i) => ({
  month: dayjs().month(i).format('MMM'),
  revenue: Math.floor(Math.random() * 50000) + 10000,
  users: Math.floor(Math.random() * 5000) + 500,
}));

export default function Dashboard() {
  const chartOption = useMemo(() => {
    const revenues = mockData.map((d) => d.revenue);
    const avgRevenue = Math.floor(sum(revenues) / revenues.length);
    return {
      title: { text: `Monthly Revenue (avg: ${formatCurrency(avgRevenue)})` },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: mockData.map((d) => d.month) },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: revenues,
        },
      ],
    };
  }, []);

  const stats = useMemo(() => {
    const fibResult = fibonacci(20);
    const primeCount = Array.from({ length: 100 }, (_, i) => i + 1).filter(isPrime).length;
    return { fibResult, primeCount };
  }, []);

  return (
    <div className={styles.dashboard}>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Fibonacci(20)" value={stats.fibResult} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Primes in 1-100" value={stats.primeCount} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Current Date"
              value={formatDate(dayjs(), 'YYYY-MM-DD HH:mm:ss')}
            />
          </Card>
        </Col>
      </Row>
      <Card className={styles.chartCard}>
        <ReactECharts option={chartOption} style={{ height: 320 }} />
      </Card>
    </div>
  );
}
