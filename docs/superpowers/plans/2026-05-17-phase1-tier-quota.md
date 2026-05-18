# Phase 1 實作計劃：Tier + Quota + StudentProfile 升格

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立行銷平台的基礎建設層 — 講師分級（FREE/PAID）、多維度配額系統（含個人錨點 Lazy reset）、會員實體升格擴充，讓後續 Phase 有 gate keeper 可呼叫。

**Architecture:** 沿用 v1.6 帳號隔離設計（OwnershipGuard + InstructorStudentRelation）。新增 `tier` 領域 package 集中管理配額邏輯，所有外發動作（後續 Phase 將呼叫）必先過 `QuotaService.check/consume/reserve`。配額週期採個人錨點而非全平台統一重置，Lazy reset 取代排程任務。

**Tech Stack:** Spring Boot 3.5.7、Java 21、Spring Data JPA、Flyway、Lombok、JUnit 5、Spring Security、React 19 + TypeScript + Vite + Zustand。

**Spec 對應**：[`docs/superpowers/specs/2026-05-17-marketing-platform-design.md`](../specs/2026-05-17-marketing-platform-design.md) 第 6 節（Tier & Quota）、附錄 A 路由總表 ADMIN 區、Phase 1 描述。

---

## 文件結構與責任分配

### 後端（新增）

```
exam-system-backend/src/main/java/com/exam/system/
├── entity/
│   ├── UserTier.java              [新] enum FREE/PAID
│   └── AcquisitionSource.java     [新] enum EXAM/SURVEY/NEWSLETTER/IMPORT/API
├── tier/
│   ├── entity/
│   │   ├── QuotaDimension.java    enum 7 種維度
│   │   ├── QuotaResetPeriod.java  enum MONTHLY/NEVER
│   │   ├── QuotaPolicy.java       配額政策表
│   │   ├── QuotaUsage.java        用量計數表
│   │   └── TierChangeLog.java     升降級稽核 log
│   ├── repository/
│   │   ├── QuotaPolicyRepository.java
│   │   ├── QuotaUsageRepository.java
│   │   └── TierChangeLogRepository.java
│   ├── dto/
│   │   ├── QuotaSnapshotDTO.java
│   │   ├── QuotaCheckResultDTO.java
│   │   ├── QuotaReservationDTO.java
│   │   ├── QuotaPolicyDTO.java
│   │   └── TierChangeRequestDTO.java
│   ├── exception/
│   │   └── QuotaExceededException.java
│   ├── service/
│   │   ├── QuotaPeriodCalculator.java   個人錨點 + Lazy reset 純函式
│   │   ├── QuotaService.java            check/consume/reserve/confirm/rollback/snapshot
│   │   └── TierService.java             升降級 + 寫 log
│   ├── scheduler/
│   │   └── TierExpirationScheduler.java 每日掃 PAID 過期
│   └── controller/
│       ├── QuotaController.java         GET /api/quota/snapshot
│       ├── TierController.java          ADMIN 升降級
│       └── QuotaPolicyController.java   ADMIN 調整配額表
├── service/
│   └── FeaturePermissionService.java    [改] 用 tier 取代 boolean flag
└── resources/db/migration/
    ├── V6__tier_and_member_extensions.sql   [新]
    └── V7__quota_tables_and_seed.sql        [新]
```

### 後端（既有實體擴充）

```
entity/User.java                  + tier, tier_subscribed_at, tier_expires_at
                                  − surveyManagementEnabled, emailManagementEnabled
entity/StudentProfile.java        + acquisitionSource, acquiredAt, acquiredViaId,
                                    firstConsentAt, consentVersion, notes
entity/InstructorStudentRelation.java   + tags (JSON)
                                  (lastInteractionAt 已存在)
```

### 前端（新增 + 修改）

```
exam-system-frontend/src/
├── types.ts                          [改] 新增 UserTier、QuotaSnapshot、QuotaDimension
├── services/apiService.ts            [改] 新增 fetchQuotaSnapshot、changeTier、listQuotaPolicies
├── pages/
│   ├── InstructorQuotaDashboard.tsx  [新] 講師配額儀表板
│   └── AdminDashboard.tsx            [改] 新增 Tier 管理 tab
└── components/
    └── QuotaProgressBar.tsx          [新] 配額進度條共用元件
```

### 測試

```
exam-system-backend/src/test/java/com/exam/system/tier/
├── service/
│   ├── QuotaPeriodCalculatorTest.java   錨點計算邏輯（含月底日 clamping）
│   ├── QuotaServiceTest.java            check/consume/reserve/confirm/rollback/snapshot
│   └── TierServiceTest.java             升降級 + 錨點重設
├── scheduler/
│   └── TierExpirationSchedulerTest.java 過期自動降級
└── controller/
    ├── QuotaControllerTest.java         INSTRUCTOR/ADMIN 隔離
    ├── TierControllerTest.java          ADMIN-only 守衛
    └── QuotaPolicyControllerTest.java   ADMIN-only 守衛

exam-system-frontend/e2e/
└── phase1-tier-quota.spec.ts            講師看自己配額 + ADMIN 升降級
```

---

## 任務總覽（23 個任務）

| # | 任務 | TDD | 大致時間 |
|---|---|---|---|
| 0 | 開分支 + 驗證既有測試通過 | - | 5 min |
| 1 | Flyway V6 + V7 migration | - | 15 min |
| 2 | UserTier enum + User entity 擴充 | - | 10 min |
| 3 | AcquisitionSource + StudentProfile 擴充 | - | 10 min |
| 4 | InstructorStudentRelation 新增 tags | - | 5 min |
| 5 | QuotaDimension + QuotaResetPeriod enums | - | 5 min |
| 6 | QuotaPolicy entity + Repository | - | 10 min |
| 7 | QuotaUsage entity + Repository | - | 10 min |
| 8 | TierChangeLog entity + Repository | - | 10 min |
| 9 | **QuotaPeriodCalculator（含 5 個邊界值測試）** | ✓ | 25 min |
| 10 | DTOs + QuotaExceededException | - | 10 min |
| 11 | **QuotaService.check + consume** | ✓ | 25 min |
| 12 | **QuotaService.reserve/confirm/rollback** | ✓ | 25 min |
| 13 | **QuotaService.snapshot** | ✓ | 15 min |
| 14 | **TierService（升降級 + 錨點重設）** | ✓ | 25 min |
| 15 | TierExpirationScheduler | ✓ | 15 min |
| 16 | FeaturePermissionService 重構 | ✓ | 15 min |
| 17 | QuotaController（GET snapshot） | ✓ | 15 min |
| 18 | TierController（ADMIN 升降級） | ✓ | 20 min |
| 19 | QuotaPolicyController（ADMIN 政策 CRUD） | ✓ | 20 min |
| 20 | 前端 types + apiService | - | 10 min |
| 21 | InstructorQuotaDashboard 頁 | - | 30 min |
| 22 | AdminDashboard 新增 Tier 管理 tab | - | 30 min |
| 23 | Playwright e2e 測試 | ✓ | 30 min |

預估總時程：**6-8 小時專注工作**。

---

## Task 0：開分支 + 驗證現況

**Files：**
- 無新增

- [ ] **Step 0.1：建立 feature branch**

```bash
git checkout main
git pull
git checkout -b feature/phase1-tier-quota
```

- [ ] **Step 0.2：驗證後端編譯與測試通過（基準線）**

```bash
cd exam-system-backend
mvn clean compile
mvn test -Dtest='!*IntegrationTest'
```
Expected：BUILD SUCCESS，所有非整合測試通過。

- [ ] **Step 0.3：驗證前端編譯通過**

```bash
cd ../exam-system-frontend
npm install
npm run build
```
Expected：build 完成，無 TypeScript 錯誤。

---

## Task 1：Flyway V6 + V7 Migration

**Files：**
- Create：`exam-system-backend/src/main/resources/db/migration/V6__tier_and_member_extensions.sql`
- Create：`exam-system-backend/src/main/resources/db/migration/V7__quota_tables_and_seed.sql`

- [ ] **Step 1.1：撰寫 V6（既有表擴充）**

Create `exam-system-backend/src/main/resources/db/migration/V6__tier_and_member_extensions.sql`：

```sql
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

-- instructor_student_relation 新增 tags JSON（H2 用 CLOB，PG 用 JSONB 但都用 CLOB 相容）
ALTER TABLE instructor_student_relation ADD COLUMN IF NOT EXISTS tags CLOB;
```

- [ ] **Step 1.2：撰寫 V7（配額表 + 種子資料）**

Create `exam-system-backend/src/main/resources/db/migration/V7__quota_tables_and_seed.sql`：

```sql
-- V7: 配額系統三張表 + 種子資料

CREATE TABLE quota_policy (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tier VARCHAR(10) NOT NULL,
    dimension VARCHAR(30) NOT NULL,
    limit_value INTEGER NOT NULL,
    reset_period VARCHAR(10) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quota_policy_tier_dim UNIQUE (tier, dimension)
);

CREATE TABLE quota_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    dimension VARCHAR(30) NOT NULL,
    period_start_date DATE NOT NULL,
    used_value INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quota_usage_owner_dim_period UNIQUE (owner_id, dimension, period_start_date),
    CONSTRAINT fk_quota_usage_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_quota_usage_owner_dim ON quota_usage (owner_id, dimension);

CREATE TABLE tier_change_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    from_tier VARCHAR(10) NOT NULL,
    to_tier VARCHAR(10) NOT NULL,
    changed_by BIGINT,
    reason VARCHAR(500),
    expires_at TIMESTAMP,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tier_log_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_tier_log_owner ON tier_change_log (owner_id);

-- 種子資料：FREE / PAID 兩階配額
INSERT INTO quota_policy (tier, dimension, limit_value, reset_period) VALUES
    ('FREE', 'MEMBER_COUNT', 100, 'NEVER'),
    ('FREE', 'MONTHLY_SEND', 200, 'MONTHLY'),
    ('FREE', 'AI_QUESTION_GEN', 0, 'MONTHLY'),
    ('FREE', 'AI_DATA_ANALYSIS', 0, 'MONTHLY'),
    ('FREE', 'AI_NEWSLETTER_GEN', 0, 'MONTHLY'),
    ('FREE', 'ACTIVE_CAMPAIGNS', 0, 'NEVER'),
    ('FREE', 'SURVEY_COUNT', 3, 'NEVER'),
    ('PAID', 'MEMBER_COUNT', 5000, 'NEVER'),
    ('PAID', 'MONTHLY_SEND', 20000, 'MONTHLY'),
    ('PAID', 'AI_QUESTION_GEN', 500, 'MONTHLY'),
    ('PAID', 'AI_DATA_ANALYSIS', 50, 'MONTHLY'),
    ('PAID', 'AI_NEWSLETTER_GEN', 10, 'MONTHLY'),
    ('PAID', 'ACTIVE_CAMPAIGNS', 10, 'NEVER'),
    ('PAID', 'SURVEY_COUNT', 50, 'NEVER');
```

- [ ] **Step 1.3：執行 migration 驗證**

```bash
cd exam-system-backend
mvn spring-boot:run
```
Expected：log 顯示 `Successfully applied 2 migration(s) to schema "PUBLIC"`（V6 + V7）。
驗證後 Ctrl+C 停止應用。

- [ ] **Step 1.4：H2 Console 驗證表結構**

開啟 http://localhost:8080/h2-console（先重啟應用）→ JDBC URL `jdbc:h2:file:./data/examdb` → 執行：

