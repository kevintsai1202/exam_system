/**
 * 帳號隔離 Spec 4：學員加入測驗後建立 instructor-student 關聯
 *
 * 驗證情境：
 * - instructor1 建立並啟動測驗
 * - 學員以 accessCode 加入
 * - GET /api/instructor/students 應回傳該學員（含 email/name）
 * - instructor2 的 GET /api/instructor/students 不包含該學員
 * - admin 的 GET /api/instructor/students 可看到所有關聯（含 instructorId 欄位）
 */
import { test, expect } from '@playwright/test';
import {
    registerAndLogin,
    upgradeToInstructor,
    createExam,
    getCurrentUser,
} from './helpers';

const TS = Date.now();
const inst1Email = `inst1-rel-${TS}@test.local`;
const inst2Email = `inst2-rel-${TS}@test.local`;

test.describe('學員加入後建立 instructor-student 關聯', () => {
    let inst1Token: string;
    let inst2Token: string;
    let adminToken: string;
    let examAccessCode: string;

    test.beforeAll(async ({ request }) => {
        const seedAdminRes = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        if (!seedAdminRes.ok()) return;
        adminToken = (await seedAdminRes.json()).token;

        // 建立並升級 instructor1
        inst1Token = await registerAndLogin(request, inst1Email, 'Relation Instructor 1');
        const u1 = await getCurrentUser(request, inst1Token);
        await upgradeToInstructor(request, adminToken, u1.id);
        const l1 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst1Email, password: 'Test1234!' },
        });
        inst1Token = (await l1.json()).token;

        // 建立並升級 instructor2
        inst2Token = await registerAndLogin(request, inst2Email, 'Relation Instructor 2');
        const u2 = await getCurrentUser(request, inst2Token);
        await upgradeToInstructor(request, adminToken, u2.id);
        const l2 = await request.post('http://localhost:8080/api/auth/login', {
            data: { email: inst2Email, password: 'Test1234!' },
        });
        inst2Token = (await l2.json()).token;

        // instructor1 建立測驗並取得 accessCode
        const examId = await createExam(request, inst1Token, `Relation-Exam-${TS}`);

        // 啟動測驗（必須 STARTED 狀態學員才能加入）
        const startRes = await request.put(`http://localhost:8080/api/exams/${examId}/start`, {
            headers: {
                Authorization: `Bearer ${inst1Token}`,
                'X-Base-URL': 'http://localhost:5173',
            },
        });
        if (!startRes.ok()) {
            throw new Error(`start exam failed [${startRes.status()}]: ${await startRes.text()}`);
        }
        const startBody = await startRes.json();
        examAccessCode = startBody.accessCode;
    });

    test('學員以 accessCode 加入測驗', async ({ request }) => {
        if (!adminToken || !examAccessCode) test.skip();

        const joinRes = await request.post('http://localhost:8080/api/students/join', {
            data: {
                accessCode: examAccessCode,
                name: `Student-${TS}`,
                email: `student-join-${TS}@test.local`,
                location: 'TPE',
                avatarIcon: 'cat',
            },
        });
        // join 成功回傳 201 CREATED
        expect(joinRes.status()).toBe(201);
    });

    test('instructor1 的 /instructor/students 包含該學員', async ({ request }) => {
        if (!adminToken || !examAccessCode) test.skip();

        const res = await request.get('http://localhost:8080/api/instructor/students', {
            headers: { Authorization: `Bearer ${inst1Token}` },
        });
        expect(res.status()).toBe(200);

        const students = await res.json();
        // 應至少有一個學員，且 email 為學員加入時填寫的 email
        const found = (students as any[]).find(
            s => s.email === `student-join-${TS}@test.local`
        );
        expect(found).toBeDefined();
        expect(found.examCount).toBeGreaterThanOrEqual(1);
    });

    test('instructor2 的 /instructor/students 不包含 instructor1 的學員', async ({ request }) => {
        if (!adminToken || !examAccessCode) test.skip();

        const res = await request.get('http://localhost:8080/api/instructor/students', {
            headers: { Authorization: `Bearer ${inst2Token}` },
        });
        expect(res.status()).toBe(200);

        const students = await res.json();
        const found = (students as any[]).find(
            s => s.email === `student-join-${TS}@test.local`
        );
        // instructor2 看不到這個學員（沒有關聯）
        expect(found).toBeUndefined();
    });

    test('admin 的 /instructor/students 包含 instructorId 欄位', async ({ request }) => {
        if (!adminToken || !examAccessCode) test.skip();

        const res = await request.get('http://localhost:8080/api/instructor/students', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(res.status()).toBe(200);

        const students = await res.json();
        // admin 視圖每筆都應有 instructorId
        expect(students.length).toBeGreaterThan(0);
        for (const s of students as any[]) {
            expect(s).toHaveProperty('instructorId');
        }
    });
});
