# 行銷平台擴展設計（問卷 / 電子報 / 廣告宣傳 / AI）

**日期**：2026-05-17
**作者**：Kevin Tsai（與 Claude Code 協作）
**狀態**：設計確認中（待用戶 review）
**前置版本**：v1.6 帳號隔離與多講師管理

---

## 1. 目標與範圍

在既有「即時互動測驗統計系統」基礎上，擴充為一個面向講師的行銷與內容平台，涵蓋：

1. **會員池隔離**：講師只看自己的會員，跨講師資料完全隔離
2. **問卷調查系統**：可獨立於測驗發送的問卷
3. **電子報系統**：講師對訂閱者定期發送內容
4. **廣告宣傳系統**：含機會漏斗、分眾、成效報表
5. **註冊同意機制**：每位會員可選擇是否接收電子報/廣告
6. **退訂機制**：信件一鍵連結 + 回信關鍵字雙通道
7. **講師分級**：FREE / PAID 兩階配額制
8. **AI 功能**：AI 出題、AI 數據分析、AI 寫電子報（PAID 限定）

### 1.1 非目標（本 spec 不涵蓋）

- 金流串接（綠界 / Stripe）— 由 Phase 7 獨立 spec 處理，MVP 期由 ADMIN 手動升降級
- A/B Test 引擎（後期）
- 多語系（後期）
- 排程信報訂閱（後期）

---

## 2. 6 個決策依據（澄清結論）

| 決策 | 結論 |
|---|---|
| **會員池定義** | 開放（4 來源：EXAM / SURVEY / NEWSLETTER / IMPORT）+ 同意聲明 |
| **電子報 vs 廣告** | 統一引擎 + 兩種 UI 入口（category 區分） |
| **付費分級** | FREE / PAID 兩階，多維度配額，皆有上限 |
| **AI 策略** | 混合（LLM API + WebResearcher）+ 分功能配額（題/次/封） |
| **同意與退訂** | 首次加入勾選 + 獨立訂閱頁 / 按講師+類別退訂 / 一鍵退訂連結 |
| **重構策略** | 捨棄重來舊 Survey/EmailCampaign / 金流另案 / 採演進式架構（升格 StudentProfile） |

---

## 3. 架構模組分層

採演進式架構，在既有 `auth` / `exam` 模組旁新增 4 個新 package + 1 個重建：

```
com.exam.system/
├── auth/         ─ 既有，僅新增 tier 欄位
├── exam/         ─ 既有測驗系統，不動
├── member/       ─ 新：會員主體、同意書、退訂偏好         [子系統 A]
├── tier/         ─ 新：講師分級與配額追蹤                 [子系統 B]
├── marketing/    ─ 新：統一 Campaign 引擎 + 漏斗          [子系統 C+D]
├── ai/           ─ 新：AI 抽象層與工作流                  [子系統 E]
└── survey/       ─ 重建（刪除既有骨架）                   [子系統 C]
```

### 3.1 跨模組互動原則

- **單向依賴**：`marketing` 依賴 `member` / `tier` / `ai`；反向不允許
- **配額守門員**：所有外發動作（寄信、AI、新增會員）必先過 `QuotaService.consume()`，超額擋下
- **擁有權守衛**：每筆 Member / Campaign / Survey 都有 `owner_id`，沿用 v1.6 `OwnershipGuard`
- **非同步任務**：寄信、AI、爬蟲走 Spring `@Async` + `TaskExecutor`
- **事件追蹤**：Open / Click / Unsubscribe 走 Webhook 接收（Mailgun Event Webhook）寫入 `delivery_event`

---

## 4. 資料模型

### 4.1 既有實體擴充（Flyway V6）

**`users`**：
- 新增 `tier ENUM('FREE','PAID') DEFAULT 'FREE'`
- 新增 `tier_subscribed_at TIMESTAMP`（配額週期錨點）
- 新增 `tier_expires_at TIMESTAMP NULL`
- 移除 `survey_management_enabled` / `email_management_enabled`（改由 tier 控制）

**`student_profile`**（升格為會員主體，表名保留避免大遷移）：
- 新增 `acquisition_source ENUM('EXAM','SURVEY','NEWSLETTER','IMPORT','API')`
- 新增 `acquired_at TIMESTAMP`、`acquired_via_id BIGINT`
- 新增 `first_consent_at TIMESTAMP`、`consent_version VARCHAR(20)`
- 新增 `notes TEXT`（講師備註）

