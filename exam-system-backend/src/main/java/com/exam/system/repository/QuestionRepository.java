package com.exam.system.repository;

import com.exam.system.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 題目資料訪問介面
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /**
     * 根據測驗 ID 查詢所有題目（按順序排序）
     *
     * @param examId 測驗 ID
     * @return 題目列表
     */
    List<Question> findByExamIdOrderByQuestionOrderAsc(Long examId);

    /**
     * 根據測驗 ID 和題目順序查詢題目
     *
     * @param examId 測驗 ID
     * @param questionOrder 題目順序
     * @return 題目實體（Optional）
     */
    Optional<Question> findByExamIdAndQuestionOrder(Long examId, Integer questionOrder);

    /**
     * 查詢題目並預先載入選項（避免 N+1 查詢問題）
     *
     * @param id 題目 ID
     * @return 題目實體（Optional）
     */
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Optional<Question> findByIdWithOptions(@Param("id") Long id);

    /**
     * 根據測驗 ID 查詢所有題目並預先載入選項
     *
     * @param examId 測驗 ID
     * @return 題目列表
     */
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.exam.id = :examId ORDER BY q.questionOrder ASC")
    List<Question> findByExamIdWithOptions(@Param("examId") Long examId);

    /**
     * 統計測驗的題目數量
     *
     * @param examId 測驗 ID
     * @return 題目數量
     */
    long countByExamId(Long examId);

    /**
     * 刪除測驗的所有題目
     *
     * @param examId 測驗 ID
     */
    void deleteByExamId(Long examId);

}