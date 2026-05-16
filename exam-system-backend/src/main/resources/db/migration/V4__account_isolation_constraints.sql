-- V4: 加上 NOT NULL 約束
-- 前提：V3 backfill 已成功，所有舊資料都有 owner_id / profile_id
-- 此 V4 若失敗即表示 V3 有遺漏 → 修正 V3 後重跑（這正是設計上的安全網）
-- ============================================================

ALTER TABLE exam    ALTER COLUMN owner_id   SET NOT NULL;
ALTER TABLE student ALTER COLUMN profile_id SET NOT NULL;