**`instructor_student_relation`**：
- 新增 `tags JSON`
- 新增 `last_interaction_at TIMESTAMP`

### 4.2 新增實體 — Member 隱私（子系統 A）

| 表 | 用途 |
|---|---|
| `consent_record` | 同意書歷史紀錄（append-only） |
| `unsubscribe_preference` | 退訂偏好 `(member × instructor × category)` UNIQUE |
| `unsubscribe_token` | 一鍵退訂連結 HMAC token（30 天過期） |
| `inbound_email_log` | 回信解析紀錄（webhook 寫入） |
| `member_import_batch` | CSV 匯入批次（含同意聲明證明） |
| `member_bounce_blacklist` | 連續退信 3 次永久黑名單 |

### 4.3 新增實體 — Tier & Quota（子系統 B）

| 表 | 用途 |
|---|---|
| `quota_policy` | 分級配額定義（ADMIN 可調，不發版） |
| `quota_usage` | 用量計數（按個人月度週期累加） |
| `tier_change_log` | 升降級稽核 log |

### 4.4 新增實體 — Campaign 引擎（子系統 C+D）

| 表 | 用途 |
|---|---|
| `campaign` | 統一活動（取代舊 EmailCampaign） |
| `campaign_audience` | QUEUED 時點凍結的目標名單快照 |
| `delivery` | 逐封郵件投遞紀錄 |
| `delivery_event` | 事件流水（SENT/DELIVERED/OPENED/CLICKED/BOUNCED/UNSUBSCRIBED/SPAM/FAILED） |
| `campaign_link` | 原 URL ↔ 短碼（點擊追蹤） |
| `campaign_conversion` | 轉換歸因（點擊後 7 天內達成目標） |
| `campaign_daily_stats` | 每日預聚合（給 L2/L3 報表用） |

### 4.5 新增實體 — AI（子系統 E）

| 表 | 用途 |
|---|---|
| `ai_job` | AI 任務追蹤（含三階段狀態） |
| `ai_usage_record` | 扣配額稽核 |

### 4.6 新增實體 — Survey 重建

刪除舊 `survey/survey_question/...` 重建為：

| 表 | 變更 |
|---|---|
| `survey` | `exam_id` 改可空、新增 `owner_id`、`public_slug` |
| `survey_question` / `survey_option` | 結構同舊版 |
| `survey_response` | 新增 `member_id` 與 `ip_address` |

---

## 5. 子系統 A：會員池與同意/退訂

### 5.1 四種會員取得來源

| 來源 | 入口 | 同意取得方式 |
|---|---|---|
| **EXAM** | StudentJoin 頁 | 填名/Email 時兩個勾選框 |
| **SURVEY** | `survey/{public_slug}` 頁 | 填問卷時兩個勾選框 |
| **NEWSLETTER** | `subscribe/{instructor_slug}` 頁 | 明確「我同意接收電子報」必勾 + Double opt-in 確認信 |
| **IMPORT** | ADMIN/INSTRUCTOR 後台 | 講師勾選「我已取得本名單合法授權」+ 簽名欄；批次保留 2 年 |
| **API** | 未來開放給講師站外整合的 REST API | 講師須提供 API key + 每筆會員需明確帶 `consent` payload；本 spec 不展開詳細介面，僅保留 enum 欄位 |

### 5.2 同意書版控

- 同意書內容存於 Git：`config/consent-versions/v1.0.md`
- 每筆 `consent_record` 記錄 `consent_version`
- 版本升級時，講師後台顯示「需重新取得會員同意」
- 撤回同意不刪 record，而是新寫一筆 `unsubscribe_preference`

### 5.3 退訂雙通道

**通道一：信件內一鍵連結**
- 每封信帶 `List-Unsubscribe` header（RFC 8058）
- 信尾連結 `https://app/u/{token}`
- token：HMAC-SHA256 簽章、30 天過期
- 點擊 → 顯示「按類別退訂」偏好頁

**通道二：回信關鍵字**
- 寄信 `Reply-To: unsub+{token}@app.tld`（plus addressing）
- 收信走 Mailgun Routes → POST 到 `/webhook/inbound-email`
- 解析：subject + body 前 200 字找關鍵字 `UNSUBSCRIBE` / `退訂` / `STOP` / `不要再寄`
- 命中 → 寫 `unsubscribe_preference`；未命中 → 寫 `inbound_email_log` 待人工
- 自動回覆確認信

