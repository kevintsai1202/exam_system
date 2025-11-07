package com.exam.system.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 配置類別
 * 配置 STOMP 協定的 WebSocket 連線
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final ExamProperties examProperties;

    /**
     * 配置訊息代理
     * /topic - 用於廣播訊息（一對多）
     * /app - 用於客戶端發送訊息
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 啟用簡單訊息代理，用於廣播訊息
        registry.enableSimpleBroker("/topic", "/queue");
        // 設定應用程式目的地前綴
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * 註冊 STOMP 端點
     * 客戶端透過此端點建立 WebSocket 連線
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(examProperties.getWebsocket().getAllowedOrigins().toArray(new String[0]))
                .withSockJS(); // 啟用 SockJS 支援（用於不支援 WebSocket 的瀏覽器）
    }

}