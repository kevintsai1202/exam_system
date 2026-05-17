package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.tier.dto.TierChangeLogDTO;
import com.exam.system.tier.dto.TierChangeRequestDTO;
import com.exam.system.tier.service.TierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ADMIN 講師升降級管理
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class TierController {

    private final TierService tierService;

    /**
     * ADMIN 升降級講師
     * @param id       目標講師 ID
     * @param req      升降級請求 DTO（targetTier, expiresAt, reason）
     * @param operator 執行操作的 ADMIN 使用者（由 JWT 注入）
     */
    @PutMapping("/{id}/tier")
    public ResponseEntity<Void> changeTier(@PathVariable Long id,
                                           @Valid @RequestBody TierChangeRequestDTO req,
                                           @AuthenticationPrincipal User operator) {
        tierService.changeTier(operator, id, req.getTargetTier(), req.getExpiresAt(), req.getReason());
        return ResponseEntity.noContent().build();
    }

    /**
     * ADMIN 查看講師升降級歷史
     * @param id 目標講師 ID
     */
    @GetMapping("/{id}/tier-history")
    public ResponseEntity<List<TierChangeLogDTO>> history(@PathVariable Long id) {
        return ResponseEntity.ok(tierService.findHistory(id));
    }
}
