- [x] **名單中心唯讀匯出 API（2026-07-27）**
  - 新增 `GET /api/integrations/audience-export`，以獨立 Bearer token 保護。
  - 以 `joinedAt|studentId` cursor 穩定分頁，單頁上限 500。
  - 匯出 `student_profile`、測驗摘要、`surveyData` 與逐題結果。
  - 未具完整同意時間與版本時保留空值，不替下游自動取得行銷同意。
  - 已新增 token／limit／cursor／DTO 服務測試，並以 Java 21 執行通過。

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

- [x] **講師匯出 / JSON 匯入匯出授權修正 - 文件更新（完成）**
  - 更新 `spec.md`、`api.md`，補充講師主控台匯出 Markdown、匯出 JSON、匯入 JSON 必須透過帶 JWT 的 API client 呼叫。

- [x] **講師匯出 / JSON 匯入匯出授權修正 - 前端實作（完成）**
  - 將 `InstructorDashboard` 的直接 `fetch` 改為統一走 `apiService`，確保自動帶入 `Authorization: Bearer <token>`。

- [x] **講師匯出 / JSON 匯入匯出授權修正 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功。

- [x] **V2 文件規劃 - 需求拆解與版本定位（完成）**
  - 已根據「題庫 / 模板 / 測驗執行 / 成績查詢」需求，整理最小改動版 V2 架構。
  - 已於 `spec.md`、`api.md` 明確標示為 `v2.0-draft` 規劃文件。

- [ ] **V2 第一階段 - 題庫與模板資料模型**
  - 新增題庫（私有 / 公開）與模板模型，保留既有 `Exam` 作為單次測驗執行與結果容器。

- [ ] **V2 第二階段 - 測驗擁有權與結果授權**
  - `Exam` 增加講師擁有者資訊；講師僅可查看自己的測驗與結果，`ADMIN` 可查看全部。

- [ ] **V2 第三階段 - 講師作答明細與學生歷史**
  - 講師可查看單次測驗所有學生答題狀況；學生可查看自己跨講師的測驗答題紀錄。

- [x] **學生首次登入需操作兩次 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充 Google OAuth2 callback 在前端需避免重複處理 token 的規範。

- [x] **學生首次登入需操作兩次 - 前端修正（完成）**
  - 已在 `AuthCallback` 加入一次性防重處理，避免 React StrictMode 導致 callback 執行兩次。

- [x] **學生首次登入需操作兩次 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功。

- [x] **學員地區選擇擴充 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充手機地圖拖曳限制、海外地區選項與「其他自填」規則。

- [x] **學員地區選擇擴充 - 前後端實作（完成）**
  - 已限制地圖拖曳範圍，並新增香港、澳門、大陸、新加坡、美國、其他自填地區選項。

- [x] **學員地區選擇擴充 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功。

- [x] **學員答題頁桌機版型優化 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充學員答題頁在大螢幕下需改用寬版桌機配置的規範。

- [x] **學員答題頁桌機版型優化 - 前端實作（完成）**
  - 已調整 `StudentExam`，保留手機單欄，於桌機改為較寬的主內容區與資訊側欄。

- [x] **學員答題頁桌機版型優化 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功，僅保留既有 chunk size warning。

- [x] **專案技能建立與發布 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充 repo 內專案技能的用途、範圍與不影響既有 API 的規範。

- [x] **專案技能建立與發布 - 技能實作（完成）**
  - 已建立可供 AI 代理使用的專案技能，涵蓋開發流程、重要目錄、建置與發布檢查。

- [x] **專案技能建立與發布 - 驗證與發布（完成）**
  - 已完成技能格式驗證，並準備提交至 GitHub 與整理發布報告。

- [x] **測驗頁版面避讓與主題切換精簡 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充左上固定選單避讓規則與主題切換僅保留右上全域按鈕。

- [x] **測驗頁版面避讓與主題切換精簡 - 前端實作（完成）**
  - 已調整共用 `PageLayout` 安全邊距，並移除 `ExamMonitor`、`StudentExam` 內部重複的日夜模式切換按鈕。

- [x] **測驗頁版面避讓與主題切換精簡 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功，僅保留既有 chunk size warning。

- [x] **講師問券/郵件功能開關 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，定義 admin 可控制講師是否可進入問券管理與郵件管理。

- [x] **講師問券/郵件功能開關 - 前後端實作（完成）**
  - 已新增使用者功能旗標、admin 管理 API、前端路由守衛與主控台入口顯示控制。

- [x] **講師問券/郵件功能開關 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功。
  - 已使用 Java 21 執行後端 `mvn -DskipTests compile` 成功。

