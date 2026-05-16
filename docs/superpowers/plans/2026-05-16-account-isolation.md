# 講師帳號隔離 + 跨測驗學員關係 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為現有的即時測驗系統加上講師帳號隔離（每位講師只看到自己的題組）、建立跨測驗的學員身份識別（StudentProfile）與「講師↔學員」關係表（為後續發問卷/宣傳鋪路），並透過 Flyway 完成可控的資料遷移。

**Architecture:** 三層強制隔離（Entity NOT NULL FK / Service 層 `OwnershipGuard` / Repository owner-filter 變種）。引入 Flyway 取代 Hibernate ddl-auto，以 V2 schema → V3 backfill → V4 constraints 三段式 migration 處理既有資料。學員加入測驗時自動 UPSERT StudentProfile 與 InstructorStudentRelation。升級對「下一題可推送」用 ExamSecurityService auto-recovery 條件擴展處理，無需 schema 變更。

**Tech Stack:** Spring Boot 3.5.7 + Java 21 + JPA + PostgreSQL + Flyway / React 19 + TypeScript + Zustand + axios / Playwright（e2e）/ JUnit 5 + Mockito + Testcontainers PostgreSQL（後端整合測試）

**Spec reference:** [`docs/superpowers/specs/2026-05-16-account-isolation-design.md`](../specs/2026-05-16-account-isolation-design.md)

---

## Phase 0：環境與前置確認

### Task 0.1: 確認 Java 21 + PostgreSQL 在本地可運作

**Files:** 無（環境檢查）

- [ ] **Step 1: 驗證 Java 版本**

Run: `java -version`
Expected: 顯示 `openjdk version "21"`（若顯示 1.8 必須先依 [CLAUDE.md](../../../CLAUDE.md) 設定 JAVA_HOME 指向 `D:\java\jdk-21`）

- [ ] **Step 2: 確認本地有 PostgreSQL 跑著且 schema 存在資料**

Run（PowerShell）：
```powershell
$env:PGPASSWORD = "exam_password"
psql -h localhost -U exam_user -d exam_system -c "SELECT COUNT(*) AS exams, (SELECT COUNT(*) FROM student) AS students FROM exam;"
```
Expected: 印出當前測驗與學員數量（若未跑過任何測驗會是 `0, 0`，這也算正常）

- [ ] **Step 3: 備份本地 PostgreSQL 資料庫**

Run：
```powershell
pg_dump -h localhost -U exam_user -d exam_system -F c -f .\pre-isolation-backup.dump
```
Expected: 產生 `pre-isolation-backup.dump` 檔（往後若 migration 失敗可 `pg_restore` 回滾）

---

## Phase 1：引入 Flyway 並 baseline 現有 schema

### Task 1.1: 在 `pom.xml` 加入 Flyway 依賴

**Files:**
- Modify: `exam-system-backend/pom.xml`

- [ ] **Step 1: 找到 `<dependencies>` 區段，加入兩個依賴**

在 `exam-system-backend/pom.xml` 的 `<dependencies>` 區段內加入：
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```
（Spring Boot Parent BOM 會自動管理版本，不需指定 `<version>`）

- [ ] **Step 2: 驗證 Maven 能解析依賴**

Run（從 `exam-system-backend/` 目錄）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn dependency:resolve -DincludeArtifactIds=flyway-core,flyway-database-postgresql -q
```
Expected: 無錯誤輸出（沉默通過 = 成功）

### Task 1.2: 設定 application.yml 啟用 Flyway 並關掉 Hibernate DDL

**Files:**
- Modify: `exam-system-backend/src/main/resources/application.yml`
- Modify: `exam-system-backend/src/main/resources/application-docker.yml`

- [ ] **Step 1: 修改 `application.yml`，在 `spring:` 區段加 flyway，並把 `jpa.hibernate.ddl-auto` 從 `update` 改為 `none`**

把 `application.yml` 中：
```yaml
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update
```
改為：
```yaml
  # Flyway migration 設定
  flyway:
    enabled: ${SPRING_FLYWAY_ENABLED:true}        # 本地預設啟用；Zeabur 由 application-docker.yml 覆蓋為 false
    baseline-on-migrate: true
    baseline-version: 1
    locations: classpath:db/migration
    placeholders:
      migrationDefaultOwnerEmail: ${MIGRATION_DEFAULT_OWNER_EMAIL:}

  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: none                              # schema 完全交給 Flyway
```

- [ ] **Step 2: 修改 `application-docker.yml`，在 `spring:` 區段加 flyway 預設 disable**

在 `application-docker.yml` 的 `spring:` 區段內加入：
```yaml
  flyway:
    enabled: ${SPRING_FLYWAY_ENABLED:false}       # Zeabur 預設禁用，要 migrate 時手動 enable
```

- [ ] **Step 3: 啟動 Spring Boot 驗證 baseline 成功**

Run（從 `exam-system-backend/` 目錄）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run
```
Expected log（節錄）：
```
Flyway Community Edition X.X.X by Redgate
Database: jdbc:postgresql://localhost:5432/exam_system (PostgreSQL 16.x)
Schema history table "public"."flyway_schema_history" does not exist yet
Schema "public" has been baselined with version 1
Current version of schema "public": 1
Schema is up to date. No migration necessary.
```
**Stop the application after seeing this.** (Ctrl+C)

- [ ] **Step 4: 驗證 `flyway_schema_history` 表已建立並有 baseline 記錄**

Run（PowerShell）：
```powershell
$env:PGPASSWORD = "exam_password"
psql -h localhost -U exam_user -d exam_system -c "SELECT version, description, type, success FROM flyway_schema_history;"
```
Expected: 一筆紀錄 `1 | << Flyway Baseline >> | BASELINE | t`

- [ ] **Step 5: Commit**

Run：
```powershell
git add exam-system-backend/pom.xml exam-system-backend/src/main/resources/application.yml exam-system-backend/src/main/resources/application-docker.yml
git commit -m "feat(backend): introduce Flyway and baseline existing schema as V1"
```

---

## Phase 2：V2 — 新增帳號隔離相關 schema（欄位先 nullable）

### Task 2.1: 撰寫 V2 migration

**Files:**
- Create: `exam-system-backend/src/main/resources/db/migration/V2__account_isolation_schema.sql`

- [ ] **Step 1: 建立 migration 目錄並寫入 V2 SQL**

建立檔案 `exam-system-backend/src/main/resources/db/migration/V2__account_isolation_schema.sql`：
```sql
-- V2: 帳號隔離與跨測驗學員關係 schema 變更（nullable 欄位 + 新表）
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
CREATE TABLE instructor_student_relation (
    id                   BIGSERIAL PRIMARY KEY,
    instructor_id        BIGINT NOT NULL REFERENCES users(id),
    profile_id           BIGINT NOT NULL REFERENCES student_profile(id),
    first_interaction_at TIMESTAMP NOT NULL,
    last_interaction_at  TIMESTAMP NOT NULL,
    exam_count           INTEGER   NOT NULL DEFAULT 0,
    CONSTRAINT uq_instructor_profile UNIQUE (instructor_id, profile_id)
);
CREATE INDEX idx_isr_instructor ON instructor_student_relation(instructor_id);
CREATE INDEX idx_isr_profile    ON instructor_student_relation(profile_id);

-- 3. 既有表加欄位（先 nullable，V3 backfill 後 V4 才加 NOT NULL）
ALTER TABLE exam    ADD COLUMN owner_id   BIGINT REFERENCES users(id);
ALTER TABLE student ADD COLUMN profile_id BIGINT REFERENCES student_profile(id);

CREATE INDEX idx_exam_owner_id      ON exam(owner_id);
CREATE INDEX idx_student_profile_id ON student(profile_id);
```

- [ ] **Step 2: 啟動 Spring Boot 跑 V2**

Run（從 `exam-system-backend/` 目錄）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run
```
Expected log（節錄）：
```
Migrating schema "public" to version "2 - account isolation schema"
Successfully applied 1 migration to schema "public", now at version v2
```
**Stop the application after seeing this.** (Ctrl+C)

- [ ] **Step 3: 驗證 schema 變更**

Run（PowerShell）：
```powershell
$env:PGPASSWORD = "exam_password"
psql -h localhost -U exam_user -d exam_system -c "\d exam"
psql -h localhost -U exam_user -d exam_system -c "\d student"
psql -h localhost -U exam_user -d exam_system -c "\d student_profile"
psql -h localhost -U exam_user -d exam_system -c "\d instructor_student_relation"
```
Expected: `exam` 表有 `owner_id` 欄位（nullable）、`student` 表有 `profile_id` 欄位（nullable）、新表 `student_profile` 與 `instructor_student_relation` 結構正確

- [ ] **Step 4: Commit**

Run：
```powershell
git add exam-system-backend/src/main/resources/db/migration/V2__account_isolation_schema.sql
git commit -m "feat(db): V2 add account isolation schema (nullable columns + new tables)"
```

---

## Phase 3：新增 Entity 與 Repository

### Task 3.1: 建立 `StudentProfile` entity

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/entity/StudentProfile.java`

- [ ] **Step 1: 撰寫 entity**

建立 `exam-system-backend/src/main/java/com/exam/system/entity/StudentProfile.java`：
```java
package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 跨測驗學員主檔
 * 以 lowercase email 為穩定識別 key；首次學員加入測驗時建立，之後同 email 再加入會更新最新資料
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "student_profile", indexes = {
        @Index(name = "idx_student_profile_email", columnList = "email", unique = true),
        @Index(name = "idx_student_profile_google_id", columnList = "googleId")
})
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 穩定識別 key：lowercase email */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /** 學員顯示名稱（最新一次加入時更新） */
    @Column(nullable = false, length = 50)
    private String name;

    /** Google 帳號 ID（綁定後填入） */
    @Column(length = 100)
    private String googleId;

    @Column(length = 100)
    private String googleEmail;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isGmailVerified = false;

    /** 頭像（最新一場參賽時使用的） */
    @Column(length = 20)
    private String avatarIcon;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 建立前回調：強制 email 正規化為 lowercase + trim
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
        if (this.isGmailVerified == null) {
            this.isGmailVerified = false;
        }
    }

    /**
     * 更新前回調：updatedAt 自動填值
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

### Task 3.2: 建立 `StudentProfileRepository`

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/repository/StudentProfileRepository.java`

- [ ] **Step 1: 撰寫 repository**

建立 `exam-system-backend/src/main/java/com/exam/system/repository/StudentProfileRepository.java`：
```java
package com.exam.system.repository;

import com.exam.system.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 跨測驗學員主檔 Repository
 */
@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    /**
     * 以 email 查 profile（email 應為已正規化的 lowercase）
     */
    Optional<StudentProfile> findByEmail(String email);

    /**
     * 檢查 email 是否已存在
     */
    boolean existsByEmail(String email);
}
```

### Task 3.3: 建立 `InstructorStudentRelation` entity

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/entity/InstructorStudentRelation.java`

- [ ] **Step 1: 撰寫 entity**

建立 `exam-system-backend/src/main/java/com/exam/system/entity/InstructorStudentRelation.java`：
```java
package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 講師 ↔ 學員 關係表
 * 學員每次參加某講師的測驗時 UPSERT：新關係建立或既有關係 examCount++
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "instructor_student_relation",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_instructor_profile",
                columnNames = {"instructor_id", "profile_id"}),
        indexes = {
                @Index(name = "idx_isr_instructor", columnList = "instructor_id"),
                @Index(name = "idx_isr_profile", columnList = "profile_id")
        })
public class InstructorStudentRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 講師（User.role = INSTRUCTOR 或 ADMIN） */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    /** 學員主檔 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private StudentProfile profile;

    /** 首次參賽此講師測驗的時間 */
    @Column(nullable = false, updatable = false)
    private LocalDateTime firstInteractionAt;

    /** 最近一次參賽 */
    @Column(nullable = false)
    private LocalDateTime lastInteractionAt;

    /** 累積參賽該講師測驗的場次 */
    @Builder.Default
    @Column(nullable = false)
    private Integer examCount = 0;
}
```

