/**
 * 主應用程式入口
 *
 * 配置所有路由
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMediaQuery } from './hooks';

// 頁面元件
import InstructorDashboard from './pages/InstructorDashboard';
import ExamCreator from './pages/ExamCreator';
import ExamMonitor from './pages/ExamMonitor';
import StudentJoin from './pages/StudentJoin';
import StudentExam from './pages/StudentExam';
import Leaderboard from './pages/Leaderboard';
import SurveyFieldManager from './pages/SurveyFieldManager';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

// 認證元件
import ProtectedRoute from './components/ProtectedRoute';

// 動畫元件
import P5Background from './components/P5Background';

// 主題切換
import ThemeToggle from './components/ThemeToggle';
import { useThemeStore, themes } from './store/themeStore';

/**
 * 首頁元件 - 選擇角色
 */
const HomePage: React.FC = () => {
  const { isMobile } = useMediaQuery();
  const { mode } = useThemeStore();
  const theme = themes[mode];
  const isDark = mode === 'dark';

  return (
    <div className="home-page" style={{ background: theme.background }}>
      <P5Background variant="network" opacity={isDark ? 0.4 : 0.2} color={isDark ? '#667eea' : '#302b63'} />

      {/* 主題切換按鈕 */}
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      <motion.div
        className="home-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 標題區域 */}
        <div className="home-header">
          <motion.div
            className="logo-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <svg viewBox="0 0 100 100" width="80" height="80">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <circle cx="50" cy="50" r="8" fill="#fff" />
              <path d="M50 20 L50 35 M50 65 L50 80 M20 50 L35 50 M65 50 L80 50" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </motion.div>
          <h1 className="home-title">即時互動測驗系統</h1>
          <p className="home-subtitle">選擇您的角色開始使用</p>
        </div>

        {/* 角色選擇卡片 */}
        <div className={`role-grid ${isMobile ? 'mobile' : ''}`}>
          {/* 講師入口 */}
          <motion.a
            href="/instructor"
            className="role-card instructor"
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card-icon">
              <svg viewBox="0 0 64 64" width="48" height="48">
                <defs>
                  <linearGradient id="instructorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="20" r="12" fill="url(#instructorGrad)" />
                <path d="M12 52 Q12 36 32 36 Q52 36 52 52" fill="url(#instructorGrad)" />
                <rect x="42" y="8" width="16" height="12" rx="2" fill="#667eea" />
                <path d="M45 11 L55 11 M45 14 L52 14 M45 17 L55 17" stroke="#fff" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="card-content">
              <h2>講師入口</h2>
              <p>建立測驗、監控進度、查看統計</p>
            </div>
            <div className="card-arrow">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.a>

          {/* 學員入口 */}
          <motion.a
            href="/student/join"
            className="role-card student"
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card-icon">
              <svg viewBox="0 0 64 64" width="48" height="48">
                <defs>
                  <linearGradient id="studentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4caf50" />
                    <stop offset="100%" stopColor="#2e7d32" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="22" r="12" fill="url(#studentGrad)" />
                <path d="M12 54 Q12 38 32 38 Q52 38 52 54" fill="url(#studentGrad)" />
                <path d="M20 8 L32 2 L44 8 L32 14 Z" fill="#4caf50" />
                <rect x="30" y="14" width="4" height="8" fill="#4caf50" />
              </svg>
            </div>
            <div className="card-content">
              <h2>學員入口</h2>
              <p>輸入加入碼開始答題</p>
            </div>
            <div className="card-arrow">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.a>
        </div>

        {/* 功能特色 */}
        <motion.div
          className="features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" width="20" height="20">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.7" />
              <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" opacity="0.85" />
              <rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor" />
            </svg>
            <span>即時統計</span>
          </div>
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" width="20" height="20">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>倒數計時</span>
          </div>
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M12 2L15 8H9L12 2Z" fill="currentColor" />
              <rect x="4" y="10" width="16" height="10" rx="2" fill="currentColor" opacity="0.8" />
              <circle cx="12" cy="15" r="2" fill="#0f0c29" />
            </svg>
            <span>排行榜</span>
          </div>
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" width="20" height="20">
              <rect x="3" y="3" width="7" height="7" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" fill="currentColor" />
              <rect x="3" y="14" width="7" height="7" fill="currentColor" />
              <rect x="14" y="14" width="3" height="3" fill="currentColor" />
              <rect x="18" y="14" width="3" height="3" fill="currentColor" />
              <rect x="14" y="18" width="3" height="3" fill="currentColor" />
              <rect x="18" y="18" width="3" height="3" fill="currentColor" />
            </svg>
            <span>QR Code</span>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s ease;
        }
        
        .theme-toggle-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 100;
        }

        .home-container {
          text-align: center;
          max-width: 900px;
          width: 100%;
          z-index: 1;
          position: relative;
        }

        .home-header {
          margin-bottom: 48px;
        }

        .logo-icon {
          font-size: 72px;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 20px rgba(102, 126, 234, 0.5));
        }

        .home-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .home-subtitle {
          font-size: 1.1rem;
          color: ${isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          transition: color 0.3s ease;
        }

        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 48px;
        }

        .role-grid.mobile {
          grid-template-columns: 1fr;
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 28px 32px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)'};
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: ${isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.08)'};
        }

        .role-card:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 1)'};
          border-color: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'};
          box-shadow: 0 20px 40px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)'};
        }

        .role-card.instructor:hover {
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.2);
        }

        .role-card.student:hover {
          border-color: rgba(76, 175, 80, 0.5);
          box-shadow: 0 20px 40px rgba(76, 175, 80, 0.2);
        }

        .card-icon {
          font-size: 48px;
          flex-shrink: 0;
        }

        .card-content {
          flex: 1;
          text-align: left;
        }

        .card-content h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .role-card.instructor .card-content h2 {
          color: #667eea;
        }

        .role-card.student .card-content h2 {
          color: #4caf50;
        }

        .card-content p {
          font-size: 0.9rem;
          color: ${isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          margin: 0;
          transition: color 0.3s ease;
        }

        .card-arrow {
          font-size: 24px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
          transition: all 0.3s ease;
        }

        .role-card:hover .card-arrow {
          color: ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'};
          transform: translateX(4px);
        }

        .features {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .feature-icon {
          font-size: 1.2rem;
        }

        @media (max-width: 600px) {
          .features {
            gap: 20px;
          }
          
          .role-card {
            padding: 20px;
          }
          
          .card-icon {
            font-size: 40px;
          }
        }
      `}</style>
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
      {/* 認證路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* 首頁 */}
      <Route path="/" element={<HomePage />} />

      {/* 講師路由 - 需要登入 */}
      <Route path="/instructor" element={
        <ProtectedRoute>
          <InstructorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/instructor/exam/create" element={
        <ProtectedRoute>
          <ExamCreator />
        </ProtectedRoute>
      } />
      <Route path="/instructor/exam/:examId/edit" element={
        <ProtectedRoute>
          <ExamCreator />
        </ProtectedRoute>
      } />
      <Route path="/instructor/exam/:examId/monitor" element={
        <ProtectedRoute>
          <ExamMonitor />
        </ProtectedRoute>
      } />
      <Route path="/instructor/survey-fields" element={
        <ProtectedRoute>
          <SurveyFieldManager />
        </ProtectedRoute>
      } />

      {/* 學員路由 - 不需要登入 */}
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
