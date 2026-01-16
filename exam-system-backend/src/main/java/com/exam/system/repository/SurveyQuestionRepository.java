package com.exam.system.repository;

import com.exam.system.entity.SurveyQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 問券題目 Repository
 */
@Repository
public interface SurveyQuestionRepository extends JpaRepository<SurveyQuestion, Long> {

    /**
     * 根據問券 ID 查詢題目列表
     */
    List<SurveyQuestion> findBySurveyIdOrderByQuestionOrderAsc(Long surveyId);

    /**
     * 查詢題目並載入選項
     */
    @Query("SELECT q FROM SurveyQuestion q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Optional<SurveyQuestion> findByIdWithOptions(@Param("id") Long id);

    /**
     * 統計問券的題目數量
     */
    long countBySurveyId(Long surveyId);

    /**
     * 刪除問券的所有題目
     */
    void deleteBySurveyId(Long surveyId);
}