### Task 3.4: 建立 `InstructorStudentRelationRepository`

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/repository/InstructorStudentRelationRepository.java`

- [ ] **Step 1: 撰寫 repository**

建立 `exam-system-backend/src/main/java/com/exam/system/repository/InstructorStudentRelationRepository.java`：
```java
package com.exam.system.repository;

import com.exam.system.entity.InstructorStudentRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 講師 ↔ 學員 關係 Repository
 */
@Repository
public interface InstructorStudentRelationRepository
        extends JpaRepository<InstructorStudentRelation, Long> {

    /**
     * 查特定講師對特定學員的關係（用於 UPSERT 判斷）
     */
    Optional<InstructorStudentRelation> findByInstructorIdAndProfileId(
            Long instructorId, Long profileId);

    /**
     * 查某講師擁有的所有學員關係（依最近互動時間排序）
     */
    @Query("SELECT r FROM InstructorStudentRelation r " +
           "WHERE r.instructor.id = :instructorId " +
           "ORDER BY r.lastInteractionAt DESC")
    List<InstructorStudentRelation> findByInstructorIdOrderByLastInteractionDesc(
            @Param("instructorId") Long instructorId);
}
```

### Task 3.5: 修改 `Exam` entity 加 owner

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/entity/Exam.java`

- [ ] **Step 1: 在 Exam class 中新增 owner 欄位**

在 `Exam.java` 的 `private LocalDateTime currentQuestionStartedAt;` 那一行之後（約第 95 行）、`private Instant currentQuestionExpiresAt;` 之前，加入：
```java
    /**
     * 測驗擁有者（建立此測驗的講師）
     * 不設 cascade=REMOVE：避免 admin 不小心刪講師時把所有測驗一起刪
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")  // V2 階段先 nullable，V4 才加 NOT NULL
    private User owner;
```

> **Note**：先**不要**加 `nullable = false`——V3 backfill 完成、V4 加 DB-level NOT NULL 之前，entity 必須允許 null，否則 Hibernate 啟動驗證會失敗。等 V4 跑完、確認所有舊資料都有 owner_id 後，再回來把 `nullable = false` 補上（這留到 Phase 5）。

### Task 3.6: 修改 `Student` entity 加 profile

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/entity/Student.java`

- [ ] **Step 1: 在 Student class 中新增 profile 欄位**

在 `Student.java` 的 `private LocalDateTime joinedAt;` 那一行之前（約第 120 行）加入：
```java
    /**
     * 對應的跨測驗學員主檔（V3 backfill 後所有 student 都會有對應 profile）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")  // V2 階段先 nullable，V4 才加 NOT NULL
    private StudentProfile profile;
```

> **Note**：同 Task 3.5，V4 跑完後再回來補 `nullable = false`。

### Task 3.7: 啟動驗證

- [ ] **Step 1: 啟動 Spring Boot**

Run（從 `exam-system-backend/` 目錄）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run
```
Expected log：應用程式正常啟動，沒有 `validation` 相關錯誤。
**Stop the application after seeing this.** (Ctrl+C)

### Task 3.8: Commit

- [ ] **Step 1: Commit**

Run：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/entity/StudentProfile.java exam-system-backend/src/main/java/com/exam/system/entity/InstructorStudentRelation.java exam-system-backend/src/main/java/com/exam/system/repository/StudentProfileRepository.java exam-system-backend/src/main/java/com/exam/system/repository/InstructorStudentRelationRepository.java exam-system-backend/src/main/java/com/exam/system/entity/Exam.java exam-system-backend/src/main/java/com/exam/system/entity/Student.java
git commit -m "feat(backend): add StudentProfile, InstructorStudentRelation entities and link from Exam/Student"
```

---

## Phase 4：V3 — 資料遷移

### Task 4.1: 在本地建立測試講師帳號（如尚未有）

**Files:** 無

- [ ] **Step 1: 確認 admin 帳號存在（[DataInitializer.java](../../../exam-system-backend/src/main/java/com/exam/system/config/DataInitializer.java) 會自動建）**

Run：
```powershell
$env:PGPASSWORD = "exam_password"
psql -h localhost -U exam_user -d exam_system -c "SELECT id, email, role FROM users WHERE LOWER(email) = 'admin@example.com';"
```
Expected: 一筆 admin 紀錄；若不存在，先 `mvn spring-boot:run` 啟動一次再 Ctrl+C 即可（DataInitializer 會建好）

- [ ] **Step 2: 設定環境變數 MIGRATION_DEFAULT_OWNER_EMAIL（本地測試用 admin）**

Run（PowerShell，本 session 期間有效）：
```powershell
$env:MIGRATION_DEFAULT_OWNER_EMAIL = "admin@example.com"
```

### Task 4.2: 撰寫 V3 migration

**Files:**
- Create: `exam-system-backend/src/main/resources/db/migration/V3__account_isolation_data_backfill.sql`

- [ ] **Step 1: 寫 V3 SQL**

建立 `exam-system-backend/src/main/resources/db/migration/V3__account_isolation_data_backfill.sql`：
```sql
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
```

- [ ] **Step 2: 啟動 Spring Boot 跑 V3**

Run（從 `exam-system-backend/`，環境變數已於 Task 4.1 Step 2 設定）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run
```
Expected log：
```
Migrating schema "public" to version "3 - account isolation data backfill"
NOTICE: 已指派 N 筆既有 exam 給 owner id=...
Successfully applied 1 migration
```
**Stop the application after seeing this.** (Ctrl+C)

- [ ] **Step 3: 驗證資料 backfill 正確**

Run：
```powershell
$env:PGPASSWORD = "exam_password"
psql -h localhost -U exam_user -d exam_system -c "SELECT COUNT(*) AS total_exams, COUNT(owner_id) AS with_owner FROM exam;"
psql -h localhost -U exam_user -d exam_system -c "SELECT COUNT(*) AS total_students, COUNT(profile_id) AS with_profile FROM student;"
psql -h localhost -U exam_user -d exam_system -c "SELECT COUNT(*) FROM student_profile;"
psql -h localhost -U exam_user -d exam_system -c "SELECT COUNT(*) FROM instructor_student_relation;"
```
Expected: `total_exams == with_owner`、`total_students == with_profile`、profile 數量等於 unique email 數量

- [ ] **Step 4: Commit**

Run：
```powershell
git add exam-system-backend/src/main/resources/db/migration/V3__account_isolation_data_backfill.sql
git commit -m "feat(db): V3 backfill exam.owner_id, student.profile_id, and instructor_student_relation"
```

### Task 4.3: 驗證 fail-fast 路徑（環境變數錯誤時的行為）

**Files:** 無（行為驗證）

- [ ] **Step 1: 模擬 MIGRATION_DEFAULT_OWNER_EMAIL 未設定的情境**

> **注意**：以下步驟只是 fail-fast 行為**驗證**，**不需要** rollback DB，因為 V3 已經跑完登記在 history 表，後續啟動 Flyway 偵測「無 pending migration」就跳過——只要 placeholder 用得到的地方都是空字串，V3 本身不會再被觸發。但為了驗證 fail-fast 是真有效，下次新增 V5 時若 placeholder 未設仍會 fail。

本步驟改為**閱讀驗證**：開啟剛建立的 V3 檔，確認 `RAISE EXCEPTION` 兩條件都有寫；以及 `application.yml` 的 placeholder 預設為空字串 `${MIGRATION_DEFAULT_OWNER_EMAIL:}`。

Expected: V3 第 11-13 行 + 第 17-19 行各有 RAISE EXCEPTION；application.yml 第 placeholders 區段有 `migrationDefaultOwnerEmail: ${MIGRATION_DEFAULT_OWNER_EMAIL:}`

---

## Phase 5：V4 — 加上 NOT NULL 約束，並回填 entity 的 nullable=false

### Task 5.1: 撰寫 V4 migration

**Files:**
- Create: `exam-system-backend/src/main/resources/db/migration/V4__account_isolation_constraints.sql`

- [ ] **Step 1: 寫 V4 SQL**

建立 `exam-system-backend/src/main/resources/db/migration/V4__account_isolation_constraints.sql`：
```sql
-- V4: 加上 NOT NULL 約束
-- 前提：V3 backfill 已成功，所有舊資料都有 owner_id / profile_id
-- ============================================================

ALTER TABLE exam    ALTER COLUMN owner_id   SET NOT NULL;
ALTER TABLE student ALTER COLUMN profile_id SET NOT NULL;
```

- [ ] **Step 2: 啟動 Spring Boot 跑 V4**

Run：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run
```
Expected log：
```
Migrating schema "public" to version "4 - account isolation constraints"
Successfully applied 1 migration
```
若 V4 在此失敗（例如 V3 有遺漏資料），需檢查並修正 V3 再重跑——這正是設計上的安全網。
**Stop the application after seeing this.** (Ctrl+C)

### Task 5.2: 回填 Exam.owner / Student.profile 的 nullable=false

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/entity/Exam.java`
- Modify: `exam-system-backend/src/main/java/com/exam/system/entity/Student.java`

- [ ] **Step 1: 修改 Exam.owner 的 `@JoinColumn`**

把 `Exam.java` 中：
```java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")  // V2 階段先 nullable，V4 才加 NOT NULL
    private User owner;
```
改為：
```java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
```

- [ ] **Step 2: 修改 Student.profile 的 `@JoinColumn`**

把 `Student.java` 中：
```java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")  // V2 階段先 nullable，V4 才加 NOT NULL
    private StudentProfile profile;
```
改為：
```java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private StudentProfile profile;
```

- [ ] **Step 3: 啟動驗證**

Run：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run
```
Expected: 應用程式正常啟動。
**Stop the application after seeing this.** (Ctrl+C)

- [ ] **Step 4: Commit**

Run：
```powershell
git add exam-system-backend/src/main/resources/db/migration/V4__account_isolation_constraints.sql exam-system-backend/src/main/java/com/exam/system/entity/Exam.java exam-system-backend/src/main/java/com/exam/system/entity/Student.java
git commit -m "feat(backend): V4 enforce NOT NULL on owner_id and profile_id, sync entity constraints"
```

---

## Phase 6：CurrentUserProvider + OwnershipGuard

### Task 6.1: 撰寫 `CurrentUserProvider` 單元測試

**Files:**
- Create: `exam-system-backend/src/test/java/com/exam/system/service/CurrentUserProviderTest.java`

- [ ] **Step 1: 撰寫測試（檔案要先建好對應 Service skeleton 才能 compile）**

先建立空的 service 以便測試 compile（內容下個 Task 補）：
建立 `exam-system-backend/src/main/java/com/exam/system/service/CurrentUserProvider.java`：
```java
package com.exam.system.service;

import com.exam.system.entity.User;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class CurrentUserProvider {
    public User requireCurrentUser() { throw new UnsupportedOperationException(); }
    public Long requireCurrentUserId() { throw new UnsupportedOperationException(); }
    public Optional<User> getCurrentUser() { throw new UnsupportedOperationException(); }
}
```

建立測試 `exam-system-backend/src/test/java/com/exam/system/service/CurrentUserProviderTest.java`：
```java
package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CurrentUserProviderTest {

    private final CurrentUserProvider provider = new CurrentUserProvider();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void requireCurrentUser_returnsPrincipal_whenAuthenticated() {
        User user = User.builder().id(1L).email("a@b.com").role(UserRole.INSTRUCTOR).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));

        assertThat(provider.requireCurrentUser()).isEqualTo(user);
        assertThat(provider.requireCurrentUserId()).isEqualTo(1L);
    }

    @Test
    void requireCurrentUser_throwsAuthException_whenNoAuthentication() {
        assertThatThrownBy(provider::requireCurrentUser)
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("尚未登入");
    }

    @Test
    void getCurrentUser_returnsEmpty_whenNoAuthentication() {
        Optional<User> result = provider.getCurrentUser();
        assertThat(result).isEmpty();
    }

    @Test
    void getCurrentUser_returnsUser_whenAuthenticated() {
        User user = User.builder().id(2L).email("c@d.com").role(UserRole.ADMIN).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        assertThat(provider.getCurrentUser()).contains(user);
    }
}
```

- [ ] **Step 2: 跑測試確認失敗**

Run（從 `exam-system-backend/`）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn test -Dtest=CurrentUserProviderTest
```
Expected: 4 個測試全部失敗（`UnsupportedOperationException`）

### Task 6.2: 實作 `CurrentUserProvider`

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/CurrentUserProvider.java`

- [ ] **Step 1: 補實作**

完整覆寫 `CurrentUserProvider.java`：
```java
package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.exception.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 當前登入使用者提供者
 * 從 SecurityContextHolder 取得 JwtAuthenticationFilter 注入的 User principal
 */
