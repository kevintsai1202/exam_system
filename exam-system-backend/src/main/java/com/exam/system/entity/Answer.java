package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 答案實體
 * 代表學員對某個題目的作答記錄
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "answer",
    indexes = {
        @Index(name = "idx_answer_question_id", columnList = "question_id"),
        @Index(name = "idx_answer_student_id", columnList = "student_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "question_id"})
    }
)
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
     * 選擇的選項 ID（單選題、是非題使用）
     */
    @Column(nullable = false)
    private Long selectedOptionId;

    /**
     * 選擇的選項 IDs JSON（複選題使用）
     * 格式範例: "[1,3,5]"
     */
    @Column(columnDefinition = "TEXT")
    private String selectedOptionIdsJson;

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
     * 實體建立前的回調，設定作答時間
     */
    @PrePersist
    protected void onCreate() {
        this.answeredAt = LocalDateTime.now();
    }

    /**
     * 獲取選擇的選項 ID 集合（複選題使用）
     *
     * @return 選擇的選項 ID 集合
     */
    public Set<Long> getSelectedOptionIdsSet() {
        if (selectedOptionIdsJson == null || selectedOptionIdsJson.trim().isEmpty()) {
            return new HashSet<>();
        }

        // 解析 JSON 陣列格式: "[1,3,5]"
        String trimmed = selectedOptionIdsJson.trim();
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
     * 設定選擇的選項 ID 集合（複選題使用）
     *
     * @param selectedOptionIds 選擇的選項 ID 集合
     */
    public void setSelectedOptionIdsSet(Set<Long> selectedOptionIds) {
        if (selectedOptionIds == null || selectedOptionIds.isEmpty()) {
            this.selectedOptionIdsJson = "[]";
            return;
        }

        // 轉換為 JSON 陣列格式: "[1,3,5]"
        String json = selectedOptionIds.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));

        this.selectedOptionIdsJson = json;
    }

}