package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

/**
 * 題目實體
 * 代表測驗中的一個題目
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "question")
public class Question {

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
     * 正確答案選項 ID
     */
    @Column(nullable = false)
    private Long correctOptionId;

    /**
     * 單題統計圖表類型
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChartType singleStatChartType;

    /**
     * 累積統計圖表類型
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChartType cumulativeChartType;

    /**
     * 題目的選項列表
     */
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("optionOrder ASC")
    @Builder.Default
    private List<QuestionOption> options = new ArrayList<>();

    /**
     * 此題目的答案列表
     */
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();

    /**
     * 判斷指定選項是否為正確答案
     *
     * @param optionId 選項 ID
     * @return true 如果是正確答案
     */
    public boolean isCorrectAnswer(Long optionId) {
        return this.correctOptionId != null && this.correctOptionId.equals(optionId);
    }

    /**
     * 新增選項
     */
    public void addOption(QuestionOption option) {
        options.add(option);
        option.setQuestion(this);
    }

    /**
     * 移除選項
     */
    public void removeOption(QuestionOption option) {
        options.remove(option);
        option.setQuestion(null);
    }

    /**
     * 新增答案
     */
    public void addAnswer(Answer answer) {
        answers.add(answer);
        answer.setQuestion(this);
    }

    /**
     * 移除答案
     */
    public void removeAnswer(Answer answer) {
        answers.remove(answer);
        answer.setQuestion(null);
    }

}