@Service
public class CurrentUserProvider {

    /**
     * 取得當前登入使用者；未登入則拋 AuthException
     */
    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED", "尚未登入");
        }
        return user;
    }

    /**
     * 取得當前登入使用者 ID
     */
    public Long requireCurrentUserId() {
        return requireCurrentUser().getId();
    }

    /**
     * 安全取得（未登入回 Optional.empty()）
     */
    public Optional<User> getCurrentUser() {
        try {
            return Optional.of(requireCurrentUser());
        } catch (AuthException e) {
            return Optional.empty();
        }
    }
}
```

- [ ] **Step 2: 跑測試確認通過**

Run：
```powershell
mvn test -Dtest=CurrentUserProviderTest
```
Expected: 4 個測試全部通過

### Task 6.3: 撰寫 `OwnershipGuard` 單元測試

**Files:**
- Create: `exam-system-backend/src/test/java/com/exam/system/service/OwnershipGuardTest.java`

- [ ] **Step 1: 建立空的 OwnershipGuard skeleton**

建立 `exam-system-backend/src/main/java/com/exam/system/service/OwnershipGuard.java`：
```java
package com.exam.system.service;

import com.exam.system.entity.EmailCampaign;
import com.exam.system.entity.Exam;
import com.exam.system.entity.Survey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OwnershipGuard {
    private final CurrentUserProvider currentUserProvider;

    public boolean isOwnerOrAdmin(Exam exam) { throw new UnsupportedOperationException(); }
    public void assertOwnerOrAdmin(Exam exam) { throw new UnsupportedOperationException(); }
    public void assertOwnerOrAdmin(Survey survey) { throw new UnsupportedOperationException(); }
    public void assertOwnerOrAdmin(EmailCampaign campaign) { throw new UnsupportedOperationException(); }
}
```

- [ ] **Step 2: 撰寫測試**

建立 `exam-system-backend/src/test/java/com/exam/system/service/OwnershipGuardTest.java`：
```java
package com.exam.system.service;

import com.exam.system.entity.Exam;
import com.exam.system.entity.Survey;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnershipGuardTest {

    @Mock CurrentUserProvider currentUserProvider;
    @InjectMocks OwnershipGuard guard;

    User instructor1, instructor2, admin;
    Exam examOwnedBy1;

    @BeforeEach
    void setup() {
        instructor1 = User.builder().id(1L).role(UserRole.INSTRUCTOR).build();
        instructor2 = User.builder().id(2L).role(UserRole.INSTRUCTOR).build();
        admin       = User.builder().id(99L).role(UserRole.ADMIN).build();
        examOwnedBy1 = new Exam();
        examOwnedBy1.setId(100L);
        examOwnedBy1.setOwner(instructor1);
    }

    @Test
    void isOwnerOrAdmin_trueForOwner() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor1);
        assertThat(guard.isOwnerOrAdmin(examOwnedBy1)).isTrue();
    }

    @Test
    void isOwnerOrAdmin_falseForOtherInstructor() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor2);
        assertThat(guard.isOwnerOrAdmin(examOwnedBy1)).isFalse();
    }

    @Test
    void isOwnerOrAdmin_trueForAdmin() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(admin);
        assertThat(guard.isOwnerOrAdmin(examOwnedBy1)).isTrue();
    }

    @Test
    void assertOwnerOrAdmin_throwsForOtherInstructor() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor2);
        assertThatThrownBy(() -> guard.assertOwnerOrAdmin(examOwnedBy1))
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("無權限");
    }

    @Test
    void assertOwnerOrAdmin_passesForAdmin() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(admin);
        assertThatNoException().isThrownBy(() -> guard.assertOwnerOrAdmin(examOwnedBy1));
    }

    @Test
    void assertOwnerOrAdmin_Survey_delegatesToExam() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor2);
        Survey s = new Survey();
        s.setExam(examOwnedBy1);
        assertThatThrownBy(() -> guard.assertOwnerOrAdmin(s))
            .isInstanceOf(AuthException.class);
    }
}
```

- [ ] **Step 3: 跑測試確認失敗**

Run：
```powershell
mvn test -Dtest=OwnershipGuardTest
```
Expected: 全部失敗

### Task 6.4: 實作 `OwnershipGuard`

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/OwnershipGuard.java`

- [ ] **Step 1: 完整覆寫**

完整覆寫 `OwnershipGuard.java`：
```java
package com.exam.system.service;

import com.exam.system.entity.EmailCampaign;
import com.exam.system.entity.Exam;
import com.exam.system.entity.Survey;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 擁有者授權守門員
 * ADMIN 一律放行；INSTRUCTOR 必須是 owner_id == self
 * Survey / EmailCampaign 透過其 exam 推導 owner，避免冗存
 */
@Service
@RequiredArgsConstructor
public class OwnershipGuard {

    private final CurrentUserProvider currentUserProvider;

    /**
     * 判斷當前登入者是否為 exam 的 owner 或具 ADMIN 身份
     */
    public boolean isOwnerOrAdmin(Exam exam) {
        User current = currentUserProvider.requireCurrentUser();
        if (current.getRole() == UserRole.ADMIN) {
            return true;
        }
        return exam.getOwner() != null
            && exam.getOwner().getId().equals(current.getId());
    }

    /**
     * 強制 exam 必須屬於當前使用者或 admin，否則拋 403
     */
    public void assertOwnerOrAdmin(Exam exam) {
        if (!isOwnerOrAdmin(exam)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "EXAM_FORBIDDEN",
                "無權限操作此測驗");
        }
    }

    /**
     * Survey 透過其 exam 推導 ownership
     */
    public void assertOwnerOrAdmin(Survey survey) {
        assertOwnerOrAdmin(survey.getExam());
    }

    /**
     * EmailCampaign 透過其 exam 推導 ownership
     */
    public void assertOwnerOrAdmin(EmailCampaign campaign) {
        assertOwnerOrAdmin(campaign.getExam());
    }
}
```

- [ ] **Step 2: 跑測試確認通過**

Run：
```powershell
mvn test -Dtest=OwnershipGuardTest
```
Expected: 6 個測試全部通過

### Task 6.5: Commit

- [ ] **Step 1: Commit**

Run：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/service/CurrentUserProvider.java exam-system-backend/src/main/java/com/exam/system/service/OwnershipGuard.java exam-system-backend/src/test/java/com/exam/system/service/CurrentUserProviderTest.java exam-system-backend/src/test/java/com/exam/system/service/OwnershipGuardTest.java
git commit -m "feat(backend): add CurrentUserProvider and OwnershipGuard with unit tests"
```

---

## Phase 7：擴展 ExamSecurityService auto-recovery（升級保護）

### Task 7.1: 撰寫測試（TDD）

**Files:**
- Create: `exam-system-backend/src/test/java/com/exam/system/service/ExamSecurityServiceAutoRecoveryTest.java`

- [ ] **Step 1: 撰寫測試**

建立 `exam-system-backend/src/test/java/com/exam/system/service/ExamSecurityServiceAutoRecoveryTest.java`：
```java
package com.exam.system.service;

import com.exam.system.config.ExamProperties;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 驗證升級重啟後 instructor session auto-recovery 邏輯：
 *   - 條件 A: 從未推題 (currentQuestionStartedAt == null)
 *   - 條件 B: 上一題已過期 + 5 秒 buffer
 */
class ExamSecurityServiceAutoRecoveryTest {

    private ExamSecurityService service;

    @BeforeEach
    void setup() {
        service = new ExamSecurityService(new ExamProperties());
    }

    @Test
    void autoRecover_whenNoQuestionPushed() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(null);

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isTrue();
        assertThat(service.getInstructorSession(exam.getId())).isEqualTo("client-token-abc");
    }

    @Test
    void autoRecover_whenLastQuestionExpiredOver5Seconds() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(LocalDateTime.now().minusSeconds(60));
        exam.setCurrentQuestionExpiresAt(Instant.now().minusSeconds(10));  // 10 秒前過期

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isTrue();
    }

    @Test
    void doNotRecover_whenLastQuestionStillActive() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(LocalDateTime.now().minusSeconds(5));
        exam.setCurrentQuestionExpiresAt(Instant.now().plusSeconds(25));   // 還有 25 秒

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isFalse();
    }

    @Test
    void doNotRecover_whenExpiredWithinBuffer() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(LocalDateTime.now().minusSeconds(30));
        exam.setCurrentQuestionExpiresAt(Instant.now().minusSeconds(2));   // 過期 2 秒（buffer 內）

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isFalse();
    }

    @Test
    void doNotRecover_whenProvidedSessionIdIsBlank() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(null);

        assertThat(service.validateInstructorSession(exam, "")).isFalse();
        assertThat(service.validateInstructorSession(exam, null)).isFalse();
    }

    private Exam newStartedExam() {
        Exam exam = new Exam();
        exam.setId(1L);
        exam.setStatus(ExamStatus.STARTED);
        return exam;
    }
}
```

- [ ] **Step 2: 跑測試確認失敗**

Run：
```powershell
mvn test -Dtest=ExamSecurityServiceAutoRecoveryTest
```
Expected: `autoRecover_whenLastQuestionExpiredOver5Seconds` 與 `doNotRecover_whenExpiredWithinBuffer` 與 `doNotRecover_whenProvidedSessionIdIsBlank` 至少有部分失敗（既有邏輯不支援這些條件）

### Task 7.2: 修改 `ExamSecurityService`

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/ExamSecurityService.java`

- [ ] **Step 1: 加入 `isLastQuestionConsideredEnded` helper**

在 `ExamSecurityService` class 內、`validateInstructorSession` 方法**之前**加入：
```java
    /**
     * 判斷上一題是否可視為「已結束」
     * 用於升級重啟後的 auto-recovery 判斷
     *  - currentQuestionStartedAt 為 null：從未推題
     *  - currentQuestionExpiresAt + 5 秒已過：上一題確定結束
     */
    private boolean isLastQuestionConsideredEnded(Exam exam) {
        if (exam.getCurrentQuestionStartedAt() == null) {
            return true;
        }
        if (exam.getCurrentQuestionExpiresAt() == null) {
            return false;
        }
        return java.time.Instant.now().isAfter(
            exam.getCurrentQuestionExpiresAt().plusSeconds(5)
        );
    }
```

- [ ] **Step 2: 修改 `validateInstructorSession` 的 auto-recovery 區塊**

