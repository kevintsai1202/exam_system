package com.exam.system.dto;

import com.exam.system.entity.ChartType;
import com.exam.system.entity.ExamStatus;
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

import java.time.LocalDateTime;
import java.util.List;

/**
 * 測驗 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamDTO {

    /**
     * 測驗 ID（回應時使用）
     */
    private Long id;

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
    @Min(value = 5, message = "倒數時間不能少於 5 秒")
    @Max(value = 300, message = "倒數時間不能超過 300 秒")
    private Integer questionTimeLimit;

    /**
     * 累積統計圖表類型
     */
    @NotNull(message = "累積統計圖表類型不能為空")
    private ChartType cumulativeChartType;

    /**
     * 測驗狀態（回應時使用）
     */
    private ExamStatus status;

    /**
     * 當前題目索引（回應時使用）
     */
    private Integer currentQuestionIndex;

    /**
     * 加入碼（回應時使用）
     */
    private String accessCode;

    /**
     * QR Code URL（回應時使用）
     */
    private String qrCodeUrl;

    /**
     * QR Code Base64 編碼圖片（回應時使用）
     */
    private String qrCodeBase64;

    /**
     * 建立時間（回應時使用）
     */
    private LocalDateTime createdAt;

    /**
     * 開始時間（回應時使用）
     */
    private LocalDateTime startedAt;

    /**
     * 結束時間（回應時使用）
     */
    private LocalDateTime endedAt;

    /**
     * 題目總數（回應時使用）
     */
    private Integer totalQuestions;

    /**
     * 學員總數（回應時使用）
     */
    private Integer totalStudents;

    /**
     * 題目列表
     */
    @Valid
    @NotEmpty(message = "測驗必須至少有一個題目")
    private List<QuestionDTO> questions;

}