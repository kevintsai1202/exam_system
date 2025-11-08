/**
 * 主應用程式入口
 *
 * 配置所有路由
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useMediaQuery, useResponsiveValue } from './hooks';

// 頁面元件
import InstructorDashboard from './pages/InstructorDashboard';
import ExamCreator from './pages/ExamCreator';
import ExamMonitor from './pages/ExamMonitor';
import StudentJoin from './pages/StudentJoin';
import StudentExam from './pages/StudentExam';
import Leaderboard from './pages/Leaderboard';

/**
 * 首頁元件 - 選擇角色
 */
const HomePage: React.FC = () => {
  const { isMobile } = useMediaQuery();
  const containerPadding = useResponsiveValue('16px', '24px', '32px');
  const titleSize = useResponsiveValue('32px', '40px', '48px');
  const subtitleSize = useResponsiveValue('16px', '18px', '18px');
  const gridGap = useResponsiveValue('16px', '20px', '24px');
  const cardPadding = useResponsiveValue('32px 24px', '40px 28px', '48px 32px');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: containerPadding,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: isMobile ? '100%' : '800px', width: '100%' }}>
        <h1
          style={{
            fontSize: titleSize,
            fontWeight: '700',
            color: '#333',
            marginBottom: '16px',
          }}
        >
          即時互動測驗系統
        </h1>
        <p
          style={{
            fontSize: subtitleSize,
            color: '#666',
            marginBottom: isMobile ? '32px' : '48px',
          }}
        >
          選擇您的角色開始使用
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: gridGap,
          }}
        >
          {/* 講師入口 */}
          <a
            href="/instructor"
            style={{
              display: 'block',
              padding: cardPadding,
              backgroundColor: '#fff',
              borderRadius: isMobile ? '12px' : '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨‍🏫</div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1976d2',
                marginBottom: '8px',
              }}
            >
              講師入口
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              建立測驗、監控進度、查看統計
            </p>
          </a>

          {/* 學員入口 */}
          <a
            href="/student/join"
            style={{
              display: 'block',
              padding: cardPadding,
              backgroundColor: '#fff',
              borderRadius: isMobile ? '12px' : '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨‍🎓</div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#4caf50',
                marginBottom: '8px',
              }}
            >
              學員入口
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              輸入加入碼開始答題
            </p>
          </a>
        </div>

        {/* 說明 */}
        <div
          style={{
            marginTop: '48px',
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'left',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '16px',
            }}
          >
            系統功能
          </h3>
          <ul
            style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.8',
              margin: 0,
              paddingLeft: '20px',
            }}
          >
            <li>即時互動答題與統計圖表顯示</li>
            <li>支援長條圖與圓餅圖兩種統計模式</li>
            <li>倒數計時功能，掌握答題節奏</li>
            <li>即時排行榜，激發競爭動力</li>
            <li>QR Code 快速加入測驗</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * 404 頁面
 */
const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '96px', marginBottom: '24px' }}>404</div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '16px',
          }}
        >
          頁面不存在
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          您訪問的頁面不存在或已被移除
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#fff',
            backgroundColor: '#1976d2',
            borderRadius: '8px',
            textDecoration: 'none',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1565c0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1976d2';
          }}
        >
          返回首頁
        </a>
      </div>
    </div>
  );
};

/**
 * 主應用程式元件
 */
const App: React.FC = () => {
  return (
    <Routes>
      {/* 首頁 */}
      <Route path="/" element={<HomePage />} />

      {/* 講師路由 */}
      <Route path="/instructor" element={<InstructorDashboard />} />
      <Route path="/instructor/exam/create" element={<ExamCreator />} />
      <Route path="/instructor/exam/:examId/edit" element={<ExamCreator />} />
      <Route path="/instructor/exam/:examId/monitor" element={<ExamMonitor />} />

      {/* 學員路由 */}
      <Route path="/student/join" element={<StudentJoin />} />
      <Route path="/student/exam/:examId" element={<StudentExam />} />

      {/* 排行榜路由 */}
      <Route path="/leaderboard/:examId" element={<Leaderboard />} />

      {/* 404 頁面 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
