/**
 * 登入頁面
 * 提供 Google OAuth2 登入
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import P5Background from '../components/P5Background';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // 導向後端 OAuth2 登入端點
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  const handleGuestMode = () => {
    // 訪客模式直接進入首頁
    navigate('/');
  };

  return (
    <div className="login-page">
      <P5Background variant="particles" opacity={0.5} />
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <h1>即時互動測驗系統</h1>
          <p>歡迎回來！請選擇登入方式</p>
        </div>

        <div className="login-buttons">
          <motion.button
            className="google-login-btn"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>使用 Google 帳號登入</span>
          </motion.button>

          <div className="login-divider">
            <span>或</span>
          </div>

          <motion.button
            className="guest-mode-btn"
            onClick={handleGuestMode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>👤</span>
            <span>以訪客模式繼續</span>
          </motion.button>
        </div>

        <p className="login-note">
          訪客模式可直接參與測驗，但無法使用講師功能
        </p>
      </motion.div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 20px;
        }

        .login-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 48px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
        }

        .login-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .google-login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: #fff;
          color: #333;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .google-login-btn:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .google-icon {
          flex-shrink: 0;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 8px 0;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .login-divider span {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }

        .guest-mode-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: transparent;
          color: #fff;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .guest-mode-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .login-note {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.8rem;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
