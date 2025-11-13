package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 調查欄位實體
 * 定義可重複使用的調查欄位（如職業、年齡層、性別等）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "survey_field",
    indexes = {
        @Index(name = "idx_survey_field_key", columnList = "fieldKey")
    }
)
public class SurveyField {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 欄位唯一鍵（如 "occupation", "age_range", "gender"）
     */
    @Column(nullable = false, unique = true, length = 50)
    private String fieldKey;

    /**
     * 欄位顯示名稱（如 "職業", "年齡層", "性別"）
     */
    @Column(nullable = false, length = 100)
    private String fieldName;

    /**
     * 欄位類型（目前只支援 SELECT）
     */
    @Column(nullable = false, length = 20)
    private String fieldType;

    /**
     * 選項列表（JSON 格式儲存）
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> options;

    /**
     * 是否啟用
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * 顯示順序
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

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
     * 實體建立前的回調
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }
    }

    /**
     * 實體更新前的回調
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
