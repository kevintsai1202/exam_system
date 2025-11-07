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
 * 學員實體
 * 代表參與測驗的學員
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "student",
    indexes = {
        @Index(name = "idx_student_session_id", columnList = "sessionId"),
        @Index(name = "idx_student_exam_id", columnList = "exam_id")
    }
)
public class Student {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所屬測驗
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    /**
     * Session ID（UUID 格式）
     * 用於識別學員的獨立 Session
     */
    @Column(nullable = false, unique = true, length = 36)
    private String sessionId;

    /**
     * 學員姓名
     */
    @Column(nullable = false, length = 50)
    private String name;

    /**
     * 學員 Email
     */
    @Column(nullable = false, length = 100)
    private String email;

    /**
     * 頭像圖示名稱
     */
    @Column(nullable = false, length = 20)
    private String avatarIcon;

    /**
     * 累積總分
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    /**
     * 加入時間
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    /**
     * 學員的答案列表
     */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();

    /**
     * 實體建立前的回調，設定加入時間
     */
    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
        if (this.totalScore == null) {
            this.totalScore = 0;
        }
    }

    /**
     * 增加分數
     *
     * @param points 增加的分數
     */
    public void addScore(int points) {
        this.totalScore += points;
    }

    /**
     * 新增答案
     */
    public void addAnswer(Answer answer) {
        answers.add(answer);
        answer.setStudent(this);
    }

    /**
     * 移除答案
     */
    public void removeAnswer(Answer answer) {
        answers.remove(answer);
        answer.setStudent(null);
    }

}