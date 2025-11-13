package com.exam.system.repository;

import com.exam.system.entity.ExamSurveyFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 測驗調查欄位配置 Repository
 */
@Repository
public interface ExamSurveyFieldConfigRepository extends JpaRepository<ExamSurveyFieldConfig, Long> {

    /**
     * 根據測驗 ID 查詢調查欄位配置（按顯示順序排序）
     *
     * @param examId 測驗 ID
     * @return 調查欄位配置列表
     */
    List<ExamSurveyFieldConfig> findByExamIdOrderByDisplayOrderAsc(Long examId);

    /**
     * 根據測驗 ID 刪除所有調查欄位配置
     *
     * @param examId 測驗 ID
     */
    void deleteByExamId(Long examId);

}
