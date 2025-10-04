package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 答案實體
 * 代表學員對某個題目的作答記錄
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "answer", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "question_id"})
})
public class Answer {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 作答學員
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /**
     * 所屬題目
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /**
     * 選擇的選項 ID
     */
    @Column(nullable = false)
    private Long selectedOptionId;

    /**
     * 是否答對
     */
    @Column(nullable = false)
    private Boolean isCorrect;

    /**
     * 作答時間
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime answeredAt;

    /**
     * 答題耗時（秒）
     * 從題目推送到作答的時間差
     */
    @Column(nullable = false)
    private Integer answerTimeSeconds;

    /**
     * 實體建立前的回調，設定作答時間
     */
    @PrePersist
    protected void onCreate() {
        this.answeredAt = LocalDateTime.now();
    }

}