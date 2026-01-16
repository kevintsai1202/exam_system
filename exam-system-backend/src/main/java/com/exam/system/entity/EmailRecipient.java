package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 郵件收件人實體
 * 記錄每封郵件的發送狀態
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "email_recipient", indexes = {
        @Index(name = "idx_email_recipient_campaign_id", columnList = "campaign_id"),
        @Index(name = "idx_email_recipient_student_id", columnList = "student_id"),
        @Index(name = "idx_email_recipient_status", columnList = "status")
})
public class EmailRecipient {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所屬郵件活動
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private EmailCampaign campaign;

    /**
     * 學員（可選）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    /**
     * 收件人 Email
     */
    @Column(nullable = false, length = 100)
    private String email;

    /**
     * 收件人姓名
     */
    @Column(length = 50)
    private String name;

    /**
     * 發送狀態
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.PENDING;

    /**
     * 發送時間
     */
    private LocalDateTime sentAt;

    /**
     * 錯誤訊息（發送失敗時）
     */
    @Column(length = 500)
    private String errorMessage;

    /**
     * 標記為已發送
     */
    public void markSent() {
        this.status = DeliveryStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * 標記為發送失敗
     */
    public void markFailed(String errorMessage) {
        this.status = DeliveryStatus.FAILED;
        this.errorMessage = errorMessage;
    }
}
