- [x] **LocalStorage 學員資料持久化 - 文件更新**  
  - 更新 spec.md、api.md，明確規範需同步保存 currentStudent 與 sessionId。  

- [x] **useStudentStore 持久化 currentStudent**  
  - 將 persist `partialize` 加入 currentStudent，F5 立即還原畫面。  

- [x] **重建測試**  
  - `npm run build` 及手動刷新流程，驗證 localStorage 持久化與 WebSocket 運作。  

pm run build ���̪� flow�A�T�{F5 ��i�۰ʧ@ localStorage ������ƧP WebSocket�C  

- [x] **學員 F5 斷線修復（二）- 文件更新**  
  - 針對 sessionId URL 傳遞與 localStorage fallback 機制，於 spec.md、pi.md 補強流程。  

- [x] **StudentJoin / StudentExam sessionId URL 支援**  
  - 加入 querystring sessionId 導向與重新整理時的同步流程，確保未能存取 localStorage 的環境仍可恢復連線。  

- [x] **sessionId URL 支援測試**  
  - 透過 build 或實機刷新驗證 sessionId 可從 URL、localStorage 成功回填。  

- [x] **學員 F5 斷線修復 - 規格與文件**  
  - 更新 `spec.md`、`api.md`，補充學員重新整理後需等待 Zustand rehydrate 並利用 localStorage session 自動回復的流程。  

- [x] **StudentExam Hydration Guard 實作**  
  - 監聽 `useStudentStore.persist.hasHydrated`／`onFinishHydration`，hydration 完成前顯示載入狀態，完成後再依據 sessionId 取得學生資料與決定導流。  

- [x] **Hydration Guard 測試驗證**  
  - 透過 `npm run build` 或等效測試流程，確認重新整理後可自動恢復連線並保持提交流程正常。  
- [x] **後端 API 泄漏正解修復** _(完成，新增管理者 Token 與前後端保護)_  
  - 調整 `GET /api/exams/{id}/questions` 與 `ExamService.convertQuestionToDTO`，僅在授權情境下回傳 `correctOptionId`，避免學生端或未授權方取得答案。  
  - 規畫/補齊授權邏輯與對應測試，確保發問者才能取得正解。

- [x] **QR Code 參數不一致修正**  
  - 統一 `QRCodeService.generateJoinUrl` 與 `StudentJoin` 讀取的 query key（`code` vs `accessCode`），確保掃碼後可自動帶入考試碼。  
  - 針對掃碼流程新增驗證/測試。

- [x] **學生狀態持久化與 API 路徑同步** _(完成，修正 API 路徑並於刷新時自動載入學生)_  
  - 將 `studentApi.getStudent`、`answerApi.getStudentAnswers` 等路徑改成與後端一致，並在頁面刷新時利用持久化 `sessionId` 自動回填學生資料。  
  - 規畫測試（含 E2E）驗證重新整理與答題流程可正常運作。  

- [x] **登入擴充：Email 註冊/登入 + Google OAuth2 綁定 - 文件更新**  
  - 先更新 `spec.md`、`api.md`，補上帳號模型、綁定規則、流程圖與 API 規格。  

- [x] **登入擴充：後端認證實作**  
  - 新增 Email 註冊/登入 API、密碼雜湊機制，並調整 Google OAuth2 成功流程支援同 Email 自動綁定。  

- [x] **登入擴充：前端登入頁與認證串接**  
  - 新增 Email 註冊/登入 UI，串接新 API 並保留既有 Google OAuth2 登入流程。  

- [x] **登入擴充：測試驗證**  
  - 已執行 `mvn test -Dtest=AuthServiceTest`、`npm run build`。  
  - `mvn test` 全量測試仍有既有失敗案例（含 `ExamFlowIntegrationTest`、`ExamServiceTest`、`StatisticsServiceTest`、`StudentServiceTest`）。  

- [x] **講師頁 401 導流修正 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充 token 過期/無效時前端導回登入頁的規則。

- [x] **講師頁 401 導流修正 - 前端實作**
  - `ProtectedRoute` 增加 token/user 驗證流程，`apiService` 於 401 時自動清理登入狀態並導向 `/login`。

- [x] **講師頁 401 導流修正 - 測試驗證**
  - 執行前端建置並驗證 `/instructor` 未認證與過期 token 導流行為。



- [x] **Docker 部署一致性修正 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充 Docker 版埠號、健康檢查與建置前置需求。

- [x] **Docker 部署一致性修正 - 根目錄 Dockerfile**
  - 修正 `COPY` JAR 路徑、`HEALTHCHECK` 端口與路徑，統一使用 8080。

- [x] **Docker 部署一致性修正 - Compose/腳本/文件**
  - `docker-compose.yml`、`docker-build.bat`、`DOCKER_DEPLOYMENT.md` 同步根目錄 `Dockerfile` 與 8080 設定。

- [ ] **Docker 部署一致性修正 - 驗證**
  - 以 `docker build` / `docker compose`（或等效流程）驗證容器可啟動且健康檢查可通過（目前環境 Docker daemon 未啟動，待補跑）。

- [x] **主要環境資料庫切換為 PostgreSQL（完成）**
  - 更新 `spec.md`、`api.md` 記錄主環境資料庫由 H2 切換為 PostgreSQL，並以註解保留舊 H2 設定。
  - 調整 `application.yml` 使用 PostgreSQL 連線（含環境變數）並驗證後端可建置。
  - 已執行 `mvn -DskipTests compile`（`exam-system-backend`）確認建置成功。

- [x] **Nginx WebSocket 反向代理修正（完成）**
  - 更新 `spec.md`、`api.md` 記錄 `/ws` 需由 gateway 轉發至 backend，避免 SockJS 回傳 HTML。
  - 調整 `nginx/nginx.conf`，將 `/ws` 一併代理到 backend 並保留 Upgrade/Connection 標頭。
  - 已驗證 `docker compose config`、`nginx -t`、`http://localhost/ws/info`（SockJS JSON 正常回應）。

- [x] **前端 WebSocket Endpoint fallback 修正（完成）**
  - 更新 `spec.md`、`api.md`，明確定義 `VITE_WS_ENDPOINT` 缺失時應改用 `VITE_API_BASE_URL + /ws`，避免 fallback 到錯誤網域。
  - 調整 `websocketService.ts` 的 endpoint 解析邏輯（新增 `resolveWebSocketEndpoint` 優先序）。
  - 已執行 `npx tsc -b` 成功；`npm run build` 失敗（既有依賴缺失：`prop-types` 無法解析）。

- [x] **WebSocket Endpoint 部署診斷輸出（完成）**
  - 更新 `spec.md`、`api.md` 補充前端啟動時需輸出 WS endpoint 解析來源與結果，便於 Zeabur 追查是否吃到新 build。
  - 調整 `websocketService.ts` 新增診斷 log（含來源與最終 URL）並執行 `npx tsc -b` 驗證成功。

- [x] **學生端時間到顯示正確答案 - 文件更新（完成）**
  - 更新 `spec.md`、`api.md`，補充時間到後由單題統計 WebSocket 顯示正確答案的規範。

- [x] **學生端時間到顯示正確答案 - 前端實作（完成）**
  - `StudentExam` 補上單題統計訂閱，收到 `isCorrect` 後切換答案顯示模式。

- [x] **學生端時間到顯示正確答案 - 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - `npm run build` 失敗（既有問題：`react-simple-maps` 依賴 `prop-types` 無法解析，與本次修復無直接關聯）。

- [x] **講師端開測前統計展示（含地點統計）- 文件更新（完成）**
  - 更新 `spec.md`、`api.md`，定義講師在開測前也需顯示地點與調查統計。

- [x] **講師端開測前統計展示（含地點統計）- 前端實作（完成）**
  - `ExamMonitor` 新增地點統計資料載入與畫面呈現，並在學員加入後同步刷新。

- [x] **講師端開測前統計展示（含地點統計）- 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - `npm run build` 失敗（既有問題：`react-simple-maps` 依賴 `prop-types` 無法解析，與本次修改無直接關聯）。

- [x] **開測前統計畫面強化（地區圖表 + 每個問券圖表 + 開始前確認）- 文件更新（完成）**
  - 更新 `spec.md`、`api.md`，補充講師需先展示統計才可推送第一題的流程規範。

- [x] **開測前統計畫面強化（地區圖表 + 每個問券圖表 + 開始前確認）- 前端實作（完成）**
  - `ExamMonitor` 新增「開測前統計」畫面與圖表，並在未確認前鎖定第一題推送。

- [x] **開測前統計畫面強化（地區圖表 + 每個問券圖表 + 開始前確認）- 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - `npm run build` 失敗（既有問題：`react-simple-maps` 依賴 `prop-types` 無法解析，與本次修改無直接關聯）。

- [x] **測驗頁日夜模式（講師/學員）- 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，定義講師監控頁與學員答題頁的日夜切換與持久化規範。

- [x] **測驗頁日夜模式（講師/學員）- 前端實作（完成）**
  - `ExamMonitor`、`StudentExam` 已顯示主題切換按鈕，並套用主要容器主題樣式。

- [x] **測驗頁日夜模式（講師/學員）- 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - `npm run build` 失敗（既有問題：`react-simple-maps` 依賴 `prop-types` 無法解析，與本次修改無直接關聯）。

- [x] **移除訪客模式 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，將登入流程調整為僅 Email / Google，不提供訪客入口。

- [x] **移除訪客模式 - 前端實作（完成）**
  - 已刪除登入頁訪客模式按鈕與導流程式。

- [x] **移除訪客模式 - 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - `npm run build` 失敗（既有問題：`react-simple-maps` 依賴 `prop-types` 無法解析，與本次修改無直接關聯）。

- [x] **前端 build 依賴修正（prop-types）- 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，記錄 `react-simple-maps` 所需 `prop-types` 依賴補齊策略。

- [x] **前端 build 依賴修正（prop-types）- 套件安裝（完成）**
  - 已在 `exam-system-frontend` 安裝 `prop-types` 並更新 lockfile（使用 `--legacy-peer-deps` 避免既有 peer 衝突中斷）。

- [x] **前端 build 依賴修正（prop-types）- 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - 已執行 `npm run build` 成功（僅保留 chunk size warning）。

- [x] **測驗入口等待與地點統計修正 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，定義講師進入測驗預設停留學員資訊，以及學員地點為必填並納入地點統計。

- [x] **測驗入口等待與地點統計修正 - 前後端實作（完成）**
  - `ExamMonitor` 已調整初始頁籤為學員資訊等待。
  - `StudentJoin`、`StudentDTO`、`StudentService` 已補齊地點必填與儲存流程。

- [x] **測驗入口等待與地點統計修正 - 測試驗證（完成）**
  - 已執行 `npx tsc -b` 成功。
  - 已執行 `npm run build` 成功（僅 chunk size warning）。
  - 已執行後端 `mvn -DskipTests compile` 成功。
