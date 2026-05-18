/**
 * e2e 測試輔助函式
 *
 * 提供 register、login、createExam、upgradeRole 等常用操作，
 * 讓各 spec 檔案不重複實作相同的 HTTP 請求邏輯。
 */
import type { APIRequestContext } from '@playwright/test';

const API = 'http://localhost:8080/api';

/** 最小測驗建立請求格式 */
const MIN_EXAM_BODY = {
    title: '',
    description: '',
    questionTimeLimit: 30,
    questions: [
        {
            questionOrder: 1,
            questionText: '測試題目',
            correctOptionOrder: 1,
            // singleStatChartType / cumulativeChartType 為後端必填欄位
            singleStatChartType: 'BAR',
            cumulativeChartType: 'BAR',
            options: [
                { optionOrder: 1, optionText: '選項 A' },
                { optionOrder: 2, optionText: '選項 B' },
            ],
        },
    ],
};

/**
 * 以 Email 方式註冊新帳號，回傳 JWT token
 * @param request Playwright APIRequestContext
 * @param email   唯一 email（測試間不重複）
 * @param role    預設 STUDENT；升為 INSTRUCTOR/ADMIN 由 upgradeRole 另行呼叫
 */
export async function registerAndLogin(
    request: APIRequestContext,
    email: string,
    name = '測試用戶',
): Promise<string> {
    // 先嘗試登入（測試重跑時帳號已存在）
    const loginRes = await request.post(`${API}/auth/login`, {
        data: { email, password: 'Test1234!' },
    });
    if (loginRes.ok()) {
        const body = await loginRes.json();
        return body.token as string;
    }

    // 帳號不存在，先註冊
    const regRes = await request.post(`${API}/auth/register`, {
        data: { name, email, password: 'Test1234!' },
    });
    if (!regRes.ok()) {
        throw new Error(`register failed [${regRes.status()}]: ${await regRes.text()}`);
    }
    const body = await regRes.json();
    return body.token as string;
}

/**
 * 用 admin token 將指定 userId 升級為 INSTRUCTOR
 */
export async function upgradeToInstructor(
    request: APIRequestContext,
    adminToken: string,
    userId: number,
): Promise<void> {
    const res = await request.post(`${API}/roles/upgrade/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok()) {
        throw new Error(`upgradeToInstructor failed [${res.status()}]: ${await res.text()}`);
    }
}

/**
 * 用指定 token 建立測驗，回傳 examId
 */
export async function createExam(
    request: APIRequestContext,
    token: string,
    title: string,
): Promise<number> {
    const res = await request.post(`${API}/exams`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { ...MIN_EXAM_BODY, title },
    });
    if (!res.ok()) {
        throw new Error(`createExam failed [${res.status()}]: ${await res.text()}`);
    }
    const body = await res.json();
    return body.id as number;
}

/**
 * 用指定 token 取得測驗列表，回傳 title 陣列
 */
export async function listExamTitles(
    request: APIRequestContext,
    token: string,
): Promise<string[]> {
    const res = await request.get(`${API}/exams`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) {
        throw new Error(`listExams failed [${res.status()}]: ${await res.text()}`);
    }
    const exams = await res.json();
    return (exams as any[]).map(e => e.title as string);
}

/**
 * 取得當前登入用戶資訊（userId 等）
 */
export async function getCurrentUser(
    request: APIRequestContext,
    token: string,
): Promise<{ id: number; role: string; email: string }> {
    const res = await request.get(`${API}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) throw new Error(`getCurrentUser failed [${res.status()}]`);
    const body = await res.json();
    return body.user as { id: number; role: string; email: string };
}
