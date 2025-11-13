# CLAUDE.md

此文件提供 Claude Code (claude.ai/code) 在此 repository 中工作時的指引。

## 專案概述

**即時互動測驗統計系統** - 一個講師與學員即時互動的測驗平台，學員透過 QR Code 加入，講師控制題目流程，系統即時統計並展示答題結果。

## 專案架構

此專案採用**前後端分離架構**：

### 後端 (exam-system-backend/)
- **技術**: Spring Boot 3.5.7 + Java 21 + JPA + WebSocket (STOMP)
- **資料庫**: H2 Database (File-based)
- **Port**: 8080
- **關鍵路徑**: `src/main/java/com/exam/system/`

### 前端 (exam-system-frontend/)
- **技術**: React 19 + TypeScript + Vite
- **Port**: 5173 (開發模式)
- **狀態管理**: Zustand
- **即時通訊**: STOMP over WebSocket
- **圖表**: Recharts
- **QR Code**: qrcode.react

## 環境設定

### Java 設定
本專案**必須使用 Java 21**。

**驗證 Java 版本**:
```bash
java -version  # 應顯示 openjdk version "21"
```

**如果需要設定 JAVA_HOME (Windows PowerShell)**:
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"
```

**如果需要設定 JAVA_HOME (Linux/macOS)**:
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

**注意**: 在 Linux 環境下，如果系統已安裝 Java 21，通常不需要手動設定 JAVA_HOME。

## 常用指令

### 後端開發 (exam-system-backend/)

**編譯專案**:
```bash
cd exam-system-backend

# Linux/macOS (如果 Java 21 已在 PATH 中)
mvn clean compile

# 或指定 JAVA_HOME
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 mvn clean compile

# Windows PowerShell (如需指定 Java 路徑)
$env:JAVA_HOME = "D:\java\jdk-21"
mvn clean compile
```

**執行應用程式**:
```bash
# 簡單啟動
mvn spring-boot:run

# Windows 指定 Java 路徑
$env:JAVA_HOME = "D:\java\jdk-21"
mvn spring-boot:run

# Linux/macOS 指定 Java 路徑
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 mvn spring-boot:run
```

**執行測試**:
```bash
# 執行所有測試
mvn test

# 執行單一測試類別
mvn test -Dtest=ExamServiceTest

# 執行特定測試方法
mvn test -Dtest=ExamServiceTest#testCreateExam
```

**打包 JAR**:
```bash
mvn clean package -DskipTests
```

**訪問 H2 資料庫控制台**:
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/examdb`
- Username: `sa`
- Password: (空白)

### 前端開發 (exam-system-frontend/)

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置
npm run build

# Lint
npm run lint
```

## 前端頁面結構

### 講師端頁面
- `InstructorDashboard.tsx` - 講師主控台（測驗列表、啟動測驗）
- `ExamCreator.tsx` - 測驗建立器（題目編輯、調查欄位設定）
- `ExamMonitor.tsx` - 測驗監控頁面（學員列表、即時統計、圖表切換）
- `SurveyFieldManager.tsx` - 調查欄位管理頁面
- `Leaderboard.tsx` - 排行榜展示

### 學員端頁面
- `StudentJoin.tsx` - 學員加入頁面（掃碼/輸入 accessCode、填寫調查欄位）
- `StudentExam.tsx` - 學員答題頁面（倒數計時、選項選擇、即時反饋）

### 關鍵元件
- WebSocket Service (`websocketService.ts`) - STOMP 連線管理
- API Service (`apiService.ts`) - HTTP API 封裝
- Zustand Store - 全域狀態管理

## 核心業務流程

### 1. 測驗生命週期狀態機
```
CREATED → STARTED → ENDED
         ↓
    (開始題目循環)