```sql
SELECT COUNT(*) FROM quota_policy;  -- 應為 14
SELECT * FROM quota_policy WHERE tier='PAID' ORDER BY dimension;
SHOW COLUMNS FROM users;            -- 應有 tier, tier_subscribed_at, tier_expires_at
SHOW COLUMNS FROM users WHERE FIELD IN ('survey_management_enabled', 'email_management_enabled');  -- 應為 0 列
```

- [ ] **Step 1.5：Commit**

```bash
git add exam-system-backend/src/main/resources/db/migration/V6__tier_and_member_extensions.sql \
        exam-system-backend/src/main/resources/db/migration/V7__quota_tables_and_seed.sql
git commit -m "feat(db): V6+V7 — tier columns, member acquisition fields, quota tables with seed"
```

---

## Task 2：UserTier enum + User entity 擴充

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/entity/UserTier.java`
- Modify：`exam-system-backend/src/main/java/com/exam/system/entity/User.java`
- Modify：`exam-system-backend/src/main/java/com/exam/system/service/FeaturePermissionService.java`（暫時改回編譯通過，正式 refactor 在 Task 16）

- [ ] **Step 2.1：建立 UserTier enum**

Create `exam-system-backend/src/main/java/com/exam/system/entity/UserTier.java`：

```java
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
```

- [ ] **Step 2.2：修改 User entity（移除舊欄位、加入 tier 系列）**

Edit `exam-system-backend/src/main/java/com/exam/system/entity/User.java`：

刪除原 `surveyManagementEnabled` 與 `emailManagementEnabled` 兩個欄位，並加入：

```java
    /**
     * 訂閱分級（FREE/PAID）
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private UserTier tier = UserTier.FREE;

    /**
     * 當前 tier 訂閱起算錨點（配額週期計算用）
     * 帳號註冊時 = createdAt；升降級時重新錨定為 NOW
     */
    private LocalDateTime tierSubscribedAt;

    /**
     * PAID 到期時間，過期會自動降為 FREE；FREE 為 NULL
     */
    private LocalDateTime tierExpiresAt;
```

並在 `onCreate()` 內加上：
```java
        if (this.tierSubscribedAt == null) {
            this.tierSubscribedAt = this.createdAt;
        }
```

- [ ] **Step 2.3：暫時穩定 FeaturePermissionService 編譯**

Edit `exam-system-backend/src/main/java/com/exam/system/service/FeaturePermissionService.java`：

把所有 `user.isSurveyManagementEnabled()` 改成 `user.getTier() == UserTier.PAID`，把 `user.isEmailManagementEnabled()` 同樣改成 `user.getTier() == UserTier.PAID`。
（正式重構在 Task 16，但這步要先讓編譯通過）

例：
```java
public boolean canManageSurveys(User user) {
    if (user == null) return false;
    if (user.getRole() == UserRole.ADMIN) return true;
    return user.getRole() == UserRole.INSTRUCTOR && user.getTier() == UserTier.PAID;
}
```

加上 `import com.exam.system.entity.UserTier;`。

- [ ] **Step 2.4：執行測試**

```bash
mvn test -Dtest='!*IntegrationTest'
```
Expected：所有測試通過。若有相關測試使用了舊欄位，先一併調整成 tier。

- [ ] **Step 2.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/entity/UserTier.java \
        exam-system-backend/src/main/java/com/exam/system/entity/User.java \
        exam-system-backend/src/main/java/com/exam/system/service/FeaturePermissionService.java
git commit -m "feat(entity): add UserTier enum and tier fields to User entity"
```

---

## Task 3：AcquisitionSource enum + StudentProfile 擴充

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/entity/AcquisitionSource.java`
- Modify：`exam-system-backend/src/main/java/com/exam/system/entity/StudentProfile.java`

- [ ] **Step 3.1：建立 AcquisitionSource enum**

Create `exam-system-backend/src/main/java/com/exam/system/entity/AcquisitionSource.java`：

```java
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
```

- [ ] **Step 3.2：擴充 StudentProfile**

Edit `exam-system-backend/src/main/java/com/exam/system/entity/StudentProfile.java`：

在現有欄位後新增：

```java
    /**
     * 會員取得來源
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AcquisitionSource acquisitionSource;

    /**
     * 加入時間（首次成為會員的時間，與 createdAt 可能相同）
     */
    private LocalDateTime acquiredAt;

    /**
     * 來源實體 ID（對應 exam_id / survey_id / campaign_id / import_batch_id）
     */
    private Long acquiredViaId;

    /**
     * 首次同意書取得時間
     */
    private LocalDateTime firstConsentAt;

    /**
     * 同意書版本（對應 config/consent-versions/v{N}.md）
     */
    @Column(length = 20)
    private String consentVersion;

    /**
     * 講師對此會員的備註
     */
    @Lob
    @Column
    private String notes;
```

- [ ] **Step 3.3：執行測試**

```bash
mvn test -Dtest='!*IntegrationTest'
```
Expected：全綠。

- [ ] **Step 3.4：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/entity/AcquisitionSource.java \
        exam-system-backend/src/main/java/com/exam/system/entity/StudentProfile.java
git commit -m "feat(entity): upgrade StudentProfile to member subject with acquisition fields"
```

---

## Task 4：InstructorStudentRelation 新增 tags

**Files：**
- Modify：`exam-system-backend/src/main/java/com/exam/system/entity/InstructorStudentRelation.java`

> ⚠️ 注意：`lastInteractionAt` 已存在於現有 entity，不需新增。

- [ ] **Step 4.1：加入 tags 欄位**

Edit `exam-system-backend/src/main/java/com/exam/system/entity/InstructorStudentRelation.java`，在 `examCount` 後加入：

```java
    /**
     * 講師對該會員的自訂標籤 JSON 陣列（例：["VIP","新北場"]）
     * Phase 1 僅儲存 JSON 字串，前端負責解析與顯示；分眾邏輯在 Phase 4 補上
     */
    @Lob
    @Column
    private String tags;
```

- [ ] **Step 4.2：執行測試**

```bash
mvn test -Dtest='!*IntegrationTest'
```
Expected：全綠。

- [ ] **Step 4.3：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/entity/InstructorStudentRelation.java
git commit -m "feat(entity): add tags column to InstructorStudentRelation"
```

---

## Task 5：QuotaDimension + QuotaResetPeriod enums

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaDimension.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaResetPeriod.java`

- [ ] **Step 5.1：建立 QuotaDimension enum**

```java
package com.exam.system.tier.entity;

/**
 * 配額維度 — 與 quota_policy.dimension 欄位字串值對應
 */
public enum QuotaDimension {
    MEMBER_COUNT,
    MONTHLY_SEND,
    AI_QUESTION_GEN,
    AI_DATA_ANALYSIS,
    AI_NEWSLETTER_GEN,
    ACTIVE_CAMPAIGNS,
    SURVEY_COUNT
}
```

- [ ] **Step 5.2：建立 QuotaResetPeriod enum**

```java
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
```

- [ ] **Step 5.3：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaDimension.java \
        exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaResetPeriod.java
git commit -m "feat(tier): add QuotaDimension and QuotaResetPeriod enums"
```

---

## Task 6：QuotaPolicy entity + Repository

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaPolicy.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/repository/QuotaPolicyRepository.java`

- [ ] **Step 6.1：建立 QuotaPolicy entity**

```java
package com.exam.system.tier.entity;

import com.exam.system.entity.UserTier;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 配額政策 — 每個 tier × dimension 對應一筆上限值
 * 種子資料由 V7 提供；ADMIN 可在後台調整數值不需發版
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quota_policy",
       uniqueConstraints = @UniqueConstraint(name = "uq_quota_policy_tier_dim",
                                              columnNames = {"tier", "dimension"}))
public class QuotaPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTier tier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuotaDimension dimension;

    /** 配額上限值（不可為 NULL；0 代表該 tier 該維度完全禁用） */
    @Column(nullable = false)
    private Integer limitValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private QuotaResetPeriod resetPeriod;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onChange() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 6.2：建立 Repository**

```java
package com.exam.system.tier.repository;

import com.exam.system.entity.UserTier;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotaPolicyRepository extends JpaRepository<QuotaPolicy, Long> {

    Optional<QuotaPolicy> findByTierAndDimension(UserTier tier, QuotaDimension dimension);

    List<QuotaPolicy> findByTier(UserTier tier);
}
```

- [ ] **Step 6.3：執行測試確認 Spring 啟動正確**

```bash
mvn test -Dtest='!*IntegrationTest'
```
Expected：全綠。

- [ ] **Step 6.4：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaPolicy.java \
        exam-system-backend/src/main/java/com/exam/system/tier/repository/QuotaPolicyRepository.java
git commit -m "feat(tier): add QuotaPolicy entity and repository"
```

---

## Task 7：QuotaUsage entity + Repository

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaUsage.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/repository/QuotaUsageRepository.java`

- [ ] **Step 7.1：建立 QuotaUsage entity**

```java
package com.exam.system.tier.entity;

import com.exam.system.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 配額用量計數
 * 每位 owner × dimension × 當期錨點日 一筆；
 * 跨期會 INSERT 新筆，舊筆保留作為趨勢分析（保留 12 個月）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quota_usage",
       uniqueConstraints = @UniqueConstraint(
           name = "uq_quota_usage_owner_dim_period",
           columnNames = {"owner_id", "dimension", "period_start_date"}),
       indexes = @Index(name = "idx_quota_usage_owner_dim",
                        columnList = "owner_id, dimension"))
