package com.exam.system.repository;

import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * 測驗資料訪問介面
 */
@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    /**
     * 根據 accessCode 查詢測驗
     *
     * @param accessCode 加入碼
     * @return 測驗實體（Optional）
     */
    Optional<Exam> findByAccessCode(String accessCode);

    /**
     * 檢查 accessCode 是否存在
     *
     * @param accessCode 加入碼
     * @return true 如果存在
     */
    boolean existsByAccessCode(String accessCode);

    /**
     * 根據狀態查詢測驗列表
     *
     * @param status 測驗狀態
     * @return 測驗列表
     */
    List<Exam> findByStatus(ExamStatus status);

    /**
     * 查詢測驗並預先載入題目（避免 N+1 查詢問題）
     *
     * @param id 測驗 ID
     * @return 測驗實體（Optional）
     */
    @Query("SELECT e FROM Exam e LEFT JOIN FETCH e.questions WHERE e.id = :id")
    Optional<Exam> findByIdWithQuestions(@Param("id") Long id);

    /**
     * 查詢測驗並預先載入學員（避免 N+1 查詢問題）
     *
     * @param id 測驗 ID
     * @return 測驗實體（Optional）
     */
    @Query("SELECT e FROM Exam e LEFT JOIN FETCH e.students WHERE e.id = :id")
    Optional<Exam> findByIdWithStudents(@Param("id") Long id);

}