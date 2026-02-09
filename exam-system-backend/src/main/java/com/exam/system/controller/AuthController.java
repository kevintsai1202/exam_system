package com.exam.system.controller;

import com.exam.system.dto.UserDTO;
import com.exam.system.dto.AuthTokenResponseDTO;
import com.exam.system.dto.EmailLoginRequestDTO;
import com.exam.system.dto.EmailRegisterRequestDTO;
import com.exam.system.entity.User;
import com.exam.system.repository.UserRepository;
import com.exam.system.service.AuthService;
import com.exam.system.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 認證控制器
 * 處理用戶登入相關 API
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

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
}
