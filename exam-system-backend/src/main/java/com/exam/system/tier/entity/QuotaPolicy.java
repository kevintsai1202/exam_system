package com.exam.system.tier.entity;

import com.exam.system.entity.UserTier;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 配額政策 — 每個 tier × dimension 對應一筆上限值
 * 種子資料由 V7 提供；ADMIN 可在後台調整數值不需發版
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quota_policy",
       uniqueConstraints = @UniqueConstraint(name = "uq_quota_policy_tier_dim",
                                              columnNames = {"tier", "dimension"}))
public class QuotaPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTier tier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuotaDimension dimension;

    /** 配額上限值（不可為 NULL；0 代表該 tier 該維度完全禁用） */
    @Column(nullable = false)
    private Integer limitValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private QuotaResetPeriod resetPeriod;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onChange() {
        this.updatedAt = LocalDateTime.now();
    }
}
