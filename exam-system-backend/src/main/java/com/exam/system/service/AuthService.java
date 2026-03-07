package com.exam.system.service;

import com.exam.system.dto.AuthTokenResponseDTO;
import com.exam.system.dto.EmailLoginRequestDTO;
import com.exam.system.dto.EmailRegisterRequestDTO;
import com.exam.system.dto.UserDTO;
import com.exam.system.entity.User;
import com.exam.system.exception.AuthException;
import com.exam.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * 認證服務
 * 統一處理 Email 註冊/登入與 Google OAuth2 綁定邏輯
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 使用 Email 註冊帳號並直接簽發 Token
     *
     * @param request 註冊請求資料
     * @return 認證成功回應
     */
    public AuthTokenResponseDTO registerWithEmail(EmailRegisterRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AuthException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "此 Email 已註冊");
        }

        // 建立 Email 帳號，先不綁定 Google
        User user = User.builder()
                .email(normalizedEmail)
                .name(request.getName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        User savedUser = userRepository.save(user);

        return buildTokenResponse(savedUser);
    }

    /**
     * 使用 Email/Password 登入並簽發 Token
     *
     * @param request 登入請求資料
     * @return 認證成功回應
     */
    public AuthTokenResponseDTO loginWithEmail(EmailLoginRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "帳號或密碼錯誤"));

        if (!StringUtils.hasText(user.getPasswordHash())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "PASSWORD_NOT_SET", "此帳號尚未設定密碼，請使用 Google 登入");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "帳號或密碼錯誤");
        }

        user.updateLastLogin();
        User savedUser = userRepository.save(user);

        return buildTokenResponse(savedUser);
    }

    /**
     * OAuth2 成功後解析並建立/綁定帳號
     *
     * @param email     Google 回傳 Email
     * @param name      Google 回傳名稱
     * @param googleId  Google 唯一識別碼
     * @param avatarUrl Google 頭像網址
     * @return 可登入的使用者資料
     */
    public User resolveOrBindGoogleUser(String email, String name, String googleId, String avatarUrl) {
        if (!StringUtils.hasText(googleId)) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "INVALID_GOOGLE_ID", "Google 身份資訊不完整");
        }

        String normalizedEmail = normalizeEmail(email);
        String resolvedName = StringUtils.hasText(name) ? name.trim() : normalizedEmail;

        // 1) 先以 Google ID 查找，已綁定就直接登入
        User userByGoogleId = userRepository.findByGoogleId(googleId).orElse(null);
        if (userByGoogleId != null) {
            refreshGoogleProfile(userByGoogleId, resolvedName, avatarUrl);
            userByGoogleId.updateLastLogin();
            return userRepository.save(userByGoogleId);
        }

        // 2) Google ID 未綁定時，若 Email 已存在則自動綁定
        User userByEmail = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (userByEmail != null) {
            if (StringUtils.hasText(userByEmail.getGoogleId()) && !googleId.equals(userByEmail.getGoogleId())) {
                throw new AuthException(HttpStatus.CONFLICT, "GOOGLE_ALREADY_LINKED", "此 Email 已綁定其他 Google 帳號");
            }

            userByEmail.setGoogleId(googleId);
            refreshGoogleProfile(userByEmail, resolvedName, avatarUrl);
            userByEmail.updateLastLogin();
            return userRepository.save(userByEmail);
        }

        // 3) 全新 Google 帳號
        User newUser = User.builder()
                .email(normalizedEmail)
                .name(resolvedName)
                .googleId(googleId)
                .avatarUrl(avatarUrl)
                .build();
        return userRepository.save(newUser);
    }

    /**
     * 將使用者資料轉為前端回傳格式
     *
     * @param user 使用者實體
     * @return 使用者 DTO
     */
    public UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .googleLinked(StringUtils.hasText(user.getGoogleId()))
                .passwordSet(StringUtils.hasText(user.getPasswordHash()))
                .surveyManagementEnabled(user.isSurveyManagementEnabled())
                .emailManagementEnabled(user.isEmailManagementEnabled())
                .build();
    }

    /**
     * 封裝 Token + User 回應格式
     *
     * @param user 已驗證使用者
     * @return 認證回應
     */
    public AuthTokenResponseDTO buildTokenResponse(User user) {
        return AuthTokenResponseDTO.builder()
                .token(jwtService.generateToken(user))
                .authenticated(true)
                .user(toUserDTO(user))
                .build();
    }

    /**
     * 正規化 Email（trim + lowercase）
     *
     * @param email 原始 Email
     * @return 正規化後 Email
     */
    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL", "Email 不可為空");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 同步 Google 回傳的個人資料
     *
     * @param user      使用者
     * @param name      Google 名稱
     * @param avatarUrl Google 頭像
     */
    private void refreshGoogleProfile(User user, String name, String avatarUrl) {
        if (StringUtils.hasText(name)) {
            user.setName(name);
        }
        if (StringUtils.hasText(avatarUrl)) {
            user.setAvatarUrl(avatarUrl);
        }
    }
}
