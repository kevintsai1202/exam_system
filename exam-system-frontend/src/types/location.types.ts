/**
 * 地點統計相關型別定義
 */

// 地點統計介面
export interface LocationStatistics {
  totalCount: number;                    // 有填寫地點的學員總數
  locationCounts: Record<string, number>; // 各縣市代碼對應人數
  locationNames: Record<string, string>;  // 縣市代碼對應顯示名稱
}

