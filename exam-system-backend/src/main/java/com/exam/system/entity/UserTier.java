package com.exam.system.entity;

/**
 * 講師訂閱分級
 * FREE：免費版，配額較低，無 AI / 無廣告 / 無電子報發送
 * PAID：付費版，依 quota_policy 表給予更高配額
 */
public enum UserTier {
    FREE,
    PAID
}
