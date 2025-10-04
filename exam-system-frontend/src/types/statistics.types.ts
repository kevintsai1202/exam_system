/**
 * 統計相關型別定義
 */

import { ChartType } from './exam.types';

// 選項統計介面
export interface OptionStatistic {
  optionId: number;         // 選項 ID
  optionText: string;       // 選項文字
  count: number;            // 選擇人數
  percentage: number;       // 百分比
  isCorrect: boolean;       // 是否為正確答案
}

// 題目統計介面
export interface QuestionStatistics {
  questionId: number;                  // 題目 ID
  questionText: string;                // 題目內容
  totalAnswers: number;                // 總答題人數
  chartType: ChartType;                // 圖表類型
  optionStatistics: OptionStatistic[]; // 選項統計列表
  correctRate: number;                 // 正確率
  timestamp: string;                   // 時間戳記
}

// 分數分布介面
export interface ScoreDistribution {
  score: number;            // 分數
  count: number;            // 人數
  percentage: number;       // 百分比
}

// 累積統計介面
export interface CumulativeStatistics {
  examId: number;                          // 測驗 ID
  totalStudents: number;                   // 總學員數
  totalQuestions: number;                  // 總題目數
  chartType: ChartType;                    // 圖表類型
  scoreDistribution: ScoreDistribution[];  // 分數分布
  averageScore: number;                    // 平均分數
  timestamp: string;                       // 時間戳記
}

// 排行榜項目介面
export interface LeaderboardEntry {
  rank: number;                  // 排名
  studentId: number;             // 學員 ID
  name: string;                  // 學員姓名
  avatarIcon: string;            // 頭像圖示
  totalScore: number;            // 總分
  correctRate: number;           // 正確率
  totalAnswerTimeSeconds: number; // 總答題時間（秒）
}

// 排行榜介面
export interface Leaderboard {
  examId: number;                    // 測驗 ID
  totalStudents: number;             // 總學員數
  totalQuestions: number;            // 總題目數
  leaderboard: LeaderboardEntry[];   // 排行榜列表
  timestamp: string;                 // 時間戳記
}

// WebSocket 訊息類型枚舉
export enum WebSocketMessageType {
  // 測驗狀態
  EXAM_STARTED = 'EXAM_STARTED',
  EXAM_ENDED = 'EXAM_ENDED',

  // 學員相關
  STUDENT_JOINED = 'STUDENT_JOINED',

  // 題目相關
  QUESTION_STARTED = 'QUESTION_STARTED',

  // 統計相關
  STATISTICS_UPDATED = 'STATISTICS_UPDATED',
  QUESTION_CLOSED = 'QUESTION_CLOSED',
  CUMULATIVE_UPDATED = 'CUMULATIVE_UPDATED',
  LEADERBOARD_UPDATED = 'LEADERBOARD_UPDATED',

  // 計時器
  TIMER_UPDATE = 'TIMER_UPDATE',
  TIMER_EXPIRED = 'TIMER_EXPIRED'
}

// WebSocket 測驗狀態訊息
export interface ExamStatusMessage {
  type: WebSocketMessageType.EXAM_STARTED | WebSocketMessageType.EXAM_ENDED;
  examId: number;
  status: string;
  timestamp: string;
}

// WebSocket 學員加入訊息
export interface StudentJoinedMessage {
  type: WebSocketMessageType.STUDENT_JOINED;
  student: {
    id: number;
    name: string;
    avatarIcon: string;
    totalScore: number;
  };
  totalStudents: number;
  timestamp: string;
}

// WebSocket 題目開始訊息
export interface QuestionStartedMessage {
  type: WebSocketMessageType.QUESTION_STARTED;
  questionId: number;
  questionIndex: number;
  questionText: string;
  options: Array<{
    id: number;
    optionOrder: number;
    optionText: string;
  }>;
  timeLimit: number;
  startedAt: string;
  expiresAt: string;
}

// WebSocket 統計更新訊息
export interface StatisticsUpdateMessage {
  type: WebSocketMessageType.STATISTICS_UPDATED | WebSocketMessageType.QUESTION_CLOSED;
  questionId: number;
  questionText: string;
  totalAnswers: number;
  chartType: ChartType;
  optionStatistics: OptionStatistic[];
  correctRate: number;
  timestamp: string;
}

// WebSocket 累積統計訊息
export interface CumulativeUpdateMessage {
  type: WebSocketMessageType.CUMULATIVE_UPDATED;
  examId: number;
  totalStudents: number;
  totalQuestions: number;
  chartType: ChartType;
  scoreDistribution: ScoreDistribution[];
  averageScore: number;
  timestamp: string;
}

// WebSocket 排行榜訊息
export interface LeaderboardUpdateMessage {
  type: WebSocketMessageType.LEADERBOARD_UPDATED;
  examId: number;
  totalStudents: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  timestamp: string;
}

// WebSocket 計時器訊息
export interface TimerMessage {
  type: WebSocketMessageType.TIMER_UPDATE | WebSocketMessageType.TIMER_EXPIRED;
  questionId: number;
  remainingSeconds?: number;
  timestamp: string;
}

// WebSocket 訊息聯合型別
export type WebSocketMessage =
  | ExamStatusMessage
  | StudentJoinedMessage
  | QuestionStartedMessage
  | StatisticsUpdateMessage
  | CumulativeUpdateMessage
  | LeaderboardUpdateMessage
  | TimerMessage;
