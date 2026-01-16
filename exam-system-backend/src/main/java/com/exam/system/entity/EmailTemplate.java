package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 郵件範本實體
 * 可重複使用的郵件範本
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "email_template")
public class EmailTemplate {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 範本名稱
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
     * 純文字內容（備用）
     */
    @Column(columnDefinition = "TEXT")
    private String plainTextContent;

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
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 實體更新前的回調
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
