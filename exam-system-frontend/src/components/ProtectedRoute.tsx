/**
 * 受保護路由元件
 * 未登入時導向登入頁
 */
import React from 'react';
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
    const { isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();

    // 如果不需要認證，直接渲染子元件
    if (!requireAuth) {
        return <>{children}</>;
    }

    // 正在載入中
    if (isLoading) {
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
    if (!isAuthenticated) {
        sessionStorage.setItem('returnTo', location.pathname);
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
