package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.entity.TierChangeLog;
import com.exam.system.tier.repository.TierChangeLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TierServiceTest {

    @Autowired private TierService tierService;
    @Autowired private UserRepository userRepository;
    @Autowired private TierChangeLogRepository logRepository;

    private User admin;
    private User instructor;

    @BeforeEach
    void setUp() {
        admin = userRepository.save(User.builder()
                .email("admin@test.com").name("Admin").role(UserRole.ADMIN)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now()).build());
        instructor = userRepository.save(User.builder()
                .email("ins@test.com").name("Ins").role(UserRole.INSTRUCTOR)
                .tier(UserTier.FREE).tierSubscribedAt(LocalDateTime.now().minusDays(30)).build());
    }

    @Test
    @DisplayName("upgrade FREE → PAID 重新錨定 + 寫 log")
    void upgrade_resetsAnchorAndLogs() {
        LocalDateTime beforeChange = instructor.getTierSubscribedAt();

        LocalDateTime expires = LocalDateTime.now().plusMonths(1);
        tierService.changeTier(admin, instructor.getId(), UserTier.PAID, expires, "promotion");

        User reloaded = userRepository.findById(instructor.getId()).orElseThrow();
        assertThat(reloaded.getTier()).isEqualTo(UserTier.PAID);
        assertThat(reloaded.getTierSubscribedAt()).isAfter(beforeChange);
        assertThat(reloaded.getTierExpiresAt()).isEqualTo(expires);

        List<TierChangeLog> logs = logRepository.findByOwnerOrderByChangedAtDesc(reloaded);
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getFromTier()).isEqualTo(UserTier.FREE);
        assertThat(logs.get(0).getToTier()).isEqualTo(UserTier.PAID);
        assertThat(logs.get(0).getChangedBy().getId()).isEqualTo(admin.getId());
    }

    @Test
    @DisplayName("downgrade PAID → FREE 清除 expiresAt + 重新錨定")
    void downgrade_clearsExpiresAndResetsAnchor() {
        tierService.changeTier(admin, instructor.getId(), UserTier.PAID,
                LocalDateTime.now().plusMonths(1), "trial");
        tierService.changeTier(admin, instructor.getId(), UserTier.FREE, null, "trial-end");

        User reloaded = userRepository.findById(instructor.getId()).orElseThrow();
        assertThat(reloaded.getTier()).isEqualTo(UserTier.FREE);
        assertThat(reloaded.getTierExpiresAt()).isNull();

        List<TierChangeLog> logs = logRepository.findByOwnerOrderByChangedAtDesc(reloaded);
        assertThat(logs).hasSize(2);
    }

    @Test
    @DisplayName("自動排程降級 changedBy 可為 null")
    void autoDowngrade_changedByNull() {
        tierService.autoDowngrade(instructor.getId(), "expired");

        List<TierChangeLog> logs = logRepository.findByOwnerOrderByChangedAtDesc(instructor);
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getChangedBy()).isNull();
    }
}
