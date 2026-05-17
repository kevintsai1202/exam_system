package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ADMIN 手動變更 tier 的請求 DTO
 */
@Data
public class TierChangeRequestDTO {
    @NotNull
    private UserTier targetTier;
    /** 升 PAID 必填，降 FREE 可空 */
    private LocalDateTime expiresAt;
    private String reason;
}