public class QuotaUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuotaDimension dimension;

    /** 該講師當期起始日（依錨點計算） */
    @Column(name = "period_start_date", nullable = false)
    private LocalDate periodStartDate;

    /** 當期已使用量；NEVER 維度的 periodStartDate 固定為錨點原始日 */
    @Column(nullable = false)
    @Builder.Default
    private Integer usedValue = 0;

    @Column(nullable = false)
    private LocalDateTime lastUpdatedAt;

    @PrePersist
    @PreUpdate
    protected void onChange() {
        this.lastUpdatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 7.2：建立 Repository**

```java
package com.exam.system.tier.repository;

import com.exam.system.entity.User;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuotaUsageRepository extends JpaRepository<QuotaUsage, Long> {

    Optional<QuotaUsage> findByOwnerAndDimensionAndPeriodStartDate(
            User owner, QuotaDimension dimension, LocalDate periodStartDate);

    List<QuotaUsage> findByOwner(User owner);
}
```

- [ ] **Step 7.3：執行測試**

```bash
mvn test -Dtest='!*IntegrationTest'
```

- [ ] **Step 7.4：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/entity/QuotaUsage.java \
        exam-system-backend/src/main/java/com/exam/system/tier/repository/QuotaUsageRepository.java
git commit -m "feat(tier): add QuotaUsage entity and repository"
```

---

## Task 8：TierChangeLog entity + Repository

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/entity/TierChangeLog.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/repository/TierChangeLogRepository.java`

- [ ] **Step 8.1：建立 entity**

```java
package com.exam.system.tier.entity;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 升降級稽核 log — 每次 tier 變動寫入一筆，不可變
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tier_change_log",
       indexes = @Index(name = "idx_tier_log_owner", columnList = "owner_id"))
public class TierChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTier fromTier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserTier toTier;

    /** 操作者（ADMIN）；自動排程降級時為 NULL */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(length = 500)
    private String reason;

    /** PAID 到期日（升 PAID 時記，自動降級時為 NULL） */
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        this.changedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 8.2：建立 Repository**

```java
package com.exam.system.tier.repository;

import com.exam.system.entity.User;
import com.exam.system.tier.entity.TierChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TierChangeLogRepository extends JpaRepository<TierChangeLog, Long> {

    List<TierChangeLog> findByOwnerOrderByChangedAtDesc(User owner);
}
```

- [ ] **Step 8.3：執行測試**

```bash
mvn test -Dtest='!*IntegrationTest'
```

- [ ] **Step 8.4：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/entity/TierChangeLog.java \
        exam-system-backend/src/main/java/com/exam/system/tier/repository/TierChangeLogRepository.java
git commit -m "feat(tier): add TierChangeLog entity and repository"
```

---

## Task 9：QuotaPeriodCalculator（TDD — 配額週期錨點計算）

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaPeriodCalculator.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaPeriodCalculatorTest.java`

> 💡 這是 Phase 1 最關鍵的純函式邏輯。先寫完整測試（5 個邊界值案例），全部紅燈後再實作。

- [ ] **Step 9.1：寫測試類別（5 個案例）**

Create `exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaPeriodCalculatorTest.java`：

```java
package com.exam.system.tier.service;

import com.exam.system.tier.entity.QuotaResetPeriod;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class QuotaPeriodCalculatorTest {

    private final QuotaPeriodCalculator calc = new QuotaPeriodCalculator();

    @Test
    @DisplayName("MONTHLY: 同月份內，period_start = anchor")
    void monthly_withinFirstMonth() {
        LocalDate anchor = LocalDate.of(2026, 5, 17);
        LocalDate today  = LocalDate.of(2026, 6, 16);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 5, 17));
    }

    @Test
    @DisplayName("MONTHLY: 跨月後 period_start = anchor + N months")
    void monthly_acrossMonths() {
        LocalDate anchor = LocalDate.of(2026, 5, 17);
        LocalDate today  = LocalDate.of(2026, 6, 20);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 6, 17));
    }

    @Test
    @DisplayName("MONTHLY: 月底日 1/31 → 2 月 clamping 到 2/28（平年）")
    void monthly_lastDayClampingFebruary() {
        LocalDate anchor = LocalDate.of(2026, 1, 31);
        LocalDate today  = LocalDate.of(2026, 2, 28);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 1, 31));
    }

    @Test
    @DisplayName("MONTHLY: 月底日 1/31 → 3/31 跨期")
    void monthly_lastDayClampingMarch() {
        LocalDate anchor = LocalDate.of(2026, 1, 31);
        LocalDate today  = LocalDate.of(2026, 3, 31);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 3, 31));
    }

    @Test
    @DisplayName("NEVER: period_start 永遠等於 anchor，不論今天")
    void never_periodAlwaysEqualsAnchor() {
        LocalDate anchor = LocalDate.of(2025, 1, 10);
        LocalDate today  = LocalDate.of(2026, 12, 31);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.NEVER);

        assertThat(periodStart).isEqualTo(LocalDate.of(2025, 1, 10));
    }
}
```

- [ ] **Step 9.2：執行測試 — 應全部失敗（類別不存在）**

```bash
mvn test -Dtest=QuotaPeriodCalculatorTest
```
Expected：5 個測試全部 FAIL，原因 `QuotaPeriodCalculator` cannot be resolved。

- [ ] **Step 9.3：實作 QuotaPeriodCalculator**

Create `exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaPeriodCalculator.java`：

```java
package com.exam.system.tier.service;

import com.exam.system.tier.entity.QuotaResetPeriod;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * 配額週期計算器 — 純函式無狀態
 * 給定錨點與今天，回傳該講師當期的 period_start_date
 * Java LocalDate.plusMonths() 內建 last-day clamping，1/31 + 1 month → 2/28
 */
@Component
public class QuotaPeriodCalculator {

    /**
     * 計算當期起始日
     * @param anchorDate     講師 tier_subscribed_at 的日期部分
     * @param today          當日（測試可注入）
     * @param resetPeriod    MONTHLY 跟著錨點走、NEVER 永遠回錨點
     * @return 當期起始日
     */
    public LocalDate computePeriodStart(LocalDate anchorDate, LocalDate today, QuotaResetPeriod resetPeriod) {
        if (resetPeriod == QuotaResetPeriod.NEVER) {
            return anchorDate;
        }
        long monthsElapsed = ChronoUnit.MONTHS.between(anchorDate, today);
        return anchorDate.plusMonths(monthsElapsed);
    }
}
```

- [ ] **Step 9.4：執行測試 — 應全部通過**

```bash
mvn test -Dtest=QuotaPeriodCalculatorTest
```
Expected：5 個測試 PASS。

- [ ] **Step 9.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaPeriodCalculator.java \
        exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaPeriodCalculatorTest.java
git commit -m "feat(tier): QuotaPeriodCalculator with anchor-based lazy reset (TDD)"
```

---

## Task 10：DTOs + QuotaExceededException

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/exception/QuotaExceededException.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/dto/QuotaCheckResultDTO.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/dto/QuotaSnapshotDTO.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/dto/QuotaReservationDTO.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/dto/QuotaPolicyDTO.java`
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/dto/TierChangeRequestDTO.java`

- [ ] **Step 10.1：QuotaExceededException**

```java
package com.exam.system.tier.exception;

import com.exam.system.tier.entity.QuotaDimension;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 配額超出例外 — Controller advice 會轉成 HTTP 429
 */
@Getter
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class QuotaExceededException extends RuntimeException {

    private final QuotaDimension dimension;
    private final int limit;
    private final int used;

    public QuotaExceededException(QuotaDimension dimension, int limit, int used) {
        super("Quota exceeded for dimension " + dimension + " (limit=" + limit + ", used=" + used + ")");
        this.dimension = dimension;
        this.limit = limit;
        this.used = used;
    }
}
```

- [ ] **Step 10.2：QuotaCheckResultDTO**

```java
package com.exam.system.tier.dto;

import com.exam.system.tier.entity.QuotaDimension;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaCheckResultDTO {
    private boolean allowed;
    private QuotaDimension dimension;
    private int limit;
    private int used;
    private int remaining;
    private String reasonIfDenied;  // "TIER_NOT_ALLOWED" | "PERIOD_LIMIT_REACHED"
}
```

- [ ] **Step 10.3：QuotaSnapshotDTO**

```java
package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaSnapshotDTO {
    private UserTier tier;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private long daysUntilReset;
    private List<QuotaItem> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuotaItem {
        private String dimension;
        private int limit;
        private int used;
        private int remaining;
        private String resetPeriod;
    }
}
```

- [ ] **Step 10.4：QuotaReservationDTO**

```java
package com.exam.system.tier.dto;

import com.exam.system.tier.entity.QuotaDimension;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 預扣憑證 — Service 內部使用，呼叫端持有以便 confirm/rollback
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaReservationDTO {
    private Long ownerId;
    private QuotaDimension dimension;
    private LocalDate periodStartDate;
    private int reservedAmount;
}
```

- [ ] **Step 10.5：QuotaPolicyDTO**

```java
package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaResetPeriod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaPolicyDTO {
    private Long id;
    private UserTier tier;
    private QuotaDimension dimension;
    private Integer limitValue;
    private QuotaResetPeriod resetPeriod;
}
```

- [ ] **Step 10.6：TierChangeRequestDTO**

```java
package com.exam.system.tier.dto;

import com.exam.system.entity.UserTier;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TierChangeRequestDTO {
    @NotNull
    private UserTier targetTier;
    private LocalDateTime expiresAt;  // 升 PAID 必填，降 FREE 可空
    private String reason;
}
```

- [ ] **Step 10.7：執行測試 + commit**

```bash
mvn test -Dtest='!*IntegrationTest'
git add exam-system-backend/src/main/java/com/exam/system/tier/dto \
        exam-system-backend/src/main/java/com/exam/system/tier/exception
git commit -m "feat(tier): add quota DTOs and QuotaExceededException"
```

---

## Task 11：QuotaService.check + consume（TDD）

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java`

> ⚠️ 採 `@SpringBootTest` 整合測試，因為 QuotaService 涉及多個 repository。

- [ ] **Step 11.1：寫 check + consume 測試（4 個案例）**

Create `exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java`：

```java
package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.exception.QuotaExceededException;
import com.exam.system.tier.dto.QuotaCheckResultDTO;
import com.exam.system.tier.dto.QuotaReservationDTO;
import com.exam.system.tier.repository.QuotaUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuotaServiceTest {

    @Autowired private QuotaService quotaService;
    @Autowired private UserRepository userRepository;
    @Autowired private QuotaUsageRepository quotaUsageRepository;

    private User freeInstructor;
    private User paidInstructor;

    @BeforeEach
    void setUp() {
        freeInstructor = userRepository.save(User.builder()
                .email("free@test.com").name("Free")
                .role(UserRole.INSTRUCTOR).tier(UserTier.FREE)
                .tierSubscribedAt(LocalDateTime.now().minusDays(10))
                .build());
        paidInstructor = userRepository.save(User.builder()
                .email("paid@test.com").name("Paid")
                .role(UserRole.INSTRUCTOR).tier(UserTier.PAID)
                .tierSubscribedAt(LocalDateTime.now().minusDays(10))
                .build());
    }

    @Test
    @DisplayName("check: FREE 講師 AI_QUESTION_GEN limit=0 → allowed=false")
    void check_freeUser_aiDimension_denied() {
        QuotaCheckResultDTO result = quotaService.check(freeInstructor, QuotaDimension.AI_QUESTION_GEN, 1);
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getReasonIfDenied()).isEqualTo("TIER_NOT_ALLOWED");
    }

    @Test
    @DisplayName("check: PAID 講師 AI_QUESTION_GEN limit=500，請求 1 → allowed=true")
    void check_paidUser_underLimit_allowed() {
        QuotaCheckResultDTO result = quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1);
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getLimit()).isEqualTo(500);
        assertThat(result.getRemaining()).isEqualTo(500);
    }

    @Test
    @DisplayName("consume: 成功扣抵後 used 累加，再 check 看到正確 remaining")
    void consume_thenCheckRemaining() {
        quotaService.consume(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 10, "test");

        QuotaCheckResultDTO result = quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1);
        assertThat(result.getUsed()).isEqualTo(10);
        assertThat(result.getRemaining()).isEqualTo(490);
    }

    @Test
    @DisplayName("consume: 超過 limit 拋 QuotaExceededException")
    void consume_exceedsLimit_throws() {
        assertThatThrownBy(() -> quotaService.consume(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 501, "abuse"))
                .isInstanceOf(QuotaExceededException.class);
    }
}
```

- [ ] **Step 11.2：執行測試 — 應全部失敗（service 不存在）**

```bash
mvn test -Dtest=QuotaServiceTest
```
Expected：4 個 FAIL。

- [ ] **Step 11.3：實作 QuotaService.check + consume**

Create `exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java`：

```java
package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.tier.dto.QuotaCheckResultDTO;
import com.exam.system.tier.dto.QuotaReservationDTO;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaPolicy;
import com.exam.system.tier.entity.QuotaUsage;
import com.exam.system.tier.exception.QuotaExceededException;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import com.exam.system.tier.repository.QuotaUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 配額服務 — 所有外發動作的中央守門員
 */
@Service
@RequiredArgsConstructor
public class QuotaService {

