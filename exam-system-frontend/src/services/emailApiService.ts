/**
 * 郵件 API 服務
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
    EmailTemplate,
    CreateEmailTemplateRequest,
    EmailCampaign,
    CreateEmailCampaignRequest
} from '../types/email.types';

// API 基礎 URL
const API_BASE_URL = import.meta.env.PROD
    ? '/api'
    : 'http://localhost:8080/api';

// Axios 實例
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * 郵件範本 API
 */
export const emailTemplateApi = {
    /**
     * 建立郵件範本
     */
    createTemplate: async (data: CreateEmailTemplateRequest): Promise<EmailTemplate> => {
        const response = await apiClient.post<EmailTemplate>('/email-templates', data);
        return response.data;
    },

    /**
     * 更新郵件範本
     */
    updateTemplate: async (id: number, data: Partial<CreateEmailTemplateRequest>): Promise<EmailTemplate> => {
        const response = await apiClient.put<EmailTemplate>(`/email-templates/${id}`, data);
        return response.data;
    },

    /**
     * 取得單一郵件範本
     */
    getTemplate: async (id: number): Promise<EmailTemplate> => {
        const response = await apiClient.get<EmailTemplate>(`/email-templates/${id}`);
        return response.data;
    },

    /**
     * 取得所有郵件範本
     */
    getAllTemplates: async (): Promise<EmailTemplate[]> => {
        const response = await apiClient.get<EmailTemplate[]>('/email-templates');
        return response.data;
    },

    /**
     * 刪除郵件範本
     */
    deleteTemplate: async (id: number): Promise<void> => {
        await apiClient.delete(`/email-templates/${id}`);
    },
};

/**
 * 郵件活動 API
 */
export const emailCampaignApi = {
    /**
     * 建立郵件活動
     */
    createCampaign: async (data: CreateEmailCampaignRequest): Promise<EmailCampaign> => {
        const response = await apiClient.post<EmailCampaign>('/email-campaigns', data);
        return response.data;
    },

    /**
     * 更新郵件活動
     */
    updateCampaign: async (id: number, data: Partial<CreateEmailCampaignRequest>): Promise<EmailCampaign> => {
        const response = await apiClient.put<EmailCampaign>(`/email-campaigns/${id}`, data);
        return response.data;
    },

    /**
     * 取得單一郵件活動
     */
    getCampaign: async (id: number): Promise<EmailCampaign> => {
        const response = await apiClient.get<EmailCampaign>(`/email-campaigns/${id}`);
        return response.data;
    },

    /**
     * 取得所有郵件活動
     */
    getAllCampaigns: async (): Promise<EmailCampaign[]> => {
        const response = await apiClient.get<EmailCampaign[]>('/email-campaigns');
        return response.data;
    },

    /**
     * 取得測驗的郵件活動列表
     */
    getCampaignsByExamId: async (examId: number): Promise<EmailCampaign[]> => {
        const response = await apiClient.get<EmailCampaign[]>(`/exams/${examId}/email-campaigns`);
        return response.data;
    },

    /**
     * 刪除郵件活動
     */
    deleteCampaign: async (id: number): Promise<void> => {
        await apiClient.delete(`/email-campaigns/${id}`);
    },

    /**
     * 新增測驗學員為收件人
     */
    addExamStudentsAsRecipients: async (campaignId: number): Promise<EmailCampaign> => {
        const response = await apiClient.post<EmailCampaign>(`/email-campaigns/${campaignId}/add-exam-students`);
        return response.data;
    },

    /**
     * 發送郵件活動
     */
    sendCampaign: async (id: number): Promise<EmailCampaign> => {
        const response = await apiClient.post<EmailCampaign>(`/email-campaigns/${id}/send`);
        return response.data;
    },

    /**
     * 取得發送狀態
     */
    getCampaignStatus: async (id: number): Promise<EmailCampaign> => {
        const response = await apiClient.get<EmailCampaign>(`/email-campaigns/${id}/status`);
        return response.data;
    },
};

export default {
    template: emailTemplateApi,
    campaign: emailCampaignApi,
};
