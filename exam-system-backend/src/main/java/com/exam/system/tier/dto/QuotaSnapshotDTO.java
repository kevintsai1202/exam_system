package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * 講師配額完整快照 — 儀表板用
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaSnapshotDTO {
    private UserTier tier;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private long daysUntilReset;
    private List<QuotaItem> items;

    /**
     * 單一維度的配額條目
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuotaItem {
        private String dimension;
        private int limit;
        private int used;
        private int remaining;
        private String resetPeriod;
    }
}
