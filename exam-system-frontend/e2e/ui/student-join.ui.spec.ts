/**
 * UI Spec: 學員加入測驗流程
 *
 * 測試情境：
 * - 以 URL 帶 accessCode 參數進入頁面，驗證欄位自動填入
 * - 填寫完整表單（地區選擇）並提交，驗證跳轉至答題頁面
 *
 * 前置條件：
 * - Docker 全部服務已啟動（db + backend + frontend + gateway）
 * - /student/join 受 ProtectedRoute 保護，需先登入
 */
import { test, expect, type Page } from '@playwright/test';

const TS = Date.now();
/** 測試用 instructor email（建立測驗用） */
const instEmail = `inst-ui-join-${TS}@test.local`;
/** 測試用 student email（登入後可進入 /student/join） */
const studentEmail = `student-ui-join-${TS}@test.local`;
/** 直接呼叫後端 API（不走 gateway） */
const BACKEND = 'http://localhost:8080';

test.describe('學員加入測驗 UI 流程', () => {
    /** 目標測驗的存取碼 */
    let examAccessCode: string;
    /** 目標測驗 ID（驗證跳轉 URL） */
    let examId: number;
    /** 學員的 JWT token（注入至 localStorage 讓 ProtectedRoute 通過） */
    let studentToken: string;
    /** 學員的 user 物件（Zustand persist 需要） */
    let studentUser: Record<string, unknown>;

    test.beforeAll(async ({ request }) => {
        // 1. 登入 admin
        const adminRes = await request.post(`${BACKEND}/api/auth/login`, {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        if (!adminRes.ok()) throw new Error(`Admin login failed [${adminRes.status()}]`);
        const adminToken = (await adminRes.json()).token;

        // 2. 建立並升級 instructor
        const regInstRes = await request.post(`${BACKEND}/api/auth/register`, {
            data: { name: 'UI Join Instructor', email: instEmail, password: 'Test1234!' },
        });
        if (!regInstRes.ok()) throw new Error(`register instructor failed: ${await regInstRes.text()}`);
        let instToken = (await regInstRes.json()).token;

        const instUserRes = await request.get(`${BACKEND}/api/auth/user`, {
            headers: { Authorization: `Bearer ${instToken}` },
        });
        const instUserId = (await instUserRes.json()).user.id;
        await request.post(`${BACKEND}/api/roles/upgrade/${instUserId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        // 3. 重新登入取得含 INSTRUCTOR 權限的 token
        const instLoginRes = await request.post(`${BACKEND}/api/auth/login`, {
            data: { email: instEmail, password: 'Test1234!' },
        });
        instToken = (await instLoginRes.json()).token;

        // 4. 建立測驗（最小化格式，不含調查欄位以避免必填驗證）
        const examRes = await request.post(`${BACKEND}/api/exams`, {
            headers: { Authorization: `Bearer ${instToken}` },
            data: {
                title: `UI-Join-Exam-${TS}`,
                description: '',
                questionTimeLimit: 30,
                questions: [{
                    questionOrder: 1,
                    questionText: '測試題目',
                    correctOptionOrder: 1,
                    singleStatChartType: 'BAR',
                    cumulativeChartType: 'BAR',
                    options: [
                        { optionOrder: 1, optionText: '選項 A' },
                        { optionOrder: 2, optionText: '選項 B' },
                    ],
                }],
            },
        });
        if (!examRes.ok()) throw new Error(`createExam failed: ${await examRes.text()}`);
        examId = (await examRes.json()).id;

        // 5. 啟動測驗取得 accessCode
        const startRes = await request.put(`${BACKEND}/api/exams/${examId}/start`, {
            headers: {
                Authorization: `Bearer ${instToken}`,
                'X-Base-URL': 'http://localhost',
            },
        });
        if (!startRes.ok()) throw new Error(`startExam failed: ${await startRes.text()}`);
        examAccessCode = (await startRes.json()).accessCode;

        // 6. 建立學員帳號（ProtectedRoute 需要登入才能進入 /student/join）
        const regStudentRes = await request.post(`${BACKEND}/api/auth/register`, {
            data: { name: `UI-Student-${TS}`, email: studentEmail, password: 'Test1234!' },
        });
        if (!regStudentRes.ok()) throw new Error(`register student failed: ${await regStudentRes.text()}`);
        studentToken = (await regStudentRes.json()).token;

        // 7. 取得完整 user 物件
        const stuUserRes = await request.get(`${BACKEND}/api/auth/user`, {
            headers: { Authorization: `Bearer ${studentToken}` },
        });
        studentUser = (await stuUserRes.json()).user;
    });

    /**
     * 注入學員 JWT token 到 Zustand persist localStorage，讓 ProtectedRoute 通過。
     * 必須在 page.goto() 之前呼叫。
     */
    const injectStudentAuth = async (page: Page): Promise<void> => {
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
            { token: studentToken, user: studentUser },
        );
    };

    test('URL 帶 accessCode 參數應自動填入加入碼欄位', async ({ page }) => {
        if (!examAccessCode) test.skip();

        await injectStudentAuth(page);
        await page.goto(`/student/join?accessCode=${examAccessCode}`);

        // 等待加入碼欄位出現並確認已自動填入
        const input = page.locator('input[placeholder="請輸入加入碼"]');
        await expect(input).toHaveValue(examAccessCode, { timeout: 10_000 });
    });

    test('填寫完整表單並提交 → 跳轉至答題頁面', async ({ page }) => {
        if (!examAccessCode) test.skip();

        await injectStudentAuth(page);
        await page.goto(`/student/join?accessCode=${examAccessCode}`);

        // 等待加入碼欄位（確認頁面已載入）
        await page.waitForSelector('input[placeholder="請輸入加入碼"]', { timeout: 10_000 });

        // 姓名和 Email 會由 authUser 自動填入（setName/setEmail 使用 authUser）
        // 如果沒有自動填入則手動填寫
        const nameInput = page.locator('input[placeholder="請輸入您的姓名"]');
        const nameValue = await nameInput.inputValue().catch(() => '');
        if (!nameValue) {
            await nameInput.fill(`UI-Student-${TS}`);
        }

        const emailInput = page.locator('input[placeholder="請輸入您的 Email"]');
        const emailValue = await emailInput.inputValue().catch(() => '');
        if (!emailValue) {
            await emailInput.fill(studentEmail);
        }

        // 選擇地區：點擊「美國」海外按鈕（避免操作複雜的 TaiwanMap SVG）
        await page.click('button:has-text("美國")');

        // 點擊提交按鈕（type="submit"）
        await page.click('button[type="submit"]');

        // 驗證跳轉至答題頁面
        await page.waitForURL(`**/student/exam/${examId}**`, { timeout: 15_000 });
        expect(page.url()).toContain(`/student/exam/${examId}`);
    });
});