### 5.4 寄送守衛

`CampaignService.send()` 每封信發出前：
```
if (unsubscribePreferenceRepo.exists(member, owner, category)) {
    delivery.markStatus(SKIPPED_UNSUBSCRIBED);
    continue;
}
```

「跳過退訂」算進統計，講師可看出名單衰退率。

### 5.5 ANNOUNCEMENT 不可退訂

系統通知（測驗即將開始、問卷已關閉等）強制必收，不受 `unsubscribe_preference` 影響。

---

## 6. 子系統 B：Tier & Quota

### 6.1 初始配額（種子於 V6）

| 維度 | FREE | PAID | reset |
|---|---:|---:|---|
| `MEMBER_COUNT` | 100 | 5,000 | NEVER |
| `MONTHLY_SEND` | 200 | 20,000 | MONTHLY |
| `AI_QUESTION_GEN` | 0 | 500 | MONTHLY |
| `AI_DATA_ANALYSIS` | 0 | 50 | MONTHLY |
| `AI_NEWSLETTER_GEN` | 0 | 10 | MONTHLY |
| `ACTIVE_CAMPAIGNS` | 0 | 10 | NEVER |
| `SURVEY_COUNT` | 3 | 50 | NEVER |

### 6.2 個人化配額週期（關鍵設計）

**不採用全平台統一 1 號重置**，改為每講師依 `tier_subscribed_at` 為錨點：

```
monthsElapsed = ChronoUnit.MONTHS.between(anchorDate, today)
currentPeriodStart = anchorDate.plusMonths(monthsElapsed)
currentPeriodEnd   = anchorDate.plusMonths(monthsElapsed + 1)
```

**錨點設定規則**：
- 帳號註冊 → anchor = `createdAt`
- ADMIN 升 PAID → anchor = `NOW()`（重新錨定）
- PAID 續訂 → anchor = `NOW()`
- PAID 自動降 FREE → anchor = `NOW()`

**月底日處理**：採 last-day clamping（Java `LocalDate.plusMonths` 內建）

### 6.3 Lazy Reset（無排程）

- `QuotaService` 進入時計算當前 `periodStartDate`
- `quota_usage(owner, dim, periodStartDate)` 不存在則新增 row
- 不刪舊月，保留 12 個月供趨勢圖
- 唯一保留的排程：「PAID 到期自動降級」（每日凌晨）

### 6.4 QuotaService API

```java
interface QuotaService {
    QuotaCheckResult check(User owner, QuotaDimension dim, int amount);

    @Transactional
    void consume(User owner, QuotaDimension dim, int amount, String reason);

    // 預扣 → 確認 / 退還（非同步任務用）
    QuotaReservation reserve(User owner, QuotaDimension dim, int amount);
    void confirm(QuotaReservation reservation);
    void rollback(QuotaReservation reservation);

    QuotaSnapshot snapshot(User owner);
}
```

### 6.5 超額處理

- API 回 HTTP 429 + 結構化 `errorCode: QUOTA_EXCEEDED`
- 前端顯示「升級或等待 N 天重置」連結
- 降級時超 FREE 上限的會員資料：**保留可看不可發送**（合規要求不擅自刪除）

---

## 7. 子系統 C+D：統一 Campaign 引擎

### 7.1 狀態機

```
DRAFT → SCHEDULED → QUEUED → SENDING → SENT
                             ↓
                          PAUSED / FAILED
```

- DRAFT / SCHEDULED 可刪
- QUEUED 後不可刪（保留統計）
- 講師可「歸檔」隱藏舊 campaign

### 7.2 Audience Filter

QUEUED 時點凍結受眾到 `campaign_audience` 表。`audience_filter` JSON 範例：

```json
{
  "sources": ["EXAM", "SURVEY"],
  "tags": { "include": ["VIP"], "exclude": ["TEST"] },
  "examIds": [123, 456],
  "surveyIds": [],
  "acquiredAfter": "2026-01-01",
  "consentRequired": "PROMOTION",
  "excludeUnsubscribed": true
}
```

### 7.3 Newsletter vs Promotion UI 分流

