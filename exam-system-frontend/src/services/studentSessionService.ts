/**
 * 學員會話服務
 * 處理學員 Gmail 綁定與斷線重連
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD
    ? ''  // 生產環境：相對路徑
    : 'http://localhost:8080'); // 開發環境：完整 URL

export interface StudentSessionInfo {
    id: number;
    sessionId: string;
    examId: number;
    name: string;
    email: string;
    googleEmail?: string;
    avatarIcon: string;
    totalScore: number;
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
    sessionStorage.setItem('oauthReturnTo', nextReturnUrl);
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
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
