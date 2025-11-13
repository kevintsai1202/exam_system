package com.exam.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 測驗調查欄位配置 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSurveyFieldConfigDTO {

    /**
     * 配置 ID（回應時使用）
     */
    private Long id;

    /**
     * 調查欄位鍵值（建立時使用）
     */
    @NotBlank(message = "調查欄位鍵值不能為空")
    private String fieldKey;

    /**
     * 調查欄位名稱（回應時使用）
     */
    private String fieldName;

    /**
     * 調查欄位類型（回應時使用）
     */
    private String fieldType;

    /**
     * 選項列表（回應時使用）
     */
    private List<String> options;

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
