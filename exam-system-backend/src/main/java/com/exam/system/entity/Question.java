package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 題目實體
 * 代表測驗中的一個題目
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "question",
    indexes = {
        @Index(name = "idx_question_exam_id", columnList = "exam_id")
    }
)
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
     * 正確答案選項 ID（單選題、是非題使用）
     */
    @Column(nullable = false)
    private Long correctOptionId;

    /**
     * 題目類型（單選題、是非題、複選題）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private QuestionType questionType = QuestionType.SINGLE_CHOICE;

    /**
     * 正確答案選項 IDs JSON（複選題使用）
     * 格式範例: "[1,3,5]"
     */
    @Column(columnDefinition = "TEXT")
    private String correctOptionIdsJson;

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
     * 判斷指定選項是否為正確答案（單選題、是非題使用）
     *
     * @param optionId 選項 ID
     * @return true 如果是正確答案
     */
    public boolean isCorrectAnswer(Long optionId) {
        if (questionType == QuestionType.MULTIPLE_CHOICE) {
            throw new IllegalStateException("複選題請使用 isCorrectAnswer(Set<Long>) 方法");
        }
        return this.correctOptionId != null && this.correctOptionId.equals(optionId);
    }

    /**
     * 判斷指定選項集合是否為正確答案（複選題使用）
     *
     * @param selectedOptionIds 選中的選項 ID 集合
     * @return true 如果答案完全正確
     */
    public boolean isCorrectAnswer(Set<Long> selectedOptionIds) {
        if (questionType != QuestionType.MULTIPLE_CHOICE) {
            throw new IllegalStateException("單選題或是非題請使用 isCorrectAnswer(Long) 方法");
        }

        Set<Long> correctIds = getCorrectOptionIdsSet();
        return correctIds.equals(selectedOptionIds);
    }

    /**
     * 獲取正確答案選項 ID 集合（複選題使用）
     *
     * @return 正確答案 ID 集合
     */
    public Set<Long> getCorrectOptionIdsSet() {
        if (correctOptionIdsJson == null || correctOptionIdsJson.trim().isEmpty()) {
            return new HashSet<>();
        }

        // 解析 JSON 陣列格式: "[1,3,5]"
        String trimmed = correctOptionIdsJson.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            String content = trimmed.substring(1, trimmed.length() - 1);
            if (content.isEmpty()) {
                return new HashSet<>();
            }

            return Arrays.stream(content.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toSet());
        }

        return new HashSet<>();
    }

    /**
     * 設定正確答案選項 ID 集合（複選題使用）
     *
     * @param correctOptionIds 正確答案 ID 集合
     */
    public void setCorrectOptionIdsSet(Set<Long> correctOptionIds) {
        if (correctOptionIds == null || correctOptionIds.isEmpty()) {
            this.correctOptionIdsJson = "[]";
            return;
        }

        // 轉換為 JSON 陣列格式: "[1,3,5]"
        String json = correctOptionIds.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));

        this.correctOptionIdsJson = json;
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