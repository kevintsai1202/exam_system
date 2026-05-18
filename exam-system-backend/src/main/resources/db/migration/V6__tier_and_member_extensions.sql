-- V6: 行銷平台 Phase 1 — 既有表擴充
-- 1. users 加 tier 與相關時間欄位，移除舊的 boolean 旗標
-- 2. student_profile 升格為會員主體，新增取得來源、同意紀錄欄位
-- 3. instructor_student_relation 新增 tags JSON

ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(10) NOT NULL DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_subscribed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMP;

-- 既有用戶錨點補 createdAt（後續升 PAID 會覆寫）
UPDATE users SET tier_subscribed_at = created_at WHERE tier_subscribed_at IS NULL;

-- 移除舊欄位（H2 與 PostgreSQL 都支援 IF EXISTS）
ALTER TABLE users DROP COLUMN IF EXISTS survey_management_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS email_management_enabled;

-- student_profile 升格欄位
ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS acquisition_source VARCHAR(20);
ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS acquired_at TIMESTAMP;
ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS acquired_via_id BIGINT;
ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS first_consent_at TIMESTAMP;
ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS consent_version VARCHAR(20);
ALTER TABLE student_profile ADD COLUMN IF NOT EXISTS notes TEXT;

-- 既有 profile 視為 EXAM 來源
UPDATE student_profile SET acquisition_source = 'EXAM' WHERE acquisition_source IS NULL;
UPDATE student_profile SET acquired_at = created_at WHERE acquired_at IS NULL;

-- instructor_student_relation 新增 tags JSON（以 TEXT 存 JSON 字串，跨 H2 / PostgreSQL 均相容）
ALTER TABLE instructor_student_relation ADD COLUMN IF NOT EXISTS tags TEXT;