找到方法中：
```java
            if (storedSessionId == null) {
                // 特殊情況：如果測驗已啟動但尚未推送題目（currentQuestionStartedAt 為 null）
                // 允許自動恢復 session（例如後端重啟的情況）
                if (exam.getCurrentQuestionStartedAt() == null) {
                    log.info("Exam {} is STARTED but no question pushed yet, auto-recovering session for provided ID: {}",
                            exam.getId(), providedSessionId);
                    // 使用前端提供的 sessionId 重新建立 session
                    if (providedSessionId != null && !providedSessionId.isEmpty()) {
                        instructorSessions.put(exam.getId(), providedSessionId);
                        log.info("Session auto-recovered for exam {}", exam.getId());
                        return true;
                    }
                }

                log.warn("No instructor session found for exam {} and cannot auto-recover", exam.getId());
                return false;
            }
```
取代為：
```java
            if (storedSessionId == null) {
                // Auto-recovery 兩條件：
                //  (1) 從未推題 (currentQuestionStartedAt == null)
                //  (2) 上一題已過期超過 5 秒 buffer（升級重啟保護）
                if (isLastQuestionConsideredEnded(exam)
                        && StringUtils.hasText(providedSessionId)) {
                    instructorSessions.put(exam.getId(), providedSessionId);
                    log.info("Instructor session auto-recovered for exam {} (last question ended or not pushed)",
                            exam.getId());
                    return true;
                }

                log.warn("No instructor session found for exam {} and cannot auto-recover", exam.getId());
                return false;
            }
```

- [ ] **Step 3: 跑測試確認通過**

Run：
```powershell
mvn test -Dtest=ExamSecurityServiceAutoRecoveryTest
```
Expected: 5 個測試全部通過

- [ ] **Step 4: Commit**

Run：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/service/ExamSecurityService.java exam-system-backend/src/test/java/com/exam/system/service/ExamSecurityServiceAutoRecoveryTest.java
git commit -m "feat(backend): extend ExamSecurityService auto-recovery for upgrade restart safety"
```

---

## Phase 8：ExamRepository owner-filter 變種

### Task 8.1: 撰寫 Repository 測試

**Files:**
- Create: `exam-system-backend/src/test/java/com/exam/system/repository/ExamRepositoryOwnerFilterTest.java`

- [ ] **Step 1: 撰寫測試**

建立 `exam-system-backend/src/test/java/com/exam/system/repository/ExamRepositoryOwnerFilterTest.java`：
```java
package com.exam.system.repository;

import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)  // 使用實際 PostgreSQL
class ExamRepositoryOwnerFilterTest {

    @Autowired TestEntityManager em;
    @Autowired ExamRepository examRepository;

    User instructor1, instructor2;

    @BeforeEach
    void setup() {
        instructor1 = em.persistAndFlush(User.builder()
            .email("t1@test.com").name("T1").role(UserRole.INSTRUCTOR).build());
        instructor2 = em.persistAndFlush(User.builder()
            .email("t2@test.com").name("T2").role(UserRole.INSTRUCTOR).build());

        em.persistAndFlush(buildExam("E-A", instructor1));
        em.persistAndFlush(buildExam("E-B", instructor1));
        em.persistAndFlush(buildExam("E-C", instructor2));
    }

    @Test
    void findByOwnerIdOrderByCreatedAtDesc_returnsOnlyOwnerExams() {
        List<Exam> result = examRepository.findByOwnerIdOrderByCreatedAtDesc(instructor1.getId());
        assertThat(result).hasSize(2)
            .extracting(Exam::getTitle)
            .containsExactlyInAnyOrder("E-A", "E-B");
    }

    @Test
    void findByIdAndOwnerId_returnsExamWhenMatch() {
        Exam examA = examRepository.findAll().stream()
            .filter(e -> "E-A".equals(e.getTitle())).findFirst().orElseThrow();
        Optional<Exam> result = examRepository.findByIdAndOwnerId(examA.getId(), instructor1.getId());
        assertThat(result).isPresent();
    }

    @Test
    void findByIdAndOwnerId_returnsEmptyWhenOtherOwner() {
        Exam examC = examRepository.findAll().stream()
            .filter(e -> "E-C".equals(e.getTitle())).findFirst().orElseThrow();
        Optional<Exam> result = examRepository.findByIdAndOwnerId(examC.getId(), instructor1.getId());
        assertThat(result).isEmpty();
    }

    @Test
    void existsByIdAndOwnerId_trueWhenMatch() {
        Exam examA = examRepository.findAll().stream()
            .filter(e -> "E-A".equals(e.getTitle())).findFirst().orElseThrow();
        assertThat(examRepository.existsByIdAndOwnerId(examA.getId(), instructor1.getId())).isTrue();
        assertThat(examRepository.existsByIdAndOwnerId(examA.getId(), instructor2.getId())).isFalse();
    }

    private Exam buildExam(String title, User owner) {
        return Exam.builder()
            .title(title)
            .questionTimeLimit(30)
            .status(ExamStatus.CREATED)
            .currentQuestionIndex(0)
            .accessCode(title.replace("-", ""))
            .owner(owner)
            .build();
    }
}
```

- [ ] **Step 2: 跑測試確認失敗**

Run：
```powershell
mvn test -Dtest=ExamRepositoryOwnerFilterTest
```
Expected: 編譯失敗（方法尚不存在）

### Task 8.2: 加入 Repository 變種方法

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/repository/ExamRepository.java`

- [ ] **Step 1: 加入三個 owner-filter 方法 + 一個 fetch-join 變種**

在 `ExamRepository.java` 介面中、`findByIdWithStudents` 之後加入：
```java

    /**
     * 取得特定 owner 的所有測驗（依建立時間倒序）
     */
    List<Exam> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    /**
     * 取得測驗，限定特定 owner（用於 ownership 預檢）
     */
    Optional<Exam> findByIdAndOwnerId(Long id, Long ownerId);

    /**
     * 檢查特定 owner 是否擁有此測驗
     */
    boolean existsByIdAndOwnerId(Long id, Long ownerId);

    /**
     * 取得測驗並預先載入題目，限定特定 owner
     */
    @Query("SELECT e FROM Exam e LEFT JOIN FETCH e.questions WHERE e.id = :id AND e.owner.id = :ownerId")
    Optional<Exam> findByIdWithQuestionsAndOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);
```

- [ ] **Step 2: 跑測試確認通過**

Run：
```powershell
mvn test -Dtest=ExamRepositoryOwnerFilterTest
```
Expected: 4 個測試全部通過

- [ ] **Step 3: Commit**

Run：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/repository/ExamRepository.java exam-system-backend/src/test/java/com/exam/system/repository/ExamRepositoryOwnerFilterTest.java
git commit -m "feat(backend): add owner-filtered query variants to ExamRepository"
```

---

## Phase 9：ExamService ownership 改造

### Task 9.1: 改造 `ExamService.createExam` 自動指派 owner

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/ExamService.java`

- [ ] **Step 1: 在 ExamService 注入新依賴**

在 `ExamService` 的依賴注入（透過 Lombok `@RequiredArgsConstructor` 或建構子）中加入：
```java
    private final CurrentUserProvider currentUserProvider;
    private final OwnershipGuard ownershipGuard;
```

- [ ] **Step 2: 修改 `createExam`，在 save 前 set owner**

找到 `createExam(ExamDTO dto)` 方法內 `Exam exam = ...build()` 之後、`examRepository.save(exam)` 之前，加入：
```java
        // 自動指派為當前登入者
        exam.setOwner(currentUserProvider.requireCurrentUser());
```

- [ ] **Step 3: 修改 `getAllExams()` 依角色分流**

把原本的：
```java
    public List<ExamDTO> getAllExams() {
        return examRepository.findAll().stream().map(this::toDto).toList();
    }
```
（若 method body 與此不同，根據實際內容調整）改為：
```java
    /**
     * 取得測驗列表
     *  - ADMIN：所有講師的測驗
     *  - INSTRUCTOR：只回傳自己 owner_id 的測驗
     */
    public List<ExamDTO> getAllExams() {
        User current = currentUserProvider.requireCurrentUser();
        List<Exam> exams = (current.getRole() == com.exam.system.entity.UserRole.ADMIN)
            ? examRepository.findAll()
            : examRepository.findByOwnerIdOrderByCreatedAtDesc(current.getId());
        return exams.stream().map(this::toDto).toList();
    }
```

- [ ] **Step 4: 在所有「對特定 exam 的操作」方法中加 `assertOwnerOrAdmin`**

對下列方法（在拿到 exam 後、做任何修改前）加上 `ownershipGuard.assertOwnerOrAdmin(exam);`：
- `getExam(Long examId)`
- `startExam(Long examId, String baseUrl)`
- `endExam(Long examId, String instructorSessionId)`
- `updateExam(Long examId, ExamDTO dto)`
- `duplicateExam(Long examId)`
- `getExamQuestions(Long examId)`
- `clearExamSession(Long examId)`
- `reorderQuestions(Long examId, List<Long> ids)`
- `reorderOptions(Long questionId, List<Long> ids)` —— 透過 question.getExam() 取得 exam 再 assert
- `startQuestion(Long examId, Integer questionIndex, String instructorSessionId)`
- `exportToMarkdown(...)`
- `exportToJson(...)`

例如 `getExam`：
```java
    public ExamDTO getExam(Long examId) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        ownershipGuard.assertOwnerOrAdmin(exam);
        return toDto(exam);
    }
```

> **學員預覽用的 `getExamByAccessCode` 不要加 ownership 檢查**——這是匿名訪問入口。

### Task 9.2: 撰寫 ExamService 隔離整合測試

**Files:**
- Create: `exam-system-backend/src/test/java/com/exam/system/service/ExamServiceIsolationTest.java`

- [ ] **Step 1: 撰寫測試**

建立 `exam-system-backend/src/test/java/com/exam/system/service/ExamServiceIsolationTest.java`：
```java
package com.exam.system.service;

import com.exam.system.dto.ExamDTO;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import com.exam.system.repository.ExamRepository;
import com.exam.system.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ExamServiceIsolationTest {

    @Autowired ExamService examService;
    @Autowired ExamRepository examRepository;
    @Autowired UserRepository userRepository;

    User t1, t2, admin;

    @BeforeEach
    void setup() {
        t1    = saveUser("isolt1@test.com", UserRole.INSTRUCTOR);
        t2    = saveUser("isolt2@test.com", UserRole.INSTRUCTOR);
        admin = saveUser("isoadmin@test.com", UserRole.ADMIN);
    }

    @Test
    void getAllExams_instructorSeesOnlyOwnExams() {
        loginAs(t1);
        examService.createExam(newExamDto("T1-Exam-A"));
        examService.createExam(newExamDto("T1-Exam-B"));

        loginAs(t2);
        examService.createExam(newExamDto("T2-Exam-C"));

        loginAs(t1);
        List<ExamDTO> t1Exams = examService.getAllExams();
        assertThat(t1Exams).extracting(ExamDTO::getTitle)
            .containsExactlyInAnyOrder("T1-Exam-A", "T1-Exam-B");
    }

    @Test
    void getAllExams_adminSeesAllExams() {
        loginAs(t1);
        examService.createExam(newExamDto("T1-Exam-A"));
        loginAs(t2);
        examService.createExam(newExamDto("T2-Exam-B"));

        loginAs(admin);
        List<ExamDTO> all = examService.getAllExams();
        assertThat(all).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void getExam_throwsForOtherInstructor() {
        loginAs(t1);
        ExamDTO created = examService.createExam(newExamDto("T1-Exam"));

        loginAs(t2);
        assertThatThrownBy(() -> examService.getExam(created.getId()))
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("無權限");
    }

    @Test
    void getExam_passesForAdmin() {
        loginAs(t1);
        ExamDTO created = examService.createExam(newExamDto("T1-Exam"));

        loginAs(admin);
        ExamDTO viewed = examService.getExam(created.getId());
        assertThat(viewed.getTitle()).isEqualTo("T1-Exam");
    }

    private User saveUser(String email, UserRole role) {
        return userRepository.save(User.builder()
            .email(email).name(email).role(role).build());
    }

    private void loginAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }

    private ExamDTO newExamDto(String title) {
        return ExamDTO.builder()
            .title(title)
            .questionTimeLimit(30)
            .build();
    }
}
```

- [ ] **Step 2: 跑測試確認通過**

