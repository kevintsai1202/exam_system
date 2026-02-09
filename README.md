# 即時互動測驗統計系統

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一個講師與學員即時互動的測驗平台，學員透過 QR Code 加入，講師控制題目流程，系統即時統計並展示答題結果。

![系統架構](https://img.shields.io/badge/Architecture-Frontend%20%2B%20Backend-blue)
![WebSocket](https://img.shields.io/badge/Real--time-WebSocket-brightgreen)
![Database](https://img.shields.io/badge/Database-H2-yellow)

---

## ✨ 功能特色

### 🎓 講師端
- ✅ **測驗管理**：建立、編輯、複製測驗
- ✅ **即時控制**：啟動測驗、控制題目流程、結束測驗
- ✅ **QR Code**：自動生成加入 QR Code 與 6 位數加入碼
- ✅ **即時監控**：查看學員加入狀態、答題進度
- ✅ **統計視覺化**：長條圖、圓餅圖即時展示答題統計
- ✅ **排行榜**：即時更新學員排名與分數

### 👨‍🎓 學員端
- ✅ **快速加入**：掃描 QR Code 或輸入加入碼
- ✅ **個人化**：選擇頭像、輸入姓名與 Email
- ✅ **即時作答**：倒數計時、即時提交答案
- ✅ **即時反饋**：答對/答錯立即顯示、累積分數
- ✅ **排行榜**：查看自己在班級中的排名

### 🔒 安全性改進
- ✅ **四重驗證**：測驗狀態、重複作答、答題時間、當前題目
- ✅ **並發控制**：accessCode 生成使用資料庫約束 + 重試機制
- ✅ **輸入驗證**：完整的 DTO 驗證註解（長度、格式、必填）
- ✅ **資料庫優化**：6 個關鍵索引、批次處理（batch_size: 20）

---

## 🛠️ 技術棧

### 後端 (Backend)
- **框架**: Spring Boot 3.2.0
- **語言**: Java 21
- **持久層**: JPA + Hibernate
- **資料庫**: H2 Database (File-based)
- **即時通訊**: WebSocket (STOMP)
- **建構工具**: Maven
- **QR Code**: ZXing 3.5.1
- **測試**: JUnit 5 + Mockito

### 前端 (Frontend)
- **框架**: React 18
- **語言**: TypeScript
- **建構工具**: Vite
- **狀態管理**: Zustand
- **圖表**: Recharts
- **即時通訊**: STOMP over WebSocket
- **樣式**: CSS Modules

---

## 📋 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                        講師端 (Instructor)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 測驗建立器   │  │  監控面板     │  │  統計展示     │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (STOMP)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Spring Boot Backend                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Controller│  │ Service  │  │Repository│  │WebSocket │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                        │                                     │
│                        ▼                                     │
│                  ┌──────────┐                               │
│                  │ H2 DB    │                               │
│                  └──────────┘                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (STOMP)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        學員端 (Student)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  掃碼加入    │  │   答題介面    │  │   排行榜      │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速開始

### 環境需求

- **Java**: 21 或以上
- **Node.js**: 16 或以上
- **Maven**: 3.6 或以上
- **作業系統**: Windows / macOS / Linux

### 安裝步驟

#### 1. 克隆專案

```bash
git clone https://github.com/kevintsai1202/exam_system.git
cd exam_system
```

#### 2. 後端設定與啟動

**Windows (PowerShell)**

```powershell
# 設定 Java 21 環境變數
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"

# 驗證 Java 版本
java -version  # 應顯示 openjdk version "21"

# 編譯並啟動後端
cd exam-system-backend
mvn clean compile
mvn spring-boot:run
```

或使用提供的腳本：

```powershell
# 在專案根目錄執行
.\start-backend.ps1
```

**Linux / macOS (Bash)**

```bash
# 設定 Java 21 環境變數
export JAVA_HOME="/path/to/jdk-21"
export PATH="$JAVA_HOME/bin:$PATH"

# 編譯並啟動後端
cd exam-system-backend
JAVA_HOME="/path/to/jdk-21" PATH="/path/to/jdk-21/bin:$PATH" mvn spring-boot:run
```

後端服務將在 `http://localhost:8080` 啟動

#### 3. 前端設定與啟動

```bash
# 進入前端目錄
cd exam-system-frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

或使用提供的腳本：

```powershell
# 在專案根目錄執行 (Windows)
.\start-frontend.ps1
```

前端服務將在 `http://localhost:5173` 啟動

---

## 📖 使用說明

### 講師操作流程

1. **建立測驗**
   - 訪問 `http://localhost:5173`
   - 點擊「建立新測驗」
   - 填寫測驗資訊（標題、描述、時間限制）
   - 新增題目與選項

2. **啟動測驗**
   - 在測驗列表中選擇測驗
   - 點擊「啟動測驗」
   - 系統生成 QR Code 與加入碼

3. **控制題目流程**
   - 點擊「開始題目」推送題目給學員
   - 等待倒數計時結束
   - 查看即時統計圖表
   - 繼續下一題或結束測驗

4. **查看排行榜**
   - 測驗結束後查看最終排名
   - 匯出成績（功能開發中）

### 學員操作流程

1. **加入測驗**
   - 掃描講師提供的 QR Code
   - 或訪問 `http://localhost:5173` 並輸入 6 位加入碼
   - 選擇頭像、輸入姓名與 Email

2. **作答**
   - 等待講師開始題目
   - 在倒數時間內選擇答案
   - 提交答案後等待統計

3. **查看結果**
   - 即時查看答對/答錯
   - 查看累積分數
   - 查看班級排行榜

---

## 🧪 測試

### 後端測試

```bash
cd exam-system-backend

# 執行所有測試
JAVA_HOME="/d/java/jdk-21" PATH="/d/java/jdk-21/bin:$PATH" mvn test

# 執行特定測試
mvn test -Dtest=ExamServiceTest

# 執行測試並生成覆蓋率報告
mvn test jacoco:report
```

### 認證與角色測試（本機開發）

**注意**：以下為本機 H2（`exam-system-backend/data/examdb`）的測試資料與流程，請勿用於正式環境。

**預設管理員帳號（Admin）**
- Email: `admin@example.com`
- Password: `Admin@12345`

**角色如何區分**
- 角色欄位：`users.role`（`STUDENT / INSTRUCTOR / ADMIN`）
- 新註冊（Email 或 Google）預設：`STUDENT`
- `ADMIN` 才能升級其他使用者為講師（`INSTRUCTOR`）

**驗證步驟（PowerShell 7+ 範例）**
```powershell
# 1) Admin 登入取得 token
$login = @{ email = 'admin@example.com'; password = 'Admin@12345' } | ConvertTo-Json
$admin = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/login' -ContentType 'application/json' -Body $login
$token = $admin.token

# 2) 查看目前登入者資訊
Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/api/auth/user' -Headers @{ Authorization = "Bearer $token" }

# 3) 註冊一個新使用者（預設 STUDENT）
$register = @{ name = 'Demo User'; email = 'demo@example.com'; password = 'Passw0rd123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/register' -ContentType 'application/json' -Body $register
```

**測試統計**：
- ✅ 單元測試：29/29 通過
- ✅ 測試覆蓋率：核心功能 100%
- ✅ Service 層測試：完整覆蓋
- ✅ Repository 層測試：完整覆蓋

### 前端測試

```bash
cd exam-system-frontend

# 執行測試
npm run test

# Lint 檢查
npm run lint
```

---

## 📂 專案結構

```
exam_system/
├── exam-system-backend/          # 後端專案
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/exam/system/
│   │   │   │   ├── config/       # 配置類別
│   │   │   │   ├── controller/   # REST API 控制器
│   │   │   │   ├── dto/          # 資料傳輸物件
│   │   │   │   ├── entity/       # JPA 實體
│   │   │   │   ├── exception/    # 異常處理
│   │   │   │   ├── repository/   # 資料存取層
│   │   │   │   ├── service/      # 業務邏輯層
│   │   │   │   └── websocket/    # WebSocket 服務
│   │   │   └── resources/
│   │   │       └── application.yml  # 應用配置
│   │   └── test/                 # 測試程式碼
│   ├── pom.xml                   # Maven 配置
│   └── README.md                 # 後端說明文件
│
├── exam-system-frontend/         # 前端專案
│   ├── src/
│   │   ├── components/           # React 元件
│   │   ├── hooks/                # 自定義 Hooks
│   │   ├── pages/                # 頁面元件
│   │   ├── services/             # API 服務
│   │   ├── store/                # Zustand 狀態管理
│   │   └── types/                # TypeScript 型別定義
│   ├── package.json              # NPM 配置
│   └── vite.config.ts            # Vite 配置
│
├── CLAUDE.md                     # Claude Code 開發指引
├── spec.md                       # 系統規格文件
├── api.md                        # API 文檔
├── requirement.md                # 需求文件
├── .gitignore                    # Git 忽略檔案
└── README.md                     # 專案說明（本檔案）
```

---

## 📡 API 文檔

完整 API 文檔請參考：[api.md](./api.md)

### 核心 API 端點

#### 測驗管理
- `POST /api/exams` - 建立測驗
- `GET /api/exams` - 取得所有測驗
- `GET /api/exams/{id}` - 取得特定測驗
- `POST /api/exams/{id}/start` - 啟動測驗
- `POST /api/exams/{id}/end` - 結束測驗

#### 題目控制
- `POST /api/exams/{id}/questions/{index}/start` - 開始題目

#### 學員管理
- `POST /api/students/join` - 學員加入測驗
- `GET /api/students/exam/{examId}` - 取得測驗學員列表

#### 答案提交
- `POST /api/answers` - 提交答案
- `GET /api/answers/student/{sessionId}` - 取得學員答案記錄

#### 統計資料
- `GET /api/statistics/exams/{examId}/questions/{questionId}` - 題目統計
- `GET /api/statistics/exams/{examId}/leaderboard` - 排行榜

### WebSocket 訂閱主題

- `/topic/exam/{examId}/status` - 測驗狀態更新
- `/topic/exam/{examId}/students` - 學員加入通知
- `/topic/exam/{examId}/question` - 題目推送
- `/topic/exam/{examId}/statistics/question/{questionId}` - 題目統計
- `/topic/exam/{examId}/leaderboard` - 排行榜更新

---

## 🔐 安全性改進

本專案經過完整的 Code Review，並實施以下安全性改進：

### 高優先級改進
1. **答題時間驗證**
   - 新增 `currentQuestionStartedAt` 欄位記錄題目開始時間
   - 四重驗證：測驗狀態 → 重複作答 → 答題時間 → 當前題目
   - 防止學員超時作答

2. **並發安全控制**
   - accessCode 生成使用資料庫 UNIQUE 約束
   - 實作重試機制（最多 5 次）
   - 避免 Race Condition

### 中優先級改進
1. **資料庫索引優化**
   - Student: `sessionId`, `exam_id`
   - Answer: `question_id`, `student_id`
   - Question: `exam_id`
   - QuestionOption: `question_id`

2. **N+1 查詢優化**
   - 啟用 Hibernate 批次處理（batch_size: 20）
   - `order_inserts: true`
   - `order_updates: true`

3. **輸入驗證增強**
   - 完整的 `@Valid` 註解
   - 長度限制、格式驗證、必填檢查
   - Email 格式驗證、accessCode 長度驗證

---

## 🗄️ 資料庫

### H2 Console 存取

開發環境可透過以下方式存取 H2 資料庫控制台：

- **URL**: http://localhost:8080/h2-console
- **JDBC URL**: `jdbc:h2:file:./data/examdb`
- **Username**: `sa`
- **Password**: (空白)

### 資料模型

```
Exam (測驗)
 ├─ 1:N → Question (題目)
 │         ├─ 1:N → QuestionOption (選項)
 │         └─ 1:N → Answer (答案)
 └─ 1:N → Student (學員)
            └─ 1:N → Answer (答案)
```

---

## 🎨 自訂配置

### 後端配置

編輯 `exam-system-backend/src/main/resources/application.yml`：

```yaml
server:
  port: 8080  # 修改後端 Port

spring:
  datasource:
    url: jdbc:h2:file:./data/examdb  # 資料庫檔案位置

  jpa:
    hibernate:
      ddl-auto: update  # 生產環境改為 validate
```

### 前端配置

編輯 `exam-system-frontend/src/services/apiService.ts`：

```typescript
const API_BASE_URL = 'http://localhost:8080/api';  // 後端 API 位址
const WS_BASE_URL = 'ws://localhost:8080/ws';      // WebSocket 位址
```

---

## 🐛 故障排除

### "invalid flag: --release" 錯誤

**原因**: Maven 使用了 Java 8 而非 Java 21

**解決**:
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"
java -version  # 確認版本
```

### Port 8080 already in use

**原因**: Port 被佔用

**解決**:
```powershell
# Windows: 查找並關閉佔用程序
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# 或修改 application.yml 中的 server.port
```

### WebSocket 連線失敗

**原因**: CORS 設定或後端未啟動

**解決**:
1. 確認後端服務運行在 8080
2. 檢查 `WebSocketConfig.java` CORS 設定
3. 確認前端 WebSocket URL 正確

---

## 📚 相關文件

- [系統規格文件](./spec.md) - 完整的系統架構與設計
- [API 文檔](./api.md) - RESTful API 完整規格
- [需求文件](./requirement.md) - 專案需求說明
- [後端開發指引](./exam-system-backend/README.md)
- [前端開發指引](./exam-system-frontend/CLAUDE.md)
- [編譯指引](./exam-system-backend/COMPILE_GUIDE.md)
- [執行指引](./exam-system-backend/RUN_GUIDE.md)

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. Push 到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📝 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 👨‍💻 作者

**Kevin Tsai** - [kevintsai1202](https://github.com/kevintsai1202)

---

## 🙏 致謝

- Spring Boot 團隊
- React 團隊
- 所有開源貢獻者

---

## 📧 聯絡方式

如有任何問題或建議，請透過以下方式聯絡：

- Email: kevintsai1202@gmail.com
- GitHub Issues: https://github.com/kevintsai1202/exam_system/issues

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**⭐ 如果這個專案對您有幫助，請給個 Star！**
