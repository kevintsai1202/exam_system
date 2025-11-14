package com.exam.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Markdown 匯出請求 DTO
 * 用於指定匯出選項
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkdownExportRequestDTO {

    /**
     * 是否包含答案（預設 true）
     * true: 匯出講師版（含答案）
     * false: 匯出學員版（無答案）
     */
    @Builder.Default
    private Boolean includeAnswers = true;

    /**
     * 是否顯示題號（預設 true）
     */
    @Builder.Default
    private Boolean showQuestionNumbers = true;

    /**
     * 是否顯示選項編號（A, B, C, D...）（預設 true）
     */
    @Builder.Default
    private Boolean showOptionLabels = true;

    /**
     * 是否顯示測驗資訊（標題、描述等）（預設 true）
     */
    @Builder.Default
    private Boolean showExamInfo = true;

}
