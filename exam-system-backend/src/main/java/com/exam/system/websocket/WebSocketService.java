package com.exam.system.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * WebSocket 服務
 * 負責透過 STOMP 協定向客戶端推送訊息
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {

    /**
     * Spring STOMP 訊息模板
     * 用於發送訊息到指定的 Topic 或 Queue
     */
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 廣播訊息給所有訂閱指定 Topic 的客戶端
     *
     * @param destination Topic 路徑（例如：/topic/exam/1/status）
     * @param payload 訊息內容
     */
    public void broadcast(String destination, Object payload) {
        try {
            log.debug("Broadcasting message to {}: {}", destination, payload);
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception e) {
            log.error("Failed to broadcast message to {}: {}", destination, e.getMessage(), e);
        }
    }

    /**
     * 發送訊息給特定使用者
     *
     * @param username 使用者名稱或 Session ID
     * @param destination Destination 路徑
     * @param payload 訊息內容
     */
    public void sendToUser(String username, String destination, Object payload) {
        try {
            log.debug("Sending message to user {} at {}: {}", username, destination, payload);
            messagingTemplate.convertAndSendToUser(username, destination, payload);
        } catch (Exception e) {
            log.error("Failed to send message to user {} at {}: {}", username, destination, e.getMessage(), e);
        }
    }

    // ==================== 測驗相關廣播方法 ====================

    /**
     * 廣播測驗狀態更新
     *
     * @param examId 測驗 ID
     * @param payload 狀態更新訊息
     */
    public void broadcastExamStatus(Long examId, Object payload) {
        String destination = String.format("/topic/exam/%d/status", examId);
        broadcast(destination, payload);
    }

    /**
     * 廣播新學員加入通知
     *
     * @param examId 測驗 ID
     * @param payload 學員資訊
     */
    public void broadcastStudentJoined(Long examId, Object payload) {
        String destination = String.format("/topic/exam/%d/students", examId);
        broadcast(destination, payload);
    }

    /**
     * 廣播題目資訊
     *
     * @param examId 測驗 ID
     * @param payload 題目資訊
     */
    public void broadcastQuestion(Long examId, Object payload) {
        String destination = String.format("/topic/exam/%d/question", examId);
        broadcast(destination, payload);
    }

    /**
     * 廣播題目統計結果
     *
     * @param examId 測驗 ID
     * @param questionId 題目 ID
     * @param payload 統計資訊
     */
    public void broadcastQuestionStatistics(Long examId, Long questionId, Object payload) {
        String destination = String.format("/topic/exam/%d/statistics/question/%d", examId, questionId);
        broadcast(destination, payload);
    }

    /**
     * 廣播累積統計結果
     *
     * @param examId 測驗 ID
     * @param payload 累積統計資訊
     */
    public void broadcastCumulativeStatistics(Long examId, Object payload) {
        String destination = String.format("/topic/exam/%d/statistics/cumulative", examId);
        broadcast(destination, payload);
    }

    /**
     * 廣播排行榜
     *
     * @param examId 測驗 ID
     * @param payload 排行榜資訊
     */
    public void broadcastLeaderboard(Long examId, Object payload) {
        String destination = String.format("/topic/exam/%d/leaderboard", examId);
        broadcast(destination, payload);
    }

    /**
     * 廣播倒數計時更新
     *
     * @param examId 測驗 ID
     * @param payload 計時器資訊
     */
    public void broadcastTimer(Long examId, Object payload) {
        String destination = String.format("/topic/exam/%d/timer", examId);
        broadcast(destination, payload);
    }

}