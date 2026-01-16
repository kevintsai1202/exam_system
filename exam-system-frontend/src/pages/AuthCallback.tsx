/**
 * OAuth2 回調頁面
 * 處理 Google 登入成功後的 Token
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError(decodeURIComponent(errorParam));
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (token) {
                try {
                    await login(token);
                    // 登入成功，導向首頁或原本要去的頁面
                    const returnTo = sessionStorage.getItem('returnTo') || '/';
                    sessionStorage.removeItem('returnTo');
                    navigate(returnTo, { replace: true });
                } catch (err) {
                    setError('登入處理失敗，請重試');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } else {
                setError('未收到認證資訊');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, login, navigate]);

    return (
        <div className="auth-callback">
            <motion.div
                className="callback-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {error ? (
                    <>
                        <div className="error-icon">❌</div>
                        <h2>登入失敗</h2>
                        <p>{error}</p>
                        <p className="redirect-note">正在返回登入頁面...</p>
                    </>
                ) : (
                    <>
                        <div className="loading-spinner"></div>
                        <h2>正在處理登入...</h2>
                        <p>請稍候，正在驗證您的身份</p>
                    </>
                )}
            </motion.div>

            <style>{`
        .auth-callback {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }

        .callback-container {
          text-align: center;
          color: #fff;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        h2 {
          font-size: 1.5rem;
          margin-bottom: 12px;
        }

        p {
          color: rgba(255, 255, 255, 0.7);
        }

        .redirect-note {
          margin-top: 20px;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
        </div>
    );
};

export default AuthCallback;
