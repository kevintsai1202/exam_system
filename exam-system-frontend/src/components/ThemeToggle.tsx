/**
 * 主題切換按鈕元件
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';

interface ThemeToggleProps {
    className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
    const { mode, toggleTheme } = useThemeStore();
    const isDark = mode === 'dark';

    return (
        <motion.button
            className={`theme-toggle ${className || ''}`}
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            title={isDark ? '切換至淺色模式' : '切換至深色模式'}
        >
            <div className="toggle-track">
                <motion.div
                    className="toggle-thumb"
                    animate={{ x: isDark ? 0 : 24 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />

                {/* 太陽圖標 */}
                <svg className="icon sun-icon" viewBox="0 0 24 24" width="16" height="16">
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </g>
                </svg>

                {/* 月亮圖標 */}
                <svg className="icon moon-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
                </svg>
            </div>

            <style>{`
        .theme-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 20px;
        }

        .toggle-track {
          position: relative;
          width: 52px;
          height: 28px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 14px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'};
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .toggle-thumb {
          position: absolute;
          width: 22px;
          height: 22px;
          background: ${isDark
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          left: 2px;
        }

        .icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          transition: opacity 0.2s ease;
        }

        .sun-icon {
          right: 6px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#fda085'};
          opacity: ${isDark ? 0.4 : 1};
        }

        .moon-icon {
          left: 6px;
          color: ${isDark ? '#667eea' : 'rgba(0, 0, 0, 0.3)'};
          opacity: ${isDark ? 1 : 0.4};
        }
      `}</style>
        </motion.button>
    );
};

export default ThemeToggle;
