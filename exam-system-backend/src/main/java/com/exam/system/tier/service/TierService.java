package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.entity.TierChangeLog;
import com.exam.system.tier.repository.TierChangeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 講師分級服務 — ADMIN 升降級流程，含錨點重設與稽核 log
 */
@Service
@RequiredArgsConstructor
public class TierService {

    /** 用戶資料存取層 */
    private final UserRepository userRepository;

    /** 升降級稽核 log 資料存取層 */
    private final TierChangeLogRepository logRepository;

    /**
     * ADMIN 手動變更 tier
     *
     * @param operator      操作者（ADMIN 角色）
     * @param targetUserId  目標講師 ID
     * @param newTier       新 tier
     * @param expiresAt     PAID 到期時間；降 FREE 傳 null
     * @param reason        變更原因（記入 log）
     */
    @Transactional
    public void changeTier(User operator, Long targetUserId, UserTier newTier,
                           LocalDateTime expiresAt, String reason) {
        // 查詢目標用戶，不存在則拋出例外
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        // 記錄原始 tier 供 log 使用
        UserTier fromTier = target.getTier();

        // 更新 tier 並重設訂閱錨點
        target.setTier(newTier);
        target.setTierSubscribedAt(LocalDateTime.now());  // 錨點重設
        target.setTierExpiresAt(newTier == UserTier.PAID ? expiresAt : null);
        userRepository.save(target);

        // 寫入稽核 log
        logRepository.save(TierChangeLog.builder()
                .owner(target).fromTier(fromTier).toTier(newTier)
                .changedBy(operator).reason(reason).expiresAt(expiresAt).build());
    }

    /**
     * 自動降級（PAID 到期）— changedBy 為 null（排程觸發，無人工操作者）
     *
     * @param targetUserId  目標講師 ID
     * @param reason        降級原因（記入 log）
     */
    @Transactional
    public void autoDowngrade(Long targetUserId, String reason) {
        // 查詢目標用戶，不存在則拋出例外
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        // 記錄原始 tier 供 log 使用
        UserTier fromTier = target.getTier();

        // 降為 FREE 並清除到期時間，重設錨點
        target.setTier(UserTier.FREE);
        target.setTierSubscribedAt(LocalDateTime.now());
        target.setTierExpiresAt(null);
        userRepository.save(target);

        // 寫入稽核 log，changedBy 為 null（系統自動觸發）
        logRepository.save(TierChangeLog.builder()
                .owner(target).fromTier(fromTier).toTier(UserTier.FREE)
                .changedBy(null).reason(reason).build());
    }
}
