/**
 * Phase 1 Tier+Quota API 驗證 Spec
 *
 * 驗證情境：
 * 1. 講師能取得 FREE tier 配額快照，且 AI 相關維度 limitValue === 0（未開放）
 * 2. ADMIN 將講師升為 PAID tier 後，快照反映新 tier，AI 維度 limitValue > 0
 * 3. ADMIN 可查詢指定用戶的 tier 異動歷史，確認升級紀錄存在
 */
import { test, expect } from '@playwright/test';
import { registerAndLogin, upgradeToInstructor, getCurrentUser } from './helpers';

/** 後端 API 根路徑 */
const API = 'http://localhost:8080/api';

// 測試用唯一 email（含時間戳避免跨測試衝突）
const TS = Date.now();
const instEmail = `inst-tier-${TS}@test.local`;
const adminEmail = `admin-tier-${TS}@test.local`;

test.describe('Phase 1 Tier+Quota API 驗證', () => {
    /** 講師 JWT token（beforeAll 建立，所有測試共用） */
    let instToken: string;
    /** 講師 userId */
    let instId: number;
    /** admin JWT token */
    let adminToken: string;

    // 在所有測試前建立帳號並設好角色
    test.beforeAll(async ({ request }) => {
        // 1. 嘗試使用 seed admin（DataInitializer 預建的 admin@example.com / admin123）
        const seedAdminRes = await request.post(`${API}/auth/login`, {
            data: { email: 'admin@example.com', password: 'admin123' },
        });
        if (!seedAdminRes.ok()) {
            // Seed admin 不存在，使用新帳號（需環境有特殊 seed 能力）
            adminToken = await registerAndLogin(request, adminEmail, 'Admin Tier Test');
        } else {
            const body = await seedAdminRes.json();
            adminToken = body.token;
        }

        // 2. 建立講師帳號並升為 INSTRUCTOR
        instToken = await registerAndLogin(request, instEmail, 'Instructor Tier Test');
        const instUser = await getCurrentUser(request, instToken);
        instId = instUser.id;
        await upgradeToInstructor(request, adminToken, instId);

        // 升級後重新登入取得包含新 role 的 JWT
        const reLoginRes = await request.post(`${API}/auth/login`, {
            data: { email: instEmail, password: 'Test1234!' },
        });
        if (!reLoginRes.ok()) {
            throw new Error(`講師重新登入失敗 [${reLoginRes.status()}]: ${await reLoginRes.text()}`);
        }
        instToken = (await reLoginRes.json()).token;
    });

    test('講師看到 FREE tier 配額快照', async ({ request }) => {
        // 講師呼叫 GET /api/quota/snapshot
        const res = await request.get(`${API}/quota/snapshot`, {
            headers: { Authorization: `Bearer ${instToken}` },
        });

        expect(res.ok(), `quota/snapshot 應回傳 200，實際 ${res.status()}: ${await res.text()}`).toBeTruthy();

        const snapshot = await res.json();

        // 驗證 tier 為 FREE
        expect(snapshot.tier).toBe('FREE');

        // 驗證 items 陣列包含全部 7 個維度
        expect(snapshot.items).toHaveLength(7);

        // 找出各維度
        const memberCount = snapshot.items.find((i: any) => i.dimension === 'MEMBER_COUNT');
        const aiGenCount = snapshot.items.find((i: any) => i.dimension === 'AI_QUESTION_GEN_COUNT');

        // FREE tier：MEMBER_COUNT 應有非零配額（已開放）
        expect(memberCount, 'MEMBER_COUNT 維度應存在').toBeTruthy();
        expect(memberCount.limitValue).toBeGreaterThanOrEqual(1);

        // FREE tier：AI_QUESTION_GEN_COUNT limitValue === 0（未開放）
        expect(aiGenCount, 'AI_QUESTION_GEN_COUNT 維度應存在').toBeTruthy();
        expect(aiGenCount.limitValue).toBe(0);
    });

    test('ADMIN 升級講師為 PAID tier 後快照變更', async ({ request }) => {
        // ADMIN 呼叫 PUT /api/users/{id}/tier 升為 PAID
        const upgradeRes = await request.put(`${API}/users/${instId}/tier`, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
            data: {
                targetTier: 'PAID',
                expiresAt: '2027-01-01T00:00:00',
                reason: 'e2e-test upgrade',
            },
        });

        expect(
            upgradeRes.ok(),
            `tier 升級應回傳 2xx，實際 ${upgradeRes.status()}: ${await upgradeRes.text()}`,
        ).toBeTruthy();

        // 講師重新登入取得包含新 tier 資訊的 JWT
        const reLoginRes = await request.post(`${API}/auth/login`, {
            data: { email: instEmail, password: 'Test1234!' },
        });
        expect(reLoginRes.ok(), '講師升級後重新登入應成功').toBeTruthy();
        const newInstToken = (await reLoginRes.json()).token;

        // 用新 token 取得快照
        const snapshotRes = await request.get(`${API}/quota/snapshot`, {
            headers: { Authorization: `Bearer ${newInstToken}` },
        });
        expect(snapshotRes.ok(), `升級後 quota/snapshot 應回傳 200，實際 ${snapshotRes.status()}`).toBeTruthy();

        const snapshot = await snapshotRes.json();

        // 驗證 tier 已升為 PAID
        expect(snapshot.tier).toBe('PAID');

        // PAID tier：AI_QUESTION_GEN_COUNT limitValue > 0（已開放）
        const aiGenCount = snapshot.items.find((i: any) => i.dimension === 'AI_QUESTION_GEN_COUNT');
        expect(aiGenCount, 'AI_QUESTION_GEN_COUNT 維度應存在').toBeTruthy();
        expect(aiGenCount.limitValue).toBeGreaterThan(0);
    });

    test('ADMIN 查看 tier 異動歷史有紀錄', async ({ request }) => {
        // ADMIN 呼叫 GET /api/users/{id}/tier-history
        const res = await request.get(`${API}/users/${instId}/tier-history`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        expect(
            res.ok(),
            `tier-history 應回傳 200，實際 ${res.status()}: ${await res.text()}`,
        ).toBeTruthy();

        const history = await res.json();

        // 驗證有至少一筆異動紀錄
        expect(Array.isArray(history)).toBeTruthy();
        expect(history.length).toBeGreaterThanOrEqual(1);

        // 找出本次升級紀錄（toTier === 'PAID' 且 reason 符合）
        const upgradeRecord = history.find(
            (log: any) => log.toTier === 'PAID' && log.reason === 'e2e-test upgrade',
        );
        expect(upgradeRecord, '應能找到 toTier=PAID 且 reason=e2e-test upgrade 的紀錄').toBeTruthy();
    });
});