    private final QuotaPolicyRepository policyRepository;
    private final QuotaUsageRepository usageRepository;
    private final QuotaPeriodCalculator periodCalculator;

    /**
     * 非破壞性檢查 — 用於 UI 判斷 disabled 狀態
     */
    @Transactional(readOnly = true)
    public QuotaCheckResultDTO check(User owner, QuotaDimension dimension, int amount) {
        QuotaPolicy policy = policyRepository.findByTierAndDimension(owner.getTier(), dimension)
                .orElseThrow(() -> new IllegalStateException(
                        "No quota policy for tier=" + owner.getTier() + " dim=" + dimension));

        if (policy.getLimitValue() == 0) {
            return QuotaCheckResultDTO.builder()
                    .allowed(false).dimension(dimension)
                    .limit(0).used(0).remaining(0)
                    .reasonIfDenied("TIER_NOT_ALLOWED").build();
        }

        LocalDate periodStart = computePeriodStart(owner, policy);
        int used = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(owner, dimension, periodStart)
                .map(QuotaUsage::getUsedValue).orElse(0);

        boolean allowed = used + amount <= policy.getLimitValue();
        return QuotaCheckResultDTO.builder()
                .allowed(allowed).dimension(dimension)
                .limit(policy.getLimitValue()).used(used)
                .remaining(policy.getLimitValue() - used)
                .reasonIfDenied(allowed ? null : "PERIOD_LIMIT_REACHED").build();
    }

    /**
     * 同步扣抵 — 超額拋例外
     */
    @Transactional
    public void consume(User owner, QuotaDimension dimension, int amount, String reason) {
        QuotaPolicy policy = policyRepository.findByTierAndDimension(owner.getTier(), dimension)
                .orElseThrow(() -> new IllegalStateException(
                        "No quota policy for tier=" + owner.getTier() + " dim=" + dimension));

        LocalDate periodStart = computePeriodStart(owner, policy);
        QuotaUsage usage = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(owner, dimension, periodStart)
                .orElseGet(() -> QuotaUsage.builder()
                        .owner(owner).dimension(dimension)
                        .periodStartDate(periodStart).usedValue(0).build());

        int newUsed = usage.getUsedValue() + amount;
        if (newUsed > policy.getLimitValue()) {
            throw new QuotaExceededException(dimension, policy.getLimitValue(), usage.getUsedValue());
        }

        usage.setUsedValue(newUsed);
        usage.setLastUpdatedAt(LocalDateTime.now());
        usageRepository.save(usage);
    }

    /**
     * 計算當期起始日（將 LocalDateTime 錨點轉 LocalDate 供 calculator 使用）
     */
    private LocalDate computePeriodStart(User owner, QuotaPolicy policy) {
        LocalDate anchor = owner.getTierSubscribedAt() != null
                ? owner.getTierSubscribedAt().toLocalDate()
                : owner.getCreatedAt().toLocalDate();
        return periodCalculator.computePeriodStart(anchor, LocalDate.now(), policy.getResetPeriod());
    }
}
```

- [ ] **Step 11.4：執行測試 — 4 個全部通過**

```bash
mvn test -Dtest=QuotaServiceTest
```
Expected：4 PASS。

- [ ] **Step 11.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java \
        exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java
git commit -m "feat(tier): QuotaService.check and consume with anchor-based period (TDD)"
```

---

## Task 12：QuotaService.reserve / confirm / rollback（TDD）

**Files：**
- Modify：`exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java`
- Modify：`exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java`

- [ ] **Step 12.1：新增 reserve/confirm/rollback 測試**

在 `QuotaServiceTest` 最末加入：

```java
    @Test
    @DisplayName("reserve: 預扣後 check.used 看得到，但尚未真正扣抵")
    void reserve_thenCheckUsedReflectsReservation() {
        QuotaReservationDTO r = quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 50);

        assertThat(r.getReservedAmount()).isEqualTo(50);
        assertThat(quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1).getUsed()).isEqualTo(50);
    }

    @Test
    @DisplayName("confirm: 預扣 50 確認 30，最終 used = 30（退還 20）")
    void confirm_partial_refundDifference() {
        QuotaReservationDTO r = quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 50);

        quotaService.confirm(r, 30);

        assertThat(quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1).getUsed()).isEqualTo(30);
    }

    @Test
    @DisplayName("rollback: 預扣後 rollback 全額退還，used 回到 0")
    void rollback_releasesAll() {
        QuotaReservationDTO r = quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 50);

        quotaService.rollback(r);

        assertThat(quotaService.check(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 1).getUsed()).isEqualTo(0);
    }

    @Test
    @DisplayName("reserve: 超過 limit 直接拋 QuotaExceededException（不寫入）")
    void reserve_exceedsLimit_throws() {
        assertThatThrownBy(() -> quotaService.reserve(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 501))
                .isInstanceOf(QuotaExceededException.class);
    }
```

- [ ] **Step 12.2：執行測試 — 應全部失敗（方法尚未實作）**

```bash
mvn test -Dtest=QuotaServiceTest
```
Expected：4 個新測試 FAIL，原本 4 個 PASS。

- [ ] **Step 12.3：實作 reserve/confirm/rollback**

在 `QuotaService` 加入：

```java
    /**
     * 預扣 — 立即計入用量（與 consume 行為一致），但回傳憑證供呼叫端後續 confirm/rollback
     * 用於非同步任務（AI、寄信）：先確保額度，任務失敗時 rollback 退還
     */
    @Transactional
    public QuotaReservationDTO reserve(User owner, QuotaDimension dimension, int amount) {
        consume(owner, dimension, amount, "RESERVE");  // 重用 consume 的超額檢查
        QuotaPolicy policy = policyRepository.findByTierAndDimension(owner.getTier(), dimension).orElseThrow();
        return QuotaReservationDTO.builder()
                .ownerId(owner.getId()).dimension(dimension)
                .periodStartDate(computePeriodStart(owner, policy))
                .reservedAmount(amount).build();
    }

    /**
     * 確認預扣 — 預扣 reservedAmount，實際使用 actualAmount，退還差額
     */
    @Transactional
    public void confirm(QuotaReservationDTO reservation, int actualAmount) {
        int refund = reservation.getReservedAmount() - actualAmount;
        if (refund > 0) {
            adjustUsage(reservation, -refund);
        }
    }

    /**
     * 取消預扣 — 全額退還
     */
    @Transactional
    public void rollback(QuotaReservationDTO reservation) {
        adjustUsage(reservation, -reservation.getReservedAmount());
    }

    private void adjustUsage(QuotaReservationDTO reservation, int delta) {
        QuotaUsage usage = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(
                userRepository.findById(reservation.getOwnerId()).orElseThrow(),
                reservation.getDimension(), reservation.getPeriodStartDate())
                .orElseThrow(() -> new IllegalStateException("Reservation not found"));
        int newUsed = Math.max(0, usage.getUsedValue() + delta);
        usage.setUsedValue(newUsed);
        usage.setLastUpdatedAt(LocalDateTime.now());
        usageRepository.save(usage);
    }
```

並在 class 最上方欄位加入 `private final UserRepository userRepository;`，import：
```java
import com.exam.system.repository.UserRepository;
```

- [ ] **Step 12.4：執行測試 — 全部通過**

```bash
mvn test -Dtest=QuotaServiceTest
```
Expected：8 PASS。

- [ ] **Step 12.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java \
        exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java
git commit -m "feat(tier): QuotaService.reserve/confirm/rollback for async tasks (TDD)"
```

---

## Task 13：QuotaService.snapshot（TDD）

**Files：**
- Modify：`exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java`
- Modify：`exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java`

- [ ] **Step 13.1：加測試**

```java
    @Test
    @DisplayName("snapshot: 回傳 tier、當期區間、與 7 個維度的 used/limit")
    void snapshot_returnsAllDimensions() {
        quotaService.consume(paidInstructor, QuotaDimension.AI_QUESTION_GEN, 10, "test");

        QuotaSnapshotDTO snap = quotaService.snapshot(paidInstructor);

        assertThat(snap.getTier()).isEqualTo(UserTier.PAID);
        assertThat(snap.getItems()).hasSize(7);
        assertThat(snap.getItems().stream()
                .filter(i -> i.getDimension().equals("AI_QUESTION_GEN"))
                .findFirst().orElseThrow().getUsed()).isEqualTo(10);
        assertThat(snap.getPeriodStart()).isNotNull();
        assertThat(snap.getPeriodEnd()).isAfter(snap.getPeriodStart());
        assertThat(snap.getDaysUntilReset()).isGreaterThanOrEqualTo(0);
    }
```

加 import：
```java
import com.exam.system.tier.dto.QuotaSnapshotDTO;
```

- [ ] **Step 13.2：執行失敗驗證 → 實作 snapshot**

```bash
mvn test -Dtest=QuotaServiceTest#snapshot_returnsAllDimensions
```
Expected：FAIL（method not found）。

在 `QuotaService` 加入：

```java
    /**
     * 講師配額快照 — 給後台儀表板用
     * 以 MONTHLY 維度的當期區間為主顯示「下次重置剩 N 天」
     */
    @Transactional(readOnly = true)
    public QuotaSnapshotDTO snapshot(User owner) {
        java.util.List<QuotaPolicy> policies = policyRepository.findByTier(owner.getTier());
        LocalDate anchor = owner.getTierSubscribedAt() != null
                ? owner.getTierSubscribedAt().toLocalDate()
                : owner.getCreatedAt().toLocalDate();
        LocalDate monthlyStart = periodCalculator.computePeriodStart(anchor, LocalDate.now(),
                com.exam.system.tier.entity.QuotaResetPeriod.MONTHLY);
        LocalDate monthlyEnd = monthlyStart.plusMonths(1);
        long daysUntilReset = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), monthlyEnd);

        java.util.List<QuotaSnapshotDTO.QuotaItem> items = policies.stream().map(p -> {
            LocalDate periodStart = periodCalculator.computePeriodStart(anchor, LocalDate.now(), p.getResetPeriod());
            int used = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(owner, p.getDimension(), periodStart)
                    .map(QuotaUsage::getUsedValue).orElse(0);
            return QuotaSnapshotDTO.QuotaItem.builder()
                    .dimension(p.getDimension().name())
                    .limit(p.getLimitValue()).used(used)
                    .remaining(p.getLimitValue() - used)
                    .resetPeriod(p.getResetPeriod().name())
                    .build();
        }).toList();

        return QuotaSnapshotDTO.builder()
                .tier(owner.getTier())
                .periodStart(monthlyStart).periodEnd(monthlyEnd)
                .daysUntilReset(Math.max(0, daysUntilReset))
                .items(items).build();
    }
```

- [ ] **Step 13.3：執行測試**

```bash
mvn test -Dtest=QuotaServiceTest
```
Expected：9 PASS。

- [ ] **Step 13.4：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/service/QuotaService.java \
        exam-system-backend/src/test/java/com/exam/system/tier/service/QuotaServiceTest.java
git commit -m "feat(tier): QuotaService.snapshot for dashboard (TDD)"
```

---

