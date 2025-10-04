package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebSocket 訊息 DTO
 * 用於封裝不同類型的 WebSocket 推送訊息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage<T> {

    /**
     * 訊息類型
     */
    private MessageType type;

    /**
     * 訊息內容（泛型）
     */
    private T data;

    /**
     * 訊息時間戳記
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * 訊息類型列舉
     */
    public enum MessageType {
        // 測驗狀態相關
        EXAM_STARTED,
        EXAM_ENDED,

        // 學員相關
        STUDENT_JOINED,
        STUDENTS_UPDATED,

        // 題目相關
        QUESTION_STARTED,
        QUESTION_CLOSED,

        // 統計相關
        STATISTICS_UPDATED,
        CUMULATIVE_UPDATED,
        LEADERBOARD_UPDATED,

        // 計時器相關
        TIMER_UPDATE,
        TIMER_EXPIRED
    }

    /**
     * 建立測驗開始訊息
     */
    public static <T> WebSocketMessage<T> examStarted(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.EXAM_STARTED)
                .data(data)
                .build();
    }

    /**
     * 建立測驗結束訊息
     */
    public static <T> WebSocketMessage<T> examEnded(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.EXAM_ENDED)
                .data(data)
                .build();
    }

    /**
     * 建立學員加入訊息
     */
    public static <T> WebSocketMessage<T> studentJoined(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.STUDENT_JOINED)
                .data(data)
                .build();
    }

    /**
     * 建立學員列表更新訊息
     */
    public static <T> WebSocketMessage<T> studentsUpdated(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.STUDENTS_UPDATED)
                .data(data)
                .build();
    }

    /**
     * 建立題目開始訊息
     */
    public static <T> WebSocketMessage<T> questionStarted(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.QUESTION_STARTED)
                .data(data)
                .build();
    }

    /**
     * 建立題目關閉訊息
     */
    public static <T> WebSocketMessage<T> questionClosed(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.QUESTION_CLOSED)
                .data(data)
                .build();
    }

    /**
     * 建立統計更新訊息
     */
    public static <T> WebSocketMessage<T> statisticsUpdated(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.STATISTICS_UPDATED)
                .data(data)
                .build();
    }

    /**
     * 建立累積統計更新訊息
     */
    public static <T> WebSocketMessage<T> cumulativeUpdated(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.CUMULATIVE_UPDATED)
                .data(data)
                .build();
    }

    /**
     * 建立排行榜更新訊息
     */
    public static <T> WebSocketMessage<T> leaderboardUpdated(T data) {
        return WebSocketMessage.<T>builder()
                .type(MessageType.LEADERBOARD_UPDATED)
                .data(data)
                .build();
    }

}