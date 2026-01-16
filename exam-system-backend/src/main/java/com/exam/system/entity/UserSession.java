package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 用戶會話實體
 * 儲存用戶當前測驗狀態，支援斷線後恢復
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_session", indexes = {
        @Index(name = "idx_session_user_id", columnList = "userId"),
        @Index(name = "idx_session_exam_id", columnList = "examId")
})
public class UserSession {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用戶 ID
     */
    @Column(nullable = false)
    private Long userId;

    /**
     * 測驗 ID
     */
    @Column(nullable = false)
    private Long examId;

    /**
     * 當前題目 ID（可為空，表示尚未開始答題）
     */
    private Long currentQuestionId;

    /**
     * 會話類型：INSTRUCTOR 或 STUDENT
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionType sessionType;

    /**
     * 會話狀態
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    /**
     * 學生 Session ID（僅學生適用）
     */
    @Column(length = 36)
    private String studentSessionId;

    /**
     * 最後活動時間
     */
    @Column(nullable = false)
    private LocalDateTime lastActiveAt;

    /**
     * 建立時間
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastActiveAt = LocalDateTime.now();
    }

    /**
     * 更新最後活動時間
     */
    public void updateLastActive() {
        this.lastActiveAt = LocalDateTime.now();
    }

    /**
     * 會話類型枚舉
     */
    public enum SessionType {
        INSTRUCTOR, STUDENT
    }

    /**
     * 會話狀態枚舉
     */
    public enum SessionStatus {
        ACTIVE, // 進行中
        COMPLETED, // 已完成
        DISCONNECTED // 已斷線
    }
}
