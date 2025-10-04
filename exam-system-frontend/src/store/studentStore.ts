/**
 * 學員狀態管理 Store
 *
 * 使用 Zustand 管理學員相關的全域狀態
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student, Answer } from '../types';

/**
 * 學員 Store 狀態介面
 */
interface StudentState {
  // 狀態
  currentStudent: Student | null;          // 當前學員（學員端使用）
  students: Student[];                     // 學員列表（講師端使用）
  totalStudents: number;                   // 總學員數
  answers: Answer[];                       // 學員答案記錄
  sessionId: string | null;                // Session ID（存入 localStorage）
  isLoading: boolean;                      // 載入狀態
  error: string | null;                    // 錯誤訊息

  // Actions
  setCurrentStudent: (student: Student | null) => void;
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (studentId: number, updates: Partial<Student>) => void;
  setTotalStudents: (total: number) => void;
  setAnswers: (answers: Answer[]) => void;
  addAnswer: (answer: Answer) => void;
  setSessionId: (sessionId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  clearSession: () => void;
}

/**
 * 初始狀態
 */
const initialState = {
  currentStudent: null,
  students: [],
  totalStudents: 0,
  answers: [],
  sessionId: null,
  isLoading: false,
  error: null,
};

/**
 * 學員 Store（使用 persist 中間件儲存 sessionId）
 */
export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * 設定當前學員
       */
      setCurrentStudent: (student) => {
        set({
          currentStudent: student,
          sessionId: student?.sessionId || null,
          error: null,
        });
      },

      /**
       * 設定學員列表
       */
      setStudents: (students) => {
        set({
          students,
          totalStudents: students.length,
          error: null,
        });
      },

      /**
       * 新增學員
       */
      addStudent: (student) => {
        const { students } = get();
        const existingIndex = students.findIndex((s) => s.id === student.id);

        if (existingIndex >= 0) {
          // 更新現有學員
          const updatedStudents = [...students];
          updatedStudents[existingIndex] = student;
          set({
            students: updatedStudents,
            totalStudents: updatedStudents.length,
          });
        } else {
          // 新增學員
          const updatedStudents = [...students, student];
          set({
            students: updatedStudents,
            totalStudents: updatedStudents.length,
          });
        }
      },

      /**
       * 更新學員資訊
       */
      updateStudent: (studentId, updates) => {
        const { students, currentStudent } = get();

        // 更新學員列表
        const updatedStudents = students.map((student) =>
          student.id === studentId ? { ...student, ...updates } : student
        );

        // 更新當前學員（如果是本人）
        const updatedCurrentStudent =
          currentStudent?.id === studentId
            ? { ...currentStudent, ...updates }
            : currentStudent;

        set({
          students: updatedStudents,
          currentStudent: updatedCurrentStudent,
        });
      },

      /**
       * 設定總學員數
       */
      setTotalStudents: (total) => {
        set({ totalStudents: total });
      },

      /**
       * 設定答案列表
       */
      setAnswers: (answers) => {
        set({
          answers,
          error: null,
        });
      },

      /**
       * 新增答案
       */
      addAnswer: (answer) => {
        const { answers } = get();
        set({
          answers: [...answers, answer],
        });
      },

      /**
       * 設定 Session ID
       */
      setSessionId: (sessionId) => {
        set({ sessionId });
      },

      /**
       * 設定載入狀態
       */
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      /**
       * 設定錯誤訊息
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * 重置狀態（保留 sessionId）
       */
      reset: () => {
        const { sessionId } = get();
        set({
          ...initialState,
          sessionId, // 保留 sessionId
        });
      },

      /**
       * 清除 Session（完全登出）
       */
      clearSession: () => {
        set(initialState);
      },
    }),
    {
      name: 'exam-student-storage', // localStorage key
      partialize: (state) => ({
        sessionId: state.sessionId, // 只持久化 sessionId
      }),
    }
  )
);

export default useStudentStore;
