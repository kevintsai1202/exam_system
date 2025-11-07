package com.exam.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 答案 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerDTO {

    /**
     * 答案 ID（回應時使用）
     */
    private Long id;

    /**
     * 學員 Session ID（請求時使用）
     */
    @jakarta.validation.constraints.NotBlank(message = "Session ID 不能為空")
    private String sessionId;

    /**
     * 學員 ID（回應時使用）
     */
    private Long studentId;

    /**
     * 題目 ID
     */
    @NotNull(message = "題目 ID 不能為空")
    private Long questionId;

    /**
     * 題目內容（回應時使用）
     */
    private String questionText;

    /**
     * 選擇的選項 ID
     */
    @NotNull(message = "選項 ID 不能為空")
    private Long selectedOptionId;

    /**
     * 選擇的選項內容（回應時使用）
     */
    private String selectedOptionText;

    /**
     * 正確答案選項 ID（回應時使用）
     */
    private Long correctOptionId;

    /**
     * 是否答對（回應時使用）
     */
    private Boolean isCorrect;

    /**
     * 作答時間（回應時使用）
     */
    private LocalDateTime answeredAt;

    /**
     * 當前累積總分（回應時使用）
     */
    private Integer currentTotalScore;

}