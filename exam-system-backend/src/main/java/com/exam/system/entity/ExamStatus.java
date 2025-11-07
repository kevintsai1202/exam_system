package com.exam.system.entity;

/**
 * 測驗狀態列舉
 */
public enum ExamStatus {
    /**
     * 已建立（尚未啟動）
     */
    CREATED,

    /**
     * 進行中（已啟動，學員可加入或作答中）
     */
    STARTED,

    /**
     * 已結束
     */
    ENDED
}