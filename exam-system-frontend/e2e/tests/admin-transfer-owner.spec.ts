/**
 * 帳號隔離 Spec 3：Admin 轉移測驗所有者
 *
 * 驗證情境：
 * - instructor1 建立測驗，admin 將其轉移給 instructor2
 * - 轉移後 instructor1 的列表不再包含該測驗
 * - 轉移後 instructor2 的列表包含該測驗
 * - instructor1 直接 GET 該測驗 → 403
 * - instructor2 直接 GET 該測驗 → 200
 * - 非 INSTRUCTOR 帳號（STUDENT）不能成為 owner → 400
 */
import { test, expect } from '@playwright/test';
import {
    registerAndLogin,
    upgradeToInstructor,
    createExam,
    listExamTitles,
    getCurrentUser,
} from './helpers';

const TS = Date.now();
const inst1Email = `inst1-transfer-${TS}@test.local`;
const inst2Email = `inst2-transfer-${TS}@test.local`;
const studentEmail = `student-transfer-${TS}@test.local`;

test.describe('Admin 轉移 owner', () => {
    let inst1Token: string;
    let inst2Token: string;
    let adminToken: string;
    let inst2UserId: number;
    let studentUserId: number;
    let examId: number;
    const examTitle = `Transfer-Exam-${TS}`;

    test.beforeAll(async ({ request }) => {
        const seedAdminRes = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        if (!seedAdminRes.ok()) {
            // 無 seed admin，跳過整個 describe
            return;
        }
        adminToken = (await seedAdminRes.json()).token;

        // 建立並升級 instructor1
        inst1Token = await registerAndLogin(request, inst1Email, 'Original Owner');
        const u1 = await getCurrentUser(request, inst1Token);
        await upgradeToInstructor(request, adminToken, u1.id);
        const l1 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst1Email, password: 'Test1234!' },
        });
        inst1Token = (await l1.json()).token;

        // 建立並升級 instructor2
        inst2Token = await registerAndLogin(request, inst2Email, 'New Owner');
        const u2 = await getCurrentUser(request, inst2Token);
        inst2UserId = u2.id;
        await upgradeToInstructor(request, adminToken, inst2UserId);
        const l2 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst2Email, password: 'Test1234!' },
        });
        inst2Token = (await l2.json()).token;

        // 建立 student 帳號（不升級，保持 STUDENT 角色）
        const studentToken = await registerAndLogin(request, studentEmail, 'Student User');
        const studentUser = await getCurrentUser(request, studentToken);
        studentUserId = studentUser.id;

        // instructor1 建立測驗
        examId = await createExam(request, inst1Token, examTitle);
    });

    test('轉移前：instructor1 看得到自己的測驗', async ({ request }) => {
        if (!adminToken) test.skip();
        const titles = await listExamTitles(request, inst1Token);
        expect(titles).toContain(examTitle);
    });

    test('轉移前：instructor2 看不到 instructor1 的測驗', async ({ request }) => {
        if (!adminToken) test.skip();
        const titles = await listExamTitles(request, inst2Token);
        expect(titles).not.toContain(examTitle);
    });

    test('嘗試轉移給 STUDENT 角色應回傳錯誤', async ({ request }) => {
        if (!adminToken) test.skip();
        const res = await request.put(`http://localhost:8080/api/exams/${examId}/transfer-owner`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { newOwnerId: studentUserId },
        });
        // 後端應拒絕（400 或 422）
        expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test('admin 成功轉移給 instructor2', async ({ request }) => {
        if (!adminToken) test.skip();
        const res = await request.put(`http://localhost:8080/api/exams/${examId}/transfer-owner`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { newOwnerId: inst2UserId },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.ownerId).toBe(inst2UserId);
    });

    test('轉移後：instructor1 列表不再含該測驗', async ({ request }) => {
        if (!adminToken) test.skip();
        const titles = await listExamTitles(request, inst1Token);
        expect(titles).not.toContain(examTitle);
    });

    test('轉移後：instructor2 列表包含該測驗', async ({ request }) => {
        if (!adminToken) test.skip();
        const titles = await listExamTitles(request, inst2Token);
        expect(titles).toContain(examTitle);
    });

    test('轉移後：instructor1 直接存取該測驗得 403', async ({ request }) => {
        if (!adminToken) test.skip();
        const res = await request.get(`http://localhost:8080/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${inst1Token}` },
        });
        expect(res.status()).toBe(403);
    });

    test('轉移後：instructor2 可以存取（200）', async ({ request }) => {
        if (!adminToken) test.skip();
        const res = await request.get(`http://localhost:8080/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${inst2Token}` },
        });
        expect(res.status()).toBe(200);
    });
});
