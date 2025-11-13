/**
 * API Service - HTTP REST API 呼叫封裝
 *
 * 負責所有與後端 REST API 的通訊
 * 使用 axios 進行 HTTP 請求
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type {
  // 測驗相關型別
  Exam,
  CreateExamRequest,
  StartExamResponse,
  StartQuestionResponse,
  QuestionsResponse,

  // 學員相關型別
  JoinExamRequest,
  JoinExamResponse,
  StudentsResponse,

  // 答案相關型別
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  StudentAnswersResponse,

  // 統計相關型別
  QuestionStatistics,
  CumulativeStatistics,
  Leaderboard,
  OccupationDistribution,
  SurveyFieldDistribution,

  // 調查欄位相關型別
  SurveyField
} from '../types';

// API Base URL
// 開發環境使用完整 URL，生產環境使用相對路徑
const API_BASE_URL = import.meta.env.PROD
  ? '/api'  // 生產環境：相對路徑
  : 'http://localhost:8080/api'; // 開發環境：完整 URL

/**
 * API 錯誤介面
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

/**
 * Axios 實例配置
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 請求攔截器 - 可添加共用 headers (如 token)
 */
apiClient.interceptors.request.use(
  (config) => {
    // 未來可在此添加 Authorization token
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 回應攔截器 - 統一錯誤處理
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 優先使用後端返回的錯誤訊息
    let errorMessage = error.message;
    if (error.response?.data) {
      const errorData = error.response.data as any;
      // 後端返回的錯誤格式：{ message: string, code?: string, ... }
      errorMessage = errorData.message || errorData.error || errorMessage;
    }

    const apiError: ApiError = {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    };

    // 可在此添加全域錯誤處理邏輯
    console.error('API Error:', apiError);

    return Promise.reject(apiError);
  }
);

/**
 * 測驗相關 API
 */
export const examApi = {
  /**
   * 建立測驗
   * POST /api/exams
   */
  createExam: async (data: CreateExamRequest): Promise<Exam> => {
    const response = await apiClient.post<Exam>('/exams', data);
    return response.data;
  },

  /**
   * 取得所有測驗
   * GET /api/exams
   */
  getAllExams: async (): Promise<Exam[]> => {
    const response = await apiClient.get<Exam[]>('/exams');
    return response.data;
  },

  /**
   * 取得測驗資訊
   * GET /api/exams/{examId}
   */
  getExam: async (examId: number): Promise<Exam> => {
    const response = await apiClient.get<Exam>(`/exams/${examId}`);
    return response.data;
  },

  /**
   * 透過 accessCode 取得測驗預覽資訊（學員加入時使用）
   * GET /api/exams/preview?accessCode={accessCode}
   */
  getExamPreview: async (accessCode: string): Promise<Exam> => {
    const response = await apiClient.get<Exam>('/exams/preview', {
      params: { accessCode },
    });
    return response.data;
  },

  /**
   * 啟動測驗
   * PUT /api/exams/{examId}/start
   * 回傳包含 instructorSessionId 的測驗資訊
   */
  startExam: async (examId: number): Promise<StartExamResponse> => {
    const response = await apiClient.put<StartExamResponse>(`/exams/${examId}/start`);
    return response.data;
  },

  /**
   * 開始題目（需要講師 Session ID）
   * PUT /api/exams/{examId}/questions/{questionIndex}/start
   */
  startQuestion: async (examId: number, questionIndex: number, instructorSessionId: string): Promise<StartQuestionResponse> => {
    const response = await apiClient.put<StartQuestionResponse>(`/exams/${examId}/questions/${questionIndex}/start`, {}, {
      headers: {
        'Instructor-Session-Id': instructorSessionId,
      },
    });
    return response.data;
  },

  /**
   * 結束測驗（需要講師 Session ID）
   * PUT /api/exams/{examId}/end
   */
  endExam: async (examId: number, instructorSessionId: string): Promise<Exam> => {
    const response = await apiClient.put<Exam>(`/exams/${examId}/end`, {}, {
      headers: {
        'Instructor-Session-Id': instructorSessionId,
      },
    });
    return response.data;
  },

  /**
   * 複製測驗
   * POST /api/exams/{examId}/duplicate
   */
  duplicateExam: async (examId: number): Promise<Exam> => {
    const response = await apiClient.post<Exam>(`/exams/${examId}/duplicate`);
    return response.data;
  },

  /**
   * 更新測驗
   * PUT /api/exams/{examId}
   */
  updateExam: async (examId: number, examData: CreateExamRequest): Promise<Exam> => {
    const response = await apiClient.put<Exam>(`/exams/${examId}`, examData);
    return response.data;
  },

  /**
   * 取得題目列表
   * GET /api/exams/{examId}/questions
   */
  getQuestions: async (examId: number): Promise<QuestionsResponse> => {
    const response = await apiClient.get<QuestionsResponse>(`/exams/${examId}/questions`);
    return response.data;
  },

  /**
   * 清除測驗 Session
   * DELETE /api/exams/{examId}/session
   */
  clearExamSession: async (examId: number): Promise<void> => {
    await apiClient.delete(`/exams/${examId}/session`);
  },

  /**
   * 調整題目順序
   * PUT /api/exams/{examId}/questions/reorder
   */
  reorderQuestions: async (examId: number, questionIds: number[]): Promise<{ message: string; referenceId: number; newOrder: number[] }> => {
    const response = await apiClient.put(`/exams/${examId}/questions/reorder`, {
      ids: questionIds,
    });
    return response.data;
  },

  /**
   * 調整選項順序
   * PUT /api/exams/{examId}/questions/{questionId}/options/reorder
   */
  reorderOptions: async (examId: number, questionId: number, optionIds: number[]): Promise<{ message: string; referenceId: number; newOrder: number[] }> => {
    const response = await apiClient.put(`/exams/${examId}/questions/${questionId}/options/reorder`, {
      ids: optionIds,
    });
    return response.data;
  },
};

