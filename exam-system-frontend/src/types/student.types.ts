/**
 * 學員相關型別定義
 */

import { ExamStatus } from './exam.types';

// 學員介面
export interface Student {
  id: number;               // 學員 ID
  sessionId: string;        // Session ID（UUID）
  examId: number;           // 測驗 ID
  name: string;             // 學員姓名
  email: string;            // 學員 Email
  avatarIcon: string;       // 頭像圖示名稱
  totalScore: number;       // 累積總分
  joinedAt: string;         // 加入時間
  examStatus?: ExamStatus;  // 測驗狀態
}

// 學員加入請求介面
export interface JoinExamRequest {
  accessCode: string;       // 測驗加入碼
  name: string;             // 學員姓名
  email: string;            // 學員 Email
  avatarIcon: string;       // 頭像圖示名稱
}

// 學員加入回應介面
export interface JoinExamResponse {
  id: number;               // 學員 ID
  sessionId: string;        // Session ID
  examId: number;           // 測驗 ID
  name: string;             // 學員姓名
  email: string;            // 學員 Email
  avatarIcon: string;       // 頭像圖示名稱
  totalScore: number;       // 累積總分
  joinedAt: string;         // 加入時間
  examStatus: ExamStatus;   // 測驗狀態
}

// 學員列表回應介面
export interface StudentsResponse {
  examId: number;           // 測驗 ID
  totalStudents: number;    // 總學員數
  students: Student[];      // 學員列表
}

// 答案介面
export interface Answer {
  id: number;                    // 答案 ID
  questionId: number;            // 題目 ID
  questionText?: string;         // 題目內容
  selectedOptionId: number;      // 選擇的選項 ID
  selectedOptionText?: string;   // 選擇的選項文字
  correctOptionId?: number;      // 正確答案選項 ID
  isCorrect: boolean;            // 是否答對
  answeredAt: string;            // 作答時間
}

// 提交答案請求介面
export interface SubmitAnswerRequest {
  sessionId: string;        // Session ID
  questionId: number;       // 題目 ID
  selectedOptionId: number; // 選擇的選項 ID
}

// 提交答案回應介面
export interface SubmitAnswerResponse {
  id: number;                  // 答案 ID
  studentId: number;           // 學員 ID
  questionId: number;          // 題目 ID
  selectedOptionId: number;    // 選擇的選項 ID
  isCorrect: boolean;          // 是否答對
  answeredAt: string;          // 作答時間
  currentTotalScore: number;   // 當前總分
}

// 學員答案記錄回應介面
export interface StudentAnswersResponse {
  studentId: number;        // 學員 ID
  sessionId: string;        // Session ID
  totalScore: number;       // 總分
  answers: Answer[];        // 答案列表
}

// 可用頭像列表
export const AVAILABLE_AVATARS = [
  'cat',      // 貓
  'dog',      // 狗
  'lion',     // 獅子
  'tiger',    // 老虎
  'bear',     // 熊
  'rabbit',   // 兔子
  'fox',      // 狐狸
  'panda'     // 熊貓
] as const;

// 頭像類型
export type AvatarIcon = typeof AVAILABLE_AVATARS[number];
