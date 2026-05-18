package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaResetPeriod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 配額政策 DTO — ADMIN 後台編輯用
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaPolicyDTO {
    private Long id;
    private UserTier tier;
    private QuotaDimension dimension;
    private Integer limitValue;
    private QuotaResetPeriod resetPeriod;
}
