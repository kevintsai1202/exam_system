# CLAUDE.md

此文件提供 Claude Code (claude.ai/code) 在此 repository 中工作時的指引。

## 專案概述

**即時互動測驗統計系統** - 一個講師與學員即時互動的測驗平台，學員透過 QR Code 加入，講師控制題目流程，系統即時統計並展示答題結果。

## 專案架構

此專案採用**前後端分離架構**：

### 後端 (exam-system-backend/)
- **技術**: Spring Boot 3.2.0 + Java 21 + JPA + WebSocket (STOMP)
- **資料庫**: H2 Database (File-based)
- **Port**: 8080
- **關鍵路徑**: `src/main/java/com/exam/system/`

### 前端 (exam-system-frontend/)
- **技術**: React 18 + TypeScript + Vite
- **Port**: 5173 (開發模式)
- **狀態管理**: Zustand
- **即時通訊**: STOMP over WebSocket

## 環境設定

### Java 路徑 (Windows)
本專案**必須使用 Java 21**，請在後端操作前設定環境變數：

```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"
```

**驗證 Java 版本**:
```bash
java -version  # 應顯示 openjdk version "21"
```

## 常用指令

### 後端開發 (exam-system-backend/)

**編譯專案**:
```bash
# Windows PowerShell
cd exam-system-backend
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"
mvn clean compile
```

**執行應用程式**:
```bash
mvn spring-boot:run
```

**執行測試**:
```bash
# 執行所有測試
mvn test

# 執行單一測試
JAVA_HOME=/d/java/jdk-21 PATH=/d/java/jdk-21/bin:$PATH mvn test -Dtest=ExamServiceTest

# 在 Windows PowerShell 環境
mvn test -Dtest=ExamServiceTest
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

## 核心業務流程

### 1. 測驗生命週期狀態機
```
CREATED → STARTED → ENDED
         ↓
    (開始題目循環)
```

### 2. 關鍵流程
1. **講師建立測驗**: 設定題目、選項、答案、圖表類型
2. **啟動測驗**: 生成 QR Code 和 accessCode
3. **學員加入**: 掃碼加入並建立 sessionId (UUID)
4. **答題循環**:
   - 講師開始題目 → WebSocket 推送題目給所有學員
   - 學員作答 → 系統驗證時間、重複性
   - 時間到 → 計算統計 → 廣播結果
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

## 資料模型關係

```
Exam (測驗)
 ├─ 1:N → Question (題目)
 │         └─ 1:N → QuestionOption (選項)
 └─ 1:N → Student (學員)
            └─ 1:N → Answer (答案)
```

**核心實體**:
- `Exam`: 包含 accessCode (唯一)、status (狀態機)、currentQuestionIndex
- `Question`: 包含 correctOptionId、圖表類型設定
- `Student`: 包含 sessionId (UUID)、totalScore (累積分數)
- `Answer`: 記錄 selectedOptionId、isCorrect、answeredAt

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

## 重要文件

- `spec.md` - 完整系統規格文件（含架構圖、流程圖、ER 圖）
- `api.md` - RESTful API 完整規格
- `requirement.md` - 需求說明
- `DEPLOYMENT.md` - 前後端整合部署指南（★ 部署必讀）
- `exam-system-backend/README.md` - 後端專案說明
- `exam-system-backend/COMPILE_GUIDE.md` - 編譯指引
- `exam-system-backend/RUN_GUIDE.md` - 執行指引
- `exam-system-frontend/CLAUDE.md` - 前端開發指引

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
- `POST /api/exams` - 建立測驗
- `POST /api/exams/{id}/start` - 啟動測驗（生成 QR Code）
- `POST /api/exams/{id}/questions/{index}/start` - 開始題目
- `POST /api/exams/{id}/end` - 結束測驗

### 學員管理
- `POST /api/students/join` - 學員加入（需 accessCode）
- `GET /api/students/exam/{examId}` - 取得測驗學員列表

### 答案與統計
- `POST /api/answers` - 提交答案
- `GET /api/statistics/exams/{examId}/questions/{questionId}` - 取得題目統計
- `GET /api/statistics/exams/{examId}/leaderboard` - 取得排行榜
