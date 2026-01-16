package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 位置統計資料傳輸物件
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationStatisticsDTO {

    /**
     * 總參與人數
     */
    private int totalCount;

    /**
     * 各縣市統計
     * Key: 縣市代碼 (如 "TPE", "KHH")
     * Value: 該縣市人數
     */
    private Map<String, Integer> locationCounts;

    /**
     * 各縣市名稱對照
     * Key: 縣市代碼
     * Value: 縣市名稱 (如 "台北市", "高雄市")
     */
    private Map<String, String> locationNames;
}
