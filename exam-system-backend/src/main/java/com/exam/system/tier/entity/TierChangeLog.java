package com.exam.system.tier.entity;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 升降級稽核 log — 每次 tier 變動寫入一筆，不可變
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tier_change_log",
       indexes = @Index(name = "idx_tier_log_owner", columnList = "owner_id"))
public class TierChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTier fromTier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTier toTier;

    /** 操作者（ADMIN）；自動排程降級時為 NULL */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(length = 500)
    private String reason;

    /** PAID 到期日（升 PAID 時記，自動降級時為 NULL） */
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        this.changedAt = LocalDateTime.now();
    }
}
