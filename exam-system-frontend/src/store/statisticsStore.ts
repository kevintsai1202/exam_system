/**
 * 統計資料管理 Store
 *
 * 使用 Zustand 管理統計相關的全域狀態
 */

import { create } from 'zustand';
import type {
  QuestionStatistics,
  CumulativeStatistics,
  Leaderboard,
} from '../types';

/**
 * 統計 Store 狀態介面
 */
interface StatisticsState {
  // 狀態
  currentQuestionStats: QuestionStatistics | null;  // 當前題目統計
  questionStatsHistory: Map<number, QuestionStatistics>; // 題目統計歷史（questionId -> stats）
  cumulativeStats: CumulativeStatistics | null;     // 累積統計
  leaderboard: Leaderboard | null;                  // 排行榜
  isLoading: boolean;                               // 載入狀態
  error: string | null;                             // 錯誤訊息

  // Actions
  setCurrentQuestionStats: (stats: QuestionStatistics | null) => void;
  updateQuestionStats: (stats: QuestionStatistics) => void;
  getQuestionStatsById: (questionId: number) => QuestionStatistics | undefined;
  setCumulativeStats: (stats: CumulativeStatistics | null) => void;
  setLeaderboard: (leaderboard: Leaderboard | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  clearQuestionStatsHistory: () => void;
}

/**
 * 初始狀態
 */
const initialState = {
  currentQuestionStats: null,
  questionStatsHistory: new Map<number, QuestionStatistics>(),
  cumulativeStats: null,
  leaderboard: null,
  isLoading: false,
  error: null,
};

/**
 * 統計 Store
 */
export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  ...initialState,

  /**
   * 設定當前題目統計
   */
  setCurrentQuestionStats: (stats) => {
    set({
      currentQuestionStats: stats,
      error: null,
    });

    // 同時更新歷史記錄
    if (stats) {
      const { questionStatsHistory } = get();
      const newHistory = new Map(questionStatsHistory);
      newHistory.set(stats.questionId, stats);
      set({ questionStatsHistory: newHistory });
    }
  },

  /**
   * 更新題目統計（增量更新）
   */
  updateQuestionStats: (stats) => {
    const { currentQuestionStats, questionStatsHistory } = get();

    // 更新當前題目統計
    if (currentQuestionStats?.questionId === stats.questionId) {
      set({ currentQuestionStats: stats });
    }

    // 更新歷史記錄
    const newHistory = new Map(questionStatsHistory);
    newHistory.set(stats.questionId, stats);
    set({ questionStatsHistory: newHistory });
  },

  /**
   * 根據題目 ID 取得統計
   */
  getQuestionStatsById: (questionId) => {
    const { questionStatsHistory } = get();
    return questionStatsHistory.get(questionId);
  },

  /**
   * 設定累積統計
   */
  setCumulativeStats: (stats) => {
    set({
      cumulativeStats: stats,
      error: null,
    });
  },

  /**
   * 設定排行榜
   */
  setLeaderboard: (leaderboard) => {
    set({
      leaderboard,
      error: null,
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
   * 重置狀態
   */
  reset: () => {
    set(initialState);
  },

  /**
   * 清除題目統計歷史
   */
  clearQuestionStatsHistory: () => {
    set({ questionStatsHistory: new Map<number, QuestionStatistics>() });
  },
}));

export default useStatisticsStore;
