package com.exam.system.tier.entity;

import com.exam.system.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 配額用量計數
 * 每位 owner × dimension × 當期錨點日 一筆；
 * 跨期會 INSERT 新筆，舊筆保留作為趨勢分析（保留 12 個月）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quota_usage",
       uniqueConstraints = @UniqueConstraint(
           name = "uq_quota_usage_owner_dim_period",
           columnNames = {"owner_id", "dimension", "period_start_date"}),
       indexes = @Index(name = "idx_quota_usage_owner_dim",
                        columnList = "owner_id, dimension"))
public class QuotaUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuotaDimension dimension;

    /** 該講師當期起始日（依錨點計算） */
    @Column(name = "period_start_date", nullable = false)
    private LocalDate periodStartDate;

    /** 當期已使用量；NEVER 維度的 periodStartDate 固定為錨點原始日 */
    @Column(nullable = false)
    @Builder.Default
    private Integer usedValue = 0;

    @Column(nullable = false)
    private LocalDateTime lastUpdatedAt;

    @PrePersist
    @PreUpdate
    protected void onChange() {
        this.lastUpdatedAt = LocalDateTime.now();
    }
}
