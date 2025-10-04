package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 排行榜 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardDTO {

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
     * 排行榜列表
     */
    private List<LeaderboardEntry> leaderboard;

    /**
     * 統計時間
     */
    private LocalDateTime timestamp;

    /**
     * 排行榜條目
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        /**
         * 名次
         */
        private Integer rank;

        /**
         * 學員 ID
         */
        private Long studentId;

        /**
         * 學員姓名
         */
        private String name;

        /**
         * 頭像圖示
         */
        private String avatarIcon;

        /**
         * 總分
         */
        private Integer totalScore;

        /**
         * 正確率（百分比）
         */
        private Double correctRate;

        /**
         * 總答題時間（秒）
         */
        private Integer totalAnswerTimeSeconds;
    }

}