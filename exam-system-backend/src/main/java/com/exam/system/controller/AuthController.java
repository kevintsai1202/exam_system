package com.exam.system.controller;

import com.exam.system.dto.UserDTO;
import com.exam.system.dto.AuthTokenResponseDTO;
import com.exam.system.dto.EmailLoginRequestDTO;
import com.exam.system.dto.EmailRegisterRequestDTO;
import com.exam.system.entity.User;
import com.exam.system.repository.UserRepository;
import com.exam.system.service.AuthService;
import com.exam.system.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 認證控制器
 * 處理用戶登入相關 API
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final String OAUTH_RETURN_TO_COOKIE = "oauth_return_to";

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthService authService;

    /**
     * 取得當前登入用戶資訊
     */
    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }

        UserDTO userDTO = authService.toUserDTO(user);

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "user", userDTO));
    }

    /**
     * Email 註冊
     */
    @PostMapping("/register")
    public ResponseEntity<AuthTokenResponseDTO> register(@Valid @RequestBody EmailRegisterRequestDTO request) {
        return ResponseEntity.ok(authService.registerWithEmail(request));
    }

    /**
     * Email 登入
     */
    @PostMapping("/login")
    public ResponseEntity<AuthTokenResponseDTO> login(@Valid @RequestBody EmailLoginRequestDTO request) {
        return ResponseEntity.ok(authService.loginWithEmail(request));
    }

    /**
     * 驗證 Token 是否有效
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(Map.of("valid", false));
        }

        String token = authHeader.substring(7);
        try {
            String email = jwtService.extractEmail(token);
            boolean expired = jwtService.isTokenExpired(token);

            if (!expired && userRepository.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.ok(Map.of("valid", true, "email", email));
            }
        } catch (Exception e) {
            // Token 解析失敗
        }

        return ResponseEntity.ok(Map.of("valid", false));
    }

    /**
     * 登出（前端清除 Token 即可，後端僅回傳成功）
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logged out successfully"));
    }

    /**
     * 取得 Google OAuth2 登入 URL
     */
    @GetMapping("/google/login-url")
    public ResponseEntity<?> getGoogleLoginUrl() {
        return ResponseEntity.ok(Map.of(
                "loginUrl", "/oauth2/authorization/google"));
    }

    /**
     * 啟動 Google OAuth，並由後端保存返回頁
     */
    @GetMapping("/google/start")
    public void startGoogleLogin(
            @RequestParam(required = false) String returnTo,
            HttpServletResponse response) throws IOException {
        Cookie cookie = new Cookie(
                OAUTH_RETURN_TO_COOKIE,
                URLEncoder.encode(returnTo == null ? "/" : returnTo, StandardCharsets.UTF_8));
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(60 * 10);
        response.addCookie(cookie);
        response.sendRedirect("/oauth2/authorization/google");
    }
}
