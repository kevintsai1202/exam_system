/**
 * 學員會話服務
 * 處理學員 Gmail 綁定與斷線重連
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD
    ? ''  // 生產環境：相對路徑
    : 'http://localhost:8080'); // 開發環境：完整 URL
const OAUTH_RETURN_TO_KEY = 'oauthReturnTo';
const OAUTH_RETURN_TO_COOKIE_MAX_AGE = 60 * 10;

export interface StudentSessionInfo {
    id: number;
    sessionId: string;
    examId: number;
    name: string;
    email: string;
    surveyData?: Record<string, string>;
    location?: string;
    googleEmail?: string;
    avatarIcon: string;
    totalScore: number;
    correctAnswersCount?: number;
    joinedAt?: string;
    examStatus: string;
    currentQuestion?: {
        questionId: number;
        questionIndex: number;
        questionText: string;
        expiresAt: string;
        options: Array<{
            id: number;
            optionOrder: string;
            optionText: string;
        }>;
    };
}

/**
 * 透過 Gmail 查詢學員會話（用於斷線重連）
 */
export async function getStudentByGmail(email: string): Promise<StudentSessionInfo | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/by-gmail/${encodeURIComponent(email)}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to get student by Gmail:', error);
        return null;
    }
}

/**
 * 透過 Gmail 和測驗 ID 查詢學員會話
 */
export async function getStudentSessionByGmail(
    email: string,
    examId: number
): Promise<StudentSessionInfo | null> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/students/gmail-session?email=${encodeURIComponent(email)}&examId=${examId}`
        );
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to get student session by Gmail:', error);
        return null;
    }
}

/**
 * 透過 Email 和測驗 ID 查詢學員會話
 */
export async function getStudentSessionByEmail(
    email: string,
    examId: number
): Promise<StudentSessionInfo | null> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/students/session?email=${encodeURIComponent(email)}&examId=${examId}`
        );
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to get student session by email:', error);
        return null;
    }
}

/**
 * 綁定 Gmail 到學員
 */
export async function bindGmailToStudent(
    sessionId: string,
    googleId: string,
    googleEmail: string
): Promise<StudentSessionInfo | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${sessionId}/bind-gmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ googleId, googleEmail }),
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Failed to bind Gmail to student:', error);
        return null;
    }
}

/**
 * Google OAuth 登入（重導向方式）
 */
export function initiateGoogleLogin(returnUrl?: string): void {
    const nextReturnUrl = returnUrl || window.location.href;
    storeOAuthReturnTarget(nextReturnUrl);
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

/**
 * 保存 OAuth 返回頁
 * 同時寫入 sessionStorage、localStorage 與 cookie，避免行動裝置跨容器跳轉後遺失返回頁
 */
export function storeOAuthReturnTarget(returnUrl: string): void {
    sessionStorage.setItem(OAUTH_RETURN_TO_KEY, returnUrl);
    localStorage.setItem(OAUTH_RETURN_TO_KEY, returnUrl);
    document.cookie = `${OAUTH_RETURN_TO_KEY}=${encodeURIComponent(returnUrl)}; path=/; max-age=${OAUTH_RETURN_TO_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * 取得 OAuth 返回頁
 * 優先讀取 sessionStorage，若不存在則依序回退至 localStorage 與 cookie
 */
export function getOAuthReturnTarget(): string | null {
    const storageValue = sessionStorage.getItem(OAUTH_RETURN_TO_KEY) || localStorage.getItem(OAUTH_RETURN_TO_KEY);
    if (storageValue) {
        return storageValue;
    }

    const cookiePrefix = `${OAUTH_RETURN_TO_KEY}=`;
    const cookieValue = document.cookie
        .split('; ')
        .find((item) => item.startsWith(cookiePrefix))
        ?.substring(cookiePrefix.length);

    return cookieValue ? decodeURIComponent(cookieValue) : null;
}

/**
 * 清除 OAuth 返回頁暫存
 */
export function clearOAuthReturnTarget(): void {
    sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
    localStorage.removeItem(OAUTH_RETURN_TO_KEY);
    document.cookie = `${OAUTH_RETURN_TO_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * 從 localStorage 取得暫存的 Google 用戶資訊
 */
export interface GoogleUserInfo {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

export function getStoredGoogleUser(): GoogleUserInfo | null {
    const stored = localStorage.getItem('google_user_info');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
}

export function storeGoogleUser(user: GoogleUserInfo): void {
    localStorage.setItem('google_user_info', JSON.stringify(user));
}

export function clearStoredGoogleUser(): void {
    localStorage.removeItem('google_user_info');
}
