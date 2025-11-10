package com.exam.system.dto;

import com.exam.system.entity.ChartType;
import com.exam.system.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

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
     * 題目類型（單選題、是非題、複選題）
     */
    @Builder.Default
    private QuestionType questionType = QuestionType.SINGLE_CHOICE;

    /**
     * 正確答案選項順序（單選題、是非題建立時使用）
     */
    private Integer correctOptionOrder;

    /**
     * 正確答案選項順序列表（複選題建立時使用）
     */
    private List<Integer> correctOptionOrders;

    /**
     * 正確答案選項 ID（單選題、是非題回應時使用）
     */
    private Long correctOptionId;

    /**
     * 正確答案選項 IDs（複選題回應時使用）
     */
    private Set<Long> correctOptionIds;

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
    private List<QuestionOptionDTO> options;

}