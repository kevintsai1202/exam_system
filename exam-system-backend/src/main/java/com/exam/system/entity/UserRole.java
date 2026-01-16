package com.exam.system.entity;

/**
 * 用戶角色枚舉
 */
public enum UserRole {
    /**
     * 學生 - 只能參與測驗
     */
    STUDENT,

    /**
     * 講師 - 可建立和管理測驗
     */
    INSTRUCTOR,

    /**
     * 管理員 - 完整權限
     */
    ADMIN
}
