# 即時互動測驗統計系統 - 前端專案

## 專案資訊
- **專案名稱**: exam-system-frontend
- **技術棧**: React 18+ + TypeScript + Vite
- **開發模式**: 前後端分離

## 技術選型
### 核心框架
- React 18+ (UI 框架)
- TypeScript (型別系統)
- Vite (建置工具)

### 主要依賴
- **react-router-dom** ^7.9.3 (路由管理)
- **recharts** ^3.2.1 (圖表庫)
- **qrcode.react** ^4.2.0 (QR Code 生成)
- **sockjs-client** ^1.6.1 + **@stomp/stompjs** ^7.2.0 (WebSocket 即時通訊)
- **zustand** ^5.0.8 (狀態管理)
- **axios** ^1.12.2 (HTTP 請求)

## 專案結構
```
src/
├── pages/              # 頁面元件
│   ├── InstructorDashboard.tsx    # 講師主控台
│   ├── ExamCreator.tsx            # 測驗建立頁
│   ├── ExamMonitor.tsx            # 測驗監控頁
│   ├── StudentJoin.tsx            # 學員加入頁
│   ├── StudentExam.tsx            # 學員答題頁
│   └── Leaderboard.tsx            # 排行榜頁
│
├── components/         # 共用元件
│   ├── QRCodeDisplay.tsx          # QR Code 顯示
│   ├── QuestionCard.tsx           # 題目卡片
│   ├── OptionButton.tsx           # 選項按鈕
│   ├── CountdownTimer.tsx         # 倒數計時器
│   ├── BarChart.tsx               # 長條圖
│   ├── PieChart.tsx               # 圓餅圖
│   ├── StudentList.tsx            # 學員列表
│   └── AvatarSelector.tsx         # 頭像選擇器
│
├── services/           # 服務層
│   ├── apiService.ts              # HTTP API 呼叫
│   └── websocketService.ts        # WebSocket 連線管理
│
├── store/              # 狀態管理
│   ├── examStore.ts               # 測驗狀態管理
│   ├── studentStore.ts            # 學員狀態管理
│   └── statisticsStore.ts         # 統計資料管理
│
├── types/              # 型別定義
│   ├── exam.types.ts              # 測驗相關型別
│   ├── student.types.ts           # 學員相關型別
│   └── statistics.types.ts        # 統計相關型別
│
├── hooks/              # 自定義 Hooks
│   ├── useWebSocket.ts            # WebSocket Hook
│   └── useCountdown.ts            # 倒數計時 Hook
│
└── assets/             # 靜態資源
    └── avatars/                   # 頭像圖示
```

## API 整合
- **Base URL**: `http://localhost:8080/api`
- **WebSocket**: `ws://localhost:8080/ws`
- **API 文件**: 參考專案根目錄 `api.md`

## 開發指令
```bash
# 安裝依賴
npm install

# 啟動開發伺服器 (Port: 5173)
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# 執行 ESLint
npm run lint
```

## 開發規範
### 程式碼規範
- 使用 TypeScript 嚴格模式
- 所有元件需要型別定義
- 函式級別註解使用中文
- 重要變數或物件需加上註解
- 遵循單一任務原則，勿過度開發

### 元件規範
- 使用函式元件 (Functional Component)
- Props 需明確定義 TypeScript 介面
- 狀態管理優先使用 Hooks
- 避免過深的元件巢狀

### 命名規範
- 元件檔案: PascalCase (如 `ExamCreator.tsx`)
- Hook 檔案: camelCase + use 前綴 (如 `useWebSocket.ts`)
- Service 檔案: camelCase + Service 後綴 (如 `apiService.ts`)
- Type 檔案: camelCase + .types 後綴 (如 `exam.types.ts`)

### Git 提交規範
- 每個任務獨立提交
- 提交訊息使用中文
- 提交訊息格式: `[功能] 簡短描述`

## WebSocket 連線管理
### STOMP 訂閱主題
- `/topic/exam/{examId}/status` - 測驗狀態更新
- `/topic/exam/{examId}/students` - 學員加入通知
- `/topic/exam/{examId}/question` - 題目推送
- `/topic/exam/{examId}/statistics/question/{questionId}` - 題目統計
- `/topic/exam/{examId}/statistics/cumulative` - 累積統計
- `/topic/exam/{examId}/leaderboard` - 排行榜
- `/topic/exam/{examId}/timer` - 倒數計時同步

## 響應式設計
- 支援裝置: 手機 (375px+) / 平板 (768px+) / 電腦 (1024px+)
- 優先設計手機版（學員答題使用）
- 講師端優化電腦版體驗

## 測試策略
- 元件單元測試 (Vitest + React Testing Library)
- API 整合測試
- WebSocket 連線測試
- 多裝置響應式測試

## 注意事項
1. 開發前需先閱讀規格文件 `spec.md` 和 API 文件 `api.md`
2. 確保後端服務已啟動 (Port: 8080)
3. WebSocket 連線需處理斷線重連
4. 學員 sessionId 需存入 localStorage
5. 圖表更新需節流處理，避免過度渲染
