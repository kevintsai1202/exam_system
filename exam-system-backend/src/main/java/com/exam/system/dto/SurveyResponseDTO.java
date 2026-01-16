package com.exam.system.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 問券回覆 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyResponseDTO {

    private Long id;

    @NotNull(message = "問券 ID 不能為空")
    private Long surveyId;

    private String surveyTitle;

    private Long studentId;

    private String responderEmail;

    private String responderName;

    private LocalDateTime submittedAt;

    @Valid
    private List<SurveyAnswerDTO> answers;

    /**
     * 問券答案 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SurveyAnswerDTO {

        private Long id;

        @NotNull(message = "題目 ID 不能為空")
        private Long questionId;

        private String questionText;

        private Long selectedOptionId;

        private String selectedOptionText;

        private String textAnswer;

        private Integer ratingValue;

        private List<Long> multipleOptionIds;

        private List<String> multipleOptionTexts;
    }
}
