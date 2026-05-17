package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.TierChangeRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TierControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;

    /** 執行升降級操作的 ADMIN 使用者 */
    private User adminUser;
    /** 被升降級的目標講師 ID */
    private Long instructorId;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(User.builder()
                .email("admin@test.com").name("Admin").role(UserRole.ADMIN)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now()).build());
        User ins = userRepository.save(User.builder()
                .email("ins@test.com").name("Ins").role(UserRole.INSTRUCTOR)
                .tier(UserTier.FREE).tierSubscribedAt(LocalDateTime.now()).build());
        instructorId = ins.getId();
    }

    @Test
    @DisplayName("ADMIN 升級講師為 PAID 成功")
    void admin_upgradeToPaid_success() throws Exception {
        TierChangeRequestDTO req = new TierChangeRequestDTO();
        req.setTargetTier(UserTier.PAID);
        req.setExpiresAt(LocalDateTime.now().plusMonths(1));
        req.setReason("promotion");

        // 使用真實 User 實體作為 principal，模擬 JwtAuthenticationFilter 的 ADMIN 行為
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                adminUser, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        mockMvc.perform(put("/api/admin/users/{id}/tier", instructorId)
                .with(authentication(auth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNoContent());

        // 驗證資料庫中講師 tier 已更新為 PAID
        assertThat(userRepository.findById(instructorId).orElseThrow().getTier()).isEqualTo(UserTier.PAID);
    }

    @Test
    @WithMockUser(username = "ins@test.com", roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 嘗試升降級 → 403")
    void instructor_changeTier_forbidden() throws Exception {
        TierChangeRequestDTO req = new TierChangeRequestDTO();
        req.setTargetTier(UserTier.PAID);

        mockMvc.perform(put("/api/admin/users/{id}/tier", instructorId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN 查詢升降級歷史 → 200 含空陣列（無歷史）")
    void admin_getHistory_emptyList() throws Exception {
        // 使用真實 User 實體作為 principal，模擬 JwtAuthenticationFilter 的 ADMIN 行為
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                adminUser, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        mockMvc.perform(get("/api/admin/users/{id}/tier-history", instructorId)
                .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 查詢歷史 → 403")
    void instructor_getHistory_forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users/{id}/tier-history", instructorId))
                .andExpect(status().isForbidden());
    }
}
