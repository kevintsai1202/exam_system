package com.exam.system.dto;

import com.exam.system.entity.ChartType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 測驗匯出/匯入 DTO
 * 用於 JSON 格式的測驗匯出和匯入，包含題目和問卷調查欄位配置
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamExportDTO {

    /**
     * 測驗標題
     */
    @NotBlank(message = "測驗標題不能為空")
    @Size(min = 1, max = 100, message = "測驗標題長度必須在 1-100 之間")
    private String title;

    /**
     * 測驗描述
     */
    @Size(max = 500, message = "測驗描述長度不能超過 500")
    private String description;

    /**
     * 每題倒數時間（秒）
     */
    @NotNull(message = "倒數時間不能為空")
    @Min(value = 10, message = "倒數時間不能少於 10 秒")
    @Max(value = 300, message = "倒數時間不能超過 300 秒")
    private Integer questionTimeLimit;

    /**
     * 問卷調查欄位配置列表（可選）
     */
    @Valid
    private List<SurveyFieldConfigExportDTO> surveyFieldConfigs;

    /**
     * 題目列表
     */
    @Valid
    @NotEmpty(message = "測驗必須至少有一個題目")
    private List<QuestionExportDTO> questions;

    /**
     * 題目匯出 DTO（內部類別）
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionExportDTO {

        /**
         * 題目順序
         */
        @NotNull(message = "題目順序不能為空")
        private Integer questionOrder;

        /**
         * 題目內容
         */
        @NotBlank(message = "題目內容不能為空")
        private String questionText;

        /**
         * 正確答案選項順序
         */
        @NotNull(message = "正確答案選項順序不能為空")
        private Integer correctOptionOrder;

        /**
         * 單題統計圖表類型
         */
        @NotNull(message = "單題統計圖表類型不能為空")
        private ChartType singleStatChartType;

        /**
         * 累積統計圖表類型
         */
        @NotNull(message = "累積統計圖表類型不能為空")
        private ChartType cumulativeChartType;

        /**
         * 題目選項列表
         */
        @Valid
        @NotEmpty(message = "題目必須至少有一個選項")
        private List<OptionExportDTO> options;
    }

    /**
     * 選項匯出 DTO（內部類別）
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionExportDTO {

        /**
         * 選項順序
         */
        @NotNull(message = "選項順序不能為空")
        private Integer optionOrder;

        /**
         * 選項內容
         */
        @NotBlank(message = "選項內容不能為空")
        private String optionText;
    }

    /**
     * 問卷調查欄位配置匯出 DTO（內部類別）
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SurveyFieldConfigExportDTO {

        /**
         * 調查欄位鍵值
         */
        @NotBlank(message = "調查欄位鍵值不能為空")
        private String fieldKey;

        /**
         * 是否必填
         */
        @NotNull(message = "是否必填不能為空")
        private Boolean isRequired;

        /**
         * 顯示順序
         */
        @NotNull(message = "顯示順序不能為空")
        private Integer displayOrder;
    }
}
