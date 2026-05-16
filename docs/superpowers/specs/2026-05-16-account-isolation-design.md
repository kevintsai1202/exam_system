# 講師帳號隔離 + 跨測驗學員關係 - 設計規格

**日期**: 2026-05-16
**狀態**: Design (尚未實作)
**作者**: kevintsai1202@gmail.com (透過 Claude Code brainstorming)

---

## 1. 背景與動機

目前系統所有講師登入後共用同一組題目資料：
- [Exam.java](../../../exam-system-backend/src/main/java/com/exam/system/entity/Exam.java) 沒有 `owner_id` 欄位
- [ExamRepository.java](../../../exam-system-backend/src/main/java/com/exam/system/repository/ExamRepository.java) 的 `findAll()` 不過濾擁有者
- [Student.java](../../../exam-system-backend/src/main/java/com/exam/system/entity/Student.java) 是 per-Exam 一次性紀錄，缺乏跨測驗的穩定學員身份

**用戶需求**:
1. 講師只能看到自己的題組
2. 學員做過講師的題目才會在講師的關係中，之後可發問卷或宣傳
3. 管理員可看到所有老師的題目以及所有學員

---

## 2. 設計決策摘要

| # | 決策 | 選項 |
|---|------|------|
| Q1 | 學員跨測驗身份識別 | **B**：`StudentProfile`（跨測驗主檔）+ `Student`（per-exam 紀錄）+ `InstructorStudentRelation`（關係表） |
| Q2 | 既有 Exam 既有資料 owner 指派 | **B**：全部指派給 `MIGRATION_DEFAULT_OWNER_EMAIL` 指定的講師 |
| - | 資料遷移工具 | **Flyway**（baseline-on-migrate）；非 CommandLineRunner |
| Q3 | admin 對其他講師資料權限 | **A**：admin 全權（可看/可改/可刪） |
| Q4 | 本次 scope | **A**：只做資料隔離 + 遷移，「我的學員 UI」留待下輪 |

---

## 3. 架構總覽

### 3.1 三層隔離模型

```
┌─────────────────────────────────────────────────────────────┐
│  User (講師)                                                 │
│  ┌──────────────┐                                            │
│  │ id, email    │                                            │
│  │ role=INSTRUCTOR                                          │
│  └──────┬───────┘                                            │
│         │ owner_id  (新增)                                    │
│         ▼                                                     │
│  ┌──────────────┐    1:N    ┌──────────────┐                │
│  │ Exam         │──────────▶│ Question     │                │
│  │ + owner_id   │           │              │                │
│  └──────┬───────┘           └──────────────┘                │
│         │ 1:N                                                 │
│         ▼                                                     │
│  ┌──────────────┐                                            │
│  │ Student      │   per-exam 參賽紀錄                        │
│  │ + profile_id │   (新增外鍵)                                │
│  └──────┬───────┘                                            │
│         │ N:1                                                 │
│         ▼                                                     │
│  ┌──────────────────┐      M:N      ┌────────────────────┐  │
│  │ StudentProfile   │◀─────────────▶│ InstructorStudent  │  │
│  │ (新增)           │  (透過此表)    │ Relation (新增)     │  │
│  │ email (unique)   │               │ instructor_id +    │  │
│  │ name, googleId   │               │ profile_id         │  │
│  └──────────────────┘               └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

下游 (自動繼承隔離)：
  Survey ──exam_id──▶ Exam ──owner_id──▶ User
  EmailCampaign ──exam_id──▶ Exam ──owner_id──▶ User
```

### 3.2 強制隔離三層防線

1. **Entity 層**：`Exam.owner_id` 為 NOT NULL FK 到 `users.id`
2. **Service 層**：`OwnershipGuard` 集中所有「擁有者或 admin」檢查
3. **Repository 層**：新增 owner-filter 變種方法（保留原方法供系統內部 / admin 使用）

### 3.3 三類使用者的視角

| 角色 | Exam/Question | Survey/Email | Student/Profile |
|------|---|---|---|
| INSTRUCTOR | 只看 `owner_id = self.id` 的 | 只看自己 Exam 下的 | 透過 `InstructorStudentRelation` 看自己的學員 |
| ADMIN | 全部 | 全部 | 全部 |
| STUDENT | 用 accessCode 查單筆（不變） | 收到問卷連結時可填（不變） | 自己的 Profile |

### 3.4 學員關係建立時機

