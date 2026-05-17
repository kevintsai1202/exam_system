/**
 * Playwright 設定檔
 *
 * 僅使用 APIRequestContext（無瀏覽器），驗證後端帳號隔離行為。
 * 執行前需確保後端服務已在 port 8080 啟動。
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',
    timeout: 30_000,
    // 失敗時不重試（隔離測試具決定性，重試無意義）
    retries: 0,
    use: {
        // 後端 API base URL
        baseURL: 'http://localhost:8080',
    },
    // 只使用 API project，不需要瀏覽器
    projects: [
        {
            name: 'api',
            use: {},
        },
    ],
});