```

### 2. 關鍵流程
1. **講師建立測驗**: 設定題目、選項、答案、圖表類型、調查欄位
2. **啟動測驗**: 生成 QR Code 和 accessCode
3. **學員加入**: 掃碼加入、填寫調查欄位、建立 sessionId (UUID)
4. **答題循環**:
   - 講師開始題目 → WebSocket 推送題目給所有學員
   - 學員作答 → 系統驗證時間、重複性
   - 時間到 → 計算統計（含調查欄位維度）→ 廣播結果
5. **結束測驗**: 計算排行榜並推送

### 3. WebSocket 通訊架構
- **連線**: `ws://localhost:8080/ws` (STOMP 協定)
- **訂閱主題格式**: `/topic/exam/{examId}/{event}`
- **重要主題**:
  - `status` - 測驗狀態更新
  - `students` - 學員加入通知
  - `question` - 題目推送
  - `statistics/question/{questionId}` - 單題統計
  - `leaderboard` - 排行榜

### 4. 答案驗證機制
系統在接收學員答案時會進行三重驗證：
1. 測驗狀態檢查 (必須為 STARTED)
2. 答題時間檢查 (未超時)
3. 重複作答檢查 (一題一答)

## 核心功能特色

### 1. 調查欄位系統 (Survey Field System)
- **講師端**: 建立測驗時可選擇啟用調查欄位（職業、年齡層、經驗年資、技術堆疊等）
- **學員端**: 加入測驗時填寫調查欄位資訊
- **統計功能**: 監視頁面可按調查欄位維度統計答題結果
- **彈性配置**: 支援必填/選填、顯示順序設定
- **預設欄位**: occupation, age_range, experience, tech_stack

### 2. 即時監控與統計
- **學員列表**: 即時顯示學員加入狀態、答對題數、總分
- **圖表切換**: 監視頁面支援長條圖/圓餅圖切換
- **累積統計**: 當前題目頁籤下顯示累積答題統計
- **倒數計時**: 講師頁面顯示題目倒數計時器

### 3. QR Code 功能
- **自動生成**: 測驗啟動時生成唯一 6 位數 accessCode
- **QR Code 展示**: 編碼測驗加入 URL
- **複製功能**: 一鍵複製 QR Code URL，方便分享
- **動態調整**: 支援 HTTP/HTTPS 環境自動適配

### 4. 使用者體驗優化
- **錯誤訊息**: 改善學生加入已結束測驗的錯誤提示
- **防止重複推送**: 修正單題測驗重複推送問題
- **響應式設計**: 手機版（學員）、電腦版（講師）優化

## 資料模型關係

```
Exam (測驗)
 ├─ 1:N → Question (題目)
 │         └─ 1:N → QuestionOption (選項)
 ├─ 1:N → ExamSurveyFieldConfig (測驗調查欄位配置)
 │         └─ N:1 → SurveyField (調查欄位定義)
 └─ 1:N → Student (學員)
            ├─ 1:N → Answer (答案)
            └─ 1:N → StudentSurveyData (學員調查資料)
```

**核心實體**:
- `Exam`: 包含 accessCode (唯一)、status (狀態機)、currentQuestionIndex
- `Question`: 包含 correctOptionId、圖表類型設定 (singleStatChartType, cumulativeChartType)
- `Student`: 包含 sessionId (UUID)、totalScore (累積分數)、correctCount (答對題數)
- `Answer`: 記錄 selectedOptionId、isCorrect、answeredAt
- `SurveyField`: 調查欄位定義（fieldKey, fieldName, options）
- `ExamSurveyFieldConfig`: 測驗調查欄位配置（isRequired, displayOrder）
- `StudentSurveyData`: 學員調查資料（fieldKey, selectedValue）

## 專案特性

### 並發處理
- 使用 `@Transactional` 確保資料一致性
- 支援 300 個同時連線學員
- WebSocket 廣播機制實現即時推送

### Session 管理
- 每個學員擁有獨立 UUID sessionId
- 前端將 sessionId 儲存於 localStorage
- 後端透過 sessionId 追蹤學員狀態

### QR Code 生成
- 使用 ZXing 函式庫
- accessCode 唯一性驗證
- Base64 編碼傳輸

## 測試策略

### 後端測試檔案位置
- `src/test/java/com/exam/system/service/*Test.java` - Service 層測試
- `src/test/java/com/exam/system/repository/*Test.java` - Repository 層測試
- `src/test/java/com/exam/system/controller/*Test.java` - 整合測試

