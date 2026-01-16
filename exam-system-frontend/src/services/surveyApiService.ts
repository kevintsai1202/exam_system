/**
 * 問券調查 API 服務
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
    Survey,
    CreateSurveyRequest,
    SurveyResponse,
    SurveyStatistics
} from '../types/survey.types';

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
 * 問券調查 API
 */
export const surveyApi = {
    /**
     * 建立問券
     */
    createSurvey: async (data: CreateSurveyRequest): Promise<Survey> => {
        const response = await apiClient.post<Survey>('/surveys', data);
        return response.data;
    },

    /**
     * 更新問券
     */
    updateSurvey: async (id: number, data: Partial<CreateSurveyRequest>): Promise<Survey> => {
        const response = await apiClient.put<Survey>(`/surveys/${id}`, data);
        return response.data;
    },

    /**
     * 取得單一問券
     */
    getSurvey: async (id: number): Promise<Survey> => {
        const response = await apiClient.get<Survey>(`/surveys/${id}`);
        return response.data;
    },

    /**
     * 取得所有問券列表
     */
    getAllSurveys: async (): Promise<Survey[]> => {
        const response = await apiClient.get<Survey[]>('/surveys');
        return response.data;
    },

    /**
     * 取得測驗的問券列表
     */
    getSurveysByExamId: async (examId: number): Promise<Survey[]> => {
        const response = await apiClient.get<Survey[]>(`/exams/${examId}/surveys`);
        return response.data;
    },

    /**
     * 啟用問券
     */
    activateSurvey: async (id: number): Promise<Survey> => {
        const response = await apiClient.put<Survey>(`/surveys/${id}/activate`);
        return response.data;
    },

    /**
     * 關閉問券
     */
    closeSurvey: async (id: number): Promise<Survey> => {
        const response = await apiClient.put<Survey>(`/surveys/${id}/close`);
        return response.data;
    },

    /**
     * 刪除問券
     */
    deleteSurvey: async (id: number): Promise<void> => {
        await apiClient.delete(`/surveys/${id}`);
    },

    /**
     * 提交問券回覆
     */
    submitResponse: async (surveyId: number, data: Omit<SurveyResponse, 'id' | 'surveyId'>): Promise<SurveyResponse> => {
        const response = await apiClient.post<SurveyResponse>(`/surveys/${surveyId}/responses`, data);
        return response.data;
    },

    /**
     * 取得問券統計
     */
    getSurveyStatistics: async (id: number): Promise<SurveyStatistics> => {
        const response = await apiClient.get<SurveyStatistics>(`/surveys/${id}/statistics`);
        return response.data;
    },
};

export default surveyApi;
