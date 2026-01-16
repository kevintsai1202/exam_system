package com.exam.system.service;

import com.exam.system.entity.UserSession;
import com.exam.system.entity.UserSession.SessionStatus;
import com.exam.system.entity.UserSession.SessionType;
import com.exam.system.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 會話管理服務
 */
@Service
@RequiredArgsConstructor
public class SessionService {

    private final UserSessionRepository sessionRepository;

    /**
     * 保存或更新會話狀態
     */
    @Transactional
    public UserSession saveSession(Long userId, Long examId, Long currentQuestionId,
            SessionType sessionType, String studentSessionId) {
        // 查找現有活躍會話
        Optional<UserSession> existingSession = sessionRepository
                .findByUserIdAndStatus(userId, SessionStatus.ACTIVE);

        UserSession session;
        if (existingSession.isPresent()) {
            session = existingSession.get();
            session.setExamId(examId);
            session.setCurrentQuestionId(currentQuestionId);
            session.updateLastActive();
        } else {
            session = UserSession.builder()
                    .userId(userId)
                    .examId(examId)
                    .currentQuestionId(currentQuestionId)
                    .sessionType(sessionType)
                    .studentSessionId(studentSessionId)
                    .status(SessionStatus.ACTIVE)
                    .build();
        }

        return sessionRepository.save(session);
    }

    /**
     * 取得用戶的活躍會話
     */
    public Optional<UserSession> getActiveSession(Long userId) {
        return sessionRepository.findByUserIdAndStatus(userId, SessionStatus.ACTIVE);
    }

    /**
     * 根據學生 Session ID 取得會話
     */
    public Optional<UserSession> getSessionByStudentId(String studentSessionId) {
        return sessionRepository.findByStudentSessionId(studentSessionId);
    }

    /**
     * 更新會話狀態
     */
    @Transactional
    public void updateSessionStatus(Long sessionId, SessionStatus status) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus(status);
            session.updateLastActive();
            sessionRepository.save(session);
        });
    }

    /**
     * 標記會話為已完成
     */
    @Transactional
    public void completeSession(Long sessionId) {
        updateSessionStatus(sessionId, SessionStatus.COMPLETED);
    }

    /**
     * 標記會話為斷線
     */
    @Transactional
    public void markDisconnected(Long sessionId) {
        updateSessionStatus(sessionId, SessionStatus.DISCONNECTED);
    }

    /**
     * 恢復斷線的會話
     */
    @Transactional
    public Optional<UserSession> restoreSession(Long userId) {
        // 查找最近的斷線會話
        return sessionRepository.findByUserId(userId).stream()
                .filter(s -> s.getStatus() == SessionStatus.DISCONNECTED)
                .max((a, b) -> a.getLastActiveAt().compareTo(b.getLastActiveAt()))
                .map(session -> {
                    session.setStatus(SessionStatus.ACTIVE);
                    session.updateLastActive();
                    return sessionRepository.save(session);
                });
    }

    /**
     * 清理過期會話（超過 24 小時的斷線會話）
     */
    @Transactional
    public void cleanupExpiredSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        sessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SessionStatus.DISCONNECTED)
                .filter(s -> s.getLastActiveAt().isBefore(cutoff))
                .forEach(s -> sessionRepository.delete(s));
    }

    /**
     * 刪除會話
     */
    @Transactional
    public void deleteSession(Long sessionId) {
        sessionRepository.deleteById(sessionId);
    }
}
