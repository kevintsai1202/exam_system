package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    @Column(length = 100)
    private String googleEmail;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isGmailVerified = false;

    /** 頭像（最新一場參賽時使用的） */
    @Column(length = 20)
    private String avatarIcon;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 建立前回調：強制 email 正規化為 lowercase + trim
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
        if (this.isGmailVerified == null) {
            this.isGmailVerified = false;
        }
    }

    /**
     * 更新前回調：updatedAt 自動填值
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
