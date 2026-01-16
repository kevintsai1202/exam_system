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
 * 問券回覆實體
 * 代表一位填寫者的完整問券回覆
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "survey_response", indexes = {
        @Index(name = "idx_survey_response_survey_id", columnList = "survey_id"),
        @Index(name = "idx_survey_response_student_id", columnList = "student_id")
})
public class SurveyResponse {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所屬問券
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    /**
     * 填寫者（學員）- 若非匿名問券
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    /**
     * 填寫者 Email
     */
    @Column(length = 100)
    private String responderEmail;

    /**
     * 填寫者姓名
     */
    @Column(length = 50)
    private String responderName;

    /**
     * 提交時間
     */
    @Column(nullable = false)
    private LocalDateTime submittedAt;

    /**
     * 回覆的答案列表
     */
    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SurveyAnswer> answers = new ArrayList<>();

    /**
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }

    /**
     * 新增答案
     */
    public void addAnswer(SurveyAnswer answer) {
        answers.add(answer);
        answer.setResponse(this);
    }
}
