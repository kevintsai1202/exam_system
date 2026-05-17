package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.exception.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 當前登入使用者提供者
 * 從 SecurityContextHolder 取得 JwtAuthenticationFilter 注入的 User principal
 */
@Service
public class CurrentUserProvider {

    /**
     * 取得當前登入使用者；未登入則拋 AuthException
     */
    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED", "尚未登入");
        }
        return user;
    }

    /**
     * 取得當前登入使用者 ID
     */
    public Long requireCurrentUserId() {
        return requireCurrentUser().getId();
    }

    /**
     * 安全取得（未登入回 Optional.empty()）
     */
    public Optional<User> getCurrentUser() {
        try {
            return Optional.of(requireCurrentUser());
        } catch (AuthException e) {
            return Optional.empty();
        }
    }
}