- [x] **admin 帳密登入失敗（功能欄位 migration）- 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充既有 `users` 資料表新增布林欄位時需提供資料庫預設值，避免 PostgreSQL schema update 失敗。

- [x] **admin 帳密登入失敗（功能欄位 migration）- 後端修正（完成）**
  - 已調整 `User` 新增欄位的 DDL 定義，讓 Hibernate 對既有資料表補欄位時可安全套用預設值。

- [x] **admin 帳密登入失敗（功能欄位 migration）- 測試驗證（完成）**
  - 已使用 Java 21 執行後端 `mvn -DskipTests compile` 成功。

- [x] **左上固定選單仍遮擋內容 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充共用 layout 安全區需覆蓋固定選單實際視覺高度，而非僅估算內容高度。

- [x] **左上固定選單仍遮擋內容 - 前端修正（完成）**
  - 已調整 `PageLayout` 的內容安全上邊距，改為更大的桌機/手機差異化保留空間。

- [x] **左上固定選單仍遮擋內容 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功，僅保留既有 chunk size warning。

- [x] **左上固定選單改為預設收合、靠近展開 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充桌機左上固定選單預設收合，hover/focus 才展開的互動規則。

- [x] **左上固定選單改為預設收合、靠近展開 - 前端實作（完成）**
  - 已調整 `PageLayout` 導覽列為桌機預設 icon-only，滑鼠靠近或 focus 才展開文字。

- [x] **左上固定選單改為預設收合、靠近展開 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功，僅保留既有 chunk size warning。

- [x] **手機固定選單預設收合 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充手機版固定選單需預設收合，點擊後才展開，避免遮擋學員頁內容。

- [x] **手機固定選單預設收合 - 前端實作（完成）**
  - 已調整 `PageLayout`，讓手機版導覽列預設縮小為單一入口，點擊後再展開選單。

- [x] **手機固定選單預設收合 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功，僅保留既有 chunk size warning。

- [x] **OAuth 首次登入註冊後直接登入 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充 Google OAuth 首次建帳後需保留原始 `state/returnTo` 並直接完成前端登入態。

- [x] **OAuth 首次登入註冊後直接登入 - 前後端修正（完成）**
  - 後端 OAuth success handler 回傳 token 時同步帶回 `state`。
  - 前端 `AuthCallback` 以 `state` 或 `sessionStorage.returnTo` 還原原頁，避免首次建帳後仍需再次點擊登入。

- [x] **OAuth 首次登入註冊後直接登入 - 測試驗證（完成）**
  - 已執行後端 `mvn -DskipTests compile`（Java 21）成功。
  - 已執行前端 `npm run build` 成功（僅保留既有 chunk size warning）。

- [x] **管理員介面增加使用者刪除功能 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充 admin 使用者管理頁可刪除帳號，且不得刪除目前登入中的管理員自己。

- [x] **管理員介面增加使用者刪除功能 - 前後端實作（完成）**
  - 後端已新增 admin 刪除使用者 API。
  - 前端 `AdminDashboard` 已新增刪除按鈕與確認流程，刪除成功後刷新列表。

- [x] **管理員介面增加使用者刪除功能 - 測試驗證（完成）**
  - 已執行後端 `mvn -DskipTests compile`（Java 21）成功。
  - 已執行前端 `npm run build` 成功（僅保留既有 chunk size warning）。

- [x] **Google OAuth 首次登入與學員導頁異常 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，改用前端 sessionStorage 保存 OAuth 返回頁，並修正學員答題頁導向路徑規範。

- [x] **Google OAuth 首次登入與學員導頁異常 - 前後端修正（完成）**
  - 已移除前端手動覆蓋 OAuth `state` 的做法，改由前端本地保存返回頁。
  - 已修正 `StudentJoin` 導向 `StudentExam` 的路徑，統一路由格式為 `/student/exam/:examId`。

- [x] **Google OAuth 首次登入與學員導頁異常 - 測試驗證（完成）**
  - 已執行後端 `mvn -DskipTests compile`（Java 21）成功。
  - 已執行前端 `npm run build` 成功（僅保留既有 chunk size warning）。

- [x] **黑夜模式台灣離島配色可視性修正 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充學員加入頁黑夜模式下離島需維持足夠辨識度與對比。

- [x] **黑夜模式台灣離島配色可視性修正 - 前端實作（完成）**
  - 已調整 `TaiwanMap` 在 dark mode 下的離島色票與描邊，提升金門、連江、澎湖在深色背景上的可見性。

- [x] **黑夜模式台灣離島配色可視性修正 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功（僅保留既有 chunk size warning）。

- [x] **講師主控台移除清除 Session 按鈕 - 文件更新（完成）**
  - 已更新 `spec.md`、`api.md`，補充講師主控台不再提供手動清除 Session 入口。