**Newsletter（簡潔流程）**：
- 「期次」概念（第 N 期週報）
- 預設受眾 = 已訂閱電子報全部會員
- 一鍵複製上期範本

**Promotion（漏斗流程）**：
- 受眾建構器（規則化分眾）
- CTA 連結自動短碼化
- 啟動後即時看開信/點擊/轉換
- A/B Test（後期，欄位先保留）

### 7.4 非同步發送 Pipeline

```
[1] CampaignService.start()
[2] quotaService.reserve(MONTHLY_SEND, audienceSize)
[3] snapshot 受眾 → campaign_audience
[4] status = QUEUED → 丟給 TaskExecutor
[5] 逐筆 send：
    a) 雙重檢查 unsubscribe_preference
    b) 渲染個人化 HTML
    c) EmailSenderAdapter.send()
    d) 失敗重試 3 次
    e) sleep 50ms 節流
[6] 完成 → SENT，quotaService.confirm(actualSent)
```

### 7.5 開信/點擊/退信追蹤

- **開信**：1×1 透明 GIF（`/t/o/{delivery_token}.gif`）
- **點擊**：原 `<a href>` 改寫為 `/t/c/{short_code}?d={token}` → 302 重定向
- **退信/Spam**：訂閱 Mailgun Event Webhook，bounce 3 次加入 `member_bounce_blacklist`

### 7.6 EmailSenderAdapter 抽象

```java
interface EmailSenderAdapter {
    SendResult send(EmailMessage msg);
    void handleEventWebhook(Map<String,Object> payload);
}
```

實作：`MailgunSenderAdapter`（預設）、`SendGridSenderAdapter`、`SmtpSenderAdapter`（本地測試）

切換靠 `app.email.provider=mailgun`。

---

## 8. 子系統 E：AI 整合層

### 8.1 兩個抽象介面

```java
interface LlmProvider {
    LlmResponse complete(LlmRequest request);
    <T> T completeStructured(LlmRequest request, Class<T> schema);
    Flux<String> stream(LlmRequest request);
}

interface WebResearcher {
    List<WebArticle> research(String topic, int maxResults);
    WebArticle fetch(String url);
}
```

**預設實作**：
- LLM：`ClaudeLlmProvider`（fallback：OpenAI）
- WebResearcher：`FirecrawlResearcher`（fallback：`McpResearcher` 走 context7/microsoft-docs MCP）

### 8.2 三階段管線（重點）

每個 AI 動作都走：

```
階段 1 GENERATE （扣用戶配額）
階段 2 AI_REVIEW （內部成本，不扣配額）
       ├─ score ≥ 7 → AWAITING_HUMAN_REVIEW
       └─ score < 7 → 自動重試 1 次 → 失敗讓講師決定
階段 3 HUMAN_REVIEW （前端面板，採用前不入庫）
```

### 8.3 三個 Workflow

| Workflow | 配額單位 | 重點 |
|---|---|---|
| `QuestionGenWorkflow` | 題數 | 結構化輸出 JSON，審查時獨立驗證正確答案 |
| `DataAnalysisWorkflow` | 1 次 | 預處理數據避免 token 爆，審查防數字幻覺 |
| `NewsletterGenWorkflow` | 1 封 | 先 research 再 LLM 摘要，串流回前端，引用來源附信尾 |

### 8.4 AiJob 狀態機

```
PENDING → RUNNING → AI_GENERATED → AI_REVIEWING
                                     ↓
              ┌──────────────────────┼──────────────────────┐
              ↓                      ↓                      ↓
       REVIEW_PASSED          REVIEW_RETRY           REVIEW_FAILED
              ↓                      ↓                      ↓
       AWAITING_HUMAN          (回到 RUNNING)            (講師決定)
              ↓
       APPROVED / DISCARDED
```

### 8.5 安全與成本控制

- `max_tokens=4000`
- 同一 owner 同時最多 3 個 AiJob
- LlmRequest user input > 2000 字拒絕
- AiJob input/output 保留 90 天
- 金鑰走 `${OPENAI_API_KEY}` env var
- Provider 連續 10 次失敗自動切備援

### 8.6 Prompt 管理

- 所有 prompt 寫成檔案：`resources/prompts/{workflow}-{version}.md`
- 支援 Mustache 變數
- 不在 DB 存 prompt（防注入）
- 單元測試用 fake `LlmProvider` 驗證 prompt 結構

