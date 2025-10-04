/**
 * 測驗相關型別定義
 */

// 測驗狀態枚舉
export enum ExamStatus {
  CREATED = 'CREATED',   // 已建立
  STARTED = 'STARTED',   // 進行中
  ENDED = 'ENDED'        // 已結束
}

// 圖表類型枚舉
export enum ChartType {
  BAR = 'BAR',   // 長條圖
  PIE = 'PIE'    // 圓餅圖
}

// 選項介面
export interface QuestionOption {
  id: number;              // 選項 ID
  optionOrder: number;     // 選項順序
  optionText: string;      // 選項內容
}

// 題目介面
export interface Question {
  id: number;                          // 題目 ID
  questionOrder: number;               // 題目順序
  questionText: string;                // 題目內容
  chartType: ChartType;                // 題目統計圖表類型
  options: QuestionOption[];           // 選項列表
  correctOptionId: number;             // 正確答案選項 ID
}

// 測驗介面
export interface Exam {
  id: number;                     // 測驗 ID
  title: string;                  // 測驗標題
  description: string;            // 測驗描述
  questionTimeLimit: number;      // 每題倒數時間（秒）
  cumulativeChartType: ChartType; // 累積統計圖表類型
  status: ExamStatus;             // 測驗狀態
  accessCode: string;             // 加入碼（QR Code 內容）
  currentQuestionIndex: number;   // 當前題目索引
  createdAt: string;              // 建立時間
  startedAt?: string;             // 開始時間
  endedAt?: string;               // 結束時間
  questions?: Question[];         // 題目列表
  totalQuestions?: number;        // 總題目數
  totalStudents?: number;         // 總學員數
}

// 建立測驗請求介面
export interface CreateExamRequest {
  title: string;                       // 測驗標題
  description: string;                 // 測驗描述
  questionTimeLimit: number;           // 每題倒數時間（秒）
  cumulativeChartType: ChartType;      // 累積統計圖表類型
  questions: CreateQuestionRequest[];  // 題目列表
}

// 建立題目請求介面
export interface CreateQuestionRequest {
  questionOrder: number;               // 題目順序
  questionText: string;                // 題目內容
  chartType: ChartType;                // 題目統計圖表類型
  options: CreateOptionRequest[];      // 選項列表
  correctOptionOrder: number;          // 正確答案選項順序
}

// 建立選項請求介面
export interface CreateOptionRequest {
  optionOrder: number;     // 選項順序
  optionText: string;      // 選項內容
}

// 啟動測驗回應介面
export interface StartExamResponse {
  id: number;               // 測驗 ID
  status: ExamStatus;       // 測驗狀態
  accessCode: string;       // 加入碼
  qrCodeUrl: string;        // QR Code URL
  qrCodeBase64: string;     // QR Code Base64 編碼
  startedAt: string;        // 開始時間
}

// 開始題目回應介面
export interface StartQuestionResponse {
  questionId: number;       // 題目 ID
  questionIndex: number;    // 題目索引
  questionText: string;     // 題目內容
  timeLimit: number;        // 時間限制（秒）
  startedAt: string;        // 開始時間
  expiresAt: string;        // 到期時間
}

// 題目列表回應介面
export interface QuestionsResponse {
  examId: number;           // 測驗 ID
  totalQuestions: number;   // 總題目數
  questions: Question[];    // 題目列表
}
