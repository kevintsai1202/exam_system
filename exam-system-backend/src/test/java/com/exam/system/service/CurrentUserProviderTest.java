package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CurrentUserProviderTest {

    private final CurrentUserProvider provider = new CurrentUserProvider();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void requireCurrentUser_returnsPrincipal_whenAuthenticated() {
        User user = User.builder().id(1L).email("a@b.com").role(UserRole.INSTRUCTOR).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));

        assertThat(provider.requireCurrentUser()).isEqualTo(user);
        assertThat(provider.requireCurrentUserId()).isEqualTo(1L);
    }

    @Test
    void requireCurrentUser_throwsAuthException_whenNoAuthentication() {
        assertThatThrownBy(provider::requireCurrentUser)
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("尚未登入");
    }

    @Test
    void getCurrentUser_returnsEmpty_whenNoAuthentication() {
        Optional<User> result = provider.getCurrentUser();
        assertThat(result).isEmpty();
    }

    @Test
    void getCurrentUser_returnsUser_whenAuthenticated() {
        User user = User.builder().id(2L).email("c@d.com").role(UserRole.ADMIN).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        assertThat(provider.getCurrentUser()).contains(user);
    }
}
