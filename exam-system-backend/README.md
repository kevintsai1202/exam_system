# 即時互動測驗統計系統 - 後端

## 技術棧
- Java 21
- Spring Boot 3.2.0
- Spring Data JPA
- Spring WebSocket (STOMP)
- H2 Database (File-based)
- Lombok
- ZXing (QR Code)

## 環境需求
- JDK 21+
- Maven 3.8+

## 開發環境設定

### Windows 環境
設定 JAVA_HOME 為 JDK 21：
```powershell
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;$env:PATH"
```

或在專案目錄使用：
```bash
cd exam-system-backend
set JAVA_HOME=D:\java\jdk-21 && mvn clean install
```

### 編譯專案
```bash
# Maven 編譯
mvn clean compile

# 完整建置（包含測試）
mvn clean install

# 跳過測試建置
mvn clean install -DskipTests
```

### 執行應用程式
```bash
# 方式 1: 使用 Maven
mvn spring-boot:run

# 方式 2: 執行 JAR
java -jar target/exam-system-1.0.0.jar
```

### H2 資料庫控制台
應用程式啟動後，可透過以下網址訪問 H2 控制台：
- URL: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:file:./data/examdb
- Username: sa
- Password: (空白)

## API 端點

### 測驗管理 (ExamController)
- `POST /api/exams` - 建立測驗
- `GET /api/exams/{examId}` - 取得測驗資訊
- `POST /api/exams/{examId}/start` - 啟動測驗
- `POST /api/exams/{examId}/questions/{questionIndex}/start` - 開始題目
- `POST /api/exams/{examId}/end` - 結束測驗
- `GET /api/exams/{examId}/questions` - 取得題目列表

### 學員管理 (StudentController)
- `POST /api/students/join` - 學員加入測驗
- `GET /api/students/{sessionId}` - 取得學員資訊
- `GET /api/students/exam/{examId}` - 取得測驗的所有學員

### 答案管理 (AnswerController)
- `POST /api/answers` - 提交答案
- `GET /api/answers/student/{sessionId}` - 取得學員答案記錄

### 統計分析 (StatisticsController)
- `GET /api/statistics/exams/{examId}/questions/{questionId}` - 取得題目統計
- `GET /api/statistics/exams/{examId}/cumulative` - 取得累積統計
- `GET /api/statistics/exams/{examId}/leaderboard` - 取得排行榜
- `POST /api/statistics/exams/{examId}/leaderboard/broadcast` - 廣播排行榜

### WebSocket 端點
- **連線端點**: `ws://localhost:8080/ws`
- **訂閱主題**:
  - `/topic/exam/{examId}/status` - 測驗狀態更新
  - `/topic/exam/{examId}/students` - 學員加入通知
  - `/topic/exam/{examId}/question` - 題目推送
  - `/topic/exam/{examId}/statistics/question/{questionId}` - 題目統計
  - `/topic/exam/{examId}/statistics/cumulative` - 累積統計
  - `/topic/exam/{examId}/leaderboard` - 排行榜
  - `/topic/exam/{examId}/timer` - 倒數計時

詳細 API 文件請參考專案根目錄的 `api.md`。

## 專案結構
```
src/main/java/com/exam/system/
├── ExamSystemApplication.java              # 主應用程式
│
├── config/                                 # 配置層 (3 個檔案)
│   ├── CorsConfig.java                     # CORS 跨域配置
│   ├── ExamProperties.java                 # 自定義屬性配置
│   └── WebSocketConfig.java                # WebSocket STOMP 配置
│
├── entity/                                 # 實體層 (7 個檔案)
│   ├── Answer.java                         # 答案實體
│   ├── ChartType.java                      # 圖表類型列舉
│   ├── Exam.java                           # 測驗實體
│   ├── ExamStatus.java                     # 測驗狀態列舉
│   ├── Question.java                       # 題目實體
│   ├── QuestionOption.java                 # 選項實體
│   └── Student.java                        # 學員實體
│
├── repository/                             # 資料訪問層 (5 個檔案)
│   ├── AnswerRepository.java               # 答案 Repository
│   ├── ExamRepository.java                 # 測驗 Repository
│   ├── QuestionOptionRepository.java       # 選項 Repository
│   ├── QuestionRepository.java             # 題目 Repository
│   └── StudentRepository.java              # 學員 Repository
│
├── dto/                                    # 資料傳輸物件 (8 個檔案)
│   ├── AnswerDTO.java                      # 答案 DTO
│   ├── ExamDTO.java                        # 測驗 DTO
│   ├── LeaderboardDTO.java                 # 排行榜 DTO
│   ├── QuestionDTO.java                    # 題目 DTO
│   ├── QuestionOptionDTO.java              # 選項 DTO
│   ├── StatisticsDTO.java                  # 統計 DTO
│   ├── StudentDTO.java                     # 學員 DTO
│   └── WebSocketMessage.java               # WebSocket 訊息封裝
│
├── service/                                # 業務邏輯層 (5 個檔案)
│   ├── AnswerService.java                  # 答案服務
│   ├── ExamService.java                    # 測驗服務
│   ├── QRCodeService.java                  # QR Code 生成服務
│   ├── StatisticsService.java              # 統計服務
│   └── StudentService.java                 # 學員服務
│
├── controller/                             # REST 控制層 (4 個檔案)
│   ├── AnswerController.java               # 答案 API
│   ├── ExamController.java                 # 測驗 API
│   ├── StatisticsController.java           # 統計 API
│   └── StudentController.java              # 學員 API
│
├── websocket/                              # WebSocket 層 (1 個檔案)
│   └── WebSocketService.java               # WebSocket 推送服務
│
└── exception/                              # 異常處理層 (3 個檔案)
    ├── BusinessException.java              # 業務異常
    ├── GlobalExceptionHandler.java         # 全域異常處理器
    └── ResourceNotFoundException.java      # 資源未找到異常

總計: 37 個 Java 檔案
```

## 開發狀態
- [x] 專案架構建立
- [x] 資料模型實作 (5 個實體 + 2 個列舉)
- [x] Repository 層實作 (5 個 Repository + 自定義查詢)
- [x] DTO 層實作 (8 個 DTO)
- [x] Service 層實作 (5 個服務)
- [x] WebSocket 通訊實作 (STOMP 協定 + 廣播機制)
- [x] REST API 實作 (4 個 Controller + 15+ 端點)
- [x] 異常處理 (全域異常處理器)
- [x] QR Code 生成 (ZXing)
- [ ] 單元測試撰寫
- [ ] 整合測試撰寫

## 核心功能
1. ✅ 測驗建立與管理
2. ✅ 學員加入與 Session 管理
3. ✅ 即時題目推送 (WebSocket)
4. ✅ 答案提交與驗證
5. ✅ 即時統計計算與推送
6. ✅ 累積分數統計
7. ✅ 排行榜生成
8. ✅ QR Code 生成

## 注意事項
- 確保使用 JDK 21 編譯
- H2 資料庫檔案會儲存在 `./data/` 目錄
- WebSocket 預設允許 `http://localhost:5173` 和 `http://localhost:3000` 跨域訪問
- 所有 API 回應使用 JSON 格式
- 日誌等級: DEBUG (開發環境)