### 8.7 前端 UI 共通

- 共用 `<AiActionPanel>` 元件：輸入表單 + 配額提示 + 進度條 + AI 審查報告 + 結果
- WebSocket 推送 `/topic/ai-job/{jobId}`
- 結果區三按鈕：採用 / 編輯後採用 / 丟棄 / 重新生成

---

## 9. 成效報表與漏斗

### 9.1 三個層級

| 層級 | 路徑 | 內容 |
|---|---|---|
| L1 單一活動 | `/marketing/campaigns/{id}/report` | 開信/點擊/退訂/退信/轉換、時間軸、CTA 排名 |
| L2 跨活動比較 | `/marketing/reports/compare?ids=...` | 併排對比，找最佳時段/標題模式 |
| L3 機會漏斗總覽 | `/marketing/funnel` | 5 階段漏斗 + 來源 → 活動 → 轉換 sankey |

### 9.2 五階段漏斗

```
① 觸及 Reach    （實送）
② 開信 Open     （透明 GIF 觸發）
③ 點擊 Click    （CTA 連結觸發）
④ 行動 Action   （填問卷 / 註冊測驗）
⑤ 轉換 Convert  （講師自定義目標）
```

### 9.3 轉換目標定義

```json
{
  "type": "EXAM_JOIN | SURVEY_RESPONSE | LINK_CLICK | CUSTOM_PIXEL",
  "targetExamId": 123,
  "attributionWindowDays": 7
}
```

點擊後 7 天內達成目標 → 寫 `campaign_conversion`。

### 9.4 來源 × 績效交叉表

提供「acquisition_source × 開信率/點擊率/轉換率/退訂率」表格，揭示名單品質差異（如 IMPORT 通常退訂率較高）。

### 9.5 後端策略

- **L1**：即時查 `delivery` + `delivery_event`
- **L2 / L3**：採 `campaign_daily_stats` 預聚合表，每日凌晨彙整
- 當日數據走即時，預聚合不含今日
- 歸因延遲：預聚合每日重算最近 7 天

### 9.6 匯出

- CSV：MVP 必做（逐筆 delivery）
- PDF：後期（OpenPDF / wkhtmltopdf）

---

## 10. 實作 Phase 切分

| Phase | 內容 | 交付指標 |
|---|---|---|
| **Phase 1** | Tier + Quota + StudentProfile 升格 | 講師能看 tier 與配額儀表板 |
| **Phase 2** | 同意/退訂 + EmailSenderAdapter（不含 inbound） | 發信都有合規退訂機制 |
| **Phase 3** | Campaign 引擎 + Newsletter UI | 講師可寄電子報，看基本統計 |
| **Phase 4** | Promotion + 漏斗報表 | 講師可做廣告 + 完整成效報表 |
| **Phase 5** | 公開訂閱頁 + CSV 匯入 + 入站郵件 | 開放會員池完整，4 來源都能進入 |
| **Phase 6** | AI 整合（三 workflow + AI 審查） | PAID 講師可用 3 個 AI 功能 |
| Phase 7（後期） | 金流 / A/B Test / 排程信報 / i18n | （另案 spec） |

### 10.1 Phase 依賴

- Phase 1 → 所有後續（QuotaService 是橫切）
- Phase 2 → Phase 3（寄信前必過退訂檢查）
- Phase 3 → Phase 4（報表基於 delivery 表）
- Phase 5 ←→ Phase 3-4 平行
- Phase 6 → Phase 3（NewsletterGen 寫進 Campaign 草稿）

### 10.2 每 Phase 測試重點

- **P1**：QuotaService 並發 race、reserve/confirm/rollback 場景
- **P2**：退訂 token 驗簽、List-Unsubscribe 用真實 Gmail 驗證
- **P3**：非同步發送整合測試、webhook 解析
- **P4**：歸因邏輯邊界值、預聚合與即時查詢一致性
- **P5**：Double opt-in e2e、CSV 含特殊字元、inbound webhook 模擬
- **P6**：fake `LlmProvider`（不打真實 API）、AI 審查通過/失敗/重試三路徑

---

## 11. 風險與權衡

