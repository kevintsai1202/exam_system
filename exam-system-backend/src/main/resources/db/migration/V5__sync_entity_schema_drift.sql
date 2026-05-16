-- V5: 修補歷史上未受 Flyway 控管的 entity 欄位
-- ============================================================
-- 起源：在 Phase 1 引入 Flyway 之前，這些欄位透過 ddl-auto: update 由
--       Hibernate 自動加入；切到 Flyway baseline 之後，未經 migration
--       的 fresh DB 缺欄位會在啟動時驗證失敗。
--
-- 設計：採 ADD COLUMN IF NOT EXISTS，本地已被手動 ALTER 過的 DB 與
--       fresh production DB 都能安全套用。
-- ============================================================

-- User 細粒度功能權限旗標（commit b3461dd / 9b78278 引入但未寫 migration）
ALTER TABLE users ADD COLUMN IF NOT EXISTS survey_management_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_management_enabled  BOOLEAN NOT NULL DEFAULT TRUE;

-- Exam 倒數計時 UTC 過期時間（更早期引入但未寫 migration）
ALTER TABLE exam ADD COLUMN IF NOT EXISTS current_question_expires_at TIMESTAMP(6);