### 測試配置
- 測試環境配置: `src/test/resources/application-test.yml`
- 測試資料建構器: `TestDataBuilder.java`

## 開發注意事項

### 後端
1. **Java 版本**: 務必使用 Java 21，使用 Java 8 會導致編譯失敗
2. **資料庫檔案**: H2 資料庫儲存於 `./data/examdb.mv.db`
3. **WebSocket CORS**: 預設允許 `http://localhost:5173` 和 `http://localhost:3000`
4. **答案推送**: 開始題目時不推送正確答案，僅在統計時顯示

### 前端
1. **API Base URL**: 確保後端服務在 port 8080 運行
2. **WebSocket 重連**: 需實作斷線重連機制
3. **響應式設計**: 優先設計手機版（學員端），電腦版（講師端）
4. **圖表渲染**: 使用 Recharts，需節流處理避免過度渲染

### 程式碼規範
- **註解語言**: 函式級別註解使用繁體中文
- **變數命名**: 關鍵變數需加上中文註解
- **單一任務原則**: 避免過度開發
- **TypeScript**: 前端嚴格使用 TypeScript，避免 any 類型
- **錯誤處理**: 前後端都需妥善處理錯誤並回傳有意義的訊息

## Claude Code 工作指引

### 開發工作流程
1. **理解需求**: 先閱讀相關文件（spec.md, api.md）了解功能規格
2. **探索程式碼**: 使用 Grep/Glob 工具搜尋相關程式碼
3. **小步驟迭代**: 一次修改一個功能，立即測試
4. **保持同步**: 前後端改動需同步（DTO、API、WebSocket 訊息）
5. **測試驗證**: 修改後執行相關測試確保無破壞性變更

### 常見開發場景

#### 新增 API 端點
1. 後端: Controller → Service → Repository
2. 前端: apiService.ts 新增方法
3. 更新: api.md 文件

#### 新增 WebSocket 事件
1. 後端: WebSocket Handler → 推送邏輯
2. 前端: websocketService.ts 訂閱處理
3. 確保: 訊息格式前後端一致

#### 新增資料欄位
1. 後端: Entity → DTO → Repository
2. 資料庫: 需考慮遷移（H2 自動建表）
3. 前端: types.ts 更新介面定義
4. 更新: spec.md 的 ER 圖

#### 新增調查欄位
1. 後端: 在 data.sql 新增 INSERT INTO survey_field
2. 前端: ExamCreator.tsx 和 StudentJoin.tsx 自動載入
3. 統計: StatisticsService 支援新欄位維度

### 測試策略
- **後端**: JUnit 測試（Service 層、Repository 層）
- **前端**: 手動測試 + Chrome DevTools MCP 自動化
- **整合**: 啟動前後端，使用瀏覽器完整流程測試
- **WebSocket**: 開多個瀏覽器分頁模擬多學員

### 除錯技巧
- **後端日誌**: 查看 Spring Boot Console 輸出
- **H2 Console**: http://localhost:8080/h2-console 檢查資料
- **瀏覽器 DevTools**: Network 查看 API、Console 查看 WebSocket
- **React DevTools**: 檢查元件狀態和 props

## 重要文件

- `spec.md` - 完整系統規格文件（含架構圖、流程圖、ER 圖）
- `api.md` - RESTful API 完整規格（包含調查欄位 API）
- `requirement.md` - 需求說明
- `DEPLOYMENT.md` - 前後端整合部署指南（★ 部署必讀）
- `DOCKER_DEPLOYMENT.md` - Docker 部署指南
- `CODE_REVIEW_REPORT.md` - 程式碼審查報告
- `exam-system-backend/README.md` - 後端專案說明
- `exam-system-backend/COMPILE_GUIDE.md` - 編譯指引
- `exam-system-backend/RUN_GUIDE.md` - 執行指引
- `exam-system-frontend/CLAUDE.md` - 前端開發指引

## MCP 整合

本專案已整合 **Chrome DevTools MCP Server**，用於自動化瀏覽器測試。

**配置檔案**: `.mcp.json`

