package com.exam.system.repository;

import com.exam.system.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 答案資料訪問介面
 */
@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /**
     * 根據學員 ID 查詢所有答案
     *
     * @param studentId 學員 ID
     * @return 答案列表
     */
    List<Answer> findByStudentId(Long studentId);

    /**
     * 根據題目 ID 查詢所有答案
     *
     * @param questionId 題目 ID
     * @return 答案列表
     */
    List<Answer> findByQuestionId(Long questionId);

    /**
     * 根據學員 ID 和題目 ID 查詢答案
     *
     * @param studentId 學員 ID
     * @param questionId 題目 ID
     * @return 答案實體（Optional）
     */
    Optional<Answer> findByStudentIdAndQuestionId(Long studentId, Long questionId);

    /**
     * 檢查學員是否已作答過該題目
     *
     * @param studentId 學員 ID
     * @param questionId 題目 ID
     * @return true 如果已作答
     */
    boolean existsByStudentIdAndQuestionId(Long studentId, Long questionId);

    /**
     * 統計學員在測驗中答對的題目數量
     *
     * @param studentId 學員 ID
     * @param examId 測驗 ID
     * @return 答對題目數量
     */
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.student.id = :studentId AND a.question.exam.id = :examId AND a.isCorrect = true")
    long countCorrectAnswersByStudentIdAndExamId(@Param("studentId") Long studentId, @Param("examId") Long examId);

    /**
     * 根據題目 ID 統計各選項被選擇的次數
     * 用於生成單題統計圖表
     *
     * @param questionId 題目 ID
     * @return 選項 ID 與數量的映射
     */
    @Query("SELECT a.selectedOptionId as optionId, COUNT(a) as count FROM Answer a WHERE a.question.id = :questionId GROUP BY a.selectedOptionId")
    List<Map<String, Object>> countByQuestionIdGroupByOption(@Param("questionId") Long questionId);

    /**
     * 統計題目的總作答人數
     *
     * @param questionId 題目 ID
     * @return 作答人數
     */
    long countByQuestionId(Long questionId);

    /**
     * 統計題目答對的人數
     *
     * @param questionId 題目 ID
     * @return 答對人數
     */
    long countByQuestionIdAndIsCorrect(Long questionId, Boolean isCorrect);

    /**
     * 刪除指定測驗的所有答案
     *
     * @param examId 測驗 ID
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Answer a WHERE a.question.exam.id = :examId")
    void deleteByExamId(@Param("examId") Long examId);

}