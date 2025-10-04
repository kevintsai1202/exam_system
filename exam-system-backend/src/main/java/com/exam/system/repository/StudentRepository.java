package com.exam.system.repository;

import com.exam.system.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 學員資料訪問介面
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    /**
     * 根據 sessionId 查詢學員
     *
     * @param sessionId Session ID
     * @return 學員實體（Optional）
     */
    Optional<Student> findBySessionId(String sessionId);

    /**
     * 根據測驗 ID 查詢所有學員
     *
     * @param examId 測驗 ID
     * @return 學員列表
     */
    List<Student> findByExamId(Long examId);

    /**
     * 根據測驗 ID 查詢所有學員（按總分降序排列）
     *
     * @param examId 測驗 ID
     * @return 學員列表
     */
    List<Student> findByExamIdOrderByTotalScoreDesc(Long examId);

    /**
     * 統計測驗的學員數量
     *
     * @param examId 測驗 ID
     * @return 學員數量
     */
    long countByExamId(Long examId);

    /**
     * 檢查 sessionId 是否存在
     *
     * @param sessionId Session ID
     * @return true 如果存在
     */
    boolean existsBySessionId(String sessionId);

    /**
     * 根據測驗 ID 統計各分數的學員數量
     * 用於生成累積分數分布圖
     *
     * @param examId 測驗 ID
     * @return 分數與數量的映射
     */
    @Query("SELECT s.totalScore as score, COUNT(s) as count FROM Student s WHERE s.exam.id = :examId GROUP BY s.totalScore ORDER BY s.totalScore ASC")
    List<Map<String, Object>> countByExamIdGroupByTotalScore(@Param("examId") Long examId);

    /**
     * 查詢測驗的前 N 名學員（排行榜）
     *
     * @param examId 測驗 ID
     * @param limit 返回名次數量
     * @return 學員列表
     */
    @Query(value = "SELECT * FROM student WHERE exam_id = :examId ORDER BY total_score DESC LIMIT :limit", nativeQuery = true)
    List<Student> findTopNByExamId(@Param("examId") Long examId, @Param("limit") int limit);

}