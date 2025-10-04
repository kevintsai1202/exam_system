# 即時互動測驗統計系統

一個支援講師與學員即時互動的測驗平台，學員透過 QR Code 快速加入，講師控制題目流程，系統即時統計並展示答題結果。

## ✨ 主要功能

### 講師功能
- 📝 建立與編輯測驗（支援多種題型）
- 🎮 即時控制測驗流程（開始、推送題目、結束）
- 📊 即時統計圖表展示（長條圖/圓餅圖）
- 👥 學員即時管理與分數追蹤
- 🏆 自動生成排行榜
- 📋 一鍵複製測驗
- 📱 QR Code 快速分享

### 學員功能
- 📲 掃描 QR Code 快速加入
- 🎨 選擇個性化頭像
- ⏱️ 倒數計時答題
- 📈 即時查看答題統計
- 🥇 測驗結束後查看排行榜與個人成績

## 🛠️ 技術棧

### 後端
- **框架**: Spring Boot 3.2.0
- **語言**: Java 21
- **資料庫**: H2 Database (File-based)
- **即時通訊**: WebSocket (STOMP)
- **QR Code**: ZXing

### 前端
- **框架**: React 18 + TypeScript
- **建置工具**: Vite
- **狀態管理**: Zustand
- **即時通訊**: STOMP over WebSocket
- **圖表庫**: Recharts
- **QR Code**: qrcode.react

## 📐 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                         前端層                                │
│  ┌──────────────┐              ┌──────────────┐             │
│  │  講師介面     │              │  學員介面     │             │
│  │  (React)     │              │  (React)     │             │
│  └──────┬───────┘              └──────┬───────┘             │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │   HTTP REST API              │
          │   WebSocket (STOMP)          │
          │                              │
┌─────────┴──────────────────────────────┴─────────────────────┐
│                    Spring Boot 應用層                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Controller → Service → Repository → Entity            │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    H2 Database (File-based)                   │
└───────────────────────────────────────────────────────────────┘
```

## 🚀 快速開始

### 環境需求
- Java 21
- Node.js 18+
- Maven 3.9+

### 後端啟動

```bash
# 進入後端目錄
cd exam-system-backend

# Windows PowerShell 設定 Java 環境
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"

# 編譯專案
mvn clean compile

# 啟動應用程式
mvn spring-boot:run
```

後端服務將在 `http://localhost:8080` 啟動

### 前端啟動

```bash
# 進入前端目錄
cd exam-system-frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

前端應用將在 `http://localhost:5173` 啟動

## 📖 使用說明

### 講師端操作流程

1. **建立測驗**
   - 進入講師主控台
   - 點擊「建立新測驗」
   - 填寫測驗資訊（標題、描述、時限）
   - 新增題目與選項
   - 設定正確答案與圖表類型

2. **啟動測驗**
   - 在測驗卡片上點擊進入監控頁面
   - 點擊「啟動測驗」
   - 系統生成 QR Code 供學員掃描加入

3. **進行測驗**
   - 等待學員加入
   - 點擊「開始題目」推送題目給學員
   - 查看即時答題統計
   - 時間到後自動顯示統計圖表
   - 推送下一題或結束測驗

4. **查看結果**
   - 測驗結束後自動生成排行榜
   - 查看累積統計與學員表現

### 學員端操作流程

1. **加入測驗**
   - 掃描講師提供的 QR Code
   - 輸入姓名、Email
   - 選擇個性化頭像
   - 加入測驗等待開始

2. **答題**
   - 接收題目後在時限內選擇答案
   - 提交後等待統計結果
   - 查看當前題目統計與累積分數

3. **查看排名**
   - 測驗結束後查看排行榜
   - 查看自己的排名與成績

## 📁 專案結構

### 後端結構
```
exam-system-backend/
├── src/main/java/com/exam/system/
│   ├── controller/          # REST API 控制器
│   ├── service/             # 業務邏輯層
│   ├── repository/          # 資料訪問層
│   ├── entity/              # JPA 實體
│   ├── dto/                 # 資料傳輸物件
│   ├── websocket/           # WebSocket 配置
│   └── exception/           # 異常處理
└── src/main/resources/
    └── application.yml      # 應用配置
```

### 前端結構
```
exam-system-frontend/
├── src/
│   ├── pages/               # 頁面元件
│   ├── components/          # 共用元件
│   ├── services/            # API 與 WebSocket 服務
│   ├── store/               # Zustand 狀態管理
│   ├── types/               # TypeScript 型別定義
│   └── hooks/               # 自定義 Hooks
└── public/                  # 靜態資源
```

