package com.exam.system.repository;

import com.exam.system.entity.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 問券回覆 Repository
 */
@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    /**
     * 根據問券 ID 查詢回覆列表
     */
    List<SurveyResponse> findBySurveyId(Long surveyId);

    /**
     * 根據問券 ID 和學員 ID 查詢回覆
     */
    Optional<SurveyResponse> findBySurveyIdAndStudentId(Long surveyId, Long studentId);

    /**
     * 根據學員 ID 查詢回覆列表
     */
    List<SurveyResponse> findByStudentId(Long studentId);

    /**
     * 查詢回覆並載入答案
     */
    @Query("SELECT r FROM SurveyResponse r LEFT JOIN FETCH r.answers WHERE r.id = :id")
    Optional<SurveyResponse> findByIdWithAnswers(@Param("id") Long id);

    /**
     * 統計問券的回覆數量
     */
    long countBySurveyId(Long surveyId);

    /**
     * 檢查學員是否已填寫問券
     */
    boolean existsBySurveyIdAndStudentId(Long surveyId, Long studentId);

    /**
     * 根據 Email 檢查是否已填寫問券
     */
    boolean existsBySurveyIdAndResponderEmail(Long surveyId, String responderEmail);
}
