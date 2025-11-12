package com.exam.system.service;

import com.exam.system.config.ExamProperties;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * 測驗安全服務
 * 負責管理講師 Session 和權限驗證
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamSecurityService {

    private final ExamProperties examProperties;

    /**
     * 儲存講師 Session：examId -> instructorSessionId
     */
    private final Map<Long, String> instructorSessions = new ConcurrentHashMap<>();

    /**
     * 檢查管理員 Admin Token 是否正確
     *
     * @param providedToken Header 提供的 Token
     * @return true 表示 Token 驗證通過
     */
    public boolean isAdminTokenValid(String providedToken) {
        String configuredToken = examProperties.getSecurity().getAdminToken();
        if (!StringUtils.hasText(configuredToken)) {
            log.warn("Admin token is not configured; privileged payloads will be rejected.");
            return false;
        }
        return StringUtils.hasText(providedToken) && configuredToken.equals(providedToken);
    }

    /**
     * 為測驗建立講師 Session
     * 當測驗啟動時呼叫
     *
     * @param examId 測驗 ID
     * @return 新產生的 instructorSessionId
     */
    public String createInstructorSession(Long examId) {
        String sessionId = UUID.randomUUID().toString();
        instructorSessions.put(examId, sessionId);
        log.info("Created instructor session for exam {}: {}", examId, sessionId);
        return sessionId;
    }

    /**
     * 驗證講師 Session
     * 依據測驗狀態決定是否需要驗證
     *
     * @param exam 測驗實體
     * @param providedSessionId 前端提供的 Session ID
     * @return true 表示驗證通過或無需驗證
     */
    public boolean validateInstructorSession(Exam exam, String providedSessionId) {
        // 測驗未開始或已結束，無需 Session 驗證
        if (exam.getStatus() == ExamStatus.CREATED || exam.getStatus() == ExamStatus.ENDED) {
            log.debug("Exam {} status is {}, no session validation required",
                     exam.getId(), exam.getStatus());
            return true;
        }

        // 測驗進行中，需要驗證 Session
        if (exam.getStatus() == ExamStatus.STARTED) {
            String storedSessionId = instructorSessions.get(exam.getId());

            if (storedSessionId == null) {
                // 特殊情況：如果測驗已啟動但尚未推送題目（currentQuestionStartedAt 為 null）
                // 允許自動恢復 session（例如後端重啟的情況）
                if (exam.getCurrentQuestionStartedAt() == null) {
                    log.info("Exam {} is STARTED but no question pushed yet, auto-recovering session for provided ID: {}",
                            exam.getId(), providedSessionId);
                    // 使用前端提供的 sessionId 重新建立 session
                    if (providedSessionId != null && !providedSessionId.isEmpty()) {
                        instructorSessions.put(exam.getId(), providedSessionId);
                        log.info("Session auto-recovered for exam {}", exam.getId());
                        return true;
                    }
                }

                log.warn("No instructor session found for exam {} and cannot auto-recover", exam.getId());
                return false;
            }

            if (!storedSessionId.equals(providedSessionId)) {
                log.warn("Invalid instructor session for exam {}. Expected: {}, Got: {}",
                        exam.getId(), storedSessionId, providedSessionId);
                return false;
            }

            log.debug("Instructor session validated successfully for exam {}", exam.getId());
            return true;
        }

        return false;
    }

    /**
     * 清除講師 Session
     * 當測驗結束時呼叫
     *
     * @param examId 測驗 ID
     */
    public void clearInstructorSession(Long examId) {
        String removedSession = instructorSessions.remove(examId);
        if (removedSession != null) {
            log.info("Cleared instructor session for exam {}: {}", examId, removedSession);
        }
    }

    /**
     * 取得講師 Session ID（用於測試或偵錯）
     *
     * @param examId 測驗 ID
     * @return Session ID，如果不存在則回傳 null
     */
    public String getInstructorSession(Long examId) {
        return instructorSessions.get(examId);
    }
}
