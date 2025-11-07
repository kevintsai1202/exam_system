# 後端執行指南

## 批次檔說明

專案提供了以下批次檔方便快速執行：

### 1. `compile.bat` - 編譯專案
**功能**: 只編譯程式碼，不執行
**使用時機**: 檢查程式碼是否有語法錯誤

```cmd
雙擊執行 compile.bat
```

---

### 2. `run.bat` - 執行應用程式（開發模式）⭐ 推薦
**功能**: 使用 Maven 直接執行應用程式
**特點**:
- 支援熱重載（修改程式碼後自動重啟）
- 適合開發時使用

```cmd
雙擊執行 run.bat
```

**執行後訪問**:
- 應用程式: http://localhost:8080
- H2 控制台: http://localhost:8080/h2-console

---

### 3. `build-and-run.bat` - 編譯並執行 ⭐ 一鍵執行
**功能**: 先編譯，編譯成功後自動執行
**特點**:
- 確保使用最新的程式碼
- 編譯失敗會停止，不會執行

```cmd
雙擊執行 build-and-run.bat
```

---

### 4. `package.bat` - 打包成 JAR
**功能**: 將專案打包成可執行的 JAR 檔案
**使用時機**: 準備部署到生產環境

```cmd
雙擊執行 package.bat
```

**產出**: `target\exam-system-1.0.0.jar`

---

### 5. `run-jar.bat` - 執行 JAR 檔案
**功能**: 執行已打包的 JAR 檔案
**使用時機**: 測試打包後的應用程式

**前置條件**: 必須先執行 `package.bat` 建立 JAR

```cmd
雙擊執行 run-jar.bat
```

---

## 快速開始 🚀

### 首次執行（推薦）
1. 雙擊 `build-and-run.bat`
2. 等待編譯完成並啟動
3. 開啟瀏覽器訪問 http://localhost:8080

### 日常開發
1. 雙擊 `run.bat`
2. 修改程式碼後自動重啟

---

## 停止應用程式

在執行視窗中按 `Ctrl + C`，然後輸入 `Y` 確認停止。

---

## 驗證執行狀態

### 1. 查看控制台輸出
應該看到：
```
Started ExamSystemApplication in X.XXX seconds
```

### 2. 測試 API
開啟瀏覽器訪問：
```
http://localhost:8080/api/exams
```

應該返回空陣列 `[]`（因為還沒有資料）

### 3. 訪問 H2 控制台
```
http://localhost:8080/h2-console
```

**連線設定**:
- JDBC URL: `jdbc:h2:file:./data/examdb`
- Username: `sa`
- Password: (留空)

---

## 常見問題

### Q: 雙擊批次檔後視窗立即關閉
**原因**: 可能是環境設定問題或編譯失敗

**解決方案**:
1. 右鍵批次檔 → 選擇「編輯」
2. 在最後加上 `pause`（已預設加入）
3. 或在 CMD 中手動執行批次檔以查看錯誤訊息

### Q: 顯示 "Port 8080 already in use"
**原因**: 8080 埠已被其他程式占用

**解決方案**:
1. 找到並關閉占用 8080 埠的程式
2. 或修改 `src/main/resources/application.yml` 中的 `server.port`

### Q: 顯示 "BUILD FAILURE"
**原因**: 程式碼有錯誤或環境問題

**解決方案**:
1. 查看錯誤訊息
2. 確認 JDK 21 已正確安裝
3. 刪除 `target` 資料夾後重試

---

## 進階操作

### 指定不同的 Port 執行
修改 `application.yml`:
```yaml
server:
  port: 8081  # 改成其他 port
```

### 使用 Profile
```cmd
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 查看日誌
執行中的日誌會顯示在控制台，也可以在 `logs/` 目錄查看檔案日誌（如果有設定）。

---

## 檔案總覽

| 批次檔 | 功能 | 執行時間 | 推薦用途 |
|--------|------|----------|----------|
| compile.bat | 編譯 | ~10秒 | 檢查語法 |
| run.bat | 執行 | ~20秒啟動 | 日常開發 ⭐ |
| build-and-run.bat | 編譯+執行 | ~30秒 | 首次執行 ⭐ |
| package.bat | 打包JAR | ~30秒 | 準備部署 |
| run-jar.bat | 執行JAR | ~10秒啟動 | 測試打包 |