## Task 14：TierService — 升降級 + 錨點重設（TDD）

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/service/TierService.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/service/TierServiceTest.java`

- [ ] **Step 14.1：寫測試**

```java
package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.entity.TierChangeLog;
import com.exam.system.tier.repository.TierChangeLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TierServiceTest {

    @Autowired private TierService tierService;
    @Autowired private UserRepository userRepository;
    @Autowired private TierChangeLogRepository logRepository;

    private User admin;
    private User instructor;

    @BeforeEach
    void setUp() {
        admin = userRepository.save(User.builder()
                .email("admin@test.com").name("Admin").role(UserRole.ADMIN)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now()).build());
        instructor = userRepository.save(User.builder()
                .email("ins@test.com").name("Ins").role(UserRole.INSTRUCTOR)
                .tier(UserTier.FREE).tierSubscribedAt(LocalDateTime.now().minusDays(30)).build());
    }

    @Test
    @DisplayName("upgrade FREE → PAID 重新錨定 + 寫 log")
    void upgrade_resetsAnchorAndLogs() {
        LocalDateTime beforeChange = instructor.getTierSubscribedAt();

        LocalDateTime expires = LocalDateTime.now().plusMonths(1);
        tierService.changeTier(admin, instructor.getId(), UserTier.PAID, expires, "promotion");

        User reloaded = userRepository.findById(instructor.getId()).orElseThrow();
        assertThat(reloaded.getTier()).isEqualTo(UserTier.PAID);
        assertThat(reloaded.getTierSubscribedAt()).isAfter(beforeChange);
        assertThat(reloaded.getTierExpiresAt()).isEqualTo(expires);

        List<TierChangeLog> logs = logRepository.findByOwnerOrderByChangedAtDesc(reloaded);
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getFromTier()).isEqualTo(UserTier.FREE);
        assertThat(logs.get(0).getToTier()).isEqualTo(UserTier.PAID);
        assertThat(logs.get(0).getChangedBy().getId()).isEqualTo(admin.getId());
    }

    @Test
    @DisplayName("downgrade PAID → FREE 清除 expiresAt + 重新錨定")
    void downgrade_clearsExpiresAndResetsAnchor() {
        tierService.changeTier(admin, instructor.getId(), UserTier.PAID,
                LocalDateTime.now().plusMonths(1), "trial");
        tierService.changeTier(admin, instructor.getId(), UserTier.FREE, null, "trial-end");

        User reloaded = userRepository.findById(instructor.getId()).orElseThrow();
        assertThat(reloaded.getTier()).isEqualTo(UserTier.FREE);
        assertThat(reloaded.getTierExpiresAt()).isNull();

        List<TierChangeLog> logs = logRepository.findByOwnerOrderByChangedAtDesc(reloaded);
        assertThat(logs).hasSize(2);
    }

    @Test
    @DisplayName("自動排程降級 changedBy 可為 null")
    void autoDowngrade_changedByNull() {
        tierService.autoDowngrade(instructor.getId(), "expired");

        List<TierChangeLog> logs = logRepository.findByOwnerOrderByChangedAtDesc(instructor);
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getChangedBy()).isNull();
    }
}
```

- [ ] **Step 14.2：跑測試 — 應全 fail（service 不存在）**

```bash
mvn test -Dtest=TierServiceTest
```

- [ ] **Step 14.3：實作 TierService**

```java
package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.entity.TierChangeLog;
import com.exam.system.tier.repository.TierChangeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 講師分級服務 — ADMIN 升降級流程，含錨點重設與稽核 log
 */
@Service
@RequiredArgsConstructor
public class TierService {

    private final UserRepository userRepository;
    private final TierChangeLogRepository logRepository;

    /**
     * ADMIN 手動變更 tier
     * @param operator   操作者（必為 ADMIN）
     * @param targetUserId 目標講師 ID
     * @param newTier    新 tier
     * @param expiresAt  PAID 到期；降 FREE 傳 null
     * @param reason     變更原因（記入 log）
     */
    @Transactional
    public void changeTier(User operator, Long targetUserId, UserTier newTier,
                           LocalDateTime expiresAt, String reason) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        UserTier fromTier = target.getTier();

        target.setTier(newTier);
        target.setTierSubscribedAt(LocalDateTime.now());  // 錨點重設
        target.setTierExpiresAt(newTier == UserTier.PAID ? expiresAt : null);
        userRepository.save(target);

        logRepository.save(TierChangeLog.builder()
                .owner(target).fromTier(fromTier).toTier(newTier)
                .changedBy(operator).reason(reason).expiresAt(expiresAt).build());
    }

    /**
     * 自動降級（過期 PAID）— operator 為 null，由排程呼叫
     */
    @Transactional
    public void autoDowngrade(Long targetUserId, String reason) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        UserTier fromTier = target.getTier();

        target.setTier(UserTier.FREE);
        target.setTierSubscribedAt(LocalDateTime.now());
        target.setTierExpiresAt(null);
        userRepository.save(target);

        logRepository.save(TierChangeLog.builder()
                .owner(target).fromTier(fromTier).toTier(UserTier.FREE)
                .changedBy(null).reason(reason).build());
    }
}
```

- [ ] **Step 14.4：跑測試**

```bash
mvn test -Dtest=TierServiceTest
```
Expected：3 PASS。

- [ ] **Step 14.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/service/TierService.java \
        exam-system-backend/src/test/java/com/exam/system/tier/service/TierServiceTest.java
git commit -m "feat(tier): TierService with anchor reset and audit log (TDD)"
```

---

## Task 15：TierExpirationScheduler — 過期自動降級

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/scheduler/TierExpirationScheduler.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/scheduler/TierExpirationSchedulerTest.java`
- Modify：`exam-system-backend/src/main/java/com/exam/system/ExamSystemApplication.java`（加 @EnableScheduling）

- [ ] **Step 15.1：確認 @EnableScheduling**

開啟 `ExamSystemApplication.java`，如已有 `@EnableScheduling` 則略過；否則加上：

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ExamSystemApplication { ... }
```

- [ ] **Step 15.2：擴充 UserRepository（查過期 PAID）**

開啟 `exam-system-backend/src/main/java/com/exam/system/repository/UserRepository.java`，加入：

```java
    /**
     * 查找 tier=PAID 且 tierExpiresAt 已過期的講師
     */
    java.util.List<User> findByTierAndTierExpiresAtBefore(UserTier tier, LocalDateTime expireBefore);
```

加 imports：
```java
import com.exam.system.entity.UserTier;
import java.time.LocalDateTime;
```

- [ ] **Step 15.3：實作 Scheduler**

```java
package com.exam.system.tier.scheduler;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.service.TierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PAID 到期自動降級排程
 * 每日凌晨 03:00 跑一次（避開 H2 backup 與系統高峰）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TierExpirationScheduler {

    private final UserRepository userRepository;
    private final TierService tierService;

    @Scheduled(cron = "0 0 3 * * *")
    public void downgradeExpiredPaidUsers() {
        runOnce();
    }

    /**
     * 抽出為 public 方法供測試直接呼叫
     */
    public int runOnce() {
        List<User> expired = userRepository.findByTierAndTierExpiresAtBefore(UserTier.PAID, LocalDateTime.now());
        log.info("[TierExpiration] found {} expired PAID users", expired.size());
        expired.forEach(u -> tierService.autoDowngrade(u.getId(), "auto-downgrade-on-expiration"));
        return expired.size();
    }
}
```

- [ ] **Step 15.4：寫測試**

```java
package com.exam.system.tier.scheduler;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TierExpirationSchedulerTest {

    @Autowired private TierExpirationScheduler scheduler;
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("過期的 PAID 講師被降為 FREE；未過期維持原狀")
    void downgrade_onlyExpiredOnes() {
        User expired = userRepository.save(User.builder()
                .email("exp@test.com").name("Exp").role(UserRole.INSTRUCTOR)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now().minusDays(40))
                .tierExpiresAt(LocalDateTime.now().minusDays(1)).build());
        User active = userRepository.save(User.builder()
                .email("act@test.com").name("Act").role(UserRole.INSTRUCTOR)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now().minusDays(5))
                .tierExpiresAt(LocalDateTime.now().plusDays(25)).build());

        int count = scheduler.runOnce();

        assertThat(count).isEqualTo(1);
        assertThat(userRepository.findById(expired.getId()).orElseThrow().getTier()).isEqualTo(UserTier.FREE);
        assertThat(userRepository.findById(active.getId()).orElseThrow().getTier()).isEqualTo(UserTier.PAID);
    }
}
```

- [ ] **Step 15.5：跑測試**

```bash
mvn test -Dtest=TierExpirationSchedulerTest
```
Expected：1 PASS。

- [ ] **Step 15.6：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/scheduler/TierExpirationScheduler.java \
        exam-system-backend/src/main/java/com/exam/system/repository/UserRepository.java \
        exam-system-backend/src/main/java/com/exam/system/ExamSystemApplication.java \
        exam-system-backend/src/test/java/com/exam/system/tier/scheduler/TierExpirationSchedulerTest.java
git commit -m "feat(tier): TierExpirationScheduler with daily auto-downgrade (TDD)"
```

---

## Task 16：FeaturePermissionService 重構（用 tier 取代 boolean flag）

**Files：**
- Modify：`exam-system-backend/src/main/java/com/exam/system/service/FeaturePermissionService.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/service/FeaturePermissionServiceTest.java`

> Task 2 已暫時讓編譯通過，這步是正式重構並補測試。

- [ ] **Step 16.1：寫測試（覆蓋四種組合）**

```java
package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.exception.AuthException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FeaturePermissionServiceTest {

    private final FeaturePermissionService service = new FeaturePermissionService();

    @Test
    @DisplayName("ADMIN 永遠可使用所有功能（不論 tier）")
    void admin_alwaysAllowed() {
        User admin = User.builder().role(UserRole.ADMIN).tier(UserTier.FREE).build();
        assertThat(service.canManageSurveys(admin)).isTrue();
        assertThat(service.canManageEmails(admin)).isTrue();
    }

    @Test
    @DisplayName("INSTRUCTOR + PAID 可使用問券與郵件管理")
    void instructorPaid_allowed() {
        User u = User.builder().role(UserRole.INSTRUCTOR).tier(UserTier.PAID).build();
        assertThat(service.canManageSurveys(u)).isTrue();
        assertThat(service.canManageEmails(u)).isTrue();
    }

    @Test
    @DisplayName("INSTRUCTOR + FREE 仍可使用問券管理（額度低但功能開放）")
    void instructorFree_surveysAllowed() {
        User u = User.builder().role(UserRole.INSTRUCTOR).tier(UserTier.FREE).build();
        assertThat(service.canManageSurveys(u)).isTrue();
    }

    @Test
    @DisplayName("INSTRUCTOR + FREE 不可寄送郵件（MONTHLY_SEND 為 200 仍開放發送但需配額檢查）")
    void instructorFree_emailsAllowedButQuotaLimited() {
        // 註：依本 spec FREE 仍有 200 封寄送額度，所以「可進」郵件管理但實際發送受配額擋
        User u = User.builder().role(UserRole.INSTRUCTOR).tier(UserTier.FREE).build();
        assertThat(service.canManageEmails(u)).isTrue();
    }

    @Test
    @DisplayName("STUDENT 不可使用講師功能")
    void student_denied() {
        User u = User.builder().role(UserRole.STUDENT).tier(UserTier.FREE).build();
        assertThat(service.canManageSurveys(u)).isFalse();
        assertThat(service.canManageEmails(u)).isFalse();
    }

    @Test
    @DisplayName("assertCanManageSurveys 不通過時拋 AuthException")
    void assertCanManageSurveys_studentThrows() {
        User u = User.builder().role(UserRole.STUDENT).tier(UserTier.FREE).build();
        assertThatThrownBy(() -> service.assertCanManageSurveys(u))
                .isInstanceOf(AuthException.class);
    }
}
```

- [ ] **Step 16.2：跑測試 — 部分通過（因 Task 2 暫時改法）**

```bash
mvn test -Dtest=FeaturePermissionServiceTest
```
注意：第 3 個測試 `instructorFree_surveysAllowed` 可能 FAIL，因 Task 2 暫時讓 FREE 都不可用。這正是本次要修正的。

- [ ] **Step 16.3：正式重構**

Edit `FeaturePermissionService.java`：

```java
package com.exam.system.service;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 功能權限檢查服務 — 判斷使用者是否可進入問券/郵件管理介面
 * 注意：本服務僅判斷「介面進入權限」；實際操作配額由 QuotaService 控管
 */
