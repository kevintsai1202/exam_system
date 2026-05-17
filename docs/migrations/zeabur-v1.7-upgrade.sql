-- ============================================================
-- Zeabur 升級腳本：v1.6 → v1.7 (Phase 1 Tier + Quota)
-- ============================================================
-- 適用情境：
--   Zeabur PostgreSQL 已有 V1-V5 Flyway 歷史，
--   Flyway disabled (application-docker.yml 預設)，
--   Hibernate ddl-auto=update 建立了 quota_policy / quota_usage /
--   tier_change_log 等新表，但無法加 NOT NULL 欄位。
--
-- 執行前確認：
--   1. 確認 quota_policy 表已存在（Hibernate 應已建立）
--   2. 確認 users 表目前沒有 tier 欄位
--      SELECT column_name FROM information_schema.columns
--      WHERE table_name='users' AND column_name='tier';
--   3. 確認 quota_policy 目前是空的
--      SELECT COUNT(*) FROM quota_policy;
--
-- 執行後確認：
--   SELECT 'users.tier' AS check, COUNT(*) FROM users;
--   SELECT 'quota_policy' AS check, COUNT(*) FROM quota_policy;
-- ============================================================

-- Step 1: 補上缺失的 tier 欄位（DEFAULT 'FREE' 自動回填現有 row）
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(10) NOT NULL DEFAULT 'FREE';

-- Step 2: 補上 tier_subscribed_at 錨點（以 created_at 為基準）
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_subscribed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMP;
UPDATE users SET tier_subscribed_at = created_at WHERE tier_subscribed_at IS NULL;

-- Step 3: 補 14 筆 quota_policy 種子資料
INSERT INTO quota_policy (tier, dimension, limit_value, reset_period, updated_at) VALUES
    ('FREE', 'MEMBER_COUNT',      100,   'NEVER',   NOW()),
    ('FREE', 'MONTHLY_SEND',      200,   'MONTHLY', NOW()),
    ('FREE', 'AI_QUESTION_GEN',   0,     'MONTHLY', NOW()),
    ('FREE', 'AI_DATA_ANALYSIS',  0,     'MONTHLY', NOW()),
    ('FREE', 'AI_NEWSLETTER_GEN', 0,     'MONTHLY', NOW()),
    ('FREE', 'ACTIVE_CAMPAIGNS',  0,     'NEVER',   NOW()),
    ('FREE', 'SURVEY_COUNT',      3,     'NEVER',   NOW()),
    ('PAID', 'MEMBER_COUNT',      5000,  'NEVER',   NOW()),
    ('PAID', 'MONTHLY_SEND',      20000, 'MONTHLY', NOW()),
    ('PAID', 'AI_QUESTION_GEN',   500,   'MONTHLY', NOW()),
    ('PAID', 'AI_DATA_ANALYSIS',  50,    'MONTHLY', NOW()),
    ('PAID', 'AI_NEWSLETTER_GEN', 10,    'MONTHLY', NOW()),
    ('PAID', 'ACTIVE_CAMPAIGNS',  10,    'NEVER',   NOW()),
    ('PAID', 'SURVEY_COUNT',      50,    'NEVER',   NOW())
ON CONFLICT (tier, dimension) DO NOTHING;
