package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 問券選項實體
 * 代表問券題目的選項（適用於選擇題）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "survey_option", indexes = {
        @Index(name = "idx_survey_option_question_id", columnList = "question_id")
})
public class SurveyOption {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所屬題目
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private SurveyQuestion question;

    /**
     * 選項順序（從 1 開始）
     */
    @Column(nullable = false)
    private Integer optionOrder;

    /**
     * 選項內容
     */
    @Column(nullable = false, length = 200)
    private String optionText;
}
