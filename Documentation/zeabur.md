# Zeabur 部署指南

## 部署方式

本專案使用根目錄的 **Multi-stage Dockerfile** 部署，Zeabur 會自動偵測。

| Stage | Base Image | 用途 |
|-------|-----------|------|
| 1 | `node:20-alpine` | 建置前端（npm install + vite build） |
| 2 | `maven:3.9-eclipse-temurin-21-alpine` | 建置後端 JAR（含前端靜態檔） |
| 3 | `eclipse-temurin:21-jre-alpine` | 執行（僅 JRE，約 133MB） |

> Zeabur 內建 Java 最高只支援 JDK 19，本專案需要 JDK 21，因此必須使用 Dockerfile 部署。

## Port

只需開放 **8080**（Dockerfile 已設定 `EXPOSE 8080`，Zeabur 自動偵測）。

前端、API、WebSocket 全部透過同一個 port 提供：

- `/` — 前端靜態頁面
- `/api/*` — REST API
- `/ws` — WebSocket（STOMP over SockJS）

## 環境變數

### 必填

| 變數 | 說明 | 範例 |
|------|------|------|
| `ADMIN_TOKEN` | 管理員驗證 Token | `your-secret-token` |
| `APP_FRONTEND_URL` | Zeabur 分配的域名（含 https，不含結尾斜線）。用於 OAuth2 redirect 和 Security CORS | `https://exam-system.zeabur.app` |
| `EXAM_WEBSOCKET_ALLOWED_ORIGINS_0` | 同上域名。用於 WebSocket CORS 和 HTTP CORS Filter | `https://exam-system.zeabur.app` |

> `APP_FRONTEND_URL` 和 `EXAM_WEBSOCKET_ALLOWED_ORIGINS_0` 的值通常相同，都是你的正式域名。

**對應的後端配置：**

| 環境變數 | 對應 application.yml | 使用位置 |
|----------|---------------------|----------|
| `ADMIN_TOKEN` | `exam.security.admin-token` | 講師端特權操作驗證 |
| `APP_FRONTEND_URL` | `app.frontend.url` | `SecurityConfig.java` — CORS allowed origins、OAuth2 登入後 redirect |
| `EXAM_WEBSOCKET_ALLOWED_ORIGINS_0` | `exam.websocket.allowed-origins[0]` | `WebSocketConfig.java` — WebSocket CORS、`CorsConfig.java` — HTTP CORS Filter |

### 選填（Google OAuth 登入）

| 變數 | 說明 |
|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |

使用 Google 登入時，需在 Google Cloud Console 將 Zeabur 域名加入 Authorized redirect URIs：

```
https://你的域名.zeabur.app/login/oauth2/code/google
```

### 選填（郵件通知）

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `SMTP_HOST` | SMTP 伺服器 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USERNAME` | SMTP 帳號 | （無） |
| `SMTP_PASSWORD` | SMTP 密碼 | （無） |

## 前端 API URL 設定

前端所有 API 呼叫在生產環境使用**相對路徑**（因為前後端打包在同一個 JAR），不需要額外設定：

| 環境 | API Base URL | WebSocket URL |
|------|-------------|---------------|
| 開發 | `http://localhost:8080/api` | `http://localhost:8080/ws` |
| 生產 | `/api`（相對路徑） | `/ws`（相對路徑） |

相關檔案已統一使用 `import.meta.env.PROD` 判斷環境。

## 部署步驟

1. 將程式碼推到 GitHub
2. Zeabur Dashboard → **Add Service** → **Deploy your source code** → 選擇 repo
3. Zeabur 偵測到 Dockerfile，自動開始建置
4. 建置完成後，到 **Networking** 綁定域名（例如 `exam-system.zeabur.app`）
5. 到 **Variables** 設定環境變數（至少設定上方「必填」的三項）
6. 服務會自動重啟套用新設定

## 資料持久化

本專案使用 H2 embedded database，資料儲存在容器內的 `/app/data/examdb`。

> 注意：容器重新部署時資料會遺失。如需持久化，考慮將 H2 替換為 Zeabur 的 PostgreSQL 服務。

## 故障排除

### WebSocket 連線失敗

確認 `EXAM_WEBSOCKET_ALLOWED_ORIGINS_0` 已設為正確的域名（含 `https://`，不含結尾 `/`）。

### OAuth 登入後跳轉失敗

確認 `APP_FRONTEND_URL` 已設為正確的域名，且 Google Cloud Console 的 redirect URI 已更新。

### 建置失敗：Java 版本錯誤

確認 Zeabur 是使用 Dockerfile 建置（自動偵測），而非 source code 建置。可在 Zeabur Dashboard 的 build logs 確認。

### 前端 API 呼叫 localhost:8080

確認前端是以 production mode 建置（`npm run build`），而非開發模式。Production build 會使用相對路徑。
