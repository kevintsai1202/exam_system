package com.exam.system.tier.scheduler;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.service.TierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PAID 到期自動降級排程 — 每日凌晨 01:00 執行
 * 掃描所有 tier_expires_at < now 的 PAID 用戶，自動降為 FREE
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TierExpirationScheduler {

    /** 用戶資料存取層，用於查詢過期 PAID 用戶 */
    private final UserRepository userRepository;

    /** 分級服務，執行實際降級邏輯並寫入稽核 log */
    private final TierService tierService;

    /**
     * 掃描所有 tier_expires_at < now 的 PAID 用戶，自動降為 FREE
     * 排程：每日凌晨 01:00 執行（cron = "0 0 1 * * *"）
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void expirePaidTiers() {
        // 查詢所有已過期的 PAID 用戶
        List<User> expired =
                userRepository.findByTierAndTierExpiresAtBefore(UserTier.PAID, LocalDateTime.now());
        log.info("TierExpirationScheduler: 找到 {} 個過期 PAID 用戶", expired.size());

        // 逐一執行自動降級，單筆失敗不影響其他用戶
        expired.forEach(u -> {
            try {
                tierService.autoDowngrade(u.getId(), "PAID subscription expired");
            } catch (Exception e) {
                log.error("自動降級失敗 userId={}: {}", u.getId(), e.getMessage());
            }
        });
    }
}
