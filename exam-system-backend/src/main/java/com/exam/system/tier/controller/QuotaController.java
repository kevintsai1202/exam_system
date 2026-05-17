package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.tier.dto.QuotaSnapshotDTO;
import com.exam.system.tier.service.QuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 講師配額查詢
 */
@RestController
@RequestMapping("/api/quota")
@RequiredArgsConstructor
public class QuotaController {

    private final QuotaService quotaService;

    /**
     * 取得當前登入講師的配額快照
     */
    @GetMapping("/snapshot")
    public ResponseEntity<QuotaSnapshotDTO> snapshot(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(quotaService.snapshot(user));
    }
}
