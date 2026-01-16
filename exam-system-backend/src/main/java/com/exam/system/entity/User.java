package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 用戶實體
 * 儲存 Google OAuth2 登入的用戶資訊
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
     * Google Email
     */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /**
     * 用戶顯示名稱
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Google 唯一識別碼
     */
    @Column(nullable = false, unique = true, length = 100)
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
