package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * 跨測驗學員主檔
 * 以 lowercase email 為穩定識別 key；首次學員加入測驗時建立，之後同 email 再加入會更新最新資料
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "student_profile", indexes = {
        @Index(name = "idx_student_profile_google_id", columnList = "googleId")
})
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 穩定識別 key：lowercase email（unique constraint 由 DB 層 uq_student_profile_email 維護） */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /** 學員顯示名稱（最新一次加入時更新） */
    @Column(nullable = false, length = 50)
    private String name;

    /** Google 帳號 ID（綁定後填入） */
    @Column(length = 100)
    private String googleId;

    /** Google 帳號 Email（透過 OAuth 取得，可能與 email 不同） */
    @Column(length = 100)
    private String googleEmail;

    /** 是否已完成 Gmail 驗證（用於後續講師寄信通知） */
    @Builder.Default
    @Column(nullable = false)
    private Boolean isGmailVerified = false;

    /** 頭像（最新一場參賽時使用的） */
    @Column(length = 20)
    private String avatarIcon;

    /**
     * 會員取得來源
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AcquisitionSource acquisitionSource;

    /**
     * 加入時間（首次成為會員的時間，與 createdAt 可能相同）
     */
    private LocalDateTime acquiredAt;

    /**
     * 來源實體 ID（對應 exam_id / survey_id / campaign_id / import_batch_id）
     */
    private Long acquiredViaId;

    /**
     * 首次同意書取得時間
     */
    private LocalDateTime firstConsentAt;

    /**
     * 同意書版本（對應 config/consent-versions/v{N}.md）
     */
    @Column(length = 20)
    private String consentVersion;

    /**
     * 講師對此會員的備註
     */
    @Lob
    @Column
    private String notes;

    /** 建立時間（首次學員加入時記錄） */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 最近一次更新時間（每次同 email 再加入或 profile 被修改時更新） */
    private LocalDateTime updatedAt;

    /**
     * 將 email 正規化為 lowercase + trim
     * 用 Locale.ROOT 避免土耳其 locale 把 "I" 變成 "ı"（dotless i），破壞 unique 識別
     */
    private void normalizeEmail() {
        if (this.email != null) {
            this.email = this.email.trim().toLowerCase(Locale.ROOT);
        }
    }

    /**
     * 建立前回調：填寫時間欄位 + 強制 email 正規化
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        normalizeEmail();
        if (this.isGmailVerified == null) {
            this.isGmailVerified = false;
        }
    }

    /**
     * 更新前回調：updatedAt 自動填值 + email 一律重做正規化
     * （避免 service 層忘記正規化導致 unique key 失效）
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        normalizeEmail();
    }
}
