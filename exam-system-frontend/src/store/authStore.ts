/**
 * 認證狀態管理 (Zustand)
 */
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? ''  // 生產環境：相對路徑
  : 'http://localhost:8080'; // 開發環境：完整 URL

export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  googleLinked?: boolean;
  passwordSet?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;

  // Role checks
  isInstructor: () => boolean;
  isStudent: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        setToken: (token: string) => {
          set({ token, isAuthenticated: true });
          // 設定 axios 預設標頭
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        },

        setUser: (user: User) => {
          set({ user });
        },

        login: async (token: string) => {
          set({ isLoading: true, error: null });
          try {
            // 設定 token
            get().setToken(token);

            // 取得用戶資訊
            const response = await axios.get(`${API_BASE_URL}/api/auth/user`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.authenticated && response.data.user) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              throw new Error('Failed to get user info');
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
              isAuthenticated: false,
              token: null,
              user: null
            });
            delete axios.defaults.headers.common['Authorization'];
          }
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          });
          delete axios.defaults.headers.common['Authorization'];

          // 呼叫後端登出 API
          axios.post(`${API_BASE_URL}/api/auth/logout`).catch(() => { });
        },

        fetchUser: async () => {
          const token = get().token;
          if (!token) return;

          set({ isLoading: true });
          try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/user`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.authenticated && response.data.user) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              get().logout();
            }
          } catch {
            get().logout();
          } finally {
            set({ isLoading: false });
          }
        },

        clearError: () => {
          set({ error: null });
        },

        // Role checks
        isInstructor: () => {
          const user = get().user;
          return user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
        },

        isStudent: () => {
          const user = get().user;
          return user?.role === 'STUDENT';
        },

        isAdmin: () => {
          const user = get().user;
          return user?.role === 'ADMIN';
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// 初始化時恢復 axios 標頭
const initAuth = () => {
  const { token, isAuthenticated } = useAuthStore.getState();

  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return;
  }

  // 防止本地狀態殘留：沒有 token 時強制回到未登入狀態
  if (isAuthenticated) {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null
    });
  }
};

initAuth();
