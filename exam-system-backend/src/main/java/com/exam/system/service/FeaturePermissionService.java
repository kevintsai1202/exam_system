package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 功能權限檢查服務
 * 統一處理問券管理與郵件管理的細部權限判斷
 */
@Service
public class FeaturePermissionService {

    /**
     * 檢查是否可使用問券管理
     *
     * @param user 目前登入使用者
     */
    public void assertCanManageSurveys(User user) {
        if (!canManageSurveys(user)) {
            throw new com.exam.system.exception.AuthException(HttpStatus.FORBIDDEN, "SURVEY_MANAGEMENT_DISABLED",
                    "目前帳號未開放問券管理權限");
        }
    }

    /**
     * 檢查是否可使用郵件管理
     *
     * @param user 目前登入使用者
     */
    public void assertCanManageEmails(User user) {
        if (!canManageEmails(user)) {
            throw new com.exam.system.exception.AuthException(HttpStatus.FORBIDDEN, "EMAIL_MANAGEMENT_DISABLED",
                    "目前帳號未開放郵件管理權限");
        }
    }

    /**
     * 問券管理：ADMIN 或 INSTRUCTOR 均可（FREE 仍可用，配額由 SURVEY_COUNT 控制）
     *
     * @param user 目前登入使用者
     * @return 是否允許
     */
    public boolean canManageSurveys(User user) {
        if (user == null) return false;
        return user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.INSTRUCTOR;
    }

    /**
     * 郵件管理：同上（FREE 仍可進入，發送配額由 MONTHLY_SEND 控制）
     *
     * @param user 目前登入使用者
     * @return 是否允許
     */
    public boolean canManageEmails(User user) {
        if (user == null) return false;
        return user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.INSTRUCTOR;
    }
}
