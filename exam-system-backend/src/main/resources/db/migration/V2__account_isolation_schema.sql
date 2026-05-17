-- V2: 帳號隔離與跨測驗學員關係 schema 變更（nullable 欄位 + 新表）
-- ============================================================
-- 設計備註：
--   - 所有 FK 採用 PostgreSQL 預設 ON DELETE NO ACTION，刻意不啟用 cascade：
--     防止 admin 不小心刪除一位講師時，連帶刪掉所有測驗、學員關係。
--   - StudentProfile 合併由 admin 手動處理（spec §10 Out of Scope）；
--     被引用的 profile 無法直接刪除是預期行為。
-- ============================================================

-- 1. 跨測驗學員主檔
CREATE TABLE student_profile (
    id                BIGSERIAL PRIMARY KEY,
    email             VARCHAR(100) NOT NULL,
    name              VARCHAR(50)  NOT NULL,
    google_id         VARCHAR(100),
    google_email      VARCHAR(100),
    is_gmail_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    avatar_icon       VARCHAR(20),
    created_at        TIMESTAMP    NOT NULL,
    updated_at        TIMESTAMP,
    CONSTRAINT uq_student_profile_email UNIQUE (email)
);
CREATE INDEX idx_student_profile_google_id ON student_profile(google_id);

-- 2. 講師 ↔ 學員關係表
--    uq_instructor_profile 是 (instructor_id, profile_id) 的 composite unique；
--    其自動建立的 btree index 已可服務「指定講師的所有學員」查詢（leading column），
--    因此不再額外建 idx_isr_instructor。idx_isr_profile 仍需要因 profile_id 為非 leading column。
CREATE TABLE instructor_student_relation (
    id                   BIGSERIAL PRIMARY KEY,
    instructor_id        BIGINT NOT NULL REFERENCES users(id),
    profile_id           BIGINT NOT NULL REFERENCES student_profile(id),
    first_interaction_at TIMESTAMP NOT NULL,
    last_interaction_at  TIMESTAMP NOT NULL,
    exam_count           INTEGER   NOT NULL DEFAULT 0,
    CONSTRAINT uq_instructor_profile UNIQUE (instructor_id, profile_id)
);
CREATE INDEX idx_isr_profile ON instructor_student_relation(profile_id);

-- 3. 既有表加欄位（先 nullable，V3 backfill 後 V4 才加 NOT NULL）
ALTER TABLE exam    ADD COLUMN owner_id   BIGINT REFERENCES users(id);
ALTER TABLE student ADD COLUMN profile_id BIGINT REFERENCES student_profile(id);

CREATE INDEX idx_exam_owner_id      ON exam(owner_id);
CREATE INDEX idx_student_profile_id ON student(profile_id);
