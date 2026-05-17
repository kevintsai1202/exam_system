package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
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
     * 判斷是否可使用問券管理
     *
     * @param user 目前登入使用者
     * @return 是否允許
     */
    public boolean canManageSurveys(User user) {
        if (user == null) {
            return false;
        }
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }
        return user.getRole() == UserRole.INSTRUCTOR && user.getTier() == UserTier.PAID;
    }

    /**
     * 判斷是否可使用郵件管理
     *
     * @param user 目前登入使用者
     * @return 是否允許
     */
    public boolean canManageEmails(User user) {
        if (user == null) {
            return false;
        }
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }
        return user.getRole() == UserRole.INSTRUCTOR && user.getTier() == UserTier.PAID;
    }
}
