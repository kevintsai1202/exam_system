# Exam System 專案脈絡

## 目的
- 提供此 repo 的固定工作順序與快速定位資訊。
- 避免 AI 代理重複搜尋已知的環境限制、目錄與發布檢查步驟。

## 環境前提
- 作業系統：Windows
- Shell：PowerShell 7+
- Java 8：`D:\java\jdk8u432-b06`
- Java 21：`D:\java\jdk-21`
- 專案根目錄：`e:\github\exam_system_new`

## 重要文件
- `todolist.md`
- `spec.md`
- `api.md`
- `CLAUDE.md`
- `exam-system-frontend/CLAUDE.md`

## 主要目錄
- `exam-system-backend`
  - Spring Boot 後端
- `exam-system-frontend`
  - React + TypeScript + Vite 前端
- `nginx`
  - 反向代理與 WebSocket 設定
- `skills`
  - 專案內技能

## 固定開發順序
1. 讀 `todolist.md`
2. 讀 `spec.md` / `api.md`
3. 先更新文件
4. 寫入任務拆分到 `todolist.md`
5. 再實作
6. 最後測試
7. 需要時再 `commit` / `push`

## 常用命令

### 前端
```powershell
cd exam-system-frontend
npm run build
```

### 後端
```powershell
cd exam-system-backend
mvn test
```

若只需快速驗證編譯：

```powershell
cd exam-system-backend
mvn -DskipTests compile
```

## 發布前檢查
- `git status --short`
- 確認 `todolist.md` 已更新
- 確認 `spec.md`、`api.md` 已先反映需求
- 執行與本次改動相符的 build / test
- 檢查是否有未預期檔案被納入 commit

## 發布報告最少要素
- 任務目標
- 實際修改檔案
- 驗證命令與結果
- branch / commit hash / push 結果
- 已知 warning 或後續風險
