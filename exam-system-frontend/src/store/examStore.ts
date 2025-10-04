/**
 * 測驗狀態管理 Store
 *
 * 使用 Zustand 管理測驗相關的全域狀態
 */

import { create } from 'zustand';
import type { Exam, Question, ExamStatus } from '../types';

/**
 * 測驗 Store 狀態介面
 */
interface ExamState {
  // 狀態
  currentExam: Exam | null;                // 當前測驗
  questions: Question[];                   // 題目列表
  currentQuestion: Question | null;        // 當前題目
  currentQuestionIndex: number;            // 當前題目索引
  isLoading: boolean;                      // 載入狀態
  error: string | null;                    // 錯誤訊息

  // Actions
  setCurrentExam: (exam: Exam | null) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  updateExamStatus: (status: ExamStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  reset: () => void;
}

/**
 * 初始狀態
 */
const initialState = {
  currentExam: null,
  questions: [],
  currentQuestion: null,
  currentQuestionIndex: -1,
  isLoading: false,
  error: null,
};

/**
 * 測驗 Store
 */
export const useExamStore = create<ExamState>((set, get) => ({
  ...initialState,

  /**
   * 設定當前測驗
   */
  setCurrentExam: (exam) => {
    set({
      currentExam: exam,
      error: null,
    });
  },

  /**
   * 設定題目列表
   */
  setQuestions: (questions) => {
    set({
      questions,
      error: null,
    });
  },

  /**
   * 設定當前題目
   */
  setCurrentQuestion: (question) => {
    set({
      currentQuestion: question,
      error: null,
    });
  },

  /**
   * 設定當前題目索引
   */
  setCurrentQuestionIndex: (index) => {
    const { questions } = get();
    const question = questions[index] || null;

    set({
      currentQuestionIndex: index,
      currentQuestion: question,
    });
  },

  /**
   * 更新測驗狀態
   */
  updateExamStatus: (status) => {
    const { currentExam } = get();
    if (!currentExam) return;

    set({
      currentExam: {
        ...currentExam,
        status,
      },
    });
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
   * 下一題
   */
  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      const nextQuestion = questions[nextIndex];
      set({
        currentQuestionIndex: nextIndex,
        currentQuestion: nextQuestion,
      });
    }
  },

  /**
   * 上一題
   */
  previousQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    const prevIndex = currentQuestionIndex - 1;

    if (prevIndex >= 0) {
      const prevQuestion = questions[prevIndex];
      set({
        currentQuestionIndex: prevIndex,
        currentQuestion: prevQuestion,
      });
    }
  },

  /**
   * 重置狀態
   */
  reset: () => {
    set(initialState);
  },
}));

export default useExamStore;
