-- V3: 帳號隔離資料 backfill
-- ============================================================
-- 前置：MIGRATION_DEFAULT_OWNER_EMAIL 環境變數必須指向已存在的 user
-- 失敗時 fail-fast，容器不會 ready
-- ============================================================

DO $$
DECLARE
    default_owner_email TEXT := LOWER(TRIM('${migrationDefaultOwnerEmail}'));
    default_owner_id    BIGINT;
    affected            BIGINT;
BEGIN
    IF default_owner_email IS NULL OR default_owner_email = '' THEN
        RAISE EXCEPTION '環境變數 MIGRATION_DEFAULT_OWNER_EMAIL 未設定，遷移中止';
    END IF;

    SELECT id INTO default_owner_id
      FROM users
     WHERE LOWER(email) = default_owner_email;

    IF default_owner_id IS NULL THEN
        RAISE EXCEPTION '找不到 email = % 的 user，請先建立此講師帳號', default_owner_email;
    END IF;

    -- Step 1: 既有 Exam 全部指派 owner
    UPDATE exam
       SET owner_id = default_owner_id
     WHERE owner_id IS NULL;

    GET DIAGNOSTICS affected = ROW_COUNT;
    RAISE NOTICE '已指派 % 筆既有 exam 給 owner id=%', affected, default_owner_id;
END $$;

-- Step 2: 為每個 unique email 建立 StudentProfile
-- 規則：
--   - email 統一 lowercase + trim
--   - 同 email 多筆時取最新（MAX(id)）那筆當主檔資料
--   - email 為空 / NULL 的 Student 給 placeholder 'legacy-{id}@no-email.local'
INSERT INTO student_profile
       (email, name, google_id, google_email, is_gmail_verified, avatar_icon, created_at, updated_at)
SELECT
    COALESCE(NULLIF(LOWER(TRIM(latest.email)), ''),
             'legacy-' || latest.id || '@no-email.local')  AS email,
    latest.name,
    latest.google_id,
    latest.google_email,
    COALESCE(latest.is_gmail_verified, FALSE),
    latest.avatar_icon,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT ON (COALESCE(NULLIF(LOWER(TRIM(email)), ''),
                                 'legacy-' || id || '@no-email.local'))
           id, email, name, google_id, google_email,
           is_gmail_verified, avatar_icon
      FROM student
     ORDER BY COALESCE(NULLIF(LOWER(TRIM(email)), ''),
                       'legacy-' || id || '@no-email.local'),
              id DESC
) latest
ON CONFLICT (email) DO NOTHING;

-- Step 3: 回填 student.profile_id
UPDATE student s
   SET profile_id = p.id
  FROM student_profile p
 WHERE p.email = COALESCE(NULLIF(LOWER(TRIM(s.email)), ''),
                          'legacy-' || s.id || '@no-email.local')
   AND s.profile_id IS NULL;

-- Step 4: 從歷史紀錄推導 InstructorStudentRelation
INSERT INTO instructor_student_relation
       (instructor_id, profile_id, first_interaction_at, last_interaction_at, exam_count)
SELECT
    e.owner_id,
    s.profile_id,
    MIN(s.joined_at) AS first_interaction_at,
    MAX(s.joined_at) AS last_interaction_at,
    COUNT(DISTINCT s.exam_id) AS exam_count
  FROM student s
  JOIN exam    e ON e.id = s.exam_id
 WHERE s.profile_id IS NOT NULL
   AND e.owner_id   IS NOT NULL
 GROUP BY e.owner_id, s.profile_id
ON CONFLICT (instructor_id, profile_id) DO NOTHING;
