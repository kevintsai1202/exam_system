package com.exam.system.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

/**
 * WebSocket 斷線事件監聽器
 *
 * 監聽 STOMP SessionDisconnectEvent，若斷線的 session 是學員連線，
 * 則從 ExamPresenceTracker 移除並廣播更新後的在線人數。
 *
 * 講師不會發送 presence 宣告，因此 removePresence 回傳 null，不廣播。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener implements ApplicationListener<SessionDisconnectEvent> {

    private final ExamPresenceTracker presenceTracker;
    private final WebSocketService webSocketService;

    @Override
    public void onApplicationEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String stompSessionId = accessor.getSessionId();
        if (stompSessionId == null) {
            return;
        }

        Long examId = presenceTracker.removePresence(stompSessionId);
        if (examId == null) {
            // 不是學員連線（例如講師），不需要廣播
            return;
        }

        int count = presenceTracker.getCount(examId);
        log.debug("[Presence] 學員下線，examId={}, stompSession={}, onlineCount={}", examId, stompSessionId, count);

        webSocketService.broadcastStudentCount(examId, Map.of("onlineCount", count));
    }
}
