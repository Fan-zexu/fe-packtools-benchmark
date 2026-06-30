import React from 'react';
import { Button, Space } from 'antd';
import { useCounterStore } from '../../store';
import logo from '../../../assets/logo.svg';
import styles from './Header.module.css';

export default function Header() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={logo} alt="logo" width={32} height={32} />
        <span className={styles.title}>Pack Test Lab</span>
      </div>
      <Space>
        <Button type="primary" onClick={increment}>
          Count +1 ({count})
        </Button>
        <Button onClick={decrement}>Reset</Button>
      </Space>
    </header>
  );
}
