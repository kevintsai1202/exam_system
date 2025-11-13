package com.exam.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 調查欄位 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyFieldDTO {

    /**
     * 調查欄位 ID（回應時使用）
     */
    private Long id;

    /**
     * 欄位唯一鍵
     */
    @NotBlank(message = "欄位鍵值不能為空")
    @Size(max = 50, message = "欄位鍵值長度不能超過 50")
    private String fieldKey;

    /**
     * 欄位顯示名稱
     */
    @NotBlank(message = "欄位名稱不能為空")
    @Size(max = 100, message = "欄位名稱長度不能超過 100")
    private String fieldName;

    /**
     * 欄位類型
     */
    @NotBlank(message = "欄位類型不能為空")
    private String fieldType;

    /**
     * 選項列表
     */
    @NotNull(message = "選項列表不能為空")
    private List<String> options;

    /**
     * 是否啟用
     */
    private Boolean isActive;

    /**
     * 顯示順序
     */
    private Integer displayOrder;

    /**
     * 建立時間（回應時使用）
     */
    private LocalDateTime createdAt;

    /**
     * 更新時間（回應時使用）
     */
    private LocalDateTime updatedAt;

}
