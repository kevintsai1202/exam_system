/**
 * UI Spec: 講師登入與儀表板操作
 *
 * 測試情境：
 * - 透過 Email 登入表單完成登入並進入講師主控台
 * - 注入 JWT token 到 localStorage 後直接進入主控台（快速驗證 Dashboard UI）
 * - 點擊「建立新測驗」按鈕後跳轉至測驗建立頁
 *
 * 前置條件：
 * - Docker 全部服務已啟動（db + backend + frontend + gateway）
 * - 後端 admin@example.com 帳號存在
 */
import { test, expect, type Page } from '@playwright/test';

const TS = Date.now();
/** 測試用 instructor email */
const instEmail = `inst-ui-dash-${TS}@test.local`;
const instPassword = 'Test1234!';
/** 直接呼叫後端 API（不走 gateway） */
const BACKEND = 'http://localhost:8080';

test.describe('講師 UI 流程', () => {
    /** 透過 API 取得的 JWT token（含 INSTRUCTOR 權限） */
    let instToken: string;
    /** 完整的 user 物件（注入 Zustand persist 需要） */
    let instUser: Record<string, unknown>;

    test.beforeAll(async ({ request }) => {
        // 1. 登入 admin
        const adminRes = await request.post(`${BACKEND}/api/auth/login`, {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        if (!adminRes.ok()) throw new Error('Admin login failed');
        const adminToken = (await adminRes.json()).token;

        // 2. 建立 instructor 帳號
        const regRes = await request.post(`${BACKEND}/api/auth/register`, {
            data: { name: 'Dashboard UI Instructor', email: instEmail, password: instPassword },
        });
        if (!regRes.ok()) throw new Error(`register failed: ${await regRes.text()}`);

        // 3. 取得 userId 並升為 INSTRUCTOR
        let currentToken = (await regRes.json()).token;
        const userRes = await request.get(`${BACKEND}/api/auth/user`, {
            headers: { Authorization: `Bearer ${currentToken}` },
        });
        const userId = (await userRes.json()).user.id;
        await request.post(`${BACKEND}/api/roles/upgrade/${userId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        // 4. 重新登入取得含 INSTRUCTOR 權限的 token
        const loginRes = await request.post(`${BACKEND}/api/auth/login`, {
            data: { email: instEmail, password: instPassword },
        });
        instToken = (await loginRes.json()).token;

        // 5. 取得完整 user 物件（Zustand persist 需要 user 資訊才能正確渲染角色）
        const fullUserRes = await request.get(`${BACKEND}/api/auth/user`, {
            headers: { Authorization: `Bearer ${instToken}` },
        });
        instUser = (await fullUserRes.json()).user;
    });

    /**
     * 將 JWT token 注入 Zustand persist 的 localStorage，讓頁面一載入即為已登入狀態。
     * 必須在 page.goto() 之前呼叫，因為 addInitScript 在每次 navigation 前執行。
     */
    const injectAuth = async (page: Page): Promise<void> => {
        await page.addInitScript(
            ({ token, user }) => {
                window.localStorage.setItem(
                    'auth-storage',
                    JSON.stringify({
                        state: { token, user, isAuthenticated: true, isLoading: false, error: null },
                        version: 0,
                    }),
                );
            },
            { token: instToken, user: instUser },
        );
    };

    test('Email 登入表單 → 成功登入後可進入講師主控台', async ({ page }) => {
        await page.goto('/login');

        // 填寫 Email 與密碼
        await page.fill('input[placeholder="Email"]', instEmail);
        await page.fill('input[placeholder="密碼"]', instPassword);
        await page.click('button.email-submit-btn');

        // 等待離開 /login 頁面（後端驗證後會跳轉）
        await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 });

        // 手動導向講師主控台（登入後預設跳 /，不一定跳 /instructor）
        await page.goto('/instructor');
        await expect(page.locator('h1:has-text("講師主控台")')).toBeVisible({ timeout: 10_000 });
    });

    test('注入 token 後講師主控台顯示「建立新測驗」按鈕', async ({ page }) => {
        await injectAuth(page);
        await page.goto('/instructor');
        // 等待並確認建立新測驗按鈕可見
        await expect(page.locator('button:has-text("建立新測驗")')).toBeVisible({ timeout: 10_000 });
    });

    test('點擊「建立新測驗」→ 跳轉至測驗建立頁', async ({ page }) => {
        await injectAuth(page);
        await page.goto('/instructor');
        // 等待按鈕出現後點擊
        await page.waitForSelector('button:has-text("建立新測驗")', { timeout: 10_000 });
        await page.click('button:has-text("建立新測驗")');
        // 驗證跳轉至 /instructor/exam/create
        await page.waitForURL('**/instructor/exam/create**', { timeout: 10_000 });
        expect(page.url()).toContain('/instructor/exam/create');
    });
});