## 🔌 API 文檔

詳細 API 文檔請參考 [api.md](./api.md)

### 主要端點

#### 測驗管理
- `POST /api/exams` - 建立測驗
- `GET /api/exams` - 取得所有測驗
- `PUT /api/exams/{id}` - 更新測驗（僅 CREATED 狀態）
- `PUT /api/exams/{id}/start` - 啟動測驗
- `PUT /api/exams/{id}/questions/{index}/start` - 開始題目
- `PUT /api/exams/{id}/end` - 結束測驗
- `POST /api/exams/{id}/duplicate` - 複製測驗

#### 學員管理
- `POST /api/students/join` - 學員加入測驗
- `GET /api/exams/{examId}/students` - 取得學員列表

#### 答案提交
- `POST /api/answers` - 提交答案

#### 統計查詢
- `GET /api/statistics/exams/{examId}/questions/{questionId}` - 題目統計
- `GET /api/statistics/exams/{examId}/cumulative` - 累積統計
- `GET /api/statistics/exams/{examId}/leaderboard` - 排行榜

### WebSocket 主題

- `/topic/exam/{examId}/status` - 測驗狀態更新
- `/topic/exam/{examId}/students` - 學員加入通知
- `/topic/exam/{examId}/question` - 題目推送
- `/topic/exam/{examId}/statistics/question/{questionId}` - 題目統計
- `/topic/exam/{examId}/statistics/cumulative` - 累積統計
- `/topic/exam/{examId}/leaderboard` - 排行榜更新

## 💾 資料模型

### 核心實體關係
```
Exam (測驗)
 ├─ 1:N → Question (題目)
 │         └─ 1:N → QuestionOption (選項)
 └─ 1:N → Student (學員)
            └─ 1:N → Answer (答案)
```

### 測驗狀態機
```
CREATED → STARTED → ENDED
         ↓
    (開始題目循環)
```

## 🔒 資料庫訪問

### H2 Console
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/examdb`
- Username: `sa`
- Password: (空白)

## 🧪 測試

### 後端測試
```bash
cd exam-system-backend

# 執行所有測試
mvn test

# 執行特定測試
mvn test -Dtest=ExamServiceTest
```

### 前端測試
```bash
cd exam-system-frontend

# 執行 Lint
npm run lint
```

## ⚙️ 配置說明

### 後端配置 (application.yml)
- Server Port: `8080`
- Database: H2 file-based mode
- WebSocket: STOMP over WebSocket
- CORS: 允許 `localhost:5173` 和 `localhost:3000`

### 前端配置
- API Base URL: `http://localhost:8080/api`
- WebSocket URL: `ws://localhost:8080/ws`

## 🌟 主要特色

### 即時互動
- 使用 WebSocket 實現低延遲即時通訊
- 支援 300 個同時連線學員
- 即時推送題目、統計、排行榜

### 答案驗證
- 測驗狀態檢查（必須為 STARTED）
- 答題時間檢查（未超時）
- 重複作答檢查（一題一答）

### Session 管理
- 每個學員擁有獨立 UUID sessionId
- 前端 localStorage 儲存
- 後端透過 sessionId 追蹤狀態

### 統計圖表
- 支援長條圖與圓餅圖
- 單題統計與累積統計
- 自定義圖表類型

## 📚 相關文檔

- [系統規格文件](./spec.md) - 完整系統設計文檔
- [API 規格文件](./api.md) - RESTful API 詳細說明
- [後端 README](./exam-system-backend/README.md) - 後端專案說明
- [前端 CLAUDE](./exam-system-frontend/CLAUDE.md) - 前端開發指引

## 🐛 故障排除

### "invalid flag: --release" 錯誤
**原因**: Maven 使用了 Java 8 而非 Java 21
**解決**: 設定正確的 JAVA_HOME 環境變數

### Port 8080 已被佔用
**原因**: Port 被其他程式佔用
**解決**: 關閉佔用程序或修改 application.yml 中的 server.port

### WebSocket 連線失敗
**原因**: CORS 設定或後端未啟動
**解決**: 檢查 WebSocketConfig.java 的 CORS 設定，確認後端運行狀態

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📝 授權

本專案採用 MIT 授權條款

---

**開發團隊** | **最後更新**: 2025-01-10
