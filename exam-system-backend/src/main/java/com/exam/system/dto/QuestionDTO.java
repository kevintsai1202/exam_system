package com.exam.system.dto;

import com.exam.system.entity.ChartType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 題目 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDTO {

    /**
     * 題目 ID（回應時使用）
     */
    private Long id;

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
     * 正確答案選項順序（建立時使用）
     */
    private Integer correctOptionOrder;

    /**
     * 正確答案選項 ID（回應時使用）
     */
    private Long correctOptionId;

    /**
     * 題目統計圖表類型
     */
    @NotNull(message = "題目統計圖表類型不能為空")
    private ChartType chartType;

    /**
     * 題目選項列表
     */
    @Valid
    @NotEmpty(message = "題目必須至少有一個選項")
    private List<QuestionOptionDTO> options;

}