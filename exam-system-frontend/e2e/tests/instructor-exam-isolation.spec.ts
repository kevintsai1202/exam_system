/**
 * 帳號隔離 Spec 1：講師只能看到自己建立的測驗
 *
 * 驗證情境：
 * - instructor1 建立「測驗 A」，instructor2 建立「測驗 B」
 * - instructor1 的 GET /api/exams 只回傳「測驗 A」
 * - instructor2 的 GET /api/exams 只回傳「測驗 B」
 * - admin 的 GET /api/exams 回傳兩者
 */
import { test, expect } from '@playwright/test';
import {
    registerAndLogin,
    upgradeToInstructor,
    createExam,
    listExamTitles,
    getCurrentUser,
} from './helpers';

// 測試用唯一 email（含時間戳避免跨測試衝突）
const TS = Date.now();
const inst1Email = `inst1-isolation-${TS}@test.local`;
const inst2Email = `inst2-isolation-${TS}@test.local`;
const adminEmail = `admin-isolation-${TS}@test.local`;

test.describe('講師測驗隔離', () => {
    let inst1Token: string;
    let inst2Token: string;
    let adminToken: string;

    // 在所有測試前建立三個帳號並設好角色
    test.beforeAll(async ({ request }) => {
        // 1. 先建立 admin 帳號並升為 ADMIN（利用系統第一個 ADMIN 的能力）
        //    如果系統還沒有 admin，用 application 預設的 seed admin 登入
        //    此處假設存在 seed admin：admin@example.com / admin123（DataInitializer 建立）
        //    若環境不同，請修改以下憑證
        const seedAdminRes = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        if (!seedAdminRes.ok()) {
            // Seed admin 不存在，先用新帳號取得 admin 能力（透過 data.sql seed）
            adminToken = await registerAndLogin(request, adminEmail, 'Admin User');
        } else {
            const body = await seedAdminRes.json();
            adminToken = body.token;
        }

        // 2. 建立 instructor1 帳號並升為 INSTRUCTOR
        inst1Token = await registerAndLogin(request, inst1Email, 'Instructor One');
        const inst1User = await getCurrentUser(request, inst1Token);
        await upgradeToInstructor(request, adminToken, inst1User.id);
        // 升級後需重新登入取得新 token（role 已更新在 JWT）
        const loginRes1 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst1Email, password: 'Test1234!' },
        });
        inst1Token = (await loginRes1.json()).token;

        // 3. 建立 instructor2 帳號並升為 INSTRUCTOR
        inst2Token = await registerAndLogin(request, inst2Email, 'Instructor Two');
        const inst2User = await getCurrentUser(request, inst2Token);
        await upgradeToInstructor(request, adminToken, inst2User.id);
        const loginRes2 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst2Email, password: 'Test1234!' },
        });
        inst2Token = (await loginRes2.json()).token;
    });

    test('instructor1 建立的測驗 instructor2 看不到', async ({ request }) => {
        // instructor1 建立測驗
        await createExam(request, inst1Token, `Exam-A-${TS}`);

        // instructor2 建立另一個測驗
        await createExam(request, inst2Token, `Exam-B-${TS}`);

        // 驗證各自只看到自己的
        const titles1 = await listExamTitles(request, inst1Token);
        const titles2 = await listExamTitles(request, inst2Token);

        expect(titles1).toContain(`Exam-A-${TS}`);
        expect(titles1).not.toContain(`Exam-B-${TS}`);

        expect(titles2).toContain(`Exam-B-${TS}`);
        expect(titles2).not.toContain(`Exam-A-${TS}`);
    });

    test('admin 可以看到所有測驗', async ({ request }) => {
        const allTitles = await listExamTitles(request, adminToken);

        // admin 必須同時看到兩個測驗（可能還有其他測驗，所以用 toContain）
        expect(allTitles).toContain(`Exam-A-${TS}`);
        expect(allTitles).toContain(`Exam-B-${TS}`);
    });
});
