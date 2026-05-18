package com.exam.system.websocket;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 測驗學員即時在線追蹤器
 *
 * 使用 STOMP session ID 追蹤哪些 WebSocket 連線是學員（已宣告 presence），
 * 以便在斷線時能正確更新在線人數。
 *
 * 結構：
 *   examSessions: examId → Set<stompSessionId>
 *   sessionExamMap: stompSessionId → examId（反查用）
 */
@Service
public class ExamPresenceTracker {

    /** examId → 已宣告 presence 的 STOMP session ID 集合 */
    private final Map<Long, Set<String>> examSessions = new ConcurrentHashMap<>();

    /** stompSessionId → examId（斷線時反查） */
    private final Map<String, Long> sessionExamMap = new ConcurrentHashMap<>();

    /**
     * 學員宣告上線
     *
     * @param examId         測驗 ID
     * @param stompSessionId STOMP session ID
     * @return 更新後的在線人數
     */
    public int addPresence(Long examId, String stompSessionId) {
        examSessions.computeIfAbsent(examId, id -> ConcurrentHashMap.newKeySet()).add(stompSessionId);
        sessionExamMap.put(stompSessionId, examId);
        return examSessions.get(examId).size();
    }

    /**
     * 移除學員連線（斷線時呼叫）
     *
     * @param stompSessionId STOMP session ID
     * @return 該連線所屬的 examId；若不是學員連線則回傳 null
     */
    public Long removePresence(String stompSessionId) {
        Long examId = sessionExamMap.remove(stompSessionId);
        if (examId == null) {
            return null;
        }
        Set<String> sessions = examSessions.get(examId);
        if (sessions != null) {
            sessions.remove(stompSessionId);
        }
        return examId;
    }

    /**
     * 取得指定測驗的在線人數
     *
     * @param examId 測驗 ID
     * @return 在線人數
     */
    public int getCount(Long examId) {
        Set<String> sessions = examSessions.get(examId);
        return sessions == null ? 0 : sessions.size();
    }
}
