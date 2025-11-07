package com.exam.system.repository;

import com.exam.system.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 題目選項資料訪問介面
 */
@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {

    /**
     * 根據題目 ID 查詢所有選項（按順序排序）
     *
     * @param questionId 題目 ID
     * @return 選項列表
     */
    List<QuestionOption> findByQuestionIdOrderByOptionOrderAsc(Long questionId);

    /**
     * 統計題目的選項數量
     *
     * @param questionId 題目 ID
     * @return 選項數量
     */
    long countByQuestionId(Long questionId);

}