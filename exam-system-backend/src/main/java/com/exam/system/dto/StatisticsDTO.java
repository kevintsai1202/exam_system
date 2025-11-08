package com.exam.system.dto;

import com.exam.system.entity.ChartType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 統計資料 DTO
 * 此類別作為統計相關 DTO 的容器
 */
public class StatisticsDTO {

    /**
     * 題目統計 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionStatistics {
        /**
         * 題目 ID
         */
        private Long questionId;

        /**
         * 題目內容
         */
        private String questionText;

        /**
         * 總作答人數
         */
        private Long totalAnswers;

        /**
         * 圖表類型
         */
        private ChartType chartType;

        /**
         * 選項統計列表
         */
        private List<OptionStatistic> optionStatistics;

        /**
         * 正確率（百分比）
         */
        private Double correctRate;

        /**
         * 統計時間
         */
        private LocalDateTime timestamp;
    }

    /**
     * 選項統計
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionStatistic {
        /**
         * 選項 ID
         */
        private Long optionId;

        /**
         * 選項內容
         */
        private String optionText;

        /**
         * 選擇此選項的人數
         */
        private Long count;

        /**
         * 百分比
         */
        private Double percentage;

        /**
         * 是否為正確答案
         */
        private Boolean isCorrect;
    }

    /**
     * 累積統計 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CumulativeStatistics {
        /**
         * 測驗 ID
         */
        private Long examId;

        /**
         * 總學員數
         */
        private Integer totalStudents;

        /**
         * 總題目數
         */
        private Integer totalQuestions;

        /**
         * 圖表類型
         */
        private ChartType chartType;

        /**
         * 分數分布列表
         */
        private List<ScoreDistribution> scoreDistribution;

        /**
         * 平均分數
         */
        private Double averageScore;

        /**
         * 統計時間
         */
        private LocalDateTime timestamp;
    }

    /**
     * 分數分布
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreDistribution {
        /**
         * 分數
         */
        private Integer score;

        /**
         * 該分數的人數
         */
        private Long count;

        /**
         * 百分比
         */
        private Double percentage;
    }

    /**
     * 職業分布統計 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OccupationDistribution {
        /**
         * 測驗 ID
         */
        private Long examId;

        /**
         * 總學員數
         */
        private Integer totalStudents;

        /**
         * 職業分布列表
         */
        private List<OccupationStatistic> occupationStatistics;

        /**
         * 統計時間
         */
        private LocalDateTime timestamp;
    }

    /**
     * 職業統計
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OccupationStatistic {
        /**
         * 職業名稱
         */
        private String occupation;

        /**
         * 該職業的人數
         */
        private Long count;

        /**
         * 百分比
         */
        private Double percentage;
    }

}