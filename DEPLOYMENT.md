# 前後端整合部署指南

## 概述

此專案已配置為支援**前後端分離開發**與**整合部署**兩種模式：

- **開發模式**：前端（port 5173）與後端（port 8080）分別運行
- **生產模式**：前端 build 到後端 resources/static/，打包成單一 JAR 部署

---

## 開發模式

### 啟動前端開發伺服器

```bash
cd exam-system-frontend
npm install
npm run dev
```

訪問：http://localhost:5173

### 啟動後端服務

```bash
cd exam-system-backend
JAVA_HOME=/d/java/jdk-21 PATH=/d/java/jdk-21/bin:$PATH mvn spring-boot:run
```

後端 API：http://localhost:8080

---

## 生產部署模式

### 1. Build 前端

```bash
cd exam-system-frontend
npm install
npm run build
```

此指令會：
- 編譯 TypeScript
- 打包 React 應用
- 自動輸出到 `exam-system-backend/src/main/resources/static/`

### 2. 打包後端（包含前端）

```bash
cd exam-system-backend
JAVA_HOME=/d/java/jdk-21 PATH=/d/java/jdk-21/bin:$PATH mvn clean package -DskipTests
```

產出：`target/exam-system-backend-*.jar`

### 3. 執行應用

```bash
java -jar target/exam-system-backend-*.jar
```

訪問：http://localhost:8080

---

## 技術實現細節

### 前端配置

#### 1. vite.config.ts

```typescript
export default defineConfig({
  base: '/',  // 使用絕對路徑
  build: {
    outDir: '../exam-system-backend/src/main/resources/static',  // 輸出到後端
    emptyOutDir: true,
  },
})
```

#### 2. apiService.ts

```typescript
const API_BASE_URL = import.meta.env.PROD
  ? '/api'                          // 生產：相對路徑
  : 'http://localhost:8080/api';    // 開發：完整 URL
```

#### 3. websocketService.ts

```typescript
const WS_ENDPOINT = import.meta.env.PROD
  ? `${window.location.protocol}//${window.location.host}/ws`  // 生產：動態 URL
  : 'http://localhost:8080/ws';                                // 開發：完整 URL
```

### 後端配置

#### 1. SpaConfig.java

處理前端路由，將非 API 請求導向 index.html：

```java
@Configuration
public class SpaConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 優先處理靜態資源
        // API、WebSocket、H2 Console 不處理
        // 其他路徑返回 index.html（支援 React Router）
    }
}
```

#### 2. application.yml

```yaml
exam:
  websocket:
    allowed-origins:
      - "http://localhost:5173"  # 開發環境
      - "http://localhost:8080"  # 生產環境
```

#### 3. .gitignore

```
# Frontend Build Output
src/main/resources/static/
```

Build 產物不納入版本控制。

---

## 路徑優先順序

Spring Boot 處理請求的順序：

1. `/api/**` → REST Controller
2. `/ws` → WebSocket
3. `/h2-console` → H2 Database Console
4. `/assets/**` → 靜態資源（CSS、JS）
5. `/**` → index.html（SPA 路由）

---

## 優勢

1. ✅ **開發便利**：前後端分離，支援 HMR（熱模組替換）
2. ✅ **部署簡單**：單一 JAR 檔案包含前後端
3. ✅ **無需 CORS**：生產環境同源，無跨域問題
4. ✅ **統一管理**：只需維護一個服務
5. ✅ **效能優化**：靜態資源由 Spring Boot 提供，支援 Gzip 壓縮

---

## 注意事項

### 環境變數檢查

- `import.meta.env.PROD`：Vite 自動設定
  - 開發模式（`npm run dev`）：`false`
  - 生產模式（`npm run build`）：`true`

### WebSocket 連線

- 開發環境：`ws://localhost:8080/ws`
- 生產環境：`ws://{當前域名}/ws` 或 `wss://{當前域名}/ws`（HTTPS）

### H2 Database

生產環境建議：
- 關閉 H2 Console（`spring.h2.console.enabled: false`）
- 使用 PostgreSQL/MySQL 等生產級資料庫

---

## 故障排除

### 問題 1: 前端路由 404

**原因**：SpaConfig 未生效或路徑配置錯誤

**解決**：
1. 確認 `SpaConfig.java` 已編譯
2. 檢查 `static/index.html` 是否存在
3. 重新 build 前端

### 問題 2: API 請求 404

**原因**：API 路徑被 SPA 路由攔截

**解決**：
確認 `SpaConfig.java` 中排除了 `api/` 路徑：
```java
if (resourcePath.startsWith("api/")) {
    return null;  // 不處理，交給 Controller
}
```

### 問題 3: WebSocket 連線失敗

**原因**：CORS 配置或路徑錯誤

**解決**：
1. 檢查 `application.yml` 的 `allowed-origins`
2. 確認 `websocketService.ts` 的 `WS_ENDPOINT` 配置
3. 檢查瀏覽器 Console 錯誤訊息

### 問題 4: 靜態資源 404

**原因**：資源路徑錯誤或 build 失敗

**解決**：
1. 檢查 `vite.config.ts` 的 `base` 設定為 `'/'`
2. 確認 `static/` 目錄有檔案
3. 重新執行 `npm run build`

---

## 參考資料

- [Vite 配置文檔](https://vitejs.dev/config/)
- [Spring Boot 靜態資源處理](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.servlet.spring-mvc.static-content)
- [React Router 部署指南](https://reactrouter.com/en/main/start/tutorial#deploying)