```
學員透過 accessCode 加入測驗 (POST /api/students/join)
  ↓
1. 用 email lookup StudentProfile，沒有就 create
2. 建立 Student record (per-exam)，profile_id 指向上面找到/建好的 Profile
3. 從 Exam.owner_id 拿到講師 ID
4. UPSERT InstructorStudentRelation (instructor_id, profile_id)
   - 新關係：first_interaction_at = now, exam_count = 1
   - 已存在：exam_count++, last_interaction_at = now
```

---

## 4. 資料模型

### 4.1 新增 Entity：`StudentProfile`

```java
@Entity
@Table(name = "student_profile", indexes = {
    @Index(name = "idx_student_profile_email", columnList = "email", unique = true),
    @Index(name = "idx_student_profile_google_id", columnList = "googleId")
})
public class StudentProfile {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;

    /** 穩定識別 key：lowercase email */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /** 學員顯示名稱（首次加入時記錄；之後加入會更新為最新） */
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

    @PrePersist void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.email = this.email.toLowerCase().trim();
    }
    @PreUpdate void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
```

**設計決定**：
- `surveyData`、`location`、`occupation` 不搬到 Profile，繼續留在 `Student`（每場測驗各自記錄當下回答）
- Profile 只放「身份基本資料 + 識別 key」

### 4.2 新增 Entity：`InstructorStudentRelation`

```java
@Entity
@Table(name = "instructor_student_relation",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_instructor_profile",
        columnNames = {"instructor_id", "profile_id"}),
    indexes = {
        @Index(name = "idx_isr_instructor", columnList = "instructor_id"),
        @Index(name = "idx_isr_profile",    columnList = "profile_id")
    })
public class InstructorStudentRelation {
    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @ManyToOne(fetch = LAZY) @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @ManyToOne(fetch = LAZY) @JoinColumn(name = "profile_id", nullable = false)
    private StudentProfile profile;

    @Column(nullable = false, updatable = false)
    private LocalDateTime firstInteractionAt;

    @Column(nullable = false)
    private LocalDateTime lastInteractionAt;

    @Builder.Default
    @Column(nullable = false)
    private Integer examCount = 0;
}
```

### 4.3 既有 Entity 改動

**`Exam` 加 `owner`**：

```java
@ManyToOne(fetch = LAZY)
@JoinColumn(name = "owner_id", nullable = false)
private User owner;
```
- 不加 `cascade = REMOVE`：避免 admin 不小心刪講師時把所有測驗一起刪

**`Student` 加 `profile`**：

```java
@ManyToOne(fetch = LAZY)
@JoinColumn(name = "profile_id", nullable = false)
private StudentProfile profile;
```
- 保留 `Student` 既有所有欄位（`email`、`name`、`googleId` 等冗存）：歷史快照 + 最小破壞

---

## 5. 後端授權機制

### 5.1 `CurrentUserProvider`（新增）

