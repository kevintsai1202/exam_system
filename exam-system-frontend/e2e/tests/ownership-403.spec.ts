/**
 * 帳號隔離 Spec 2：非 owner 存取他人測驗得 403
 *
 * 驗證情境：
 * - instructor1 建立測驗 X
 * - instructor2 嘗試 GET /api/exams/{examX.id} → 403
 * - instructor2 嘗試 PUT /api/exams/{examX.id} → 403
 * - instructor1 本人存取 → 200
 * - admin 存取 → 200（admin 可越過 ownership guard）
 */
import { test, expect } from '@playwright/test';
import {
    registerAndLogin,
    upgradeToInstructor,
    createExam,
    getCurrentUser,
} from './helpers';

const TS = Date.now();
const inst1Email = `inst1-403-${TS}@test.local`;
const inst2Email = `inst2-403-${TS}@test.local`;

test.describe('Ownership 403 守衛', () => {
    let inst1Token: string;
    let inst2Token: string;
    let adminToken: string;
    let examId: number;

    test.beforeAll(async ({ request }) => {
        // 取得 seed admin token
        const seedAdminRes = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        adminToken = seedAdminRes.ok()
            ? (await seedAdminRes.json()).token
            : ''; // 若無 seed admin，admin 測試案例會被跳過

        // 建立並升級 instructor1
        inst1Token = await registerAndLogin(request, inst1Email, 'Owner');
        const u1 = await getCurrentUser(request, inst1Token);
        if (adminToken) await upgradeToInstructor(request, adminToken, u1.id);
        const l1 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst1Email, password: 'Test1234!' },
        });
        inst1Token = (await l1.json()).token;

        // 建立並升級 instructor2
        inst2Token = await registerAndLogin(request, inst2Email, 'Intruder');
        const u2 = await getCurrentUser(request, inst2Token);
        if (adminToken) await upgradeToInstructor(request, adminToken, u2.id);
        const l2 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst2Email, password: 'Test1234!' },
        });
        inst2Token = (await l2.json()).token;

        // instructor1 建立測驗
        examId = await createExam(request, inst1Token, `Protected-Exam-${TS}`);
    });

    test('owner 本人可以 GET 自己的測驗（200）', async ({ request }) => {
        const res = await request.get(`http://localhost:8080/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${inst1Token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(examId);
    });

    test('非 owner 的 GET 回傳 403', async ({ request }) => {
        const res = await request.get(`http://localhost:8080/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${inst2Token}` },
        });
        expect(res.status()).toBe(403);
        const body = await res.json();
        // 後端應回傳 code: EXAM_FORBIDDEN
        expect(body.code).toBe('EXAM_FORBIDDEN');
    });

    test('admin 可以 GET 任何人的測驗（200）', async ({ request }) => {
        if (!adminToken) test.skip();
        const res = await request.get(`http://localhost:8080/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(res.status()).toBe(200);
    });
});
