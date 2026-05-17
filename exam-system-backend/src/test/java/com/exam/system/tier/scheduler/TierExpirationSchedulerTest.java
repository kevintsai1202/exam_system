package com.exam.system.tier.scheduler;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TierExpirationSchedulerTest {

    @Autowired private TierExpirationScheduler scheduler;
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("過期 PAID 用戶自動降為 FREE")
    void expiredPaidUser_getsDowngraded() {
        // 建立一個 PAID 已過期用戶（tierExpiresAt 在 1 小時前）
        User paid = userRepository.save(User.builder()
                .email("paid@test.com").name("Paid")
                .role(UserRole.INSTRUCTOR).tier(UserTier.PAID)
                .tierSubscribedAt(LocalDateTime.now().minusMonths(1))
                .tierExpiresAt(LocalDateTime.now().minusHours(1))  // 已過期 1 小時
                .build());

        // 執行排程器
        scheduler.expirePaidTiers();

        // 確認用戶已降為 FREE，且 tierExpiresAt 已清除
        User reloaded = userRepository.findById(paid.getId()).orElseThrow();
        assertThat(reloaded.getTier()).isEqualTo(UserTier.FREE);
        assertThat(reloaded.getTierExpiresAt()).isNull();
    }

    @Test
    @DisplayName("尚未過期的 PAID 用戶不降級")
    void notExpiredPaidUser_staysPaid() {
        // 建立一個 PAID 尚未過期用戶（tierExpiresAt 在 20 天後）
        User paid = userRepository.save(User.builder()
                .email("paid2@test.com").name("Paid2")
                .role(UserRole.INSTRUCTOR).tier(UserTier.PAID)
                .tierSubscribedAt(LocalDateTime.now().minusDays(10))
                .tierExpiresAt(LocalDateTime.now().plusDays(20))  // 尚未過期
                .build());

        // 執行排程器
        scheduler.expirePaidTiers();

        // 確認用戶仍維持 PAID
        User reloaded = userRepository.findById(paid.getId()).orElseThrow();
        assertThat(reloaded.getTier()).isEqualTo(UserTier.PAID);
    }
}
