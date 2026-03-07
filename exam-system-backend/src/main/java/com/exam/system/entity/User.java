package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 用戶實體
 * 儲存 Email 與 Google OAuth2 的用戶資訊
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_google_id", columnList = "googleId")
})
public class User {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 帳號 Email（唯一識別）
     */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /**
     * 用戶顯示名稱
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 密碼雜湊值（Email 登入使用）
     */
    @Column(length = 100)
    private String passwordHash;

    /**
     * Google 唯一識別碼（可為空，代表尚未綁定）
     */
    @Column(unique = true, length = 100)
    private String googleId;

    /**
     * Google 頭像 URL
     */
    @Column(length = 500)
    private String avatarUrl;

    /**
     * 用戶角色
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.STUDENT;

    /**
     * 是否允許進入問券管理
     */
    @Column(nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean surveyManagementEnabled = true;

    /**
     * 是否允許進入郵件管理
     */
    @Column(nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean emailManagementEnabled = true;

    /**
     * 帳號建立時間
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 最後登入時間
     */
    private LocalDateTime lastLoginAt;

    /**
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastLoginAt = LocalDateTime.now();
    }

    /**
     * 更新最後登入時間
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
}
