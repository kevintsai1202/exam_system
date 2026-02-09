package com.exam.system.service;

import com.exam.system.dto.AuthTokenResponseDTO;
import com.exam.system.dto.EmailLoginRequestDTO;
import com.exam.system.dto.EmailRegisterRequestDTO;
import com.exam.system.entity.User;
import com.exam.system.exception.AuthException;
import com.exam.system.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AuthService 測試
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 測試")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Email 註冊成功應建立密碼雜湊並回傳 Token")
    void registerWithEmailSuccess() {
        EmailRegisterRequestDTO request = new EmailRegisterRequestDTO();
        request.setName("測試使用者");
        request.setEmail("Test@Example.com");
        request.setPassword("Passw0rd123");

        when(userRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Passw0rd123")).thenReturn("HASHED_PASSWORD");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (user.getId() == null) {
                user.setId(1L);
            }
            return user;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("JWT_TOKEN");

        AuthTokenResponseDTO result = authService.registerWithEmail(request);

        assertThat(result.getToken()).isEqualTo("JWT_TOKEN");
        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getUser().getEmail()).isEqualTo("test@example.com");
        assertThat(result.getUser().isPasswordSet()).isTrue();
        assertThat(result.getUser().isGoogleLinked()).isFalse();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo("HASHED_PASSWORD");
    }

    @Test
    @DisplayName("Email 重複註冊應回傳 409")
    void registerWithDuplicateEmail() {
        EmailRegisterRequestDTO request = new EmailRegisterRequestDTO();
        request.setName("測試使用者");
        request.setEmail("dup@example.com");
        request.setPassword("Passw0rd123");

        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerWithEmail(request))
                .isInstanceOf(AuthException.class)
                .satisfies(error -> {
                    AuthException authException = (AuthException) error;
                    assertThat(authException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(authException.getCode()).isEqualTo("EMAIL_ALREADY_EXISTS");
                });
    }

    @Test
    @DisplayName("Email 登入成功應回傳 Token")
    void loginWithEmailSuccess() {
        EmailLoginRequestDTO request = new EmailLoginRequestDTO();
        request.setEmail("login@example.com");
        request.setPassword("Passw0rd123");

        User user = User.builder()
                .id(10L)
                .email("login@example.com")
                .name("登入測試")
                .passwordHash("HASHED_PASSWORD")
                .build();

        when(userRepository.findByEmailIgnoreCase("login@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Passw0rd123", "HASHED_PASSWORD")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn("JWT_LOGIN");

        AuthTokenResponseDTO result = authService.loginWithEmail(request);

        assertThat(result.getToken()).isEqualTo("JWT_LOGIN");
        assertThat(result.getUser().isPasswordSet()).isTrue();
    }

    @Test
    @DisplayName("Google-only 帳號使用 Email 登入應回傳 400")
    void loginWithEmailWhenPasswordNotSet() {
        EmailLoginRequestDTO request = new EmailLoginRequestDTO();
        request.setEmail("google-only@example.com");
        request.setPassword("Passw0rd123");

        User user = User.builder()
                .id(11L)
                .email("google-only@example.com")
                .name("Google 帳號")
                .googleId("google-sub-123")
                .build();

        when(userRepository.findByEmailIgnoreCase("google-only@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.loginWithEmail(request))
                .isInstanceOf(AuthException.class)
                .satisfies(error -> {
                    AuthException authException = (AuthException) error;
                    assertThat(authException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(authException.getCode()).isEqualTo("PASSWORD_NOT_SET");
                });
    }

    @Test
    @DisplayName("Google 登入遇到既有 Email 應自動綁定")
    void resolveOrBindGoogleUserBindsByEmail() {
        User existingUser = User.builder()
                .id(20L)
                .email("bind@example.com")
                .name("既有使用者")
                .passwordHash("HASHED")
                .build();

        when(userRepository.findByGoogleId("google-sub-999")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("bind@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.resolveOrBindGoogleUser(
                "bind@example.com",
                "Google 名稱",
                "google-sub-999",
                "https://avatar.example.com/a.png");

        assertThat(result.getGoogleId()).isEqualTo("google-sub-999");
        assertThat(result.getName()).isEqualTo("Google 名稱");
        assertThat(result.getAvatarUrl()).isEqualTo("https://avatar.example.com/a.png");
    }
}