Run：
```powershell
mvn test -Dtest=ExamServiceIsolationTest
```
Expected: 4 個測試全部通過

- [ ] **Step 3: Commit**

Run：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/service/ExamService.java exam-system-backend/src/test/java/com/exam/system/service/ExamServiceIsolationTest.java
git commit -m "feat(backend): wire OwnershipGuard into ExamService; isolate getAllExams by role"
```

---

## Phase 10：SurveyService / EmailService ownership 改造

### Task 10.1: 改造 SurveyService

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/SurveyService.java`

- [ ] **Step 1: 在 SurveyService 注入 `OwnershipGuard` 與 `CurrentUserProvider`**

在 `SurveyService` 的依賴中加入：
```java
    private final OwnershipGuard ownershipGuard;
    private final CurrentUserProvider currentUserProvider;
```

- [ ] **Step 2: 對所有「對特定 survey 的操作」加 assertOwnerOrAdmin**

對下列方法加 `ownershipGuard.assertOwnerOrAdmin(survey);`（在取得 survey 後、實際修改前）：
- `getSurvey(Long id)`
- `updateSurvey(Long id, SurveyDTO dto)`
- `deleteSurvey(Long id)`
- `activateSurvey(Long id)`
- `closeSurvey(Long id)`
- 任何「列出某 exam 下的 survey」的方法 → 改用 `ownershipGuard.assertOwnerOrAdmin(exam)` 在拿到 exam 後檢查

- [ ] **Step 3: 改 `listSurveys()` / `getAllSurveys()` 依角色分流**

讓「列出全部」的端點按角色分流：
```java
    public List<SurveyDTO> getAllSurveys() {
        User current = currentUserProvider.requireCurrentUser();
        List<Survey> surveys;
        if (current.getRole() == UserRole.ADMIN) {
            surveys = surveyRepository.findAll();
        } else {
            // 透過 join exam → owner_id 過濾
            surveys = surveyRepository.findByExamOwnerIdOrderByCreatedAtDesc(current.getId());
        }
        return surveys.stream().map(this::toDto).toList();
    }
```
若 `SurveyRepository` 尚無 `findByExamOwnerIdOrderByCreatedAtDesc`，在介面加：
```java
    @Query("SELECT s FROM Survey s WHERE s.exam.owner.id = :ownerId ORDER BY s.createdAt DESC")
    List<Survey> findByExamOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);
```

- [ ] **Step 4: 啟動驗證**

Run：
```powershell
mvn test -Dtest=SurveyServiceTest -DfailIfNoTests=false
mvn spring-boot:run
```
（沒有現成 SurveyServiceTest 也沒關係，重點是 application 啟動成功）
Expected: 應用程式正常啟動。
**Stop the application after seeing this.** (Ctrl+C)

### Task 10.2: 改造 EmailService（同模式）

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/EmailService.java`

- [ ] **Step 1: 注入 + 對所有 mutating 操作加 assertOwnerOrAdmin**

在 `EmailService` 的依賴中加入：
```java
    private final OwnershipGuard ownershipGuard;
    private final CurrentUserProvider currentUserProvider;
```

對下列「對特定 EmailCampaign 操作」的方法加 `ownershipGuard.assertOwnerOrAdmin(campaign);`：
- `getCampaign(Long id)`
- `updateCampaign(Long id, EmailCampaignDTO dto)`
- `deleteCampaign(Long id)`
- `sendCampaign(Long id)`
- 任何取得單筆 campaign 並回傳的方法

- [ ] **Step 2: 改 `listCampaigns()` 依角色分流**

同 SurveyService 模式，若 `EmailCampaignRepository` 尚無 owner-filter，加：
```java
    @Query("SELECT c FROM EmailCampaign c WHERE c.exam.owner.id = :ownerId ORDER BY c.createdAt DESC")
    List<EmailCampaign> findByExamOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);
```

- [ ] **Step 3: 啟動驗證 + Commit**

Run：
```powershell
mvn spring-boot:run
```
確認啟動成功後 Ctrl+C。

Commit：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/service/SurveyService.java exam-system-backend/src/main/java/com/exam/system/service/EmailService.java exam-system-backend/src/main/java/com/exam/system/repository/SurveyRepository.java exam-system-backend/src/main/java/com/exam/system/repository/EmailCampaignRepository.java
git commit -m "feat(backend): wire OwnershipGuard into SurveyService and EmailService"
```

---

## Phase 11：StudentService.joinExam UPSERT Profile + Relation

### Task 11.1: 撰寫 join + UPSERT 整合測試

**Files:**
- Create: `exam-system-backend/src/test/java/com/exam/system/service/StudentJoinUpsertTest.java`

- [ ] **Step 1: 撰寫測試**

建立 `exam-system-backend/src/test/java/com/exam/system/service/StudentJoinUpsertTest.java`：
```java
package com.exam.system.service;

import com.exam.system.dto.ExamDTO;
import com.exam.system.dto.StudentDTO;
import com.exam.system.entity.*;
import com.exam.system.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class StudentJoinUpsertTest {

    @Autowired StudentService studentService;
    @Autowired ExamService examService;
    @Autowired StudentProfileRepository profileRepository;
    @Autowired InstructorStudentRelationRepository relationRepository;
    @Autowired UserRepository userRepository;
    @Autowired ExamRepository examRepository;

    User instructor;
    String accessCodeA;
    String accessCodeB;

    @BeforeEach
    void setup() {
        instructor = userRepository.save(User.builder()
            .email("joinupsert@test.com").name("J").role(UserRole.INSTRUCTOR).build());

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                instructor, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));

        ExamDTO examA = examService.createExam(ExamDTO.builder()
            .title("EX-A").questionTimeLimit(30).build());
        ExamDTO examB = examService.createExam(ExamDTO.builder()
            .title("EX-B").questionTimeLimit(30).build());

        // 模擬 startExam 設定 accessCode（簡化：直接 update DB）
        Exam a = examRepository.findById(examA.getId()).orElseThrow();
        a.setAccessCode("AAAAAA");
        accessCodeA = "AAAAAA";
        Exam b = examRepository.findById(examB.getId()).orElseThrow();
        b.setAccessCode("BBBBBB");
        accessCodeB = "BBBBBB";
        examRepository.saveAll(List.of(a, b));
    }

    @Test
    void firstJoin_createsProfileAndRelation() {
        StudentDTO s = studentService.joinExam(joinRequest("STU@Example.com", "小明", accessCodeA));

        Optional<StudentProfile> profile = profileRepository.findByEmail("stu@example.com");
        assertThat(profile).isPresent();
        assertThat(profile.get().getName()).isEqualTo("小明");

        Optional<InstructorStudentRelation> rel = relationRepository
            .findByInstructorIdAndProfileId(instructor.getId(), profile.get().getId());
        assertThat(rel).isPresent();
        assertThat(rel.get().getExamCount()).isEqualTo(1);
    }

    @Test
    void secondJoinSameInstructor_incrementsExamCount() {
        studentService.joinExam(joinRequest("stu@example.com", "小明", accessCodeA));
        studentService.joinExam(joinRequest("stu@example.com", "小明", accessCodeB));

        StudentProfile profile = profileRepository.findByEmail("stu@example.com").orElseThrow();
        InstructorStudentRelation rel = relationRepository
            .findByInstructorIdAndProfileId(instructor.getId(), profile.getId()).orElseThrow();
        assertThat(rel.getExamCount()).isEqualTo(2);
    }

    @Test
    void emailIsNormalizedToLowercase() {
        studentService.joinExam(joinRequest("MIXED@Case.COM", "小華", accessCodeA));

        assertThat(profileRepository.findByEmail("mixed@case.com")).isPresent();
        assertThat(profileRepository.findByEmail("MIXED@Case.COM")).isEmpty();  // 主檔只存 lowercase
    }

    /**
     * 建立 JoinRequestDTO 的 helper；根據實際 DTO 的欄位調整
     */
    private com.exam.system.dto.StudentDTO joinRequest(String email, String name, String accessCode) {
        return com.exam.system.dto.StudentDTO.builder()
            .email(email)
            .name(name)
            .avatarIcon("avatar1")
            .build();
        // 注意：實際呼叫請改用對應的 JoinRequestDTO；此處示意，可能需要根據實作調整
    }
}
```

> **Note**：建議實作前先確認 `StudentService` 的 `joinExam` 方法簽名與對應 DTO 結構，必要時調整測試中的 `joinRequest` helper 或直接使用 controller 的 DTO 類別。

- [ ] **Step 2: 跑測試確認失敗（UPSERT 邏輯未實作）**

Run：
```powershell
mvn test -Dtest=StudentJoinUpsertTest
```
Expected: 至少 `firstJoin_createsProfileAndRelation` 失敗（Profile 與 Relation 都還沒建立）

### Task 11.2: 改造 `StudentService.joinExam`

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/StudentService.java`

- [ ] **Step 1: 注入新依賴**

在 `StudentService` 的依賴中加入：
```java
    private final StudentProfileRepository studentProfileRepository;
    private final InstructorStudentRelationRepository instructorStudentRelationRepository;
```

- [ ] **Step 2: 修改 joinExam 實作**

在現有 `joinExam` 方法中，於 `studentRepository.save(student)` 之前加入「UPSERT Profile」邏輯、之後加入「UPSERT Relation」邏輯。

範例（按既有 join 流程順序整合）：
```java
@Transactional
public StudentDTO joinExam(...) {
    Exam exam = examRepository.findByAccessCode(accessCode)
        .orElseThrow(() -> new ResourceNotFoundException("Exam", accessCode));

    // ... 既有的測驗狀態檢查、學員姓名/email 驗證 ...

    // (1) UPSERT StudentProfile（以 lowercase email 為穩定 key）
    String normalizedEmail = email.toLowerCase().trim();
    StudentProfile profile = studentProfileRepository.findByEmail(normalizedEmail)
        .map(existing -> {
            existing.setName(name);            // 更新最新名字
            if (avatarIcon != null) existing.setAvatarIcon(avatarIcon);
            if (googleId != null) existing.setGoogleId(googleId);
            return existing;
        })
        .orElseGet(() -> StudentProfile.builder()
            .email(normalizedEmail)
            .name(name)
            .avatarIcon(avatarIcon)
            .googleId(googleId)
            .googleEmail(googleEmail)
            .isGmailVerified(false)
            .build());
    profile = studentProfileRepository.save(profile);

    // (2) 建立 per-exam Student 紀錄
    Student student = Student.builder()
        .exam(exam)
        .profile(profile)
        .sessionId(java.util.UUID.randomUUID().toString())
        .email(normalizedEmail)
        .name(name)
        .avatarIcon(avatarIcon)
        // ... 其餘既有欄位（occupation, location, surveyData 等）...
        .build();
    studentRepository.save(student);

    // (3) UPSERT InstructorStudentRelation
    User instructor = exam.getOwner();
    java.time.LocalDateTime now = java.time.LocalDateTime.now();
    StudentProfile pf = profile;  // effectively final 供 lambda 使用
    instructorStudentRelationRepository
        .findByInstructorIdAndProfileId(instructor.getId(), pf.getId())
        .ifPresentOrElse(
            rel -> {
                rel.setLastInteractionAt(now);
                rel.setExamCount(rel.getExamCount() + 1);
            },
            () -> instructorStudentRelationRepository.save(
                InstructorStudentRelation.builder()
                    .instructor(instructor)
                    .profile(pf)
                    .firstInteractionAt(now)
                    .lastInteractionAt(now)
                    .examCount(1)
                    .build())
        );

    return toDto(student);
}
```

> 實作時請根據實際的 join 流程與 DTO 參數簽名調整變數名稱；上述為核心邏輯模板。

- [ ] **Step 3: 跑測試確認通過**

Run：
```powershell
mvn test -Dtest=StudentJoinUpsertTest
```
Expected: 3 個測試全部通過

- [ ] **Step 4: Commit**

Run：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/service/StudentService.java exam-system-backend/src/test/java/com/exam/system/service/StudentJoinUpsertTest.java
git commit -m "feat(backend): UPSERT StudentProfile and InstructorStudentRelation on join"
```