/**
 * 學員相關 API
 */
export const studentApi = {
  /**
   * 學員加入測驗
   * POST /api/students/join
   */
  joinExam: async (data: JoinExamRequest): Promise<JoinExamResponse> => {
    const response = await apiClient.post<JoinExamResponse>('/students/join', data);
    return response.data;
  },

  /**
   * 取得學員資訊
   * GET /api/students/session/{sessionId}
   */
  getStudent: async (sessionId: string): Promise<JoinExamResponse> => {
    const response = await apiClient.get<JoinExamResponse>(`/students/session/${sessionId}`);
    return response.data;
  },

  /**
   * 取得學員列表
   * GET /api/exams/{examId}/students
   */
  getStudents: async (examId: number): Promise<StudentsResponse> => {
    const response = await apiClient.get<StudentsResponse>(`/exams/${examId}/students`);
    return response.data;
  },
};

/**
 * 答案相關 API
 */
export const answerApi = {
  /**
   * 提交答案
   * POST /api/answers
   */
  submitAnswer: async (data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
    const response = await apiClient.post<SubmitAnswerResponse>('/answers', data);
    return response.data;
  },

  /**
   * 取得學員答案記錄
   * GET /api/students/session/{sessionId}/answers
   */
  getStudentAnswers: async (sessionId: string): Promise<StudentAnswersResponse> => {
    const response = await apiClient.get<StudentAnswersResponse>(`/students/session/${sessionId}/answers`);
    return response.data;
  },
};

/**
 * 統計相關 API
 */
