package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.QuotaCheckResultDTO;
import com.exam.system.tier.dto.QuotaReservationDTO;
import com.exam.system.tier.dto.QuotaSnapshotDTO;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaPolicy;
import com.exam.system.tier.entity.QuotaResetPeriod;
import com.exam.system.tier.exception.QuotaExceededException;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import com.exam.system.tier.repository.QuotaUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuotaServiceTest {

    @Autowired private QuotaService quotaService;
    @Autowired private UserRepository userRepository;
    @Autowired private QuotaUsageRepository quotaUsageRepository;
    @Autowired private QuotaPolicyRepository quotaPolicyRepository;

    /** 免費版測試用講師 */
    private User freeInstructor;
    /** 付費版測試用講師 */
    private User paidInstructor;

    @BeforeEach
    void setUp() {
        // 測試環境 Flyway 停用，手動建立 QuotaPolicy 種子資料
        savePolicy(UserTier.FREE, QuotaDimension.AI_QUESTION_GEN, 0, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.MONTHLY_SEND, 200, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.MEMBER_COUNT, 100, QuotaResetPeriod.NEVER);
        savePolicy(UserTier.FREE, QuotaDimension.AI_DATA_ANALYSIS, 0, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.AI_NEWSLETTER_GEN, 0, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.ACTIVE_CAMPAIGNS, 0, QuotaResetPeriod.NEVER);
        savePolicy(UserTier.FREE, QuotaDimension.SURVEY_COUNT, 3, QuotaResetPeriod.NEVER);
        savePolicy(UserTier.PAID, QuotaDimension.AI_QUESTION_GEN, 500, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.MONTHLY_SEND, 20000, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.MEMBER_COUNT, 5000, QuotaResetPeriod.NEVER);
        savePolicy(UserTier.PAID, QuotaDimension.AI_DATA_ANALYSIS, 50, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.AI_NEWSLETTER_GEN, 10, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.ACTIVE_CAMPAIGNS, 10, QuotaResetPeriod.NEVER);
        savePolicy(UserTier.PAID, QuotaDimension.SURVEY_COUNT, 50, QuotaResetPeriod.NEVER);

        freeInstructor = userRepository.save(User.builder()
                .email("free@test.com").name("Free")
                .role(UserRole.INSTRUCTOR).tier(UserTier.FREE)
                .tierSubscribedAt(LocalDateTime.now().minusDays(10))
                .build());
        paidInstructor = userRepository.save(User.builder()
                .email("paid@test.com").name("Paid")
                .role(UserRole.INSTRUCTOR).tier(UserTier.PAID)
                .tierSubscribedAt(LocalDateTime.now().minusDays(10))
                .build());
    }

    /**
     * 儲存 QuotaPolicy，避免重複插入（@Transactional 每次測試回滾，但 @BeforeEach 在同一 tx 內）
     */
    private void savePolicy(UserTier tier, QuotaDimension dim, int limit, QuotaResetPeriod period) {
        quotaPolicyRepository.findByTierAndDimension(tier, dim)
                .orElseGet(() -> quotaPolicyRepository.save(QuotaPolicy.builder()
                        .tier(tier).dimension(dim).limitValue(limit).resetPeriod(period).build()));
    }

    // === Task 11: check + consume ===

    @Test
    @DisplayName("check: FREE 講師 AI_QUESTION_GEN limit=0 → allowed=false")
    void check_freeUser_aiDimension_denied() {
        QuotaCheckResultDTO result = quotaService.check(freeInstructor, QuotaDimension.AI_QUESTION_GEN, 1);
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getReasonIfDenied()).isEqualTo("TIER_NOT_ALLOWED");
    }

    @Test
    @DisplayName("check: PAID 講師 AI_QUESTION_GEN limit=500，請求 1 → allowed=true")
    void check_paidUser_underLimit_allowed() {
        QuotaCheckResultDTO result = quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1);
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getLimit()).isEqualTo(500);
        assertThat(result.getRemaining()).isEqualTo(500);
    }

    @Test
    @DisplayName("consume: 成功扣抵後 used 累加，再 check 看到正確 remaining")
    void consume_thenCheckRemaining() {
        quotaService.consume(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 10, "test");

        QuotaCheckResultDTO result = quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1);
        assertThat(result.getUsed()).isEqualTo(10);
        assertThat(result.getRemaining()).isEqualTo(490);
    }

    @Test
    @DisplayName("consume: 超過 limit 拋 QuotaExceededException")
    void consume_exceedsLimit_throws() {
        assertThatThrownBy(() -> quotaService.consume(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 501, "abuse"))
                .isInstanceOf(QuotaExceededException.class);
    }

    // === Task 12: reserve/confirm/rollback ===

    @Test
    @DisplayName("reserve: 預扣後 check.used 看得到，但尚未真正扣抵")
    void reserve_thenCheckUsedReflectsReservation() {
        QuotaReservationDTO r = quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 50);

        assertThat(r.getReservedAmount()).isEqualTo(50);
        assertThat(quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1).getUsed()).isEqualTo(50);
    }

    @Test
    @DisplayName("confirm: 預扣 50 確認 30，最終 used = 30（退還 20）")
    void confirm_partial_refundDifference() {
        QuotaReservationDTO r = quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 50);

        quotaService.confirm(r, 30);

        assertThat(quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1).getUsed()).isEqualTo(30);
    }

    @Test
    @DisplayName("rollback: 預扣後 rollback 全額退還，used 回到 0")
    void rollback_releasesAll() {
        QuotaReservationDTO r = quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 50);

        quotaService.rollback(r);

        assertThat(quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1).getUsed()).isEqualTo(0);
    }

    @Test
    @DisplayName("reserve: 超過 limit 直接拋 QuotaExceededException（不寫入）")
    void reserve_exceedsLimit_throws() {
        assertThatThrownBy(() -> quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 501))
                .isInstanceOf(QuotaExceededException.class);
    }

    // === Task 13: snapshot ===

    @Test
    @DisplayName("snapshot: 回傳 tier、當期區間、與 7 個維度的 used/limit")
    void snapshot_returnsAllDimensions() {
        quotaService.consume(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 10, "test");

        QuotaSnapshotDTO snap = quotaService.snapshot(paidInstructor);

        assertThat(snap.getTier()).isEqualTo(com.exam.system.entity.UserTier.PAID);
        assertThat(snap.getItems()).hasSize(7);
        assertThat(snap.getItems().stream()
                .filter(i -> i.getDimension().equals("AI_QUESTION_GEN"))
                .findFirst().orElseThrow().getUsed()).isEqualTo(10);
        assertThat(snap.getPeriodStart()).isNotNull();
        assertThat(snap.getPeriodEnd()).isAfter(snap.getPeriodStart());
        assertThat(snap.getDaysUntilReset()).isGreaterThanOrEqualTo(0);
    }
}
