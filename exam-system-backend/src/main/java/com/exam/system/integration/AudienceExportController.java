package com.exam.system.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** 供 survey-backend 使用的唯讀整合端點；不使用講師 JWT，改採獨立 integration token。 */
@RestController
public class AudienceExportController {

    private final AudienceExportService service;
    private final String integrationToken;

    /** 注入匯出服務與部署環境中的共享 token。 */
    public AudienceExportController(
            AudienceExportService service,
            @Value("${app.integrations.audience-export-token:}") String integrationToken) {
        this.service = service;
        this.integrationToken = integrationToken;
    }

    /** 增量匯出人物、測驗活動與逐題答案；單頁最多 500 筆。 */
    @GetMapping("/api/integrations/audience-export")
    public AudienceExportResponse export(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "since", required = false) String cursor,
            @RequestParam(defaultValue = "200") int limit) {
        verifyToken(authorization);
        if (limit < 1 || limit > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit 必須介於 1 到 500");
        }
        try {
            return service.export(cursor, limit);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    /** 以固定時間比較 Bearer token；未設定 token 時整合端點維持關閉。 */
    private void verifyToken(String authorization) {
        if (integrationToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Exam 名單整合尚未設定");
        }
        String provided = authorization != null && authorization.startsWith("Bearer ")
            ? authorization.substring("Bearer ".length())
            : "";
        if (!MessageDigest.isEqual(
                integrationToken.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "integration token 無效");
        }
    }
}
