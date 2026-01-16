/**
 * 通用頁面佈局元件
 * 提供 P5.js 背景和主題切換功能
 */
import React from 'react';
import { motion } from 'framer-motion';
import P5Background from './P5Background';
import ThemeToggle from './ThemeToggle';
import { useThemeStore, themes } from '../store/themeStore';

interface PageLayoutProps {
    children: React.ReactNode;
    variant?: 'particles' | 'waves' | 'network';
    showThemeToggle?: boolean;
    maxWidth?: string;
    padding?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    variant = 'particles',
    showThemeToggle = true,
    maxWidth = '1200px',
    padding = '20px'
}) => {
    const { mode } = useThemeStore();
    const theme = themes[mode];
    const isDark = mode === 'dark';

    return (
        <div className="page-layout" style={{ background: theme.background }}>
            <P5Background
                variant={variant}
                opacity={isDark ? 0.3 : 0.15}
                color={isDark ? '#667eea' : '#302b63'}
            />

            {showThemeToggle && (
                <div className="theme-toggle-wrapper">
                    <ThemeToggle />
                </div>
            )}

            <motion.div
                className="page-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ maxWidth, padding }}
            >
                {children}
            </motion.div>

            <style>{`
        .page-layout {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          transition: background 0.3s ease;
        }

        .theme-toggle-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .page-content {
          position: relative;
          z-index: 1;
          width: 100%;
          margin: 0 auto;
          min-height: 100vh;
        }

        /* 通用主題樣式 */
        .page-layout .card {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(20px);
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .page-layout .card:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 1)'};
          box-shadow: 0 10px 30px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .page-layout .text-primary {
          color: ${isDark ? '#ffffff' : '#1a1a2e'};
        }

        .page-layout .text-secondary {
          color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};
        }

        .page-layout .text-muted {
          color: ${isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
        }

        .page-layout h1,
        .page-layout h2,
        .page-layout h3 {
          color: ${isDark ? '#ffffff' : '#1a1a2e'};
        }

        .page-layout p {
          color: ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'};
        }

        .page-layout .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .page-layout .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .page-layout .btn-secondary {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${isDark ? '#ffffff' : '#1a1a2e'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'};
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .page-layout .btn-secondary:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
        }

        .page-layout input,
        .page-layout textarea,
        .page-layout select {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'};
          color: ${isDark ? '#ffffff' : '#1a1a2e'};
          padding: 12px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .page-layout input:focus,
        .page-layout textarea:focus,
        .page-layout select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .page-layout input::placeholder,
        .page-layout textarea::placeholder {
          color: ${isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
        }
      `}</style>
        </div>
    );
};

export default PageLayout;
