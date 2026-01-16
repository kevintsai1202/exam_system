package com.exam.system.dto;

import com.exam.system.entity.SurveyQuestionType;
import com.exam.system.entity.SurveyStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 問券調查 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyDTO {

    private Long id;

    @NotNull(message = "測驗 ID 不能為空")
    private Long examId;

    private String examTitle;

    @NotBlank(message = "問券標題不能為空")
    @Size(max = 200, message = "問券標題最多 200 字")
    private String title;

    @Size(max = 1000, message = "問券描述最多 1000 字")
    private String description;

    private SurveyStatus status;

    private Boolean isAnonymous;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    @Valid
    private List<SurveyQuestionDTO> questions;

    private Integer totalQuestions;

    private Integer totalResponses;

    /**
     * 問券題目 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SurveyQuestionDTO {

        private Long id;

        private Integer questionOrder;

        @NotBlank(message = "題目內容不能為空")
        @Size(max = 500, message = "題目內容最多 500 字")
        private String questionText;

        @NotNull(message = "題目類型不能為空")
        private SurveyQuestionType questionType;

        private Boolean isRequired;

        private Integer maxRating;

        @Valid
        private List<SurveyOptionDTO> options;
    }

    /**
     * 問券選項 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SurveyOptionDTO {

        private Long id;

        private Integer optionOrder;

        @NotBlank(message = "選項內容不能為空")
        @Size(max = 200, message = "選項內容最多 200 字")
        private String optionText;
    }
}