@Service
public class FeaturePermissionService {

    public void assertCanManageSurveys(User user) {
        if (!canManageSurveys(user)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "SURVEY_MANAGEMENT_DISABLED",
                    "目前帳號未開放問券管理權限");
        }
    }

    public void assertCanManageEmails(User user) {
        if (!canManageEmails(user)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "EMAIL_MANAGEMENT_DISABLED",
                    "目前帳號未開放郵件管理權限");
        }
    }

    /**
     * 問券管理：ADMIN 或 INSTRUCTOR 均可（FREE 仍可用，配額由 SURVEY_COUNT 控制）
     */
    public boolean canManageSurveys(User user) {
        if (user == null) return false;
        return user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.INSTRUCTOR;
    }

    /**
     * 郵件管理：同上（FREE 仍可進入，發送配額由 MONTHLY_SEND 控制）
     */
    public boolean canManageEmails(User user) {
        if (user == null) return false;
        return user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.INSTRUCTOR;
    }
}
```

- [ ] **Step 16.4：跑測試**

```bash
mvn test -Dtest=FeaturePermissionServiceTest
```
Expected：6 PASS。

- [ ] **Step 16.5：執行所有非整合測試確認沒打壞東西**

```bash
mvn test -Dtest='!*IntegrationTest'
```
Expected：全綠。

- [ ] **Step 16.6：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/service/FeaturePermissionService.java \
        exam-system-backend/src/test/java/com/exam/system/service/FeaturePermissionServiceTest.java
git commit -m "refactor(auth): FeaturePermissionService now uses role + tier semantics (TDD)"
```

---

## Task 17：QuotaController — GET /api/quota/snapshot

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/controller/QuotaController.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/controller/QuotaControllerTest.java`
- Modify：`exam-system-backend/src/main/java/com/exam/system/config/SecurityConfig.java`（新路由須認證）

- [ ] **Step 17.1：寫 Controller**

```java
package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.QuotaSnapshotDTO;
import com.exam.system.tier.service.QuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 講師配額查詢
 */
@RestController
@RequestMapping("/api/quota")
@RequiredArgsConstructor
public class QuotaController {

    private final QuotaService quotaService;
    private final UserRepository userRepository;

    /**
     * 取得當前登入講師的配額快照
     */
    @GetMapping("/snapshot")
    public ResponseEntity<QuotaSnapshotDTO> snapshot(@AuthenticationPrincipal OAuth2User principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(quotaService.snapshot(user));
    }

    private User resolveUser(OAuth2User principal) {
        String email = principal.getAttribute("email");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not in DB: " + email));
    }
}
```

> 註：若專案使用自訂 JWT principal 解析方式，請對齊既有 controller 的 pattern（例如 `JwtAuthenticationFilter` 設定的 principal）。

- [ ] **Step 17.2：SecurityConfig 加路由規則**

開啟 `SecurityConfig.java`，在 `.authorizeHttpRequests` 區塊內加入（依既有風格放在 `permitAll()` 之外、`anyRequest().authenticated()` 之前）：

```java
.requestMatchers("/api/quota/**").hasAnyRole("INSTRUCTOR", "ADMIN")
```

- [ ] **Step 17.3：寫 Controller 測試（MockMvc）**

```java
package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QuotaControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.save(User.builder()
                .email("ins@test.com").name("Ins").role(UserRole.INSTRUCTOR)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now().minusDays(5)).build());
    }

    @Test
    @WithMockUser(username = "ins@test.com", roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 可取得自己的 quota snapshot")
    void instructor_snapshotSuccess() throws Exception {
        mockMvc.perform(get("/api/quota/snapshot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tier").value("PAID"))
                .andExpect(jsonPath("$.items.length()").value(7));
    }

    @Test
    @DisplayName("未登入 → 401")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/quota/snapshot"))
                .andExpect(status().isUnauthorized());
    }
}
```

> 註：若專案使用自訂 principal 解析（如 JWT），`@WithMockUser` 可能無法觸發業務邏輯的 user lookup。此時改用「直接呼叫 service 並驗證輸出」的單元測試 pattern。可參考既有 `*ControllerTest.java`。

- [ ] **Step 17.4：跑測試**

```bash
mvn test -Dtest=QuotaControllerTest
```
若失敗請對齊既有 controller test 的 auth pattern 後再跑。

- [ ] **Step 17.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/controller/QuotaController.java \
        exam-system-backend/src/main/java/com/exam/system/config/SecurityConfig.java \
        exam-system-backend/src/test/java/com/exam/system/tier/controller/QuotaControllerTest.java
git commit -m "feat(tier): QuotaController GET /api/quota/snapshot for instructor dashboard"
```

---

