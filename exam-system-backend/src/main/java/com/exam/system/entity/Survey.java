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
 * 問券調查實體
 * 代表與測驗關聯的問券調查
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "survey", indexes = {
        @Index(name = "idx_survey_exam_id", columnList = "exam_id"),
        @Index(name = "idx_survey_status", columnList = "status")
})
public class Survey {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 關聯的測驗
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    /**
     * 問券標題
     */
    @Column(nullable = false, length = 200)
    private String title;

    /**
     * 問券描述
     */
    @Column(length = 1000)
    private String description;

    /**
     * 問券狀態
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SurveyStatus status = SurveyStatus.DRAFT;

    /**
     * 是否匿名調查
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isAnonymous = false;

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
     * 問券開始時間（可選）
     */
    private LocalDateTime startAt;

    /**
     * 問券結束時間（可選）
     */
    private LocalDateTime endAt;

    /**
     * 問券的題目列表
     */
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    @Builder.Default
    private List<SurveyQuestion> questions = new ArrayList<>();

    /**
     * 問券的回覆列表
     */
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SurveyResponse> responses = new ArrayList<>();

    /**
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = SurveyStatus.DRAFT;
        }
        if (this.isAnonymous == null) {
            this.isAnonymous = false;
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
     * 啟用問券
     */
    public void activate() {
        this.status = SurveyStatus.ACTIVE;
        if (this.startAt == null) {
            this.startAt = LocalDateTime.now();
        }
    }

    /**
     * 關閉問券
     */
    public void close() {
        this.status = SurveyStatus.CLOSED;
        if (this.endAt == null) {
            this.endAt = LocalDateTime.now();
        }
    }

    /**
     * 新增題目
     */
    public void addQuestion(SurveyQuestion question) {
        questions.add(question);
        question.setSurvey(this);
    }

    /**
     * 移除題目
     */
    public void removeQuestion(SurveyQuestion question) {
        questions.remove(question);
        question.setSurvey(null);
    }

    /**
     * 新增回覆
     */
    public void addResponse(SurveyResponse response) {
        responses.add(response);
        response.setSurvey(this);
    }
}
