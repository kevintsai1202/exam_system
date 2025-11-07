package com.exam.system.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS 跨域請求配置
 * 允許前端應用程式訪問後端 API
 */
@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    private final ExamProperties examProperties;

    /**
     * 配置 CORS 過濾器
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 允許的來源
        config.setAllowedOrigins(examProperties.getWebsocket().getAllowedOrigins());

        // 允許的 HTTP 方法
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");

        // 允許的請求標頭
        config.addAllowedHeader("*");

        // 允許傳送憑證（如 Cookie）
        config.setAllowCredentials(true);

        // 預檢請求的快取時間（秒）
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

}