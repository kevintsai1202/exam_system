/**
 * 問券調查相關型別定義
 */

// 問券狀態枚舉
export enum SurveyStatus {
    DRAFT = 'DRAFT',     // 草稿
    ACTIVE = 'ACTIVE',   // 進行中
    CLOSED = 'CLOSED'    // 已關閉
}

// 問券題目類型枚舉
export enum SurveyQuestionType {
    SINGLE_CHOICE = 'SINGLE_CHOICE',     // 單選題
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 多選題
    TEXT = 'TEXT',                       // 文字題
    RATING = 'RATING'                    // 評分題
}

// 問券選項介面
export interface SurveyOption {
    id?: number;              // 選項 ID
    optionOrder: number;      // 選項順序
    optionText: string;       // 選項內容
}

// 問券題目介面
export interface SurveyQuestion {
    id?: number;                          // 題目 ID
    questionOrder: number;                // 題目順序
    questionText: string;                 // 題目內容
    questionType: SurveyQuestionType;     // 題目類型
    isRequired: boolean;                  // 是否必填
    maxRating?: number;                   // 評分題最大分數
    options?: SurveyOption[];             // 選項列表
}

// 問券介面
export interface Survey {
    id: number;                     // 問券 ID
    examId: number;                 // 測驗 ID
    examTitle?: string;             // 測驗標題
    title: string;                  // 問券標題
    description?: string;           // 問券描述
    status: SurveyStatus;           // 問券狀態
    isAnonymous: boolean;           // 是否匿名調查
    createdAt?: string;             // 建立時間
    updatedAt?: string;             // 更新時間
    startAt?: string;               // 開始時間
    endAt?: string;                 // 結束時間
    questions?: SurveyQuestion[];   // 題目列表
    totalQuestions?: number;        // 總題目數
    totalResponses?: number;        // 總回覆數
}

// 建立問券請求介面
export interface CreateSurveyRequest {
    examId: number;                 // 測驗 ID
    title: string;                  // 問券標題
    description?: string;           // 問券描述
    isAnonymous?: boolean;          // 是否匿名調查
    startAt?: string;               // 開始時間
    endAt?: string;                 // 結束時間
    questions?: SurveyQuestion[];   // 題目列表
}

// 問券答案介面
export interface SurveyAnswer {
    id?: number;                    // 答案 ID
    questionId: number;             // 題目 ID
    questionText?: string;          // 題目內容
    selectedOptionId?: number;      // 選擇的選項 ID（單選題）
    selectedOptionText?: string;    // 選擇的選項文字
    textAnswer?: string;            // 文字答案（文字題）
    ratingValue?: number;           // 評分值（評分題）
    multipleOptionIds?: number[];   // 多選選項 ID 列表
    multipleOptionTexts?: string[]; // 多選選項文字列表
}

// 問券回覆介面
export interface SurveyResponse {
    id?: number;                    // 回覆 ID
    surveyId: number;               // 問券 ID
    surveyTitle?: string;           // 問券標題
    studentId?: number;             // 學員 ID
    responderEmail?: string;        // 填寫者 Email
    responderName?: string;         // 填寫者姓名
    submittedAt?: string;           // 提交時間
    answers?: SurveyAnswer[];       // 答案列表
}

// 選項分布 DTO
export interface OptionDistribution {
    optionId: number;               // 選項 ID
    optionText: string;             // 選項文字
    count: number;                  // 選擇次數
    percentage: number;             // 百分比
}

// 評分統計 DTO
export interface RatingStatistics {
    averageRating: number;          // 平均分數
    maxRating: number;              // 最大分數
    distribution: Record<number, number>; // 評分分布
}

// 問券題目統計 DTO
export interface SurveyQuestionStatistics {
    questionId: number;                               // 題目 ID
    questionText: string;                             // 題目內容
    questionType: SurveyQuestionType;                 // 題目類型
    totalAnswers: number;                             // 總答案數
    optionDistribution?: Record<number, OptionDistribution>; // 選項分布
    ratingStatistics?: RatingStatistics;              // 評分統計
    textAnswers?: string[];                           // 文字回答列表
}

// 問券統計 DTO
export interface SurveyStatistics {
    surveyId: number;                                 // 問券 ID
    surveyTitle: string;                              // 問券標題
    totalResponses: number;                           // 總回覆數
    questionStatistics: SurveyQuestionStatistics[];   // 題目統計列表
}
