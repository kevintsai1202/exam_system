package com.exam.system.repository;

import com.exam.system.entity.Survey;
import com.exam.system.entity.SurveyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 問券調查 Repository
 */
@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {

    /**
     * 根據測驗 ID 查詢問券列表
     */
    List<Survey> findByExamId(Long examId);

    /**
     * 根據測驗 ID 和狀態查詢問券
     */
    List<Survey> findByExamIdAndStatus(Long examId, SurveyStatus status);

    /**
     * 根據狀態查詢問券
     */
    List<Survey> findByStatus(SurveyStatus status);

    /**
     * 查詢問券並載入題目
     */
    @Query("SELECT s FROM Survey s LEFT JOIN FETCH s.questions WHERE s.id = :id")
    Optional<Survey> findByIdWithQuestions(@Param("id") Long id);

    /**
     * 查詢問券並載入題目和選項
     */
    @Query("SELECT DISTINCT s FROM Survey s " +
            "LEFT JOIN FETCH s.questions q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE s.id = :id")
    Optional<Survey> findByIdWithQuestionsAndOptions(@Param("id") Long id);

    /**
     * 統計測驗的問券數量
     */
    long countByExamId(Long examId);
}
