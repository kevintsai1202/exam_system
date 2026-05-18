package com.exam.system.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * WebSocket Presence 控制器
 *
 * 學員連上 WebSocket 後，前端主動發送訊息至 /app/exam/{examId}/presence，
 * 後端記錄 STOMP session 與測驗的對應關係，並廣播更新後的在線人數。
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ExamPresenceController {

    private final ExamPresenceTracker presenceTracker;
    private final WebSocketService webSocketService;

    /**
     * 學員宣告上線
     *
     * 前端在 WebSocket 連線成功後發送至 /app/exam/{examId}/presence
     *
     * @param examId         路徑參數：測驗 ID
     * @param headerAccessor STOMP 訊息 header（用於取得 session ID）
     */
    @MessageMapping("/exam/{examId}/presence")
    public void handlePresence(@DestinationVariable Long examId,
                               SimpMessageHeaderAccessor headerAccessor) {
        String stompSessionId = headerAccessor.getSessionId();
        if (stompSessionId == null) {
            log.warn("[Presence] 無法取得 STOMP session ID，examId={}", examId);
            return;
        }

        int count = presenceTracker.addPresence(examId, stompSessionId);
        log.debug("[Presence] 學員上線，examId={}, stompSession={}, onlineCount={}", examId, stompSessionId, count);

        webSocketService.broadcastStudentCount(examId, Map.of("onlineCount", count));
    }
}
