package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.QuotaPolicyDTO;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaPolicy;
import com.exam.system.tier.entity.QuotaResetPeriod;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QuotaPolicyControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private QuotaPolicyRepository policyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.save(User.builder()
                .email("admin@test.com").name("Admin").role(UserRole.ADMIN)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now()).build());

        // Flyway 在測試環境停用，手動植入 14 筆種子配額政策
        savePolicy(UserTier.FREE, QuotaDimension.MEMBER_COUNT,       100,   QuotaResetPeriod.NEVER);
        savePolicy(UserTier.FREE, QuotaDimension.MONTHLY_SEND,       200,   QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.AI_QUESTION_GEN,    0,     QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.AI_DATA_ANALYSIS,   0,     QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.AI_NEWSLETTER_GEN,  0,     QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.FREE, QuotaDimension.ACTIVE_CAMPAIGNS,   0,     QuotaResetPeriod.NEVER);
        savePolicy(UserTier.FREE, QuotaDimension.SURVEY_COUNT,       3,     QuotaResetPeriod.NEVER);
        savePolicy(UserTier.PAID, QuotaDimension.MEMBER_COUNT,       5000,  QuotaResetPeriod.NEVER);
        savePolicy(UserTier.PAID, QuotaDimension.MONTHLY_SEND,       20000, QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.AI_QUESTION_GEN,    500,   QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.AI_DATA_ANALYSIS,   50,    QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.AI_NEWSLETTER_GEN,  10,    QuotaResetPeriod.MONTHLY);
        savePolicy(UserTier.PAID, QuotaDimension.ACTIVE_CAMPAIGNS,   10,    QuotaResetPeriod.NEVER);
        savePolicy(UserTier.PAID, QuotaDimension.SURVEY_COUNT,       50,    QuotaResetPeriod.NEVER);
    }

    /** 建立並儲存單筆配額政策 */
    private void savePolicy(UserTier tier, QuotaDimension dim, int limit, QuotaResetPeriod period) {
        policyRepository.save(QuotaPolicy.builder()
                .tier(tier).dimension(dim).limitValue(limit).resetPeriod(period).build());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("GET 列出 14 筆種子政策")
    void list_returns14SeedPolicies() throws Exception {
        mockMvc.perform(get("/api/admin/quota-policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(14));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("PUT 調整 PAID MONTHLY_SEND 上限為 30000")
    void update_changesLimit() throws Exception {
        // 查詢 PAID + MONTHLY_SEND 的 ID
        Long id = policyRepository.findByTierAndDimension(UserTier.PAID, QuotaDimension.MONTHLY_SEND)
                .orElseThrow().getId();
        QuotaPolicyDTO req = QuotaPolicyDTO.builder().limitValue(30000).build();

        mockMvc.perform(put("/api/admin/quota-policies/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.limitValue").value(30000));

        // 驗證資料庫已更新
        assertThat(policyRepository.findById(id).orElseThrow().getLimitValue()).isEqualTo(30000);
    }

    @Test
    @WithMockUser(roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 取得列表 → 403")
    void instructor_forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/quota-policies"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 嘗試 PUT → 403")
    void instructor_put_forbidden() throws Exception {
        // 使用任意 ID — 安全守衛在 controller 主體執行前就會攔截
        mockMvc.perform(put("/api/admin/quota-policies/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"limitValue\":999}"))
                .andExpect(status().isForbidden());
    }
}