export const statisticsApi = {
  /**
   * 取得單題統計
   * GET /api/statistics/exams/{examId}/questions/{questionId}
   */
  getQuestionStatistics: async (examId: number, questionId: number): Promise<QuestionStatistics> => {
    const response = await apiClient.get<QuestionStatistics>(
      `/statistics/exams/${examId}/questions/${questionId}`
    );
    return response.data;
  },

  /**
   * 取得累積統計
   * GET /api/statistics/exams/{examId}/cumulative
   */
  getCumulativeStatistics: async (examId: number): Promise<CumulativeStatistics> => {
    const response = await apiClient.get<CumulativeStatistics>(
      `/statistics/exams/${examId}/cumulative`
    );
    return response.data;
  },

  /**
   * 取得排行榜
   * GET /api/statistics/exams/{examId}/leaderboard
   */
  getLeaderboard: async (examId: number): Promise<Leaderboard> => {
    const response = await apiClient.get<Leaderboard>(`/statistics/exams/${examId}/leaderboard`);
    return response.data;
  },

  /**
   * 取得職業分布統計（保留向下兼容）
   * GET /api/statistics/exams/{examId}/occupation-distribution
   */
  getOccupationDistribution: async (examId: number): Promise<OccupationDistribution> => {
    const response = await apiClient.get<OccupationDistribution>(
      `/statistics/exams/${examId}/occupation-distribution`
    );
    return response.data;
  },

  /**
   * 取得指定調查欄位的分布統計
   * GET /api/statistics/exams/{examId}/survey-fields/{fieldKey}
   */
  getSurveyFieldDistribution: async (
    examId: number,
    fieldKey: string
  ): Promise<SurveyFieldDistribution> => {
    const response = await apiClient.get<SurveyFieldDistribution>(
      `/statistics/exams/${examId}/survey-fields/${fieldKey}`
    );
    return response.data;
  },

  /**
   * 取得測驗所有調查欄位的分布統計
   * GET /api/statistics/exams/{examId}/survey-fields
   */
  getAllSurveyFieldDistributions: async (examId: number): Promise<SurveyFieldDistribution[]> => {
    const response = await apiClient.get<SurveyFieldDistribution[]>(
      `/statistics/exams/${examId}/survey-fields`
    );
    return response.data;
  },
};

// ==================== 調查欄位 API ====================

/**
 * 調查欄位相關 API
 */
export const surveyFieldApi = {
  /**
   * 取得所有調查欄位
   * GET /api/survey-fields?activeOnly=true
   */
  getAllSurveyFields: async (activeOnly: boolean = false): Promise<SurveyField[]> => {
    const response = await apiClient.get<SurveyField[]>('/survey-fields', {
      params: { activeOnly },
    });
    return response.data;
  },

  /**
   * 取得單一調查欄位
   * GET /api/survey-fields/{id}
   */
  getSurveyField: async (id: number): Promise<SurveyField> => {
    const response = await apiClient.get<SurveyField>(`/survey-fields/${id}`);
    return response.data;
  },

  /**
   * 根據欄位鍵值取得調查欄位
   * GET /api/survey-fields/by-key/{fieldKey}
   */
  getSurveyFieldByKey: async (fieldKey: string): Promise<SurveyField> => {
    const response = await apiClient.get<SurveyField>(`/survey-fields/by-key/${fieldKey}`);
    return response.data;
  },

  /**
   * 建立調查欄位
   * POST /api/survey-fields
   */
  createSurveyField: async (data: Omit<SurveyField, 'id' | 'createdAt' | 'updatedAt'>): Promise<SurveyField> => {
    const response = await apiClient.post<SurveyField>('/survey-fields', data);
    return response.data;
  },

  /**
   * 更新調查欄位
   * PUT /api/survey-fields/{id}
   * 注意：fieldKey 雖然不可修改，但後端驗證需要此欄位
   */
  updateSurveyField: async (id: number, data: Omit<SurveyField, 'id' | 'createdAt' | 'updatedAt'>): Promise<SurveyField> => {
    const response = await apiClient.put<SurveyField>(`/survey-fields/${id}`, data);
    return response.data;
  },

  /**
   * 刪除調查欄位
   * DELETE /api/survey-fields/{id}
   */
  deleteSurveyField: async (id: number): Promise<void> => {
    await apiClient.delete(`/survey-fields/${id}`);
  },
};

/**
 * 匯出所有 API
 */
export default {
  exam: examApi,
  student: studentApi,
  answer: answerApi,
  statistics: statisticsApi,
  surveyField: surveyFieldApi,
};