---

## Phase 12：新增 API endpoints

### Task 12.1: 撰寫 `transfer-owner` endpoint（admin 轉讓擁有權）

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/dto/TransferOwnerRequestDTO.java`
- Modify: `exam-system-backend/src/main/java/com/exam/system/service/ExamService.java`
- Modify: `exam-system-backend/src/main/java/com/exam/system/controller/ExamController.java`

- [ ] **Step 1: 建立 DTO**

建立 `exam-system-backend/src/main/java/com/exam/system/dto/TransferOwnerRequestDTO.java`：
```java
package com.exam.system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 轉讓測驗擁有權請求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferOwnerRequestDTO {

    @NotNull(message = "newOwnerId 不可為空")
    private Long newOwnerId;
}
```

- [ ] **Step 2: 在 `ExamService` 加 `transferOwner` 方法**

在 `ExamService` 中加入：
```java
    private final UserRepository userRepository;  // 加入依賴（若尚未注入）

    /**
     * 轉讓測驗擁有權（僅 ADMIN 可呼叫）
     */
    @Transactional
    public ExamDTO transferOwner(Long examId, Long newOwnerId) {
        User current = currentUserProvider.requireCurrentUser();
        if (current.getRole() != UserRole.ADMIN) {
            throw new AuthException(HttpStatus.FORBIDDEN, "ADMIN_ONLY",
                "僅管理員可轉讓擁有權");
        }

        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));

        User newOwner = userRepository.findById(newOwnerId)
            .orElseThrow(() -> new ResourceNotFoundException("User", newOwnerId));

        if (newOwner.getRole() != UserRole.INSTRUCTOR && newOwner.getRole() != UserRole.ADMIN) {
            throw new BusinessException("新擁有者必須為 INSTRUCTOR 或 ADMIN");
        }

        exam.setOwner(newOwner);
        return toDto(examRepository.save(exam));
    }
```

- [ ] **Step 3: 在 `ExamController` 加 endpoint**

在 `ExamController` 中加入：
```java
    /**
     * 轉讓測驗擁有權（僅 ADMIN）
     * PUT /api/exams/{examId}/transfer-owner
     */
    @PutMapping("/{examId}/transfer-owner")
    public ResponseEntity<ExamDTO> transferOwner(
            @PathVariable Long examId,
            @Valid @RequestBody com.exam.system.dto.TransferOwnerRequestDTO request) {
        log.info("Transferring exam {} to owner {}", examId, request.getNewOwnerId());
        ExamDTO updated = examService.transferOwner(examId, request.getNewOwnerId());
        return ResponseEntity.ok(updated);
    }
```

- [ ] **Step 4: 測試 + Commit**

跑既有測試確保沒被破壞：
```powershell
mvn test
```
Commit：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/dto/TransferOwnerRequestDTO.java exam-system-backend/src/main/java/com/exam/system/service/ExamService.java exam-system-backend/src/main/java/com/exam/system/controller/ExamController.java
git commit -m "feat(backend): add PUT /api/exams/{id}/transfer-owner (admin only)"
```

### Task 12.2: `GET /api/instructor/students` endpoint

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/dto/InstructorStudentDTO.java`
- Create: `exam-system-backend/src/main/java/com/exam/system/controller/InstructorStudentController.java`

- [ ] **Step 1: 建立 DTO**

建立 `exam-system-backend/src/main/java/com/exam/system/dto/InstructorStudentDTO.java`：
```java
package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 講師視角下的學員資料（含跨測驗統計）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorStudentDTO {
    private Long profileId;
    private String email;
    private String name;
    private String avatarIcon;
    private String googleId;
    private Boolean isGmailVerified;
    private Integer examCount;
    private LocalDateTime firstInteractionAt;
    private LocalDateTime lastInteractionAt;
}
```

- [ ] **Step 2: 建立 Controller**

建立 `exam-system-backend/src/main/java/com/exam/system/controller/InstructorStudentController.java`：
```java
package com.exam.system.controller;

import com.exam.system.dto.InstructorStudentDTO;
import com.exam.system.entity.InstructorStudentRelation;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.repository.InstructorStudentRelationRepository;
import com.exam.system.service.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 講師視角的學員清單 endpoint
 * 此次前端不消費，但暴露以便後續「我的學員」UI 使用
 */
@Slf4j
@RestController
@RequestMapping("/api/instructor/students")
@RequiredArgsConstructor
public class InstructorStudentController {

    private final InstructorStudentRelationRepository relationRepository;
    private final CurrentUserProvider currentUserProvider;

    /**
     * GET /api/instructor/students
     * 當前登入講師的所有 StudentProfile（依最近互動時間倒序）
     */
    @GetMapping
    public ResponseEntity<List<InstructorStudentDTO>> listMyStudents() {
        User current = currentUserProvider.requireCurrentUser();
        Long instructorId = current.getRole() == UserRole.ADMIN
            ? null    // ADMIN 用此 endpoint 較少見；如要顯示「自己擁有的學員」用 self.id
            : current.getId();
        // 為了簡化：ADMIN 也只看自己 owner_id 的 relation。
        // 若要看「全部講師的所有學員」，改打 /api/admin/* 系列端點。
        instructorId = current.getId();

        List<InstructorStudentRelation> rels =
            relationRepository.findByInstructorIdOrderByLastInteractionDesc(instructorId);

        List<InstructorStudentDTO> result = rels.stream().map(r ->
            InstructorStudentDTO.builder()
                .profileId(r.getProfile().getId())
                .email(r.getProfile().getEmail())
                .name(r.getProfile().getName())
                .avatarIcon(r.getProfile().getAvatarIcon())
                .googleId(r.getProfile().getGoogleId())
                .isGmailVerified(r.getProfile().getIsGmailVerified())
                .examCount(r.getExamCount())
                .firstInteractionAt(r.getFirstInteractionAt())
                .lastInteractionAt(r.getLastInteractionAt())
                .build()
        ).toList();

        return ResponseEntity.ok(result);
    }
}
```

- [ ] **Step 3: 啟動驗證 + Commit**

Run：
```powershell
mvn spring-boot:run
```
Ctrl+C 後 commit：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/dto/InstructorStudentDTO.java exam-system-backend/src/main/java/com/exam/system/controller/InstructorStudentController.java
git commit -m "feat(backend): add GET /api/instructor/students endpoint"
```

### Task 12.3: `GET /api/admin/users?role=INSTRUCTOR` endpoint

**Files:**
- Create: `exam-system-backend/src/main/java/com/exam/system/controller/AdminUserController.java`

- [ ] **Step 1: 建立 Controller**

建立 `exam-system-backend/src/main/java/com/exam/system/controller/AdminUserController.java`：
```java
package com.exam.system.controller;

import com.exam.system.dto.UserDTO;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import com.exam.system.repository.UserRepository;
import com.exam.system.service.AuthService;
import com.exam.system.service.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 管理員：使用者管理 endpoint
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final CurrentUserProvider currentUserProvider;

    /**
     * GET /api/admin/users?role=INSTRUCTOR
     * 列出指定角色的所有使用者（給「轉讓擁有權」UI 用）
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> listUsers(
            @RequestParam(required = false) String role) {
        User current = currentUserProvider.requireCurrentUser();
        if (current.getRole() != UserRole.ADMIN) {
            throw new AuthException(HttpStatus.FORBIDDEN, "ADMIN_ONLY", "僅管理員可呼叫");
        }

        List<User> users;
        if (role == null || role.isBlank()) {
            users = userRepository.findAll();
        } else {
            UserRole parsed;
            try {
                parsed = UserRole.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AuthException(HttpStatus.BAD_REQUEST, "INVALID_ROLE",
                    "未知的角色：" + role);
            }
            users = userRepository.findAll().stream()
                .filter(u -> u.getRole() == parsed).toList();
        }

        List<UserDTO> result = users.stream().map(authService::toUserDTO).toList();
        return ResponseEntity.ok(result);
    }
}
```

- [ ] **Step 2: 啟動驗證 + Commit**

```powershell
mvn spring-boot:run
```
Ctrl+C 後：
```powershell
git add exam-system-backend/src/main/java/com/exam/system/controller/AdminUserController.java
git commit -m "feat(backend): add GET /api/admin/users for owner-transfer UI"
```

---

## Phase 13：前端 AdminDashboard 轉讓 UI + 403 攔截

### Task 13.1: 在 `apiService.ts` 新增 `transferOwner` 與 `listInstructors`

**Files:**
- Modify: `exam-system-frontend/src/services/apiService.ts`

- [ ] **Step 1: 在 examApi 物件加 `transferOwner`**

找到 `examApi` 的物件定義，在尾端的 `}` 之前加入：
```typescript
  /**
   * 轉讓測驗擁有權（admin only）
   * PUT /api/exams/{examId}/transfer-owner
   */
  transferOwner: async (examId: number, newOwnerId: number): Promise<Exam> => {
    const response = await axios.put(
      `${API_BASE_URL}/api/exams/${examId}/transfer-owner`,
      { newOwnerId }
    );
    return response.data;
  },
```

- [ ] **Step 2: 新增 `adminApi.listInstructors`**

在 `apiService.ts` 中新增（檔案結尾或 examApi 之後）：
```typescript
/**
 * 管理員：使用者管理 API
 */
export const adminApi = {
  /**
   * 取得指定角色的使用者列表（給「轉讓擁有權」UI 用）
   * GET /api/admin/users?role=INSTRUCTOR
   */
  listUsers: async (role?: 'INSTRUCTOR' | 'ADMIN' | 'STUDENT') => {
    const query = role ? `?role=${role}` : '';
    const response = await axios.get(`${API_BASE_URL}/api/admin/users${query}`);
    return response.data;
  }
};
```

- [ ] **Step 3: 加入 403 全域攔截**

在 `apiService.ts` 檔案頂部、axios import 之後加入：
```typescript
/**
 * 全域 403 攔截：碰到 EXAM_FORBIDDEN 時導回 /instructor dashboard
 */
axios.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 403
      && error.response?.data?.code === 'EXAM_FORBIDDEN') {
    if (typeof window !== 'undefined') {
      window.location.href = '/instructor';
    }
  }
  return Promise.reject(error);
});
```

### Task 13.2: 在 `AdminDashboard.tsx` 新增轉讓按鈕與 modal

**Files:**
- Modify: `exam-system-frontend/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: 加入 state 與 handler**

在 `AdminDashboard` component 內部加入：
```typescript
const [transferTargetExamId, setTransferTargetExamId] = useState<number | null>(null);
const [instructors, setInstructors] = useState<Array<{ id: number; email: string; name: string; role: string }>>([]);
const [selectedNewOwner, setSelectedNewOwner] = useState<number | null>(null);

const openTransferModal = async (examId: number) => {
  try {
    const data = await adminApi.listUsers('INSTRUCTOR');
    setInstructors(data);
    setTransferTargetExamId(examId);
  } catch (err) {
    console.error('載入講師列表失敗', err);
  }
};

const handleTransfer = async () => {
  if (transferTargetExamId == null || selectedNewOwner == null) return;
  try {
    await examApi.transferOwner(transferTargetExamId, selectedNewOwner);
    setTransferTargetExamId(null);
    setSelectedNewOwner(null);
    // 重新載入測驗列表（依現有 hook 邏輯呼叫）
    window.location.reload();
  } catch (err) {
    console.error('轉讓失敗', err);
  }
};
```

- [ ] **Step 2: 在測驗列表每列加「轉讓」按鈕**

找到 admin 測驗列表的 render 區塊，在每列的 actions 加入：
```tsx
<button
  type="button"
  onClick={() => openTransferModal(exam.id)}
  className="btn-secondary"
  data-testid="transfer-owner-btn"
