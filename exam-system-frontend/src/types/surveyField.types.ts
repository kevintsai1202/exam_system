/**
 * 調查欄位相關型別定義
 */

// 調查欄位介面
export interface SurveyField {
  id: number;                    // 調查欄位 ID
  fieldKey: string;              // 欄位唯一鍵（如 "occupation", "age_range"）
  fieldName: string;             // 欄位顯示名稱（如 "職業", "年齡層"）
  fieldType: string;             // 欄位類型（目前只支援 "SELECT"）
  options: string[];             // 選項列表
  isActive: boolean;             // 是否啟用
  displayOrder: number;          // 顯示順序
  createdAt: string;             // 建立時間
  updatedAt: string;             // 更新時間
}

// 調查欄位值統計
export interface SurveyFieldValueStatistic {
  value: string;                 // 欄位值
  count: number;                 // 選擇此值的人數
  percentage: number;            // 百分比（相對於總學員數）
  respondentPercentage: number;  // 百分比（相對於填寫者）
}

// 調查欄位分布統計
export interface SurveyFieldDistribution {
  examId: number;                          // 測驗 ID
  fieldKey: string;                        // 調查欄位鍵值
  fieldName: string;                       // 調查欄位名稱
  totalStudents: number;                   // 總學員數
  respondentCount: number;                 // 填寫此欄位的學員數
  valueStatistics: SurveyFieldValueStatistic[];  // 值統計列表
  timestamp: string;                       // 統計時間
}
