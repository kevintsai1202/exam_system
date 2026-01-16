/**
 * 郵件相關型別定義
 */

// 郵件活動狀態枚舉
export enum CampaignStatus {
    DRAFT = 'DRAFT',         // 草稿
    SCHEDULED = 'SCHEDULED', // 已排程
    SENDING = 'SENDING',     // 發送中
    SENT = 'SENT',           // 已發送
    FAILED = 'FAILED'        // 發送失敗
}

// 郵件發送狀態枚舉
export enum DeliveryStatus {
    PENDING = 'PENDING',     // 待發送
    SENT = 'SENT',           // 已發送
    FAILED = 'FAILED'        // 發送失敗
}

// 郵件範本介面
export interface EmailTemplate {
    id: number;                     // 範本 ID
    name: string;                   // 範本名稱
    subject: string;                // 郵件主旨
    htmlContent?: string;           // HTML 內容
    plainTextContent?: string;      // 純文字內容
    createdAt?: string;             // 建立時間
    updatedAt?: string;             // 更新時間
}

// 建立郵件範本請求介面
export interface CreateEmailTemplateRequest {
    name: string;                   // 範本名稱
    subject: string;                // 郵件主旨
    htmlContent?: string;           // HTML 內容
    plainTextContent?: string;      // 純文字內容
}

// 郵件收件人介面
export interface EmailRecipient {
    id?: number;                    // 收件人 ID
    studentId?: number;             // 學員 ID
    email: string;                  // 收件人 Email
    name?: string;                  // 收件人姓名
    status?: DeliveryStatus;        // 發送狀態
    sentAt?: string;                // 發送時間
    errorMessage?: string;          // 錯誤訊息
}

// 郵件活動介面
export interface EmailCampaign {
    id: number;                     // 活動 ID
    examId: number;                 // 測驗 ID
    examTitle?: string;             // 測驗標題
    surveyId?: number;              // 問券 ID
    surveyTitle?: string;           // 問券標題
    templateId?: number;            // 範本 ID
    templateName?: string;          // 範本名稱
    name: string;                   // 活動名稱
    subject: string;                // 郵件主旨
    htmlContent?: string;           // HTML 內容
    status: CampaignStatus;         // 活動狀態
    scheduledAt?: string;           // 排程時間
    sentAt?: string;                // 發送時間
    totalRecipients?: number;       // 總收件人數
    sentCount?: number;             // 已發送數
    failedCount?: number;           // 發送失敗數
    createdAt?: string;             // 建立時間
    updatedAt?: string;             // 更新時間
    recipients?: EmailRecipient[];  // 收件人列表
}

// 建立郵件活動請求介面
export interface CreateEmailCampaignRequest {
    examId: number;                 // 測驗 ID
    surveyId?: number;              // 問券 ID
    templateId?: number;            // 範本 ID
    name: string;                   // 活動名稱
    subject: string;                // 郵件主旨
    htmlContent?: string;           // HTML 內容
    scheduledAt?: string;           // 排程時間
    recipients?: EmailRecipient[];  // 收件人列表
}
