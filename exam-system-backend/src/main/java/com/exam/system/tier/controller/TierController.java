package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.TierChangeRequestDTO;
import com.exam.system.tier.entity.TierChangeLog;
import com.exam.system.tier.repository.TierChangeLogRepository;
import com.exam.system.tier.service.TierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
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
    private final UserRepository userRepository;
    private final TierChangeLogRepository logRepository;

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
     * @Transactional 防止 TierChangeLog lazy 關聯序列化時拋 LazyInitializationException
     *
     * @param id 目標講師 ID
     */
    @GetMapping("/{id}/tier-history")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TierChangeLog>> history(@PathVariable Long id) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return ResponseEntity.ok(logRepository.findByOwnerOrderByChangedAtDesc(target));
    }
}
