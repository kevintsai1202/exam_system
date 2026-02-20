/**
 * 主應用程式入口
 *
 * 配置所有路由
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AdminDashboard from './pages/AdminDashboard';

// 問券調查頁面
import SurveyManager from './pages/SurveyManager';
import SurveyCreator from './pages/SurveyCreator';
import SurveyStats from './pages/SurveyStats';
import SurveyResponse from './pages/SurveyResponse';

// 郵件功能頁面
import EmailManager from './pages/EmailManager';
import EmailComposer from './pages/EmailComposer';

// 認證元件
import ProtectedRoute from './components/ProtectedRoute';

// 動畫元件

import PageLayout from './components/PageLayout';

// 主題切換

import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';

/**
 * 首頁元件 - 選擇角色
 */
const HomePage: React.FC = () => {
  const { isMobile } = useMediaQuery();
  const { mode } = useThemeStore();

  const isDark = mode === 'dark';
  const { user, isAuthenticated, logout, isAdmin, isInstructor } = useAuthStore();

  const handleOpenLoginPage = () => {
    window.location.href = '/login';
  };

  return (
    <div className="home-page">
      {/* 頂部工具列：登入狀態 */}
      <div className="home-toolbar">
        {isAuthenticated && user ? (
          <div className="user-info">
            <span className="user-greeting">歡迎，{user.name}</span>
            <button className="logout-btn" onClick={logout}>
              登出
            </button>
          </div>
        ) : (
          <button className="google-login-btn" onClick={handleOpenLoginPage}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            登入 / 註冊
          </button>
        )}
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

          {!isAuthenticated && (
            <motion.button
              className="main-login-btn"
              onClick={handleOpenLoginPage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: '24px',
                padding: '12px 32px',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#fff',
                background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(66, 133, 244, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" style={{ background: '#fff', borderRadius: '50%', padding: '2px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              前往登入頁
            </motion.button>
          )}
        </div>

        {/* 角色選擇卡片 */}
        <div className={`role-grid ${isMobile ? 'mobile' : ''}`}>
          {/* 講師入口 - 僅 INSTRUCTOR 與 ADMIN 可見 */}
          {isAuthenticated && user && (isInstructor() || isAdmin()) ? (
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
          ) : (
            <motion.div
              className="role-card instructor"
              style={{ opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(0.8)' }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 0.6, x: 0 }}
              transition={{ delay: 0.3 }}
              title="僅限具有講師權限的帳號進入"
            >
              <div className="card-icon">
                <svg viewBox="0 0 64 64" width="48" height="48">
                  <defs>
                    <linearGradient id="instructorGradLocked" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9e9e9e" />
                      <stop offset="100%" stopColor="#616161" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="20" r="12" fill="url(#instructorGradLocked)" />
                  <path d="M12 52 Q12 36 32 36 Q52 36 52 52" fill="url(#instructorGradLocked)" />
                  <rect x="42" y="8" width="16" height="12" rx="2" fill="#9e9e9e" />
                  <path d="M45 11 L55 11 M45 14 L52 14 M45 17 L55 17" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="card-content">
                <h2>講師入口</h2>
                <p style={{ color: '#d32f2f', fontWeight: 500 }}>需要講師或管理員權限</p>
              </div>
              <div className="card-arrow">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 15V17M12 7H12.01M10 21H14C15.1046 21 16 20.1046 16 19V11C16 9.89543 15.1046 9 14 9H10C8.89543 9 8 9.89543 8 11V19C8 20.1046 8.89543 21 10 21ZM16 9V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9H16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          )}

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

          {/* Admin 入口 - 僅管理員可見 */}
          {isAuthenticated && user && isAdmin && isAdmin() && (
            <motion.a
              href="/admin/users"
              className="role-card admin"
              whileHover={{ scale: 1.03, y: -8 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: 0, y: 30 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                color: '#fff',
                gridColumn: '1 / -1',
                maxWidth: '400px',
                margin: '0 auto',
                marginTop: '16px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '24px',
                borderRadius: '16px',
                textDecoration: 'none'
              }}
            >
              <div className="card-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <svg viewBox="0 0 64 64" width="36" height="36">
                  <path d="M32 10 A12 12 0 1 0 32 34 A12 12 0 1 0 32 10 Z M14 54 Q14 40 32 40 Q50 40 50 54" fill="#fff" />
                  <path d="M48 22 L60 22 M54 16 L54 28" stroke="#fff" strokeWidth="4" />
                </svg>
              </div>
              <div className="card-content" style={{ marginLeft: '20px', flex: 1 }}>
                <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 4px 0' }}>系統管理中心</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>設定帳戶升級與系統管理</p>
              </div>
            </motion.a>
          )}
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
        
        .home-toolbar {
          position: fixed;
          top: 20px;
          right: 100px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .user-greeting {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }

        .logout-btn {
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.02);
        }

        .google-login-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #fff;
          color: #333;
          border: none;
          border-radius: 24px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }

        .google-login-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .google-login-btn svg {
          flex-shrink: 0;
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
 * 講師權限護衛
 */
const InstructorGuard: React.FC<{ component?: React.ReactNode }> = ({ component }) => {
  const { isInstructor, isAdmin } = useAuthStore();

  if (!isInstructor() && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{component || <InstructorDashboard />}</>;
};

/**
 * 主應用程式元件
 */
const App: React.FC = () => {
  return (
    <PageLayout variant="particles" showThemeToggle={true} maxWidth="100%" padding="0">
      <Routes>
        {/* 認證路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* 首頁 */}
        <Route path="/" element={<HomePage />} />

        {/* 講師路由 - 需要登入與負責權限 */}
        <Route path="/instructor" element={
          <ProtectedRoute>
            <InstructorGuard />
          </ProtectedRoute>
        } />
        <Route path="/instructor/exam/create" element={
          <ProtectedRoute>
            <InstructorGuard component={<ExamCreator />} />
          </ProtectedRoute>
        } />
        <Route path="/instructor/exam/:examId/edit" element={
          <ProtectedRoute>
            <InstructorGuard component={<ExamCreator />} />
          </ProtectedRoute>
        } />
        <Route path="/instructor/exam/:examId/monitor" element={
          <ProtectedRoute>
            <InstructorGuard component={<ExamMonitor />} />
          </ProtectedRoute>
        } />
        <Route path="/instructor/survey-fields" element={
          <ProtectedRoute>
            <InstructorGuard component={<SurveyFieldManager />} />
          </ProtectedRoute>
        } />

        {/* 管理員路由 - 需要登入且在內部驗證權限 */}
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* 問券調查路由 - 需要登入 */}
        <Route path="/surveys" element={
          <ProtectedRoute>
            <SurveyManager />
          </ProtectedRoute>
        } />
        <Route path="/surveys/new" element={
          <ProtectedRoute>
            <SurveyCreator />
          </ProtectedRoute>
        } />
        <Route path="/surveys/:id/edit" element={
          <ProtectedRoute>
            <SurveyCreator />
          </ProtectedRoute>
        } />
        <Route path="/surveys/:id/statistics" element={
          <ProtectedRoute>
            <SurveyStats />
          </ProtectedRoute>
        } />

        {/* 郵件功能路由 - 需要登入 */}
        <Route path="/emails" element={
          <ProtectedRoute>
            <EmailManager />
          </ProtectedRoute>
        } />
        <Route path="/emails/new" element={
          <ProtectedRoute>
            <EmailComposer />
          </ProtectedRoute>
        } />
        <Route path="/emails/:id/edit" element={
          <ProtectedRoute>
            <EmailComposer />
          </ProtectedRoute>
        } />

        {/* 學員路由 - 需要登入 */}
        <Route path="/student/join" element={
          <ProtectedRoute>
            <StudentJoin />
          </ProtectedRoute>
        } />
        <Route path="/student/exam/:examId" element={
          <ProtectedRoute>
            <StudentExam />
          </ProtectedRoute>
        } />

        {/* 排行榜路由 */}
        <Route path="/leaderboard/:examId" element={<Leaderboard />} />

        {/* 問券填寫路由 - 不需要登入 */}
        <Route path="/surveys/:id/respond" element={<SurveyResponse />} />

        {/* 404 頁面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PageLayout>
  );
};

export default App;
