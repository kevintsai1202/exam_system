package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.exception.AuthException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FeaturePermissionServiceTest {

    private final FeaturePermissionService service = new FeaturePermissionService();

    @Test
    @DisplayName("ADMIN 永遠可使用所有功能（不論 tier）")
    void admin_alwaysAllowed() {
        User admin = User.builder().role(UserRole.ADMIN).tier(UserTier.FREE).build();
        assertThat(service.canManageSurveys(admin)).isTrue();
        assertThat(service.canManageEmails(admin)).isTrue();
    }

    @Test
    @DisplayName("INSTRUCTOR + PAID 可使用問券與郵件管理")
    void instructorPaid_allowed() {
        User u = User.builder().role(UserRole.INSTRUCTOR).tier(UserTier.PAID).build();
        assertThat(service.canManageSurveys(u)).isTrue();
        assertThat(service.canManageEmails(u)).isTrue();
    }

    @Test
    @DisplayName("INSTRUCTOR + FREE 仍可使用問券管理（額度由 SURVEY_COUNT 配額控制）")
    void instructorFree_surveysAllowed() {
        User u = User.builder().role(UserRole.INSTRUCTOR).tier(UserTier.FREE).build();
        assertThat(service.canManageSurveys(u)).isTrue();
    }

    @Test
    @DisplayName("INSTRUCTOR + FREE 可進入郵件管理（發送配額由 MONTHLY_SEND 控制）")
    void instructorFree_emailsAllowed() {
        User u = User.builder().role(UserRole.INSTRUCTOR).tier(UserTier.FREE).build();
        assertThat(service.canManageEmails(u)).isTrue();
    }

    @Test
    @DisplayName("STUDENT 不可使用講師功能")
    void student_denied() {
        User u = User.builder().role(UserRole.STUDENT).tier(UserTier.FREE).build();
        assertThat(service.canManageSurveys(u)).isFalse();
        assertThat(service.canManageEmails(u)).isFalse();
    }

    @Test
    @DisplayName("assertCanManageSurveys 不通過時拋 AuthException")
    void assertCanManageSurveys_studentThrows() {
        User u = User.builder().role(UserRole.STUDENT).tier(UserTier.FREE).build();
        assertThatThrownBy(() -> service.assertCanManageSurveys(u))
                .isInstanceOf(AuthException.class);
    }
}
