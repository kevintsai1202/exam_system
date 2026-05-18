package com.exam.system.tier.entity;

/**
 * 配額重置週期
 * MONTHLY：跟著個人錨點每月重置（lazy reset，不需排程）
 * NEVER  ：永久累計，例如會員總數、進行中活動數
 */
public enum QuotaResetPeriod {
    MONTHLY,
    NEVER
}
