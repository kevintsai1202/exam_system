package com.exam.system.repository;

import com.exam.system.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 用戶會話資料存取層
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    /**
     * 根據用戶 ID 查找活躍會話
     */
    Optional<UserSession> findByUserIdAndStatus(Long userId, UserSession.SessionStatus status);

    /**
     * 根據用戶 ID 查找所有會話
     */
    List<UserSession> findByUserId(Long userId);

    /**
     * 根據測驗 ID 查找所有活躍會話
     */
    List<UserSession> findByExamIdAndStatus(Long examId, UserSession.SessionStatus status);

    /**
     * 根據學生 Session ID 查找會話
     */
    Optional<UserSession> findByStudentSessionId(String studentSessionId);

    /**
     * 刪除用戶的所有會話
     */
    void deleteByUserId(Long userId);

    /**
     * 刪除測驗的所有會話
     */
    void deleteByExamId(Long examId);
}
