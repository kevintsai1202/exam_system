package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 升降級歷史 DTO — 避免直接序列化 TierChangeLog 實體（含敏感 User 欄位）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TierChangeLogDTO {
    private Long id;
    private UserTier fromTier;
    private UserTier toTier;
    private String reason;
    private LocalDateTime expiresAt;
    private LocalDateTime changedAt;
    /** 操作者（自動降級時為 null） */
    private Long changedById;
    private String changedByName;
}
