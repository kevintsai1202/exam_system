package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

/**
 * 問券答案實體
 * 代表單一題目的答案
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "survey_answer", indexes = {
        @Index(name = "idx_survey_answer_response_id", columnList = "response_id"),
        @Index(name = "idx_survey_answer_question_id", columnList = "question_id")
})
public class SurveyAnswer {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所屬回覆
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    private SurveyResponse response;

    /**
     * 所屬題目
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private SurveyQuestion question;

    /**
     * 選擇的選項（適用於單選題）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private SurveyOption selectedOption;

    /**
     * 文字答案（適用於文字題）
     */
    @Column(length = 2000)
    private String textAnswer;

    /**
     * 評分值（適用於評分題）
     */
    private Integer ratingValue;

    /**
     * 多選選項 ID 列表（適用於多選題）
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<Long> multipleOptionIds;
}
