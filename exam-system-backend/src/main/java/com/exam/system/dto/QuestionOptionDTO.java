package com.exam.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 題目選項 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionDTO {

    /**
     * 選項 ID（回應時使用）
     */
    private Long id;

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