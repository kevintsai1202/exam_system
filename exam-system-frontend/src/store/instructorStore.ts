/**
 * 講師狀態管理 Store
 *
 * 使用 Zustand 管理講師 Session ID
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 講師 Store 狀態介面
 */
interface InstructorState {
  // 狀態
  instructorSessionId: string | null;  // 講師 Session ID（存入 localStorage）

  // Actions
  setInstructorSessionId: (sessionId: string | null) => void;
  clearInstructorSessionId: () => void;
}

/**
 * 講師 Store（使用 persist 中間件儲存 instructorSessionId）
 */
export const useInstructorStore = create<InstructorState>()(
  persist(
    (set) => ({
      instructorSessionId: null,

      /**
       * 設定講師 Session ID
       */
      setInstructorSessionId: (sessionId) => {
        set({ instructorSessionId: sessionId });
      },

      /**
       * 清除講師 Session ID
       */
      clearInstructorSessionId: () => {
        set({ instructorSessionId: null });
      },
    }),
    {
      name: 'exam-instructor-storage',  // localStorage key
      partialize: (state) => ({
        instructorSessionId: state.instructorSessionId,
      }),
    }
  )
);