>
  轉讓
</button>
```

- [ ] **Step 3: 在 component return 結尾加 Modal**

在 `AdminDashboard` 的 return JSX 結尾（最外層 div 內、結束標籤之前）加入：
```tsx
{transferTargetExamId !== null && (
  <div className="modal-backdrop" onClick={() => setTransferTargetExamId(null)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <h3>轉讓測驗擁有權</h3>
      <p>選擇新的擁有講師：</p>
      <select
        value={selectedNewOwner ?? ''}
        onChange={e => setSelectedNewOwner(Number(e.target.value))}
        data-testid="transfer-owner-select"
      >
        <option value="">-- 請選擇 --</option>
        {instructors.map(i => (
          <option key={i.id} value={i.id}>{i.name}（{i.email}）</option>
        ))}
      </select>
      <div className="modal-actions">
        <button onClick={() => setTransferTargetExamId(null)}>取消</button>
        <button
          onClick={handleTransfer}
          disabled={selectedNewOwner == null}
          data-testid="transfer-confirm-btn"
        >
          確認轉讓
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: 確保有 import**

在檔案頂部 import 加入：
```typescript
import { useState } from 'react';
import { examApi, adminApi } from '../services/apiService';
```
（如果已經有部分 import，補上缺的）

- [ ] **Step 5: lint + build 驗證**

Run（從 `exam-system-frontend/`）：
```powershell
npm run lint
npm run build
```
Expected: 無 error（warning 可接受）

### Task 13.3: 手動驗證 + Commit

- [ ] **Step 1: 手動驗證**

1. 啟動後端 + 前端
2. 用 admin@example.com 登入
3. 進入 AdminDashboard
4. 確認測驗列表有「轉讓」按鈕
5. 點按鈕 → 出現 modal → 選一個講師 → 確認轉讓
6. 重新整理確認 owner 已變更

- [ ] **Step 2: Commit**

```powershell
git add exam-system-frontend/src/services/apiService.ts exam-system-frontend/src/pages/AdminDashboard.tsx
git commit -m "feat(frontend): admin transfer-owner UI and global 403 redirect"
```

---

## Phase 14：Playwright e2e

### Task 14.1: 安裝 Playwright 並建立設定

**Files:**
- Create: `package.json` (root, 如果 root 沒有)
- Create: `e2e/playwright.config.ts`
- Modify: 既有 root `package.json`（如果存在）

- [ ] **Step 1: 確認 root `package.json` 是否存在**

Run：
```powershell
ls package.json
```
若不存在，建立基本骨架：
```powershell
npm init -y
```

- [ ] **Step 2: 安裝 Playwright**

Run（從專案 root）：
```powershell
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: 在 root `package.json` 的 scripts 加上 e2e 指令**

修改 `package.json` 的 `scripts`：
```json
{
  "scripts": {
    "e2e": "playwright test --config=e2e/playwright.config.ts",
    "e2e:headed": "playwright test --config=e2e/playwright.config.ts --headed",
    "e2e:debug": "playwright test --config=e2e/playwright.config.ts --debug"
  }
}
```

- [ ] **Step 4: 建立 `e2e/playwright.config.ts`**

建立 `e2e/playwright.config.ts`：
```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e 設定
 * 前提：後端跑在 localhost:8080，前端跑在 localhost:5173
 * 並且資料庫已 seed 過測試帳號（teacher1, teacher2, admin）
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,                 // 同一 DB 不平行
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Task 14.2: 建立測試帳號 seed 機制

**Files:**
- Modify: `exam-system-backend/src/main/java/com/exam/system/config/DataInitializer.java`

- [ ] **Step 1: 修改 `DataInitializer` 加入 e2e profile 偵測**

找到 `DataInitializer.run()` 方法，在現有 admin 建立邏輯之後，加入：
```java
        // E2E 測試帳號 seed（僅 app.profile=e2e 時建立）
        String profile = System.getenv("APP_PROFILE");
        if ("e2e".equalsIgnoreCase(profile)) {
            seedE2eUserIfMissing("teacher1@e2e.test", "Teacher1", UserRole.INSTRUCTOR);
            seedE2eUserIfMissing("teacher2@e2e.test", "Teacher2", UserRole.INSTRUCTOR);
            log.info("E2E 測試帳號 seed 完成");
        }
```

並在 class 內加入 helper：
```java
    private void seedE2eUserIfMissing(String email, String name, UserRole role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(User.builder()
                .email(email)
                .name(name)
                .passwordHash(passwordEncoder.encode("e2e-password"))
                .role(role)
                .build());
            log.info("已建立 E2E 帳號: {}", email);
        }
    }
```

- [ ] **Step 2: 確認 UserRepository 有 `existsByEmail` 方法**

開啟 `UserRepository.java`，確認有：
```java
    boolean existsByEmail(String email);
```
若沒有，加上去。

### Task 14.3: 建立 e2e fixtures

**Files:**
- Create: `e2e/fixtures/test-users.ts`
- Create: `e2e/fixtures/auth-helper.ts`

- [ ] **Step 1: 建立 `e2e/fixtures/test-users.ts`**

```typescript
/**
 * E2E 測試帳號定義
 * 對應後端 DataInitializer 在 APP_PROFILE=e2e 時 seed 的帳號
 */
export const TEST_USERS = {
  teacher1: { email: 'teacher1@e2e.test', password: 'e2e-password', name: 'Teacher1' },
  teacher2: { email: 'teacher2@e2e.test', password: 'e2e-password', name: 'Teacher2' },
  admin:    { email: 'admin@example.com', password: 'admin123',    name: 'Admin' },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;
```

- [ ] **Step 2: 建立 `e2e/fixtures/auth-helper.ts`**

```typescript
import { Page, BrowserContext, request } from '@playwright/test';
import { TEST_USERS, TestUserKey } from './test-users';

const API_BASE = 'http://localhost:8080';

/**
 * 以指定 user 透過 API 登入並取得 JWT，注入到 page 的 localStorage
 */
export async function loginAs(context: BrowserContext, userKey: TestUserKey): Promise<Page> {
  const user = TEST_USERS[userKey];
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_BASE}/api/auth/email/login`, {
    data: { email: user.email, password: user.password }
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${userKey}: ${response.status()}`);
  }
  const body = await response.json();
  const token = body.token;

  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate((t) => {
    const stored = {
      state: { token: t, user: null, isAuthenticated: true },
      version: 0
    };
    localStorage.setItem('auth-storage', JSON.stringify(stored));
  }, token);
  return page;
}

/**
 * 直接透過 API 用 admin 取得任意 user 的 token
 */
export async function adminTokenFor(userKey: TestUserKey): Promise<string> {
  const user = TEST_USERS[userKey];
  const apiContext = await request.newContext();
  const response = await apiContext.post(`${API_BASE}/api/auth/email/login`, {
    data: { email: user.email, password: user.password }
  });
  const body = await response.json();
  return body.token;
}
```

### Task 14.4: 撰寫 `instructor-isolation.spec.ts`

**Files:**
- Create: `e2e/tests/instructor-isolation.spec.ts`

- [ ] **Step 1: 撰寫 spec**

建立 `e2e/tests/instructor-isolation.spec.ts`：
```typescript
import { test, expect } from '@playwright/test';
import { loginAs, adminTokenFor } from '../fixtures/auth-helper';

test.describe('講師隔離', () => {
  test('teacher1 建立的測驗 teacher2 看不到', async ({ browser }) => {
    // teacher1 建立測驗
    const ctx1 = await browser.newContext();
    const page1 = await loginAs(ctx1, 'teacher1');
    await page1.goto('/instructor');

    // 建立新測驗
    await page1.click('text=建立新測驗');
    await page1.fill('input[name="title"]', 'Only-Teacher1');
    await page1.fill('input[name="questionTimeLimit"]', '30');
    await page1.click('button:has-text("儲存")');
    await expect(page1.locator('text=Only-Teacher1')).toBeVisible();
    await ctx1.close();

    // teacher2 登入應看不到此測驗
    const ctx2 = await browser.newContext();
    const page2 = await loginAs(ctx2, 'teacher2');
    await page2.goto('/instructor');
    await expect(page2.locator('text=Only-Teacher1')).toHaveCount(0);
    await ctx2.close();
  });

  test('teacher2 直接打 teacher1 測驗的 URL 會被 redirect 回 dashboard', async ({ browser }) => {
    // 先用 teacher1 建立測驗並取得 id
    const t1Token = await adminTokenFor('teacher1');
    const apiContext = await test.request.newContext();
    const createResp = await apiContext.post('http://localhost:8080/api/exams', {
      headers: { Authorization: `Bearer ${t1Token}` },
      data: { title: 'Teacher1-Locked-Exam', questionTimeLimit: 30 }
    });
    const created = await createResp.json();
    const examId = created.id;

    // teacher2 直接訪問
    const ctx2 = await browser.newContext();
    const page2 = await loginAs(ctx2, 'teacher2');
    await page2.goto(`/instructor/exam/${examId}/monitor`);

    // 應該被 axios 403 攔截器導回 /instructor
    await page2.waitForURL(/\/instructor$/, { timeout: 5000 });
    await ctx2.close();
  });
});
```

### Task 14.5: 撰寫 `student-join-relation.spec.ts`

**Files:**
- Create: `e2e/tests/student-join-relation.spec.ts`

- [ ] **Step 1: 撰寫 spec**

```typescript
import { test, expect, request } from '@playwright/test';
import { loginAs, adminTokenFor } from '../fixtures/auth-helper';

test.describe('學員加入測驗 → 建立關係', () => {
  test('首次加入建立 StudentProfile 與 InstructorStudentRelation', async ({ browser }) => {
    // teacher1 建立並啟動測驗
    const t1Token = await adminTokenFor('teacher1');
    const api = await request.newContext();
    const createResp = await api.post('http://localhost:8080/api/exams', {
      headers: { Authorization: `Bearer ${t1Token}` },
      data: { title: 'JoinExam-1', questionTimeLimit: 30 }
    });
    const exam = await createResp.json();

    const startResp = await api.put(
      `http://localhost:8080/api/exams/${exam.id}/start?baseUrl=http://localhost:5173`,
      { headers: { Authorization: `Bearer ${t1Token}` } }
    );
    const started = await startResp.json();
    const accessCode = started.accessCode;

    // 學員加入
    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await studentPage.goto(`/?accessCode=${accessCode}`);
    await studentPage.fill('input[name="name"]', '小明');
    await studentPage.fill('input[name="email"]', 'e2estu1@e2e.test');
    await studentPage.click('button:has-text("加入測驗")');
    await expect(studentPage.locator('text=等待開始')).toBeVisible({ timeout: 5000 });
    await studentCtx.close();

    // 用 teacher1 的 token 查 /api/instructor/students 確認 relation 建立
    const checkResp = await api.get('http://localhost:8080/api/instructor/students', {
      headers: { Authorization: `Bearer ${t1Token}` }
    });
    const myStudents = await checkResp.json();
    expect(myStudents.some((s: any) => s.email === 'e2estu1@e2e.test')).toBeTruthy();
  });
});
```

### Task 14.6: 撰寫 `admin-cross-instructor.spec.ts`

**Files:**
- Create: `e2e/tests/admin-cross-instructor.spec.ts`

- [ ] **Step 1: 撰寫 spec**

```typescript
import { test, expect, request } from '@playwright/test';
import { loginAs, adminTokenFor } from '../fixtures/auth-helper';

