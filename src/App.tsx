import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './core/components/Header';
import Dashboard from './core/components/Dashboard';

// 代码分割测试：React.lazy 动态导入
const LazyPage = lazy(() => import('./core/components/LazyPage'));

// 引入批量生成的模块（1000个），测试大规模模块处理能力
import { GeneratedModuleList } from './generated';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <nav className="nav">
          <Link to="/">Dashboard</Link>
          <Link to="/lazy">Lazy Page</Link>
          <Link to="/modules">Generated Modules</Link>
        </nav>
        <main className="main">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lazy" element={<LazyPage />} />
              <Route
                path="/modules"
                element={
                  <div className="module-grid">
                    {GeneratedModuleList.slice(0, 50).map(({ name, Component }) => (
                      <div key={name} className="module-card">
                        <Component />
                      </div>
                    ))}
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
