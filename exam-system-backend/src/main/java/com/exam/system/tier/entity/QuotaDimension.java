package com.exam.system.tier.entity;

/**
 * 配額維度 — 與 quota_policy.dimension 欄位字串值對應
 */
public enum QuotaDimension {
    MEMBER_COUNT,
    MONTHLY_SEND,
    AI_QUESTION_GEN,
    AI_DATA_ANALYSIS,
    AI_NEWSLETTER_GEN,
    ACTIVE_CAMPAIGNS,
    SURVEY_COUNT
}