test.describe('管理員跨講師操作', () => {
  test('admin 看得到所有講師的測驗', async ({ browser }) => {
    // 用各講師 token 建立測驗
    const t1Token = await adminTokenFor('teacher1');
    const t2Token = await adminTokenFor('teacher2');
    const api = await request.newContext();
    await api.post('http://localhost:8080/api/exams', {
      headers: { Authorization: `Bearer ${t1Token}` },
      data: { title: 'Admin-See-1', questionTimeLimit: 30 }
    });
    await api.post('http://localhost:8080/api/exams', {
      headers: { Authorization: `Bearer ${t2Token}` },
      data: { title: 'Admin-See-2', questionTimeLimit: 30 }
    });

    const ctxAdmin = await browser.newContext();
    const adminPage = await loginAs(ctxAdmin, 'admin');
    await adminPage.goto('/admin');
    await expect(adminPage.locator('text=Admin-See-1')).toBeVisible();
    await expect(adminPage.locator('text=Admin-See-2')).toBeVisible();
    await ctxAdmin.close();
  });

  test('admin 將 teacher1 的測驗轉讓給 teacher2', async ({ browser }) => {
    const t1Token = await adminTokenFor('teacher1');
    const api = await request.newContext();
    const created = await api.post('http://localhost:8080/api/exams', {
      headers: { Authorization: `Bearer ${t1Token}` },
      data: { title: 'Transfer-Me', questionTimeLimit: 30 }
    });
    const exam = await created.json();

    // admin 操作轉讓 UI
    const ctxAdmin = await browser.newContext();
    const adminPage = await loginAs(ctxAdmin, 'admin');
    await adminPage.goto('/admin');
    const row = adminPage.locator(`tr:has-text("Transfer-Me")`);
    await row.locator('[data-testid="transfer-owner-btn"]').click();
    await adminPage.locator('[data-testid="transfer-owner-select"]')
      .selectOption({ label: /Teacher2/ });
    await adminPage.locator('[data-testid="transfer-confirm-btn"]').click();
    await adminPage.waitForLoadState('networkidle');
    await ctxAdmin.close();

    // teacher2 應看到測驗
    const ctx2 = await browser.newContext();
    const page2 = await loginAs(ctx2, 'teacher2');
    await page2.goto('/instructor');
    await expect(page2.locator('text=Transfer-Me')).toBeVisible();
    await ctx2.close();
  });
});
```

### Task 14.7: 撰寫 `access-forbidden-redirect.spec.ts`

**Files:**
- Create: `e2e/tests/access-forbidden-redirect.spec.ts`

- [ ] **Step 1: 撰寫 spec**

```typescript
import { test, expect, request } from '@playwright/test';
import { loginAs, adminTokenFor } from '../fixtures/auth-helper';

test.describe('403 全域攔截', () => {
  test('未授權訪問別人的測驗 → 自動導回 /instructor', async ({ browser }) => {
    const t1Token = await adminTokenFor('teacher1');
    const api = await request.newContext();
    const created = await api.post('http://localhost:8080/api/exams', {
      headers: { Authorization: `Bearer ${t1Token}` },
      data: { title: 'Forbidden-Test', questionTimeLimit: 30 }
    });
    const exam = await created.json();

    const ctx2 = await browser.newContext();
    const page2 = await loginAs(ctx2, 'teacher2');
    await page2.goto(`/instructor/exam/${exam.id}/monitor`);

    await page2.waitForURL(/\/instructor$/, { timeout: 5000 });
    await expect(page2).toHaveURL(/\/instructor$/);
    await ctx2.close();
  });
});
```

### Task 14.8: 跑全套 e2e + Commit

- [ ] **Step 1: 啟動環境**

兩個 PowerShell terminal 分別跑：
```powershell
# Terminal 1（後端）
cd exam-system-backend
$env:JAVA_HOME = "D:\java\jdk-21"
$env:APP_PROFILE = "e2e"
mvn spring-boot:run
```
```powershell
# Terminal 2（前端）
cd exam-system-frontend
npm run dev
```
等到前後端都 ready。

- [ ] **Step 2: 跑 e2e**

第三個 terminal：
```powershell
npm run e2e
```
Expected: 全部 spec 綠燈通過

- [ ] **Step 3: 修復失敗（如有）**

若有 spec 失敗，使用 `npm run e2e:headed` 觀察視覺化操作，或 `npm run e2e:debug` 逐步檢查。常見問題：
- selector 跟現有 UI 不符 → 調整為實際 DOM 結構
- `localStorage` key 名跟 authStore 不符 → 查 [authStore.ts:172-180](exam-system-frontend/src/store/authStore.ts#L172-L180) 確認 `name: 'auth-storage'`

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json e2e/ exam-system-backend/src/main/java/com/exam/system/config/DataInitializer.java exam-system-backend/src/main/java/com/exam/system/repository/UserRepository.java
git commit -m "test(e2e): add Playwright e2e for instructor isolation, student join, admin transfer, 403 redirect"
```

---

## Phase 15：文件與 CLAUDE.md 更新

### Task 15.1: 更新 `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 在 "資料模型關係" 區段更新 ER 描述**

替換現有的「資料模型關係」程式碼區塊為：
```
Exam (測驗)
 ├─ N:1 → User (擁有者講師，owner_id)
 ├─ 1:N → Question (題目)
 │         └─ 1:N → QuestionOption (選項)
 ├─ 1:N → ExamSurveyFieldConfig (測驗調查欄位配置)
 │         └─ N:1 → SurveyField (調查欄位定義)
 └─ 1:N → Student (學員，per-exam 紀錄)
            ├─ N:1 → StudentProfile (跨測驗學員主檔)
            └─ 1:N → Answer (答案)

InstructorStudentRelation (講師↔學員 M:N)
 ├─ N:1 → User (講師)
 └─ N:1 → StudentProfile (學員主檔)
```

- [ ] **Step 2: 在 "最近更新記錄" 加入 v1.6 紀錄**

在 `最近更新記錄` 區段頂端新增：
```
### v1.6 - 講師帳號隔離 + 跨測驗學員關係 (2026-05)
- ✅ **帳號隔離**：講師只看到自己 owner_id 的測驗、問卷、Email Campaign
- ✅ **跨測驗學員主檔**：新增 StudentProfile 以 lowercase email 為穩定 key
- ✅ **講師↔學員關係**：學員加入測驗時自動 UPSERT InstructorStudentRelation
- ✅ **Flyway 導入**：替代 Hibernate ddl-auto，本地預設啟用、Zeabur 預設禁用
- ✅ **OwnershipGuard**：集中所有「擁有者或 admin」授權檢查
- ✅ **admin 轉讓功能**：AdminDashboard 加「轉讓測驗擁有權」UI
- ✅ **升級保護**：ExamSecurityService auto-recovery 擴展，題目過期 +5s buffer 後允許 recover
- ✅ **Playwright e2e**：4 支 spec 驗證隔離鏈完整
```

### Task 15.2: 更新 `api.md`

**Files:**
- Modify: `api.md`

- [ ] **Step 1: 加入新 endpoints 段落**

在 `api.md` 末尾或對應分類下新增：
```markdown
## 帳號隔離相關 API（v1.6 新增）

### 轉讓測驗擁有權（admin only）

PUT /api/exams/{examId}/transfer-owner

Authorization: Bearer {ADMIN_JWT_TOKEN}
Body:
{ "newOwnerId": 5 }

Response: 更新後的 ExamDTO
Errors: 403 ADMIN_ONLY / 404 ResourceNotFound

### 取得當前講師的學員清單

GET /api/instructor/students

Authorization: Bearer {INSTRUCTOR_JWT_TOKEN}
Response: List<InstructorStudentDTO>
  [
    {
      "profileId": 12,
      "email": "stu@example.com",
      "name": "小明",
      "avatarIcon": "avatar1",
      "googleId": null,
      "isGmailVerified": false,
      "examCount": 3,
      "firstInteractionAt": "2026-04-01T10:00:00",
      "lastInteractionAt": "2026-05-10T14:30:00"
    }
  ]

### 取得使用者列表（admin only）

GET /api/admin/users?role=INSTRUCTOR

Authorization: Bearer {ADMIN_JWT_TOKEN}
Response: List<UserDTO>
```

- [ ] **Step 2: Commit**

```powershell
git add CLAUDE.md api.md
git commit -m "docs: update CLAUDE.md ER and api.md for account isolation endpoints"
```

---

## Phase 16：本地完整驗收

### Task 16.1: 跑完整單元 + 整合測試

- [ ] **Step 1: 跑全部後端測試**

Run（從 `exam-system-backend/`）：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
mvn test
```
Expected: 全部測試通過

### Task 16.2: 跑完整 e2e

- [ ] **Step 1: 啟動後端 + 前端**

兩個 terminal 分別跑（如 Task 14.8 Step 1）。

- [ ] **Step 2: 跑 e2e**

```powershell
npm run e2e
```
Expected: 全部 spec 通過

### Task 16.3: 驗收標準逐項打勾

- [ ] **Step 1: 對照 spec §8 驗收標準逐項驗證**

開啟 [docs/superpowers/specs/2026-05-16-account-isolation-design.md](../specs/2026-05-16-account-isolation-design.md) 第 8 節，逐項手動或透過 e2e 確認：
- ✅ 講師 A 登入 → `/api/exams` 只回傳 A 的測驗
- ✅ 講師 A 直接打 `GET /api/exams/{B 的 examId}` → 403
- ✅ ADMIN 登入 → 所有測驗
- ✅ admin 轉讓功能可用
- ✅ 學員加入後 Profile + Relation 建立
- ✅ 同學員再加入 examCount 累積
- ✅ Migration: V3 缺 env var 抛 EXCEPTION
- ✅ Migration: V3 用戶不存在抛 EXCEPTION
- ✅ 既有資料全部 owner_id / profile_id 已 backfill

### Task 16.4: 最終 commit（若有最後修補）

- [ ] **Step 1: 若驗收中發現小問題，修復後 commit**

```powershell
git add -A
git commit -m "fix: address findings from local acceptance pass"
```

- [ ] **Step 2: 檢查 git log**

```powershell
git log --oneline -n 30
```
Expected: 看到本次 plan 產出的所有 commits 條列清楚

---

## 部署檢核（Zeabur，由用戶手動觸發）

> 本段非 plan task，僅為部署 SOP 提醒。等用戶決定何時部署再執行。

1. 確認 Zeabur 已有 `MIGRATION_DEFAULT_OWNER_EMAIL` 指向已存在的 user
2. 確認所有測驗 `status != 'STARTED'`（或可接受重啟對在進行測驗的影響——僅保證下一題可推送）
3. 在 Zeabur 設定環境變數 `SPRING_FLYWAY_ENABLED=true`
4. Restart container，看 log 確認 V2/V3/V4 跑完
5. 把 `SPRING_FLYWAY_ENABLED` 改回 `false` 或刪除

---

## Self-Review 紀錄

**Spec coverage check:**
- §3 架構 → 全部對應 Phase 2-12
- §4 資料模型 → Phase 2-3
- §5 授權機制 → Phase 6, 7, 9, 10
- §6 Flyway → Phase 1-5
- §7 前端/WS → Phase 13
- §8 驗收標準 → Phase 16
- §9 測試策略 → 各 Phase TDD + Phase 14 e2e
- §10 Out of Scope → 嚴格遵守，未做「我的學員 UI」或批次寄信功能
- §11 風險緩解 → 升級保護於 Phase 7、Migration fail-fast 於 V3 SQL

**Placeholder scan:** 已避免 TBD/TODO；所有測試與實作有完整 code block。少數 generic 描述（如「依現有 hook 邏輯呼叫」）保留是因為原始實作差異無法完全標準化。

**Type consistency check:** `examCount: Integer`、`firstInteractionAt: LocalDateTime`、`profileId: Long` 在 entity / DTO / e2e 中一致；`OwnershipGuard.assertOwnerOrAdmin` 方法簽名跨檔案一致。

**Implementation gap notes:**
- StudentService.joinExam 的 DTO 簽名各專案實作不同；plan 給出邏輯模板，實作時請對應現有 method signature 調整變數命名。
- SurveyService / EmailService 的具體方法名（`listSurveys` vs `getAllSurveys`）依現有專案命名為準。
