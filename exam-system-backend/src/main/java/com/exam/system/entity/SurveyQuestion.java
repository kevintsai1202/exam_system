package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

/**
 * 問券題目實體
 * 代表問券中的一個題目
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "survey_question", indexes = {
        @Index(name = "idx_survey_question_survey_id", columnList = "survey_id")
})
public class SurveyQuestion {

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
     * 題目順序（從 1 開始）
     */
    @Column(nullable = false)
    private Integer questionOrder;

    /**
     * 題目內容
     */
    @Column(nullable = false, length = 500)
    private String questionText;

    /**
     * 題目類型
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SurveyQuestionType questionType;

    /**
     * 是否必填
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isRequired = true;

    /**
     * 評分題最大分數（僅適用於 RATING 類型）
     */
    private Integer maxRating;

    /**
     * 題目的選項列表（適用於選擇題）
     */
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("optionOrder ASC")
    @Builder.Default
    private List<SurveyOption> options = new ArrayList<>();

    /**
     * 此題目的答案列表
     */
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SurveyAnswer> answers = new ArrayList<>();

    /**
     * 新增選項
     */
    public void addOption(SurveyOption option) {
        options.add(option);
        option.setQuestion(this);
    }

    /**
     * 移除選項
     */
    public void removeOption(SurveyOption option) {
        options.remove(option);
        option.setQuestion(null);
    }

    /**
     * 新增答案
     */
    public void addAnswer(SurveyAnswer answer) {
        answers.add(answer);
        answer.setQuestion(this);
    }
}