**功能**:
- 自動化測試學員加入流程
- 測試答題功能
- 驗證即時統計更新
- 截圖與快照功能

**使用範例**:
```bash
# MCP 伺服器會在需要時自動啟動
# Claude Code 可直接使用 mcp__chrome-devtools__* 工具
```

## 故障排除

### "invalid flag: --release" 錯誤
**原因**: Maven 使用了 Java 8 而非 Java 21
**解決**: 執行前設定 JAVA_HOME 環境變數

### "Port 8080 already in use"
**原因**: Port 被佔用
**解決**: 關閉佔用程序或修改 `application.yml` 中的 `server.port`

### WebSocket 連線失敗
**原因**: CORS 設定或後端未啟動
**解決**: 檢查 `WebSocketConfig.java` CORS 設定，確認後端運行狀態

## 部署模式

此專案支援兩種運行模式：

### 開發模式（前後端分離）
```bash
# 終端 1: 啟動後端（port 8080）
cd exam-system-backend
mvn spring-boot:run

# 終端 2: 啟動前端（port 5173）
cd exam-system-frontend
npm run dev
```

### 生產模式（整合部署）
```bash
# 1. Build 前端到後端 resources/static/
cd exam-system-frontend
npm run build

# 2. 打包 JAR（包含前端）
cd ../exam-system-backend
mvn clean package -DskipTests

# 3. 執行（單一應用）
java -jar target/exam-system-backend-*.jar

# 訪問: http://localhost:8080
```

詳細說明請參考 `DEPLOYMENT.md`。

## API 快速參考

### 測驗管理
- `POST /api/exams` - 建立測驗（可包含 surveyFieldConfigs）
- `POST /api/exams/{id}/start` - 啟動測驗（生成 QR Code）
- `POST /api/exams/{id}/questions/{index}/start` - 開始題目
- `POST /api/exams/{id}/end` - 結束測驗
- `GET /api/exams/{id}` - 取得測驗詳情

### 學員管理
- `POST /api/students/join` - 學員加入（需 accessCode，可包含 surveyData）
- `GET /api/students/exam/{examId}` - 取得測驗學員列表（含答對題數、總分）

### 答案與統計
- `POST /api/answers` - 提交答案
- `GET /api/statistics/exams/{examId}/questions/{questionId}` - 取得題目統計
- `GET /api/statistics/exams/{examId}/questions/{questionId}/by-survey-field/{fieldKey}` - 按調查欄位統計
- `GET /api/statistics/exams/{examId}/cumulative/by-survey-field/{fieldKey}` - 累積統計（按調查欄位）
- `GET /api/statistics/exams/{examId}/leaderboard` - 取得排行榜

### 調查欄位管理
- `GET /api/survey-fields` - 取得所有調查欄位定義
- `GET /api/survey-fields/{fieldKey}` - 取得特定調查欄位
- `POST /api/survey-fields` - 建立調查欄位（管理功能）
- `PUT /api/survey-fields/{fieldKey}` - 更新調查欄位（管理功能）

## 最近更新記錄

### v1.5 - 調查欄位與統計增強 (2024-2025)
- ✅ **調查欄位系統**: 完整實作可配置的調查欄位（occupation, age_range, experience, tech_stack）
- ✅ **調查欄位統計**: 支援按調查欄位維度統計單題與累積答題結果
- ✅ **學員列表增強**: 顯示學員答對題數和總分
- ✅ **圖表切換功能**: 監視頁面支援長條圖/圓餅圖切換
- ✅ **倒數計時器**: 講師頁面顯示題目倒數計時
- ✅ **QR Code URL 複製**: 一鍵複製 QR Code URL 功能
- ✅ **UX 優化**: 改善已結束測驗的錯誤訊息，修正單題測驗推送問題
- ✅ **累積統計優化**: 將累積統計移至當前題目頁籤下

### 技術債務與改進方向
- 考慮將 H2 資料庫替換為 PostgreSQL（生產環境）
- WebSocket 斷線重連機制可進一步強化
- 前端單元測試覆蓋率需提升
- 考慮加入效能監控（答題延遲、WebSocket 訊息延遲）
