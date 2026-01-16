package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 郵件活動實體
 * 代表一次郵件發送活動
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "email_campaign", indexes = {
        @Index(name = "idx_email_campaign_exam_id", columnList = "exam_id"),
        @Index(name = "idx_email_campaign_status", columnList = "status")
})
public class EmailCampaign {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 目標測驗
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    /**
     * 關聯的問券（可選）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id")
    private Survey survey;

    /**
     * 使用的範本（可選）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private EmailTemplate template;

    /**
     * 活動名稱
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 郵件主旨
     */
    @Column(nullable = false, length = 200)
    private String subject;

    /**
     * HTML 內容
     */
    @Column(columnDefinition = "TEXT")
    private String htmlContent;

    /**
     * 活動狀態
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CampaignStatus status = CampaignStatus.DRAFT;

    /**
     * 排程發送時間
     */
    private LocalDateTime scheduledAt;

    /**
     * 實際發送時間
     */
    private LocalDateTime sentAt;

    /**
     * 總收件人數
     */
    @Builder.Default
    private Integer totalRecipients = 0;

    /**
     * 已發送數
     */
    @Builder.Default
    private Integer sentCount = 0;

    /**
     * 發送失敗數
     */
    @Builder.Default
    private Integer failedCount = 0;

    /**
     * 建立時間
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新時間
     */
    private LocalDateTime updatedAt;

    /**
     * 收件人列表
     */
    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmailRecipient> recipients = new ArrayList<>();

    /**
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = CampaignStatus.DRAFT;
        }
    }

    /**
     * 實體更新前的回調
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 新增收件人
     */
    public void addRecipient(EmailRecipient recipient) {
        recipients.add(recipient);
        recipient.setCampaign(this);
    }

    /**
     * 開始發送
     */
    public void startSending() {
        this.status = CampaignStatus.SENDING;
    }

    /**
     * 完成發送
     */
    public void completeSending() {
        this.status = CampaignStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * 標記發送失敗
     */
    public void markFailed() {
        this.status = CampaignStatus.FAILED;
    }

    /**
     * 增加成功計數
     */
    public void incrementSentCount() {
        this.sentCount++;
    }

    /**
     * 增加失敗計數
     */
    public void incrementFailedCount() {
        this.failedCount++;
    }
}
