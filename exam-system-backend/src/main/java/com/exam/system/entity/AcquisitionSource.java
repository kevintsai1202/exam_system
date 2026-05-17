package com.exam.system.entity;

/**
 * 會員取得來源 — 用於分眾與成效報表
 * EXAM       : 透過 QR Code 加入測驗
 * SURVEY     : 透過公開問卷連結填寫
 * NEWSLETTER : 透過公開訂閱頁主動訂閱（Double opt-in）
 * IMPORT     : 講師後台 CSV 匯入
 * API        : 未來開放給講師站外整合（本 Phase 不實作介面，僅保留 enum 值）
 */
public enum AcquisitionSource {
    EXAM,
    SURVEY,
    NEWSLETTER,
    IMPORT,
    API
}
