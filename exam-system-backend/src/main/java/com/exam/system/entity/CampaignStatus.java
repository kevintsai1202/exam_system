package com.exam.system.entity;

/**
 * 郵件活動狀態枚舉
 */
public enum CampaignStatus {
    DRAFT, // 草稿
    SCHEDULED, // 已排程
    SENDING, // 發送中
    SENT, // 已發送
    FAILED // 發送失敗
}