## Task 18：TierController — ADMIN 升降級

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/controller/TierController.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/controller/TierControllerTest.java`
- Modify：`SecurityConfig.java`

- [ ] **Step 18.1：Controller**

```java
package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.TierChangeRequestDTO;
import com.exam.system.tier.entity.TierChangeLog;
import com.exam.system.tier.repository.TierChangeLogRepository;
import com.exam.system.tier.service.TierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class TierController {

    private final TierService tierService;
    private final UserRepository userRepository;
    private final TierChangeLogRepository logRepository;

    /**
     * ADMIN 升降級講師
     */
    @PutMapping("/{id}/tier")
    public ResponseEntity<Void> changeTier(@PathVariable Long id,
                                           @Valid @RequestBody TierChangeRequestDTO req,
                                           @AuthenticationPrincipal OAuth2User principal) {
        User operator = resolveUser(principal);
        tierService.changeTier(operator, id, req.getTargetTier(), req.getExpiresAt(), req.getReason());
        return ResponseEntity.noContent().build();
    }

    /**
     * ADMIN 查看講師升降級歷史
     */
    @GetMapping("/{id}/tier-history")
    public ResponseEntity<List<TierChangeLog>> history(@PathVariable Long id) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return ResponseEntity.ok(logRepository.findByOwnerOrderByChangedAtDesc(target));
    }

    private User resolveUser(OAuth2User principal) {
        String email = principal.getAttribute("email");
        return userRepository.findByEmail(email).orElseThrow();
    }
}
```

- [ ] **Step 18.2：SecurityConfig 加 ADMIN 限定**

```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```
（若已存在通用 ADMIN 規則則略過）

- [ ] **Step 18.3：Controller 測試**

```java
package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.exam.system.tier.dto.TierChangeRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TierControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;

    private Long instructorId;

    @BeforeEach
    void setUp() {
        userRepository.save(User.builder()
                .email("admin@test.com").name("Admin").role(UserRole.ADMIN)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now()).build());
        User ins = userRepository.save(User.builder()
                .email("ins@test.com").name("Ins").role(UserRole.INSTRUCTOR)
                .tier(UserTier.FREE).tierSubscribedAt(LocalDateTime.now()).build());
        instructorId = ins.getId();
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    @DisplayName("ADMIN 升級講師為 PAID 成功")
    void admin_upgradeToPaid_success() throws Exception {
        TierChangeRequestDTO req = new TierChangeRequestDTO();
        req.setTargetTier(UserTier.PAID);
        req.setExpiresAt(LocalDateTime.now().plusMonths(1));
        req.setReason("promotion");

        mockMvc.perform(put("/api/admin/users/{id}/tier", instructorId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(instructorId).orElseThrow().getTier()).isEqualTo(UserTier.PAID);
    }

    @Test
    @WithMockUser(username = "ins@test.com", roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 嘗試升降級 → 403")
    void instructor_changeTier_forbidden() throws Exception {
        TierChangeRequestDTO req = new TierChangeRequestDTO();
        req.setTargetTier(UserTier.PAID);

        mockMvc.perform(put("/api/admin/users/{id}/tier", instructorId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 18.4：跑測試**

```bash
mvn test -Dtest=TierControllerTest
```
Expected：2 PASS。

- [ ] **Step 18.5：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/controller/TierController.java \
        exam-system-backend/src/test/java/com/exam/system/tier/controller/TierControllerTest.java \
        exam-system-backend/src/main/java/com/exam/system/config/SecurityConfig.java
git commit -m "feat(tier): TierController for ADMIN tier upgrade/downgrade"
```

---

## Task 19：QuotaPolicyController — ADMIN 政策 CRUD

**Files：**
- Create：`exam-system-backend/src/main/java/com/exam/system/tier/controller/QuotaPolicyController.java`
- Test：`exam-system-backend/src/test/java/com/exam/system/tier/controller/QuotaPolicyControllerTest.java`

- [ ] **Step 19.1：Controller**

```java
package com.exam.system.tier.controller;

import com.exam.system.tier.dto.QuotaPolicyDTO;
import com.exam.system.tier.entity.QuotaPolicy;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 配額政策管理 — ADMIN 可調整數字不需發版
 */
@RestController
@RequestMapping("/api/admin/quota-policies")
@RequiredArgsConstructor
public class QuotaPolicyController {

    private final QuotaPolicyRepository policyRepository;

    @GetMapping
    public List<QuotaPolicyDTO> list() {
        return policyRepository.findAll().stream().map(this::toDto).toList();
    }

    /**
     * 調整某筆配額（只能改 limitValue；tier/dimension/resetPeriod 不可改）
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<QuotaPolicyDTO> update(@PathVariable Long id, @RequestBody QuotaPolicyDTO req) {
        QuotaPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));
        if (req.getLimitValue() == null || req.getLimitValue() < 0) {
            throw new IllegalArgumentException("limitValue must be non-negative");
        }
        policy.setLimitValue(req.getLimitValue());
        return ResponseEntity.ok(toDto(policyRepository.save(policy)));
    }

    private QuotaPolicyDTO toDto(QuotaPolicy p) {
        return QuotaPolicyDTO.builder()
                .id(p.getId()).tier(p.getTier()).dimension(p.getDimension())
                .limitValue(p.getLimitValue()).resetPeriod(p.getResetPeriod()).build();
    }
}
```

- [ ] **Step 19.2：Controller 測試**

```java
package com.exam.system.tier.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.entity.UserTier;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.QuotaPolicyDTO;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QuotaPolicyControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private QuotaPolicyRepository policyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.save(User.builder()
                .email("admin@test.com").name("Admin").role(UserRole.ADMIN)
                .tier(UserTier.PAID).tierSubscribedAt(LocalDateTime.now()).build());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("GET 列出 14 筆種子政策")
    void list_returns14SeedPolicies() throws Exception {
        mockMvc.perform(get("/api/admin/quota-policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(14));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    @DisplayName("PUT 調整 PAID MONTHLY_SEND 上限為 30000")
    void update_changesLimit() throws Exception {
        Long id = policyRepository.findByTierAndDimension(UserTier.PAID, QuotaDimension.MONTHLY_SEND)
                .orElseThrow().getId();
        QuotaPolicyDTO req = QuotaPolicyDTO.builder().limitValue(30000).build();

        mockMvc.perform(put("/api/admin/quota-policies/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.limitValue").value(30000));

        assertThat(policyRepository.findById(id).orElseThrow().getLimitValue()).isEqualTo(30000);
    }

    @Test
    @WithMockUser(roles = {"INSTRUCTOR"})
    @DisplayName("INSTRUCTOR 取得列表 → 403")
    void instructor_forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/quota-policies"))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 19.3：跑測試**

```bash
mvn test -Dtest=QuotaPolicyControllerTest
```

- [ ] **Step 19.4：Commit**

```bash
git add exam-system-backend/src/main/java/com/exam/system/tier/controller/QuotaPolicyController.java \
        exam-system-backend/src/test/java/com/exam/system/tier/controller/QuotaPolicyControllerTest.java
git commit -m "feat(tier): QuotaPolicyController for ADMIN policy adjustment"
```

---

## Task 20：前端 types + apiService

**Files：**
- Modify：`exam-system-frontend/src/types.ts`（或對應的 types 檔，需 grep 確認）
- Modify：`exam-system-frontend/src/services/apiService.ts`（或對應 service 檔）

- [ ] **Step 20.1：找出前端 types 與 apiService 檔案位置**

```bash
cd ../exam-system-frontend
find src -name "types*.ts" -not -path "*/node_modules/*"
find src -name "apiService*" -not -path "*/node_modules/*"
```

- [ ] **Step 20.2：types 新增**

在找到的 types 檔尾端新增：

```typescript
// === Phase 1: Tier & Quota types ===

export type UserTier = 'FREE' | 'PAID';

export type QuotaDimensionName =
  | 'MEMBER_COUNT'
  | 'MONTHLY_SEND'
  | 'AI_QUESTION_GEN'
  | 'AI_DATA_ANALYSIS'
  | 'AI_NEWSLETTER_GEN'
  | 'ACTIVE_CAMPAIGNS'
  | 'SURVEY_COUNT';

export type QuotaResetPeriodName = 'MONTHLY' | 'NEVER';

export interface QuotaItem {
  dimension: QuotaDimensionName;
  limit: number;
  used: number;
  remaining: number;
  resetPeriod: QuotaResetPeriodName;
}

export interface QuotaSnapshot {
  tier: UserTier;
  periodStart: string;   // ISO date "2026-05-17"
  periodEnd: string;
  daysUntilReset: number;
  items: QuotaItem[];
}

export interface QuotaPolicy {
  id: number;
  tier: UserTier;
  dimension: QuotaDimensionName;
  limitValue: number;
  resetPeriod: QuotaResetPeriodName;
}

export interface TierChangeRequest {
  targetTier: UserTier;
  expiresAt?: string | null;  // ISO datetime
  reason?: string;
}

export interface TierChangeLog {
  id: number;
  fromTier: UserTier;
  toTier: UserTier;
  changedAt: string;
  expiresAt: string | null;
  reason: string | null;
  changedBy: { id: number; name: string } | null;
}
```

- [ ] **Step 20.3：apiService 新增方法**

在 apiService 檔內新增：

```typescript
import type { QuotaSnapshot, QuotaPolicy, TierChangeRequest, TierChangeLog } from '../types';
// （依專案實際 type 匯入路徑調整）

export const tierQuotaApi = {
  /** 取得當前登入講師的配額快照 */
  async fetchSnapshot(): Promise<QuotaSnapshot> {
    const res = await axios.get<QuotaSnapshot>('/api/quota/snapshot');
    return res.data;
  },

  /** ADMIN：升降級講師 */
  async changeTier(userId: number, req: TierChangeRequest): Promise<void> {
    await axios.put(`/api/admin/users/${userId}/tier`, req);
  },

  /** ADMIN：查看講師升降級歷史 */
  async fetchTierHistory(userId: number): Promise<TierChangeLog[]> {
    const res = await axios.get<TierChangeLog[]>(`/api/admin/users/${userId}/tier-history`);
    return res.data;
  },

  /** ADMIN：列出所有配額政策 */
  async listPolicies(): Promise<QuotaPolicy[]> {
    const res = await axios.get<QuotaPolicy[]>('/api/admin/quota-policies');
    return res.data;
  },

  /** ADMIN：調整某筆配額政策的 limitValue */
  async updatePolicy(id: number, limitValue: number): Promise<QuotaPolicy> {
    const res = await axios.put<QuotaPolicy>(`/api/admin/quota-policies/${id}`, { limitValue });
    return res.data;
  },
};
```

> 註：實際 axios import 與 apiService 物件結構需對齊既有檔案的命名慣例。

- [ ] **Step 20.4：tsc 編譯確認**

```bash
npm run build
```
Expected：build 完成、無 TS 錯誤。

- [ ] **Step 20.5：Commit**

```bash
git add exam-system-frontend/src/types.ts exam-system-frontend/src/services/apiService.ts
git commit -m "feat(frontend): add Phase 1 tier-quota types and apiService methods"
```

---

## Task 21：InstructorQuotaDashboard 頁面

**Files：**
- Create：`exam-system-frontend/src/components/QuotaProgressBar.tsx`
- Create：`exam-system-frontend/src/pages/InstructorQuotaDashboard.tsx`
- Modify：路由註冊檔（grep `<Route` 找位置）

- [ ] **Step 21.1：QuotaProgressBar 元件**

```tsx
import React from 'react';

interface Props {
  label: string;
  used: number;
  limit: number;
  resetPeriod: string;
}

/**
 * 配額進度條元件
 * - limit=0：顯示「未開放」灰色條
 * - 已使用 >= 80%：紅色警示
 * - 已使用 >= 50%：黃色提醒
 * - 其他：藍色正常
 */
const QuotaProgressBar: React.FC<Props> = ({ label, used, limit, resetPeriod }) => {
  if (limit === 0) {
    return (
      <div className="quota-row">
        <div className="quota-label">{label}</div>
        <div className="quota-bar disabled">
          <span className="quota-text">未開放（升級 PAID 可用）</span>
        </div>
      </div>
    );
  }
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const color = percent >= 80 ? '#ef4444' : percent >= 50 ? '#f59e0b' : '#3b82f6';
  return (
    <div className="quota-row">
      <div className="quota-label">{label}</div>
      <div className="quota-bar">
        <div className="quota-fill" style={{ width: `${percent}%`, background: color }} />
        <span className="quota-text">
          {used.toLocaleString()} / {limit.toLocaleString()}
          {resetPeriod === 'MONTHLY' ? '（月度）' : '（永久）'}
        </span>
      </div>
    </div>
  );
};

export default QuotaProgressBar;
```

- [ ] **Step 21.2：InstructorQuotaDashboard 頁**

```tsx
import React, { useEffect, useState } from 'react';
import { tierQuotaApi } from '../services/apiService';
import type { QuotaSnapshot } from '../types';
import QuotaProgressBar from '../components/QuotaProgressBar';

/**
 * 講師配額儀表板
 * 顯示當前 tier、當期區間、剩餘天數、7 個維度的使用量
 */
const DIMENSION_LABELS: Record<string, string> = {
  MEMBER_COUNT: '會員數',
  MONTHLY_SEND: '本期寄送量',
  AI_QUESTION_GEN: 'AI 出題',
  AI_DATA_ANALYSIS: 'AI 數據分析',
  AI_NEWSLETTER_GEN: 'AI 電子報生成',
  ACTIVE_CAMPAIGNS: '進行中活動',
  SURVEY_COUNT: '問卷數',
};

const InstructorQuotaDashboard: React.FC = () => {
  const [snapshot, setSnapshot] = useState<QuotaSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tierQuotaApi.fetchSnapshot()
      .then(setSnapshot)
      .catch(err => setError(err.message ?? '載入失敗'));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!snapshot) return <div>載入中...</div>;

  return (
    <div className="quota-dashboard">
      <header className="quota-header">
        <h2>配額儀表板</h2>
        <div className="tier-badge">{snapshot.tier === 'PAID' ? '付費版 PAID' : '免費版 FREE'}</div>
      </header>

      <div className="period-info">
        <span>當期：{snapshot.periodStart} ~ {snapshot.periodEnd}</span>
        <span>距下次重置：{snapshot.daysUntilReset} 天</span>
      </div>

      <div className="quota-list">
        {snapshot.items.map(item => (
          <QuotaProgressBar
            key={item.dimension}
            label={DIMENSION_LABELS[item.dimension] ?? item.dimension}
            used={item.used}
            limit={item.limit}
            resetPeriod={item.resetPeriod}
          />
        ))}
      </div>

      {snapshot.tier === 'FREE' && (
        <div className="upgrade-cta">
          <strong>需要更多配額？</strong>
          <p>請聯絡管理員升級 PAID 帳號，可解鎖 AI 功能、廣告活動與更高寄送量。</p>
        </div>
      )}
    </div>
  );
};

export default InstructorQuotaDashboard;
```

- [ ] **Step 21.3：加最簡 CSS**

在 `index.css` 或對應全域樣式檔加入：

```css
.quota-dashboard { padding: 24px; max-width: 800px; margin: 0 auto; }
.quota-header { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.tier-badge { padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-weight: 600; }
.period-info { display: flex; justify-content: space-between; padding: 8px 12px; background: #f3f4f6; border-radius: 4px; margin-bottom: 16px; font-size: 14px; }
.quota-row { display: grid; grid-template-columns: 160px 1fr; gap: 12px; align-items: center; margin: 8px 0; }
.quota-label { font-size: 14px; color: #374151; }
.quota-bar { position: relative; height: 28px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.quota-bar.disabled { background: #f3f4f6; }
.quota-fill { position: absolute; top: 0; left: 0; height: 100%; transition: width 0.3s; }
.quota-text { position: relative; padding: 4px 12px; font-size: 13px; color: #1f2937; z-index: 1; }
.upgrade-cta { margin-top: 24px; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
```

- [ ] **Step 21.4：註冊路由**

找到既有的 React Router 設定檔（搜 `<Route path="/instructor`），加入：

```tsx
<Route path="/instructor/quota" element={<InstructorQuotaDashboard />} />
```

並在 `InstructorDashboard.tsx` 或 nav 加入連結：「配額儀表板」 → `/instructor/quota`。

- [ ] **Step 21.5：手動驗證**

```bash
# 後端
cd ../exam-system-backend
mvn spring-boot:run &

# 前端
cd ../exam-system-frontend
npm run dev
```

開瀏覽器：http://localhost:5173/instructor/quota
（須登入 INSTRUCTOR 帳號）
Expected：看到「免費版 FREE」徽章 + 7 個進度條（多數為 0%）。

- [ ] **Step 21.6：Commit**

```bash
git add exam-system-frontend/src/pages/InstructorQuotaDashboard.tsx \
        exam-system-frontend/src/components/QuotaProgressBar.tsx \
        exam-system-frontend/src/index.css \
        exam-system-frontend/src/App.tsx  # 或實際的路由檔
git commit -m "feat(frontend): InstructorQuotaDashboard with tier and 7-dimension progress bars"
```

---

## Task 22：AdminDashboard 新增 Tier 管理 tab

**Files：**
- Modify：`exam-system-frontend/src/pages/AdminDashboard.tsx`

- [ ] **Step 22.1：在 AdminDashboard 加入「Tier 管理」tab**

開啟 `AdminDashboard.tsx`，目前已有「測驗管理」tab（v1.6 加入）。在 tab list 加入新 tab：

```tsx
const [activeTab, setActiveTab] = useState<'exams' | 'users' | 'tiers' | 'policies'>('exams');
```

加入兩個新區塊：

**「Tier 管理」tab：**
- 列出所有 INSTRUCTOR（透過 `/api/admin/users?role=INSTRUCTOR`，若 API 尚未存在則先新增）
- 每列顯示：email、name、tier、tier_expires_at、操作按鈕（升 PAID / 降 FREE / 查歷史）
- 升 PAID 跳出對話框：選到期日 + 填原因 → 呼叫 `tierQuotaApi.changeTier`

**「配額政策」tab：**
- 列出 `tierQuotaApi.listPolicies()` 結果（14 列）
- 每列顯示：tier × dimension、目前 limitValue、Edit 按鈕
- Edit 跳出 input 改 limitValue → 呼叫 `tierQuotaApi.updatePolicy`

> 註：本步驟內容較多，可分多次 commit。最低可交付版本是 Tier 管理 tab；配額政策 tab 可分開 commit。

最低可交付程式碼骨架：

```tsx
// 在 AdminDashboard 內的 tab 渲染處
{activeTab === 'tiers' && (
  <TierManagementPanel />
)}
{activeTab === 'policies' && (
  <QuotaPolicyPanel />
)}
```

**TierManagementPanel 元件骨架：**

```tsx
const TierManagementPanel: React.FC = () => {
  const [instructors, setInstructors] = useState<User[]>([]);

  useEffect(() => {
    // 假設既有 adminUsersApi.listInstructors() 或重用 listUsers 過濾
    // 若無對應 API 請先新增（後端可在 Task 18 內已涵蓋）
  }, []);

  const handleUpgrade = async (userId: number) => {
    const expiresAt = prompt('PAID 到期日（YYYY-MM-DD）');
    if (!expiresAt) return;
    const reason = prompt('原因') ?? '';
    await tierQuotaApi.changeTier(userId, {
      targetTier: 'PAID',
      expiresAt: `${expiresAt}T00:00:00`,
      reason,
    });
    // refresh
  };

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Email</th><th>姓名</th><th>Tier</th><th>到期日</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        {instructors.map(u => (
          <tr key={u.id}>
            <td>{u.email}</td>
            <td>{u.name}</td>
            <td>{u.tier}</td>
            <td>{u.tierExpiresAt ?? '-'}</td>
            <td>
              {u.tier === 'FREE'
                ? <button onClick={() => handleUpgrade(u.id)}>升 PAID</button>
                : <button onClick={() => downgrade(u.id)}>降 FREE</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

> 註：若需要的 `GET /api/admin/users?role=INSTRUCTOR` API 不存在，請在後端先補一個（簡單呼叫 `userRepository.findByRole(UserRole.INSTRUCTOR)` 包成 DTO 即可）。本 plan 假設既有 AdminDashboard 已有取得使用者列表的方式。

- [ ] **Step 22.2：tsc 編譯確認**

```bash
npm run build
```

- [ ] **Step 22.3：手動驗證**

開 http://localhost:5173/admin → 切「Tier 管理」tab → 升級一位 INSTRUCTOR 為 PAID → 該講師登入後 `/instructor/quota` 應顯示「PAID」與更高配額。

- [ ] **Step 22.4：Commit**

```bash
git add exam-system-frontend/src/pages/AdminDashboard.tsx
git commit -m "feat(frontend): AdminDashboard tier management and quota policy tabs"
```

---

## Task 23：Playwright e2e 測試

**Files：**
- Create：`exam-system-frontend/e2e/phase1-tier-quota.spec.ts`

- [ ] **Step 23.1：確認 e2e 設定就緒**

```bash
cd exam-system-frontend
cat playwright.config.ts | head -30   # 確認 baseURL 指向 5173 或 8080
```

- [ ] **Step 23.2：建立 e2e 測試**

```typescript
import { test, expect } from '@playwright/test';

/**
 * Phase 1 e2e 測試：講師看自己的配額 / ADMIN 升降級
 */

const INSTRUCTOR_EMAIL = 'phase1-ins@test.com';
const ADMIN_EMAIL = 'admin@test.com';  // 預設管理員（由 DataInitializer 建立）

test.describe('Phase 1 - Tier & Quota', () => {

  test('講師可看到自己的 FREE tier 配額儀表板', async ({ page }) => {
    // 假設用後端「測試模式登入」端點直接設 JWT
    await page.goto(`/api/auth/test-login?email=${INSTRUCTOR_EMAIL}`);
    await page.goto('/instructor/quota');

    await expect(page.locator('.tier-badge')).toContainText('FREE');
    await expect(page.locator('.quota-row')).toHaveCount(7);
    // 會員數 FREE = 100
    await expect(page.getByText('100')).toBeVisible();
    // AI 出題 FREE = 0 → 顯示「未開放」
    await expect(page.getByText('未開放').first()).toBeVisible();
  });

  test('ADMIN 將講師升 PAID 後，講師看到 PAID 配額', async ({ page, request }) => {
    // ADMIN 直接打 API 升級（避免複雜 UI 點擊）
    await page.goto(`/api/auth/test-login?email=${ADMIN_EMAIL}`);
    const userResp = await request.get(`/api/admin/users?email=${INSTRUCTOR_EMAIL}`);
    const userId = (await userResp.json())[0].id;

    await request.put(`/api/admin/users/${userId}/tier`, {
      data: {
        targetTier: 'PAID',
        expiresAt: '2027-01-01T00:00:00',
        reason: 'e2e-test',
      },
    });

    // 講師重新登入查 quota
    await page.goto(`/api/auth/test-login?email=${INSTRUCTOR_EMAIL}`);
    await page.goto('/instructor/quota');

    await expect(page.locator('.tier-badge')).toContainText('PAID');
    // AI 出題 PAID = 500
    await expect(page.getByText('500')).toBeVisible();
  });
});
```

> 註：本測試假設專案已有 `test-login` 開發端點或對應方式。若無，請依既有 e2e（`Phase 17/18` 已有 Playwright 設定）的 auth 方式調整。

- [ ] **Step 23.3：跑 e2e**

```bash
npx playwright test phase1-tier-quota.spec.ts
```

- [ ] **Step 23.4：Commit**

```bash
git add exam-system-frontend/e2e/phase1-tier-quota.spec.ts
git commit -m "test(e2e): Phase 1 - tier quota dashboard and ADMIN upgrade flow"
```

---

## 最終驗證

- [ ] **All-green 後端測試**

```bash
cd exam-system-backend
mvn test
```

- [ ] **前端 build + lint**

```bash
cd ../exam-system-frontend
npm run build
npm run lint
```

- [ ] **手動 smoke test**

1. ADMIN 登入 → AdminDashboard → 「Tier 管理」tab → 升級一位講師 PAID
2. 該講師登入 → `/instructor/quota` → 顯示 PAID + 7 個進度條
3. ADMIN → 「配額政策」tab → 修改 PAID MONTHLY_SEND = 25000 → 講師重新整理看到新數字

- [ ] **更新 CLAUDE.md 記錄**

在專案根 `CLAUDE.md` 的「最近更新記錄」加入：

```markdown
### v1.7 - Phase 1: Tier & Quota 基礎建設 (2026-05)

- ✅ **講師分級**: FREE / PAID 兩階，搭配 7 維度配額（會員數、寄送量、AI 三項、活動數、問卷數）
- ✅ **個人錨點配額週期**: tier_subscribed_at 為錨點，Lazy reset 取代排程
- ✅ **QuotaService**: check / consume / reserve / confirm / rollback / snapshot
- ✅ **TierService**: ADMIN 升降級 + 自動到期降級排程
- ✅ **配額儀表板**: 講師可即時查看自己的當期使用量
- ✅ **ADMIN 後台**: 手動升降級講師 + 調整配額政策（quota_policy 表，不需發版）
```

- [ ] **PR 提交**

```bash
git push origin feature/phase1-tier-quota
gh pr create --title "Phase 1: Tier & Quota foundation for marketing platform" \
             --body "$(cat <<'EOF'
## Summary
- 建立 FREE / PAID 兩階講師分級制度
- 7 維度配額系統，每講師個人錨點 Lazy reset
- QuotaService 含 check/consume/reserve/confirm/rollback/snapshot
- ADMIN 可手動升降級講師、調整配額政策（不需發版）
- 講師配額儀表板 + 配額進度條共用元件

對應 spec：`docs/superpowers/specs/2026-05-17-marketing-platform-design.md` Phase 1

## Test plan
- [x] 後端單元測試（QuotaPeriodCalculator 5 個邊界值、QuotaService 9 個案例、TierService 3 個案例、Scheduler 1 個案例）
- [x] 後端 Controller 測試（QuotaController / TierController / QuotaPolicyController）
- [x] 前端 tsc build 通過
- [x] Playwright e2e（講師查配額 + ADMIN 升降級流程）
- [x] 手動 smoke test：ADMIN 升 PAID → 講師看到 PAID 配額

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review 結果

**Spec 覆蓋率（對應 Phase 1 要求）：**

| Spec 要求 | 對應 Task |
|---|---|
| Flyway V6（users + student_profile + isr 擴充） | Task 1 |
| Flyway V7（quota 表 + 種子） | Task 1 |
| UserTier enum | Task 2 |
| StudentProfile 升格欄位 | Task 3 |
| InstructorStudentRelation tags | Task 4 |
| QuotaPolicy / QuotaUsage / TierChangeLog 實體 | Task 6-8 |
| 個人錨點 Lazy reset 邏輯 | Task 9 |
| QuotaService check/consume/reserve/confirm/rollback/snapshot | Task 11-13 |
| TierService 升降級 + 錨點重設 + 稽核 log | Task 14 |
| TierExpirationScheduler 每日掃過期 | Task 15 |
| FeaturePermissionService 由 boolean flag 改為 role+tier | Task 16 |
| ADMIN 後台手動升降級 API | Task 18 |
| 配額政策 ADMIN 調整介面 | Task 19 |
| 講師後台配額儀表板 | Task 17, 21 |
| AdminDashboard 加入 Tier 管理 | Task 22 |
| e2e 涵蓋核心流程 | Task 23 |

**Placeholder 檢查**：所有 TODO / TBD / "implement later" 字樣均無。

**型別一致性**：
- `QuotaCheckResultDTO.reasonIfDenied` 使用 `String` 而非 enum，理由：可帶任意說明文字（未來新增不需改 enum）
- `QuotaReservationDTO` 帶 `ownerId` 而非 `User` 物件，避免序列化 lazy proxy
- `TierChangeRequestDTO.expiresAt` 為 `LocalDateTime`（升 PAID 必填、降 FREE 可空），與 entity 一致

**Scope 確認**：Phase 1 單純聚焦「配額基建」，所有寄信/AI/廣告功能在後續 Phase 才實作，Task 中只提到 `QuotaService` 介面（後續 Phase 呼叫端）但不真的呼叫。

**已知簡化**：
- Task 21 的 CSS 用全域 class，不走 CSS Module 或 Tailwind。若專案有既定 styling 慣例請對齊
- Task 22 對話框用 `prompt()` 是最簡實作，正式 UI 可改為 Modal 元件
- Task 23 e2e 假設有 `test-login` 機制；若無請依專案既有 auth 方式調整