從 `SecurityContextHolder` 取得當前登入使用者。JWT filter 已將 `User` 物件放入 `auth.getPrincipal()`（[JwtAuthenticationFilter.java:55-58](../../../exam-system-backend/src/main/java/com/exam/system/config/JwtAuthenticationFilter.java#L55-L58)）。

```java
@Service
public class CurrentUserProvider {
    public User requireCurrentUser() { ... }
    public Long requireCurrentUserId() { ... }
    public Optional<User> getCurrentUser() { ... }
}
```

### 5.2 `OwnershipGuard`（新增）

集中所有「擁有者或 admin」檢查，模式參考既有 [FeaturePermissionService.java](../../../exam-system-backend/src/main/java/com/exam/system/service/FeaturePermissionService.java)。

```java
@Service
public class OwnershipGuard {
    public boolean isOwnerOrAdmin(Exam exam);
    public void assertOwnerOrAdmin(Exam exam);
    public void assertOwnerOrAdmin(Survey survey);       // 透過 survey.getExam()
    public void assertOwnerOrAdmin(EmailCampaign c);     // 透過 c.getExam()
}
```

下游 `Survey`、`EmailCampaign` 不存自己的 `owner_id`，透過 `Exam.owner` 推導。

### 5.3 Repository 層

`ExamRepository` 新增 owner-filter 變種，**保留**既有方法（admin / 系統內部用）：

```java
List<Exam> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
Optional<Exam> findByIdAndOwnerId(Long id, Long ownerId);
boolean existsByIdAndOwnerId(Long id, Long ownerId);

@Query("SELECT e FROM Exam e LEFT JOIN FETCH e.questions WHERE e.id = :id AND e.owner.id = :ownerId")
Optional<Exam> findByIdWithQuestionsAndOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);
```

### 5.4 Service 層改動要點

**`ExamService`**：
- `createExam`：自動指派 `owner = currentUserProvider.requireCurrentUser()`
- `getAllExams`：依角色分流（ADMIN → findAll；INSTRUCTOR → findByOwnerId）
- 其餘所有特定 exam 操作（get/update/delete/start/end/duplicate/export/reorder）：`ownershipGuard.assertOwnerOrAdmin(exam)`

**`SurveyService` / `EmailService`**：同上模式

**`StudentService.joinExam`**（關鍵）：
```java
@Transactional
public StudentDTO joinExam(JoinRequestDTO req) {
    Exam exam = examRepository.findByAccessCode(req.getAccessCode()).orElseThrow(...);

    // (1) UPSERT StudentProfile (email lowercase)
    String email = req.getEmail().toLowerCase().trim();
    StudentProfile profile = studentProfileRepository.findByEmail(email)
        .map(p -> updateProfileLatestData(p, req))
        .orElseGet(() -> createNewProfile(email, req));

    // (2) 建立 Student per-exam 紀錄
    Student student = Student.builder()
        .exam(exam).profile(profile)
        .email(profile.getEmail()).name(profile.getName())
        ...build();
    studentRepository.save(student);

    // (3) UPSERT InstructorStudentRelation
    User instructor = exam.getOwner();
    instructorStudentRelationRepository
        .findByInstructorIdAndProfileId(instructor.getId(), profile.getId())
        .ifPresentOrElse(
            rel -> { rel.setLastInteractionAt(now); rel.setExamCount(rel.getExamCount()+1); },
            () -> instructorStudentRelationRepository.save(... examCount=1 ...));

    return toDto(student);
}
```

### 5.5 例外：學員預覽 endpoint 不做 ownership

`GET /api/exams/preview?accessCode=XXX`（[ExamController.java:77-82](../../../exam-system-backend/src/main/java/com/exam/system/controller/ExamController.java#L77-L82)）是學員加入流程，匿名訪問必須可行，**不**套 `OwnershipGuard`。

### 5.6 SecurityConfig 補強

JWT filter 已注入 `ROLE_INSTRUCTOR` / `ROLE_ADMIN`，可選擇性加方法級保護：
```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/exams/**").hasAnyRole("INSTRUCTOR", "ADMIN")
    .requestMatchers("/api/students/join", "/api/exams/preview").permitAll()
);
```
但資料隔離仍以 `OwnershipGuard` 在 Service 層為主防線。

### 5.7 新增 API endpoint

```
PUT /api/exams/{examId}/transfer-owner    Body: { newOwnerId: number }
    Authorization: ADMIN only
    Effect: exam.setOwner(newOwner)

GET /api/instructor/students
    Authorization: INSTRUCTOR or ADMIN
    Response: 當前登入講師的所有 StudentProfile（含 examCount / firstInteractionAt / lastInteractionAt）
    (此次前端不消費，但暴露以便後續「我的學員 UI」)

GET /api/admin/users?role=INSTRUCTOR
    Authorization: ADMIN only
    Response: 講師列表，供「轉讓擁有權」UI 使用
```

---

## 6. Flyway Migration 計畫

### 6.1 引入 Flyway

**pom.xml 新增依賴**：
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

### 6.2 可控制開關（本地預設啟用，Zeabur 預設禁用）

**application.yml**：
```yaml
spring:
  flyway:
    enabled: ${SPRING_FLYWAY_ENABLED:true}      # 本地預設啟用
    baseline-on-migrate: true
    baseline-version: 1
    locations: classpath:db/migration
    placeholders:
      migrationDefaultOwnerEmail: ${MIGRATION_DEFAULT_OWNER_EMAIL:}
  jpa:
    hibernate:
      ddl-auto: none                             # 完全交給 Flyway
```

**application-docker.yml**：
```yaml
spring:
  flyway:
    enabled: ${SPRING_FLYWAY_ENABLED:false}     # Zeabur 預設禁用，手動觸發
```

### 6.3 Migration 檔案

```
exam-system-backend/src/main/resources/db/migration/
├── V2__account_isolation_schema.sql           # 新表 + 欄位（nullable）
├── V3__account_isolation_data_backfill.sql    # 資料遷移（指派 owner / 建 profile / 推 relation）
└── V4__account_isolation_constraints.sql      # 加 NOT NULL
```

V1 由 `baseline-on-migrate=true` 自動標記為現狀（不執行）。

### 6.4 V2 內容（DDL）

```sql
CREATE TABLE student_profile (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    google_id VARCHAR(100),
    google_email VARCHAR(100),
    is_gmail_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_icon VARCHAR(20),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT uq_student_profile_email UNIQUE (email)
);
CREATE INDEX idx_student_profile_google_id ON student_profile(google_id);

CREATE TABLE instructor_student_relation (
    id BIGSERIAL PRIMARY KEY,
    instructor_id BIGINT NOT NULL REFERENCES users(id),
    profile_id BIGINT NOT NULL REFERENCES student_profile(id),
    first_interaction_at TIMESTAMP NOT NULL,
    last_interaction_at TIMESTAMP NOT NULL,
    exam_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_instructor_profile UNIQUE (instructor_id, profile_id)
);
CREATE INDEX idx_isr_instructor ON instructor_student_relation(instructor_id);
CREATE INDEX idx_isr_profile    ON instructor_student_relation(profile_id);

ALTER TABLE exam    ADD COLUMN owner_id   BIGINT REFERENCES users(id);
ALTER TABLE student ADD COLUMN profile_id BIGINT REFERENCES student_profile(id);

CREATE INDEX idx_exam_owner_id      ON exam(owner_id);
CREATE INDEX idx_student_profile_id ON student(profile_id);
```

### 6.5 V3 內容（資料遷移核心）

```sql
DO $$
DECLARE
    default_owner_email TEXT := LOWER(TRIM('${migrationDefaultOwnerEmail}'));
    default_owner_id    BIGINT;
BEGIN
    IF default_owner_email IS NULL OR default_owner_email = '' THEN
        RAISE EXCEPTION '環境變數 MIGRATION_DEFAULT_OWNER_EMAIL 未設定，遷移中止';
    END IF;

    SELECT id INTO default_owner_id FROM users WHERE LOWER(email) = default_owner_email;
    IF default_owner_id IS NULL THEN
        RAISE EXCEPTION '找不到 email = % 的 user，請先建立此講師帳號', default_owner_email;
    END IF;

    -- Step 1: 既有 Exam 全部指派 owner
    UPDATE exam SET owner_id = default_owner_id WHERE owner_id IS NULL;
END $$;

-- Step 2: 為每個 unique email 建立 StudentProfile
INSERT INTO student_profile (email, name, google_id, google_email, is_gmail_verified, avatar_icon, created_at, updated_at)
SELECT
    COALESCE(NULLIF(LOWER(TRIM(latest.email)), ''), 'legacy-' || latest.id || '@no-email.local') AS email,
    latest.name, latest.google_id, latest.google_email,
    COALESCE(latest.is_gmail_verified, FALSE), latest.avatar_icon, NOW(), NOW()
FROM (
    SELECT DISTINCT ON (COALESCE(NULLIF(LOWER(TRIM(email)), ''), 'legacy-' || id || '@no-email.local'))
           id, email, name, google_id, google_email, is_gmail_verified, avatar_icon
      FROM student
     ORDER BY COALESCE(NULLIF(LOWER(TRIM(email)), ''), 'legacy-' || id || '@no-email.local'), id DESC
) latest
ON CONFLICT (email) DO NOTHING;

-- Step 3: 回填 student.profile_id
UPDATE student s
   SET profile_id = p.id
  FROM student_profile p
 WHERE p.email = COALESCE(NULLIF(LOWER(TRIM(s.email)), ''), 'legacy-' || s.id || '@no-email.local')
   AND s.profile_id IS NULL;

-- Step 4: 推導 InstructorStudentRelation
INSERT INTO instructor_student_relation
       (instructor_id, profile_id, first_interaction_at, last_interaction_at, exam_count)
SELECT e.owner_id, s.profile_id, MIN(s.joined_at), MAX(s.joined_at), COUNT(DISTINCT s.exam_id)
  FROM student s JOIN exam e ON e.id = s.exam_id
 WHERE s.profile_id IS NOT NULL AND e.owner_id IS NOT NULL
 GROUP BY e.owner_id, s.profile_id
ON CONFLICT (instructor_id, profile_id) DO NOTHING;
```

### 6.6 V4 內容（約束）

```sql
ALTER TABLE exam    ALTER COLUMN owner_id   SET NOT NULL;
ALTER TABLE student ALTER COLUMN profile_id SET NOT NULL;
```

### 6.7 Zeabur 部署觸發 SOP

```
1. 確認 Zeabur 已建立目標講師 user（admin@example.com 已預設，或先 register 一個）
2. Zeabur 環境變數設定：
   - MIGRATION_DEFAULT_OWNER_EMAIL=teacher@xxx.com
   - SPRING_FLYWAY_ENABLED=true
3. Restart container
4. Spring Boot 啟動 → Flyway baseline → V2 → V3 → V4 → app ready
5. 看 log 確認成功
6. 把 SPRING_FLYWAY_ENABLED 改回 false（或刪除環境變數）避免下次部署又跑
```

---

## 7. 前端與 WebSocket 影響

### 7.1 前端改動

| 檔案 | 改動 |
|---|---|
| [InstructorDashboard.tsx](../../../exam-system-frontend/src/pages/InstructorDashboard.tsx) | ✅ 零改動（API 自動隔離） |
| [SurveyCreator.tsx](../../../exam-system-frontend/src/pages/SurveyCreator.tsx) / [EmailComposer.tsx](../../../exam-system-frontend/src/pages/EmailComposer.tsx) | ✅ 零改動 |
| [StudentJoin.tsx](../../../exam-system-frontend/src/pages/StudentJoin.tsx) / [StudentExam.tsx](../../../exam-system-frontend/src/pages/StudentExam.tsx) | ✅ 零改動 |
| [AdminDashboard.tsx](../../../exam-system-frontend/src/pages/AdminDashboard.tsx) | 🆕 新增「轉讓擁有權」按鈕 + modal |
| [apiService.ts](../../../exam-system-frontend/src/services/apiService.ts) | 🔄 新增 `transferOwner` 方法、403 全域攔截導回 dashboard |

### 7.2 WebSocket 影響：幾乎為零

訂閱主題以 `examId` 為粒度（`/topic/exam/{examId}/...`），天然 per-exam scoping。隔離後：
- 學員訂閱（透過 accessCode 拿 examId）→ 不變
- 講師訂閱（getAllExams 已隔離）→ 不變
- 觸發廣播的後端 API → 加 `OwnershipGuard.assertOwnerOrAdmin(exam)`

---

## 8. 驗收標準

### 講師隔離
- 講師 A 登入 → `/api/exams` 只回傳 A 擁有的測驗
- 講師 A 打 `GET /api/exams/{B 的 examId}` → 403 `EXAM_FORBIDDEN`
- 講師 A 試圖 PUT/DELETE B 的測驗 → 403
- 講師 A 試圖列出 B 測驗的學員 → 403
- 講師 A 試圖建立關聯到 B 測驗的 Survey/EmailCampaign → 403

### 管理員權限
- ADMIN 登入 → `/api/exams` 回傳所有講師的所有測驗
- ADMIN 可修改/刪除任何測驗、問卷、EmailCampaign
- ADMIN 可透過 `PUT /api/exams/{examId}/transfer-owner` 轉讓擁有權

### 學員關係建立
- 學員 X 加入講師 A 的測驗 → `student_profile` 新增（若 email 未存在）
- 同上 → `instructor_student_relation (A.id, X.profile_id)` 新增，examCount=1
- 學員 X 再加入講師 A 的另一場 → relation 不重複建立，examCount=2，lastInteractionAt 更新
- 學員 X 加入講師 B 的測驗 → 新增 (B.id, X.profile_id)，不影響 A 的關係

### Migration 行為
- 本地啟動（`SPRING_FLYWAY_ENABLED` 預設 true）→ 自動跑 V2/V3/V4
- Zeabur 啟動（`SPRING_FLYWAY_ENABLED` 預設 false）→ 不執行
- V3 跑時 `MIGRATION_DEFAULT_OWNER_EMAIL` 未設 → 拋 EXCEPTION
- V3 跑時指定 email 找不到對應 user → 拋 EXCEPTION
- 既有 Exam 全部填上 owner_id；既有 Student 全部填上 profile_id；對應 relation 推導完成

---

## 9. 測試策略

### 9.1 後端測試

| 類別 | 範圍 | 工具 |
|---|---|---|
| 單元 | `OwnershipGuard`、`CurrentUserProvider` | JUnit + Mockito |
| Service 隔離 | `ExamService.getAllExams()` 依角色分流 | `@SpringBootTest` |
| Student UPSERT | 同 email 多次加入 → Profile 不重複，Relation examCount++ | `@SpringBootTest` |
| Migration | 乾淨 DB + 有舊資料 DB 各跑一次 | Testcontainers PostgreSQL |
| API 層整合 | 講師 A JWT 打 B 的測驗 → 403 | `@SpringBootTest` + MockMvc |

### 9.2 前端手動驗證

- 兩個瀏覽器分頁分別登入 teacher1 / teacher2，確認 dashboard 互不可見
- admin 登入確認看全部 + 轉讓按鈕可用
- 用 admin 轉讓測驗 A 給 teacher2，雙方 dashboard 同步更新
- 多個學員 email（含重複參賽）測試 relation 累積正確

### 9.3 Playwright e2e 腳本

目錄結構：
```
e2e/
├── playwright.config.ts
├── fixtures/
│   ├── test-users.ts          # 測試帳號定義
│   └── auth-helper.ts          # 登入/登出共用函式
└── tests/
    ├── instructor-isolation.spec.ts        # 講師隔離
    ├── student-join-relation.spec.ts       # 學員加入→關係建立
    ├── admin-cross-instructor.spec.ts      # admin 全權 + 轉讓
    └── access-forbidden-redirect.spec.ts   # 403 全域攔截
```

設定要點：
- 獨立 PostgreSQL 測試資料庫（docker-compose 起 / 不動 dev DB）
- 每個 spec 前重設 DB（Flyway clean + migrate）
- 預先 seed 測試帳號（`DataInitializer` 偵測 `app.profile=e2e` 自動建 teacher1/teacher2/admin）
- 暫不整合 CI，先確保本地可跑

root `package.json`：
```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug"
  }
}
```

---

## 10. Out of Scope（明確不做）

| 項目 | 不做的原因 |
|---|---|
| 「我的學員」UI 列表頁 | Q4 選 A，留待下輪 |
| 批次發問卷給「我的學員」 | 同上 |
| 多講師共同擁有同一個測驗（co-ownership） | 沒有需求 |
| 修改 audit log | Q3 選 A 全權；未來合規需求再加 |
| 學員強制登入 / Email verification | 維持匿名加入，不增加學員門檻 |
| 講師端「轉讓擁有權」歷史紀錄 | 簡單覆蓋即可 |
| 刪除講師時 cascade 處理 | admin UI 沒有刪講師按鈕 |
| Email 為空的舊 Student 手動合併 Profile UI | 邊緣案例，用 placeholder profile 過渡 |
| e2e CI pipeline 整合 | 先確保本地可跑 |
| 視覺回歸測試（screenshot diff） | 不在本次範圍 |
| 跨瀏覽器 e2e | 先只跑 Chromium |
| Hibernate ddl-auto: none 後的 schema drift CI 檢查 | 未來改善 |

---

## 11. 主要風險與緩解

| 風險 | 緩解 |
|---|---|
| 本地 dev 忘記設 `MIGRATION_DEFAULT_OWNER_EMAIL` 啟動 → V3 失敗 | application.yml 不給預設值，failfast 並印清楚錯誤訊息 |
| Zeabur 不小心開了 Flyway → production schema 被改 | `application-docker.yml` 預設 `SPRING_FLYWAY_ENABLED=false`，且要兩個環境變數同時對才能 migrate |
| 同 email 但實際是不同人 → 合併成同一 Profile | 用 lowercase email 為 key 是業界做法；極少數衝突 admin 可後續手動拆 |
| 既有資料只有 admin@example.com，沒有真的「INSTRUCTOR」帳號 | Migration 前必須先在 Zeabur 建立 `MIGRATION_DEFAULT_OWNER_EMAIL` 指定的 user，否則 V3 fail-fast |
| `ddl-auto: none` 後若 entity 跟 DB 不同步 → query 時才發現 | 未來新欄位一律走 V5/V6 migration；可在 CI 加 schema diff 檢查（OOS） |

---

## 12. 已知技術債 / 未來改善方向

1. **學員 email verification**：未來大規模發問卷/宣傳前，建議加 email 驗證流程
2. **「我的學員」UI**：本次只暴露 endpoint，UI 留待下輪
3. **Audit log**：admin 修改別人測驗時無紀錄；合規需求再加
4. **Migration 失敗 alert**：未來可整合監控（如 Sentry）
5. **schema drift CI 檢查**：未來可加 Liquibase / schemacrawler 比對

---

## 13. 變更影響檔案清單（預估）

### 後端 - 新增
- `entity/StudentProfile.java`
- `entity/InstructorStudentRelation.java`
- `repository/StudentProfileRepository.java`
- `repository/InstructorStudentRelationRepository.java`
- `service/CurrentUserProvider.java`
- `service/OwnershipGuard.java`
- `controller/InstructorStudentController.java`（GET /api/instructor/students）
- `controller/AdminUserController.java`（GET /api/admin/users）
- `dto/StudentProfileDTO.java`
- `dto/InstructorStudentRelationDTO.java`
- `dto/TransferOwnerRequestDTO.java`
- `src/main/resources/db/migration/V2__account_isolation_schema.sql`
- `src/main/resources/db/migration/V3__account_isolation_data_backfill.sql`
- `src/main/resources/db/migration/V4__account_isolation_constraints.sql`

### 後端 - 修改
- `entity/Exam.java`（加 owner）
- `entity/Student.java`（加 profile）
- `repository/ExamRepository.java`（加 owner-filter 變種）
- `repository/StudentRepository.java`（加 profile-filter 變種，若需要）
- `service/ExamService.java`（所有方法加 ownership 檢查）
- `service/SurveyService.java`（同上）
- `service/EmailService.java`（同上）
- `service/StudentService.java`（joinExam 加 UPSERT Profile + Relation）
- `controller/ExamController.java`（加 transfer-owner endpoint）
- `config/SecurityConfig.java`（補方法級保護）
- `config/JwtAuthenticationFilter.java`（保留不動，已正確）
- `application.yml` / `application-docker.yml`（Flyway 設定）
- `pom.xml`（加 flyway 依賴）

### 前端 - 修改
- `pages/AdminDashboard.tsx`（加轉讓 UI）
- `services/apiService.ts`（加 transferOwner、403 攔截）

### e2e - 新增
- `e2e/playwright.config.ts`
- `e2e/fixtures/test-users.ts`
- `e2e/fixtures/auth-helper.ts`
- `e2e/tests/instructor-isolation.spec.ts`
- `e2e/tests/student-join-relation.spec.ts`
- `e2e/tests/admin-cross-instructor.spec.ts`
- `e2e/tests/access-forbidden-redirect.spec.ts`
- `package.json`（root, e2e scripts）

---

## 14. 實作順序建議（概略）

1. 引入 Flyway：
   - `pom.xml` 加 `flyway-core` + `flyway-database-postgresql` 依賴
   - `application.yml` 設定 `spring.flyway.*` 區段（含 `baseline-on-migrate: true`、placeholders）
   - **將 `spring.jpa.hibernate.ddl-auto` 從 `update` 改為 `none`**（避免 Hibernate 跟 Flyway 打架）
   - 啟動 Spring Boot 確認 Flyway 偵測無 history → 自動 baseline V1（標記現狀，不執行任何 SQL）
   - 確認應用功能正常（schema 不變、現有 entity 仍能 query）
2. 寫 V2 schema → 確認本地能跑（owner_id / profile_id 暫 nullable）
3. 新增 Entity（StudentProfile / InstructorStudentRelation）+ Repository
4. 寫 V3 data backfill → 在本地有舊資料的 DB 上跑通
5. 寫 V4 約束 → 確認 NOT NULL 加得上
6. 實作 `CurrentUserProvider` + `OwnershipGuard`
7. 改造 `ExamService` 加 ownership 檢查（單元 + 整合測試）
8. 改造 `SurveyService` / `EmailService`
9. 改造 `StudentService.joinExam` 加 UPSERT 邏輯
10. 新增 `transfer-owner` endpoint + `GET /api/instructor/students`
11. 前端 AdminDashboard 加轉讓 UI + 403 攔截
12. 寫 Playwright e2e 4 支 spec
13. 全 e2e 跑通 → 確認本地驗收
14. 文件更新（CLAUDE.md / api.md）

詳細的實作計畫由 `writing-plans` skill 後續產出。