| 風險 | 緩解策略 |
|---|---|
| Mailgun vendor lock-in | `EmailSenderAdapter` 抽象，可切 SendGrid/SMTP |
| LLM 成本失控 | `max_tokens` 限制、同 owner 並發限 3、配額硬擋 |
| AI 幻覺污染主表 | 三階段管線 + 採用前不入庫 |
| 配額週期復雜（個人錨點） | Lazy reset 設計，無排程依賴；月底日採 clamping |
| 大量發送阻塞主 thread | `@Async` + `TaskExecutor`、節流 50ms |
| CSV 匯入法遵爭議 | 必填同意聲明簽名、批次保留 2 年備查 |
| iOS Mail Privacy Protection 影響開信率 | 開信率僅供趨勢，點擊率為主要 engagement 指標 |
| Phase 太多 implementation 壓力大 | 每 Phase 可獨立交付且 ship-able，不必一次做完 |

---

## 12. 後續步驟

1. **用戶 review 本 spec** → 修訂或確認
2. **commit 本 spec 到 Git**
3. **呼叫 `superpowers:writing-plans`** 為 Phase 1 建立詳細實作計劃（剩餘 Phase 在開始該階段時各自建計劃）

---

## 附錄 A：路由總表（新增）

### 公開（無需登入）

- `GET  /subscribe/{instructor_slug}` — 公開訂閱頁
- `POST /api/public/subscribe` — 提交訂閱（觸發 double opt-in）
- `GET  /confirm-subscribe/{token}` — Double opt-in 確認
- `GET  /u/{token}` — 一鍵退訂頁
- `POST /webhook/inbound-email` — Mailgun Routes 入站
- `POST /webhook/mailgun-events` — Mailgun Event Webhook
- `GET  /t/o/{delivery_token}.gif` — 開信追蹤像素
- `GET  /t/c/{short_code}?d={token}` — 點擊追蹤重定向
- `GET  /survey/{public_slug}` — 公開問卷填寫頁

### 講師（INSTRUCTOR）

- `GET  /api/members` — 會員列表（按擁有權過濾）
- `POST /api/members/import` — CSV 匯入
- `GET  /api/quota/snapshot` — 配額儀表板
- `POST /api/campaigns` — 建立活動
- `POST /api/campaigns/{id}/start` — 啟動
- `GET  /api/campaigns/{id}/report` — L1 報表
- `GET  /api/marketing/funnel` — L3 漏斗
- `POST /api/ai/jobs` — 觸發 AI 任務
- `GET  /api/ai/jobs/{id}` — 查 AI 任務狀態與結果
- `POST /api/ai/jobs/{id}/approve` — 採用
- `POST /api/ai/jobs/{id}/discard` — 丟棄

### 管理員（ADMIN）

- `PUT  /api/admin/users/{id}/tier` — 手動升降級
- `GET  /api/admin/quota-policies` — 配額政策管理
- `PUT  /api/admin/quota-policies/{id}` — 調整配額數字

---

## 附錄 B：與既有 v1.6 帳號隔離的相容性

本設計**完整沿用 v1.6 的兩個機制**：

1. **`OwnershipGuard`**：所有 `member` / `campaign` / `survey` / `ai_job` 都有 `owner_id`，沿用既有守衛邏輯（ADMIN 越過、INSTRUCTOR 限本人）
2. **`InstructorStudentRelation`**：仍是「講師 ↔ 會員」的核心關聯表，本設計擴充其 `tags` 與 `last_interaction_at` 欄位，未變動核心結構

`StudentProfile.email` 唯一性（v1.6 已確立）是「跨 exam 同一人」的天然定義，本設計直接複用作為 Member 主鍵，無需資料遷移。

---

## 附錄 C：對既有測驗流程的影響評估

| 既有流程 | 影響 | 處理 |
|---|---|---|
| 學員透過 QR Code 加入測驗 | StudentJoin 頁 UI 加同意勾選 | Phase 2 |
| Student 建立 | 同步建 ConsentRecord（若勾選） | Phase 2 |
| 即時答題 / 統計 | 完全不影響 | 無 |
| WebSocket 推送 | 完全不影響 | 無 |
| 既有 Survey / EmailCampaign 骨架 | 刪除重建 | Phase 3 第一個動作 |

無破壞性變更。既有測驗功能在 Phase 1 完成後即可繼續正常運作（配額對既有 INSTRUCTOR 預設給 FREE，但既有用法都在 FREE 額度內）。
