import dayjs, { Dayjs } from 'dayjs';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Dayjs | string | Date, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function relativeTime(date: Dayjs | string | Date): string {
  const d = dayjs(date);
  const now = dayjs();
  const diff = now.diff(d, 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  if (diff < 30) return `${Math.floor(diff / 7)}周前`;
  return d.format('YYYY-MM-DD');
}
