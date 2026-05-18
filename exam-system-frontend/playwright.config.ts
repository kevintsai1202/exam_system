/**
 * Playwright 設定檔
 *
 * 包含兩個測試專案：
 * - api: API-only 測試（無瀏覽器），驗證後端帳號隔離行為。baseURL = http://localhost:8080
 * - ui-chromium: 瀏覽器 UI 測試，透過 nginx gateway 存取前端。baseURL = http://localhost
 *
 * 執行前需確保 Docker 服務已全部啟動：scripts\run-e2e-docker.ps1
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    retries: 0,
    // 設為 1 防止測試資料互相污染（各 spec 間共用 Docker 狀態）
    workers: 1,
    reporter: 'list',

    projects: [
        // ── API-only 測試：無瀏覽器，直打後端 ──
        {
            name: 'api',
            testDir: './e2e/tests',
            timeout: 30_000,
            use: {
                baseURL: 'http://localhost:8080',
            },
        },

        // ── UI 測試：Chromium 瀏覽器，透過 gateway ──
        {
            name: 'ui-chromium',
            testDir: './e2e/ui',
            timeout: 60_000,
            use: {
                ...devices['Desktop Chrome'],
                // 走 nginx gateway (port 80)，gateway 會把 /api/* 轉到 backend
                baseURL: 'http://localhost',
                // 失敗時截圖與錄影，方便除錯
                screenshot: 'only-on-failure',
                video: 'retain-on-failure',
            },
        },
    ],
});
