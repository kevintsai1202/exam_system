package com.exam.system.tier.dto;

import com.exam.system.tier.entity.QuotaDimension;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 配額檢查結果 — 非破壞性查詢，用於 UI 判斷按鈕是否可用
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaCheckResultDTO {
    private boolean allowed;
    private QuotaDimension dimension;
    private int limit;
    private int used;
    private int remaining;
    /** 拒絕原因：TIER_NOT_ALLOWED | PERIOD_LIMIT_REACHED */
    private String reasonIfDenied;
}
