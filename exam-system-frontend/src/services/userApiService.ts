import { apiClient } from './apiService';
import type { User } from '../store/authStore';

export const userApiService = {
    /**
     * 取得所有用戶清單（需 ADMIN 權限）
     */
    getAllUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/roles/users');
        return response.data;
    },

    /**
     * 將用戶升級為講師（需 ADMIN 權限）
     * @param userId 目標用戶 ID
     */
    upgradeToInstructor: async (userId: number): Promise<void> => {
        await apiClient.post(`/roles/upgrade/${userId}`);
    },

    /**
     * 將用戶升級為系統管理員（需 ADMIN 權限）
     * @param userId 目標用戶 ID
     */
    upgradeToAdmin: async (userId: number): Promise<void> => {
        await apiClient.post(`/roles/upgrade-admin/${userId}`);
    },

    /**
     * 更新使用者功能權限（需 ADMIN 權限）
     * @param userId 目標用戶 ID
     * @param features 功能權限設定
     */
    updateUserFeatures: async (
        userId: number,
        features: { surveyManagementEnabled?: boolean; emailManagementEnabled?: boolean }
    ): Promise<void> => {
        await apiClient.put(`/roles/users/${userId}/features`, features);
    },

    /**
     * 刪除指定使用者（需 ADMIN 權限）
     * @param userId 目標用戶 ID
     */
    deleteUser: async (userId: number): Promise<void> => {
        await apiClient.delete(`/roles/users/${userId}`);
    },

    /**
     * 轉移測驗所有者（需 ADMIN 權限）
     * @param examId 測驗 ID
     * @param newOwnerId 新 owner 的用戶 ID（必須為 INSTRUCTOR 或 ADMIN）
     */
    transferExamOwner: async (examId: number, newOwnerId: number): Promise<void> => {
        await apiClient.put(`/exams/${examId}/transfer-owner`, { newOwnerId });
    }
};
