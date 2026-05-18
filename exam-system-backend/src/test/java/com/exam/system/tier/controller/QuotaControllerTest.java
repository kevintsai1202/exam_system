package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.QuotaSnapshotDTO;
import com.exam.system.tier.service.QuotaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QuotaControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @MockBean private QuotaService quotaService;

    /** 測試用講師 User 實體 */
    private User instructor;

    @BeforeEach
    void setUp() {
        instructor = userRepository.save(User.builder()
                .email("ins@test.com").name("Ins").role(UserRole.INSTRUCTOR)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now().minusDays(5)).build());

        // 模擬 QuotaService 回傳含 7 個維度的快照
        QuotaSnapshotDTO mockSnapshot = QuotaSnapshotDTO.builder()
                .tier(UserTier.PAID)
                .periodStart(LocalDate.now().minusDays(5))
                .periodEnd(LocalDate.now().plusMonths(1).minusDays(5))
                .daysUntilReset(25L)
                .items(List.of(
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("MEMBER_COUNT").limit(5000).used(0).remaining(5000).resetPeriod("NEVER").build(),
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("MONTHLY_SEND").limit(20000).used(0).remaining(20000).resetPeriod("MONTHLY").build(),
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("AI_QUESTION_GEN").limit(500).used(0).remaining(500).resetPeriod("MONTHLY").build(),
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("AI_DATA_ANALYSIS").limit(50).used(0).remaining(50).resetPeriod("MONTHLY").build(),
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("AI_NEWSLETTER_GEN").limit(10).used(0).remaining(10).resetPeriod("MONTHLY").build(),
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("ACTIVE_CAMPAIGNS").limit(10).used(0).remaining(10).resetPeriod("NEVER").build(),
                    QuotaSnapshotDTO.QuotaItem.builder().dimension("SURVEY_COUNT").limit(50).used(0).remaining(50).resetPeriod("NEVER").build()
                )).build();
        when(quotaService.snapshot(any(User.class))).thenReturn(mockSnapshot);
    }

    @Test
    @DisplayName("INSTRUCTOR 可取得自己的 quota snapshot")
    void instructor_snapshotSuccess() throws Exception {
        // 使用真實 User 實體作為 principal，模擬 JwtAuthenticationFilter 行為
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                instructor, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR")));

        mockMvc.perform(get("/api/quota/snapshot").with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tier").value("PAID"))
                .andExpect(jsonPath("$.items.length()").value(7));
    }

    @Test
    @DisplayName("未登入 → 401")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/quota/snapshot"))
                .andExpect(status().isUnauthorized());
    }
}
