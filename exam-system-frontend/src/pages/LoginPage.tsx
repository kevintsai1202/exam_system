/**
 * 登入頁面
 * 提供 Email 註冊/登入與 Google OAuth2 登入
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD
  ? ''  // 生產環境：相對路徑
  : 'http://localhost:8080'); // 開發環境：完整 URL

type AuthMode = 'login' | 'register';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 導向後端 Google OAuth2 授權端點
   */
  const handleGoogleLogin = () => {
    const returnTo = sessionStorage.getItem('returnTo') || window.location.pathname;
    sessionStorage.setItem('oauthReturnTo', returnTo);
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  /**
   * 取得後端錯誤訊息
   */
  const extractErrorMessage = (err: unknown): string => {
    if (!axios.isAxiosError(err)) {
      return '系統發生未知錯誤，請稍後再試';
    }

    const responseMessage = err.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
      return responseMessage;
    }

    return '登入流程失敗，請稍後再試';
  };

  /**
   * Email 密碼登入流程
   */
  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('請輸入 Email 與密碼');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: email.trim(),
        password
      });

      const token = response.data?.token;
      if (!token) {
        throw new Error('未取得登入 Token');
      }

      await login(token);
      const returnTo = sessionStorage.getItem('returnTo') || '/';
      sessionStorage.removeItem('returnTo');
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Email 註冊流程
   */
  const handleEmailRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('請完整填寫姓名、Email 與密碼');
      return;
    }

    if (password !== confirmPassword) {
      setError('密碼與確認密碼不一致');
      return;
    }

    if (password.length < 8) {
      setError('密碼至少需要 8 碼');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        password
      });

      const token = response.data?.token;
      if (!token) {
        throw new Error('未取得註冊 Token');
      }

      await login(token);
      const returnTo = sessionStorage.getItem('returnTo') || '/';
      sessionStorage.removeItem('returnTo');
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <h1>即時互動測驗系統</h1>
          <p>使用 Email 或 Google 帳號登入</p>
        </div>

        <div className="mode-tabs">
          <button
            type="button"
            className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Email 登入
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Email 註冊
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleEmailLogin}>
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <input
              className="auth-input"
              type="password"
              placeholder="密碼"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <button className="email-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '登入中...' : 'Email 登入'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleEmailRegister}>
            <input
              className="auth-input"
              type="text"
              placeholder="姓名"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <input
              className="auth-input"
              type="password"
              placeholder="密碼（至少 8 碼）"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <input
              className="auth-input"
              type="password"
              placeholder="確認密碼"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <button className="email-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '註冊中...' : 'Email 註冊'}
            </button>
          </form>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="login-divider">
          <span>或</span>
        </div>

        <motion.button
          className="google-login-btn"
          onClick={handleGoogleLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
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

        <p className="login-note">
          若 Email 與 Google 為同一信箱，Google 登入時會自動綁定到同一帳號
        </p>
      </motion.div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px;
          max-width: 460px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .login-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #5dd39e 0%, #348aa7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        .mode-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }

        .mode-tab {
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-tab.active {
          border-color: rgba(93, 211, 158, 0.8);
          background: rgba(93, 211, 158, 0.15);
          color: #fff;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 10px;
        }

        .auth-input {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.22);
          color: #fff;
          padding: 12px 14px;
          font-size: 0.95rem;
          outline: none;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        .auth-input:focus {
          border-color: rgba(93, 211, 158, 0.75);
          box-shadow: 0 0 0 3px rgba(93, 211, 158, 0.16);
        }

        .email-submit-btn {
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #5dd39e 0%, #348aa7 100%);
          color: #fff;
          padding: 12px 14px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .email-submit-btn:hover {
          transform: translateY(-1px);
        }

        .email-submit-btn:disabled,
        .google-login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          margin-top: 6px;
          margin-bottom: 4px;
          border: 1px solid rgba(255, 107, 107, 0.5);
          border-radius: 8px;
          background: rgba(255, 107, 107, 0.14);
          color: #ffd7d7;
          padding: 10px 12px;
          font-size: 0.86rem;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 14px 0;
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

        .google-login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 14px 20px;
          background: #fff;
          color: #333;
          border: none;
          border-radius: 12px;
          font-size: 0.96rem;
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

        .login-note {
          text-align: center;
          color: rgba(255, 255, 255, 0.52);
          font-size: 0.78rem;
          margin-top: 16px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
