package com.exam.system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * SPA (Single Page Application) 配置
 * 處理前端路由，將所有非 API 請求導向 index.html
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    /**
     * 配置靜態資源處理器
     * 支援 React Router 的前端路由
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);

                        // 如果資源存在（靜態檔案、CSS、JS 等），直接返回
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }

                        // 如果是 API、WebSocket 或 H2 Console 路徑，不處理（交給對應的 Controller）
                        if (resourcePath.startsWith("api/") ||
                            resourcePath.startsWith("ws") ||
                            resourcePath.startsWith("h2-console")) {
                            return null;
                        }

                        // 其他所有路徑都返回 index.html（支援 SPA 前端路由）
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }
}
