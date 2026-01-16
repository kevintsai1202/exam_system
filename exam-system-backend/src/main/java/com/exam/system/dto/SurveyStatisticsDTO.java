package com.exam.system.dto;

import com.exam.system.entity.SurveyQuestionType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;
import java.util.Map;

/**
 * 問券統計 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyStatisticsDTO {

    private Long surveyId;

    private String surveyTitle;

    private Integer totalResponses;

    private List<QuestionStatisticsDTO> questionStatistics;

    /**
     * 題目統計 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionStatisticsDTO {

        private Long questionId;

        private String questionText;

        private SurveyQuestionType questionType;

        private Integer totalAnswers;

        /**
         * 選項分布（適用於選擇題）
         * Key: 選項 ID，Value: 選擇次數
         */
        private Map<Long, OptionDistributionDTO> optionDistribution;

        /**
         * 評分統計（適用於評分題）
         */
        private RatingStatisticsDTO ratingStatistics;

        /**
         * 文字回答列表（適用於文字題）
         */
        private List<String> textAnswers;
    }

    /**
     * 選項分布 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionDistributionDTO {

        private Long optionId;

        private String optionText;

        private Integer count;

        private Double percentage;
    }

    /**
     * 評分統計 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RatingStatisticsDTO {

        private Double averageRating;

        private Integer maxRating;

        /**
         * 評分分布
         * Key: 評分值，Value: 選擇次數
         */
        private Map<Integer, Integer> distribution;
    }
}
