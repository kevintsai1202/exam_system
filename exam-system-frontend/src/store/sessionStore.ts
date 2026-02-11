/**
 * 會話狀態管理 (Zustand)
 * 用於保存和恢復測驗狀態
 */
import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? ''  // 生產環境：相對路徑
  : 'http://localhost:8080'; // 開發環境：完整 URL

export interface Session {
    id: number;
    examId: number;
    currentQuestionId: number;
    sessionType: 'INSTRUCTOR' | 'STUDENT';
    status: 'ACTIVE' | 'COMPLETED' | 'DISCONNECTED';
    studentSessionId?: string;
}

interface SessionState {
    activeSession: Session | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchActiveSession: () => Promise<void>;
    saveSession: (examId: number, currentQuestionId?: number, sessionType?: 'INSTRUCTOR' | 'STUDENT', studentSessionId?: string) => Promise<void>;
    completeSession: (sessionId: number) => Promise<void>;
    restoreSession: () => Promise<Session | null>;
    clearSession: () => void;
    getStudentSession: (studentSessionId: string) => Promise<Session | null>;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
    activeSession: null,
    isLoading: false,
    error: null,

    fetchActiveSession: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_BASE_URL}/api/session/active`);
            if (response.data.hasSession) {
                set({ activeSession: response.data.session, isLoading: false });
            } else {
                set({ activeSession: null, isLoading: false });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch session',
                isLoading: false
            });
        }
    },

    saveSession: async (examId: number, currentQuestionId?: number, sessionType: 'INSTRUCTOR' | 'STUDENT' = 'STUDENT', studentSessionId?: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/session/save`, {
                examId,
                currentQuestionId,
                sessionType,
                studentSessionId
            });

            if (response.data.success) {
                // 重新取得會話資訊
                await get().fetchActiveSession();
            }
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    },

    completeSession: async (sessionId: number) => {
        try {
            await axios.post(`${API_BASE_URL}/api/session/${sessionId}/complete`);
            set({ activeSession: null });
        } catch (error) {
            console.error('Failed to complete session:', error);
        }
    },

    restoreSession: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.post(`${API_BASE_URL}/api/session/restore`);
            if (response.data.restored) {
                const session = response.data.session;
                set({ activeSession: session, isLoading: false });
                return session;
            }
            set({ isLoading: false });
            return null;
        } catch (error) {
            set({ isLoading: false });
            return null;
        }
    },

    getStudentSession: async (studentSessionId: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/session/student/${studentSessionId}`);
            if (response.data.hasSession) {
                return response.data.session;
            }
            return null;
        } catch {
            return null;
        }
    },

    clearSession: () => {
        set({ activeSession: null, error: null });
    }
}));

// 監聽瀏覽器關閉事件，保存會話狀態
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        const session = useSessionStore.getState().activeSession;
        if (session) {
            // 使用 sendBeacon 在頁面關閉時發送請求
            const data = JSON.stringify({
                examId: session.examId,
                currentQuestionId: session.currentQuestionId,
                sessionType: session.sessionType,
                studentSessionId: session.studentSessionId
            });

            navigator.sendBeacon(
                `${API_BASE_URL}/api/session/save`,
                new Blob([data], { type: 'application/json' })
            );
        }
    });
}
