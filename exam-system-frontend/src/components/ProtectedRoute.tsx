/**
 * 受保護路由元件
 * 未登入時導向登入頁
 */
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAuth = true
}) => {
    const { isAuthenticated, isLoading, token, user, fetchUser } = useAuthStore();
    const location = useLocation();
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        let isCancelled = false;

        const checkSession = async () => {
            if (!requireAuth) {
                if (!isCancelled) setIsCheckingSession(false);
                return;
            }

            // 沒有 Token 代表未登入，不需要額外請求
            if (!token) {
                if (!isCancelled) setIsCheckingSession(false);
                return;
            }

            // 有 token 且已有使用者資訊，直接通過
            if (user) {
                if (!isCancelled) setIsCheckingSession(false);
                return;
            }

            // 有 token 但缺少 user 時，主動向後端同步一次登入狀態
            await fetchUser();
            if (!isCancelled) setIsCheckingSession(false);
        };

        checkSession();

        return () => {
            isCancelled = true;
        };
    }, [requireAuth, token, user, fetchUser]);

    // 如果不需要認證，直接渲染子元件
    if (!requireAuth) {
        return <>{children}</>;
    }

    // 正在載入中
    if (isLoading || isCheckingSession) {
        return (
            <div className="loading-auth">
                <div className="spinner"></div>
                <style>{`
          .loading-auth {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.2);
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // 未登入，儲存目標路徑並導向登入頁
    if (!isAuthenticated || !token) {
        sessionStorage.setItem('returnTo', `${location.pathname}${location.search}`);
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
