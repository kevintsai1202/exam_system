package com.exam.system.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 應用程式自定義配置屬性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "exam")
public class ExamProperties {

    /**
     * QR Code 配置
     */
    private QRCodeConfig qrcode = new QRCodeConfig();

    /**
     * Access Code 配置
     */
    private AccessCodeConfig accessCode = new AccessCodeConfig();

    /**
     * WebSocket 配置
     */
    private WebSocketProperties websocket = new WebSocketProperties();

    /**
     * 安全配置
     */
    private SecurityConfig security = new SecurityConfig();

    @Data
    public static class QRCodeConfig {
        /**
         * QR Code 寬度（像素）
         */
        private int width = 300;

        /**
         * QR Code 高度（像素）
         */
        private int height = 300;
    }

    @Data
    public static class AccessCodeConfig {
        /**
         * Access Code 長度
         */
        private int length = 6;

        /**
         * Access Code 可用字元
         */
        private String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    }

    @Data
    public static class WebSocketProperties {
        /**
         * 允許的 CORS 來源列表
         */
        private List<String> allowedOrigins = List.of("http://localhost:5173", "http://localhost:3000");
    }

    @Data
    public static class SecurityConfig {
        /**
         * 管理員 Token，用於講師端特權操作驗證
         */
        private String adminToken;
    }

}