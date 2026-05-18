package com.exam.system.service;

import com.exam.system.entity.EmailCampaign;
import com.exam.system.entity.Exam;
import com.exam.system.entity.Survey;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 擁有者授權守門員
 * ADMIN 一律放行；INSTRUCTOR 必須是 owner_id == self
 * Survey / EmailCampaign 透過其 exam 推導 owner，避免冗存
 */
@Service
@RequiredArgsConstructor
public class OwnershipGuard {

    private final CurrentUserProvider currentUserProvider;

    /**
     * 判斷當前登入者是否為 exam 的 owner 或具 ADMIN 身份
     */
    public boolean isOwnerOrAdmin(Exam exam) {
        User current = currentUserProvider.requireCurrentUser();
        if (current.getRole() == UserRole.ADMIN) {
            return true;
        }
        return exam.getOwner() != null
            && exam.getOwner().getId().equals(current.getId());
    }

    /**
     * 強制 exam 必須屬於當前使用者或 admin，否則拋 403
     */
    public void assertOwnerOrAdmin(Exam exam) {
        if (!isOwnerOrAdmin(exam)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "EXAM_FORBIDDEN",
                "無權限操作此測驗");
        }
    }

    /**
     * Survey 透過其 exam 推導 ownership
     */
    public void assertOwnerOrAdmin(Survey survey) {
        assertOwnerOrAdmin(survey.getExam());
    }

    /**
     * EmailCampaign 透過其 exam 推導 ownership
     */
    public void assertOwnerOrAdmin(EmailCampaign campaign) {
        assertOwnerOrAdmin(campaign.getExam());
    }
}
