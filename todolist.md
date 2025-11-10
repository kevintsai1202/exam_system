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