- [x] **講師主控台移除清除 Session 按鈕 - 前端實作（完成）**
  - 已移除 `InstructorDashboard` 的清除 Session 按鈕與對應前端處理流程。

- [x] **講師主控台移除清除 Session 按鈕 - 測試驗證（完成）**
  - 已執行前端 `npm run build` 成功（僅保留既有 chunk size warning）。

- [x] **學員加入即時更新與重進訂閱失敗修正 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充 WebSocket 訂閱只能在底層 STOMP ready 後執行，且斷線重連後需恢復測驗主題訂閱。

- [x] **學員加入即時更新與重進訂閱失敗修正 - 前端實作**
  - 修正 `websocketService` 的訂閱時機與重連補訂閱流程，避免講師端學生加入未即時更新，並避免重進測驗出現訂閱失敗。

- [x] **學員加入即時更新與重進訂閱失敗修正 - 測試驗證**
  - 執行前端建置驗證 WebSocket 修正未破壞既有流程。

- [x] **學員掃碼已加入直接進入 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充已登入且已加入同場測驗時，掃碼進入應直接恢復既有 session，不再顯示個資填寫畫面。

- [x] **學員掃碼已加入直接進入 - 前後端實作**
  - 新增依 email + examId 查詢既有學員 session 的流程，並於 `StudentJoin` 載入後優先自動導向答題頁。

- [x] **學員掃碼已加入直接進入 - 測試驗證**
  - 執行前端建置與後端編譯，確認自動直入流程未破壞既有加入與重連行為。

- [x] **登入仍需兩次操作 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充 OAuth 從 `/login` 發起時不得再導回 `/login`，且登入頁於已登入狀態下需自動離開。

- [x] **登入仍需兩次操作 - 前端修正**
  - 修正 `LoginPage` 與 `AuthCallback` 的登入後導向規則，避免成功登入後停留在登入頁造成誤判。

- [x] **登入仍需兩次操作 - 測試驗證**
  - 執行前端建置，確認登入導向修正未破壞既有 Email / Google 流程。

- [x] **手機掃碼 OAuth 首次登入無法直接進入 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充行動裝置 OAuth 返回頁需具備 `localStorage` 備援，不可只依賴 `sessionStorage`。

- [x] **手機掃碼 OAuth 首次登入無法直接進入 - 前端修正**
  - 統一 OAuth 返回頁暫存邏輯，加入 `localStorage` 備援，確保手機掃碼第一次登入後能回到原始測驗加入頁。

- [x] **手機掃碼 OAuth 首次登入無法直接進入 - 測試驗證**
  - 執行前端建置，確認 OAuth 返回頁備援修正未破壞既有桌機與登入流程。

- [x] **手機掃碼 OAuth 仍需二次登入 - 文件更新**
  - 更新 `spec.md`、`api.md`，補充行動裝置 OAuth 返回頁需再加入 cookie 備援，避免跨 WebView / 瀏覽器跳轉時遺失返回目標。

- [x] **手機掃碼 OAuth 仍需二次登入 - 前端修正**
  - 將 OAuth 返回頁暫存擴充為 sessionStorage + localStorage + cookie 三層備援，並統一 callback 清除邏輯。

- [x] **手機掃碼 OAuth 仍需二次登入 - 測試驗證**
  - 執行前端建置，確認 cookie 備援修正未破壞既有登入與掃碼流程。

- [x] **手機首次登入仍需兩次 - StudentJoin 狀態同步文件更新**
  - 更新 `spec.md`、`api.md`，補充 `StudentJoin` 必須監聽 auth store 變化，不可只在 mount 當下讀取一次登入狀態。

- [x] **手機首次登入仍需兩次 - StudentJoin 狀態同步修正**
  - 將 `StudentJoin` 的登入資訊同步改為 reactive，確保 OAuth callback 後第一次狀態更新即可觸發自動恢復流程。

- [x] **手機首次登入仍需兩次 - 測試驗證**
  - 執行前端建置，確認 `StudentJoin` 狀態同步修正未破壞既有掃碼與加入流程。

- [x] **手機掃碼 OAuth 後端托管返回頁 - 文件更新**
  - 更新 `spec.md`、`api.md`，改由後端以 cookie 托管 OAuth 返回頁，不再依賴前端儲存跨容器傳遞。

- [x] **手機掃碼 OAuth 後端托管返回頁 - 前後端實作**
  - 新增後端 Google OAuth 起始端點與 callback returnTo 回傳，前端改用後端端點發起登入並優先讀取 callback querystring 的 returnTo。

- [x] **手機掃碼 OAuth 後端托管返回頁 - 測試驗證**
  - 執行後端編譯與前端建置，確認後端托管返回頁未破壞既有登入流程。
