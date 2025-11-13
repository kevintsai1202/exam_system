package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 測驗調查欄位配置實體
 * 定義特定測驗中調查欄位的配置（必填/選填、顯示順序等）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "exam_survey_field_config",
    indexes = {
        @Index(name = "idx_exam_survey_config_exam_id", columnList = "exam_id"),
        @Index(name = "idx_exam_survey_config_survey_field_id", columnList = "survey_field_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_exam_survey_field", columnNames = {"exam_id", "survey_field_id"})
    }
)
public class ExamSurveyFieldConfig {

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
     * 調查欄位
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "survey_field_id", nullable = false)
    private SurveyField surveyField;

    /**
     * 是否必填
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isRequired = false;

    /**
     * 顯示順序（測驗內的順序）
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        if (this.isRequired == null) {
            this.isRequired = false;
        }
        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }
    }

}
