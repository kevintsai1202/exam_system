/**
 * 主題狀態管理 (Zustand)
 * 用於日夜模式切換
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    isDark: () => boolean;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'dark',

            toggleTheme: () => {
                set((state) => ({
                    mode: state.mode === 'dark' ? 'light' : 'dark'
                }));
            },

            setTheme: (mode: ThemeMode) => {
                set({ mode });
            },

            isDark: () => get().mode === 'dark'
        }),
        {
            name: 'theme-storage'
        }
    )
);

// 主題色彩配置
export const themes = {
    dark: {
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        cardBg: 'rgba(255, 255, 255, 0.05)',
        cardBorder: 'rgba(255, 255, 255, 0.1)',
        cardHoverBg: 'rgba(255, 255, 255, 0.1)',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.6)',
        textMuted: 'rgba(255, 255, 255, 0.4)',
        // 別名屬性 - 相容新頁面
        text: '#ffffff',
        primary: '#667eea',
        border: 'rgba(255, 255, 255, 0.2)',
    },
    light: {
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        cardBg: 'rgba(255, 255, 255, 0.9)',
        cardBorder: 'rgba(0, 0, 0, 0.1)',
        cardHoverBg: 'rgba(255, 255, 255, 1)',
        textPrimary: '#1a1a2e',
        textSecondary: 'rgba(0, 0, 0, 0.6)',
        textMuted: 'rgba(0, 0, 0, 0.4)',
        // 別名屬性 - 相容新頁面
        text: '#1a1a2e',
        primary: '#667eea',
        border: 'rgba(0, 0, 0, 0.15)',
    }
};
