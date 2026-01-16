package com.exam.system.repository;

import com.exam.system.entity.SurveyAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * 問券答案 Repository
 */
@Repository
public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, Long> {

    /**
     * 根據回覆 ID 查詢答案列表
     */
    List<SurveyAnswer> findByResponseId(Long responseId);

    /**
     * 根據題目 ID 查詢答案列表
     */
    List<SurveyAnswer> findByQuestionId(Long questionId);

    /**
     * 統計題目的答案數量
     */
    long countByQuestionId(Long questionId);

    /**
     * 統計單選題各選項的選擇次數
     */
    @Query("SELECT a.selectedOption.id, COUNT(a) FROM SurveyAnswer a " +
            "WHERE a.question.id = :questionId AND a.selectedOption IS NOT NULL " +
            "GROUP BY a.selectedOption.id")
    List<Object[]> countByQuestionIdGroupBySelectedOption(@Param("questionId") Long questionId);

    /**
     * 計算評分題的平均分數
     */
    @Query("SELECT AVG(a.ratingValue) FROM SurveyAnswer a " +
            "WHERE a.question.id = :questionId AND a.ratingValue IS NOT NULL")
    Double calculateAverageRatingByQuestionId(@Param("questionId") Long questionId);

    /**
     * 獲取評分分布
     */
    @Query("SELECT a.ratingValue, COUNT(a) FROM SurveyAnswer a " +
            "WHERE a.question.id = :questionId AND a.ratingValue IS NOT NULL " +
            "GROUP BY a.ratingValue ORDER BY a.ratingValue")
    List<Object[]> countByQuestionIdGroupByRatingValue(@Param("questionId") Long questionId);
}
