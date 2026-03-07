/**
 * 講師主控台頁面
 *
 * 顯示講師測驗列表與操作入口
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { examApi } from '../services/apiService';
import { useInstructorStore } from '../store';
import type { Exam, ExamStatus, ExamExportDTO } from '../types';
import { useThemeStore } from '../store/themeStore';

/**
 * 講師主控台頁面
 */
export const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { canManageSurveys, canManageEmails } = useAuthStore();
  const { setInstructorSessionId } = useInstructorStore();
  const { mode } = useThemeStore();

  const isDark = mode === 'dark';

  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicatingExamId, setDuplicatingExamId] = useState<number | null>(null);
  const [clearingSessionExamId, setClearingSessionExamId] = useState<number | null>(null);
  const [exportingExamId, setExportingExamId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * 從 Content-Disposition 解析下載檔名
   */
  const resolveDownloadFilename = (contentDisposition: string | undefined, fallback: string): string => {
    if (!contentDisposition) {
      return fallback;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return basicMatch?.[1] || fallback;
  };

  /**
   * 載入測驗列表
   */
  useEffect(() => {
    const loadExams = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 載入所有測驗列表
        const data = await examApi.getAllExams();
        setExams(data);
      } catch (err: any) {
        console.error('[InstructorDashboard] 載入失敗:', err);
        setError(err.message || '載入測驗列表失敗');
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, []);

  /**
   * 建立新測驗
   */
  const handleCreateExam = () => {
    navigate('/instructor/exam/create');
  };

  /**
   * 前往調查欄位管理頁面
   */
  const handleManageSurveyFields = () => {
    navigate('/instructor/survey-fields');
  };

  /**
   * 前往監控頁面
   */
  const handleMonitorExam = (examId: number) => {
    navigate(`/instructor/exam/${examId}/monitor`);
  };

  /**
   * 複製測驗
   */
  const handleDuplicateExam = async (examId: number, event: React.MouseEvent) => {
    // 阻止事件冒泡，避免觸發卡片的點擊事件
    event.stopPropagation();

    try {
      setDuplicatingExamId(examId);
      setError(null);
      setSuccessMessage(null);

      // 呼叫複製 API
      const newExam = await examApi.duplicateExam(examId);

      // 重新載入測驗列表
      const data = await examApi.getAllExams();
      setExams(data);

      // 顯示成功訊息
      setSuccessMessage(`成功複製測驗：${newExam.title}`);

      // 3 秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('[InstructorDashboard] 複製測驗失敗:', err);
      setError(err.message || '複製測驗失敗');
    } finally {
      setDuplicatingExamId(null);
    }
  };

  /**
   * 匯出測驗為 Markdown 檔案
   */
  const handleExportMarkdown = async (examId: number, includeAnswers: boolean, event: React.MouseEvent) => {
    // 阻止事件冒泡，避免觸發卡片的點擊事件
    event.stopPropagation();

    try {
      setExportingExamId(examId);
      setError(null);
      setSuccessMessage(null);

      // 呼叫匯出 API（透過 apiClient 自動帶入 JWT）
      const { blob, filename: contentDisposition } = await examApi.exportMarkdown(examId, includeAnswers);
      const filename = resolveDownloadFilename(
        contentDisposition,
        `exam_${examId}${includeAnswers ? '_teacher' : '_student'}.md`
      );

      // 建立下載連結
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // 顯示成功訊息
      setSuccessMessage(`成功匯出 ${includeAnswers ? '講師版' : '學員版'} Markdown 檔案`);

      // 3 秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('[InstructorDashboard] 匯出 Markdown 失敗:', err);
      setError(err.message || '匯出 Markdown 失敗');
    } finally {
      setExportingExamId(null);
    }
  };

  /**
   * 匯出測驗為 JSON 檔案
   */
  const handleExportJson = async (examId: number, event: React.MouseEvent) => {
    // 阻止事件冒泡，避免觸發卡片的點擊事件
    event.stopPropagation();

    try {
      setExportingExamId(examId);
      setError(null);
      setSuccessMessage(null);

      // 呼叫匯出 API（透過 apiClient 自動帶入 JWT）
      const { data: jsonData, filename: contentDisposition } = await examApi.exportJson(examId);
      const filename = resolveDownloadFilename(contentDisposition, `exam_${examId}.json`);

      // 建立 Blob 並下載
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // 顯示成功訊息
      setSuccessMessage('成功匯出 JSON 檔案');

      // 3 秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('[InstructorDashboard] 匯出 JSON 失敗:', err);
      setError(err.message || '匯出 JSON 失敗');
    } finally {
      setExportingExamId(null);
    }
  };

  /**
   * 匯入測驗從 JSON 檔案
   */
  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      setSuccessMessage(null);

      // 讀取檔案內容
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent) as ExamExportDTO;

      // 檢查是否包含問卷調查欄位配置
      let importSurveyFields = false;
      if (jsonData.surveyFieldConfigs && jsonData.surveyFieldConfigs.length > 0) {
        // 建立問卷欄位列表字串
        const surveyFieldsList = jsonData.surveyFieldConfigs
          .map((config: any, index: number) => `${index + 1}. ${config.fieldKey}${config.isRequired ? ' (必填)' : ' (選填)'}`)
          .join('\n');

        // 顯示確認對話框
        const confirmMessage = `此測驗包含 ${jsonData.surveyFieldConfigs.length} 個問卷調查欄位：\n\n${surveyFieldsList}\n\n是否一起匯入這些問卷調查欄位配置？\n\n（選擇「取消」將只匯入題目，不匯入問卷配置）`;
        importSurveyFields = confirm(confirmMessage);
      }

      // 呼叫匯入 API（透過 apiClient 自動帶入 JWT）
      const createdExam = await examApi.importExamFromJson(jsonData, importSurveyFields);

      // 重新載入測驗列表
      const data = await examApi.getAllExams();
      setExams(data);

      // 顯示成功訊息
      const surveyFieldsMsg = importSurveyFields ? '（含問卷配置）' : '';
      setSuccessMessage(`成功匯入測驗${surveyFieldsMsg}：${createdExam.title}`);

      // 3 秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // 清除 input 以允許重複匯入相同檔案
      event.target.value = '';
    } catch (err: any) {
      console.error('[InstructorDashboard] 匯入 JSON 失敗:', err);
      setError(err.message || '匯入 JSON 失敗');
      event.target.value = '';
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * 清除測驗 Session
   */
  const handleClearSession = async (examId: number, event: React.MouseEvent) => {
    // 阻止事件冒泡，避免觸發卡片的點擊事件
    event.stopPropagation();

    if (!confirm('確定要清除此測驗的 Session 嗎？清除後需要重新啟動測驗。')) return;

    try {
      setClearingSessionExamId(examId);
      setError(null);
      setSuccessMessage(null);

      // 呼叫後端 API 清除 Session
      await examApi.clearExamSession(examId);

      // 清除 localStorage 中的 Session ID
      const localStorageKey = `exam_${examId}_sessionId`;
      localStorage.removeItem(localStorageKey);
      console.log('[InstructorDashboard] Session ID 已從 localStorage 清除');

      // 清除 store 中的 Session ID
      setInstructorSessionId(null);

      // 顯示成功訊息
      setSuccessMessage('Session 已清除！');

      // 3 秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('[InstructorDashboard] 清除 Session 失敗:', err);
      setError(err.message || '清除 Session 失敗');
    } finally {
      setClearingSessionExamId(null);
    }
  };

  /**
   * 取得狀態標籤樣式
   */
  const getStatusStyle = (status: ExamStatus): React.CSSProperties => {
    switch (status) {
      case 'CREATED':
        return {
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
        };
      case 'STARTED':
        return {
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
        };
      case 'ENDED':
        return {
          backgroundColor: '#f5f5f5',
          color: '#666',
        };
      default:
        return {
          backgroundColor: '#f5f5f5',
          color: '#666',
        };
    }
  };

  /**
   * 取得狀態文字
   */
  const getStatusText = (status: ExamStatus): string => {
    switch (status) {
      case 'CREATED':
        return '已建立';
      case 'STARTED':
        return '進行中';
      case 'ENDED':
        return '已結束';
      default:
        return '未知';
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '18px', color: isDark ? '#fff' : '#666', zIndex: 1 }}>載入中...</div>
      </div>
    );
  }

  // 錯誤
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', flexDirection: 'column', gap: '20px' }}>
        <div style={{ fontSize: '18px', color: '#f44336' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>重新載入</button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 20px',
        position: 'relative',
      }}
    >

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* 頁面標題 */}
        <div
          style={{
            marginBottom: '40px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: '0 0 12px 0',
              fontSize: '36px',
              fontWeight: '700',
              color: isDark ? '#fff' : '#333',
            }}
          >
            講師主控台
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              color: isDark ? 'rgba(255,255,255,0.6)' : '#666',
            }}
          >
            管理您的測驗與監控學員答題狀況
          </p>
        </div>

        {/* 成功訊息 */}
        {successMessage && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px 24px',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: '8px',
              border: '1px solid #81c784',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '500',
              animation: 'fadeIn 0.3s ease-in',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* 建立測驗與管理按鈕 */}
        <div
          style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleCreateExam}
            style={{
              padding: '16px 48px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#1976d2',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1565c0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1976d2';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.3)';
            }}
          >
            + 建立新測驗
          </button>

          <button
            onClick={handleManageSurveyFields}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#1976d2',
              backgroundColor: '#fff',
              border: '2px solid #1976d2',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e3f2fd';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.1)';
            }}
          >
            📊 管理調查欄位
          </button>

          {canManageSurveys() && (
            <button
              onClick={() => navigate('/surveys')}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#7c4dff',
                backgroundColor: '#fff',
                border: '2px solid #7c4dff',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124, 77, 255, 0.1)',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ede7f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 77, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 77, 255, 0.1)';
              }}
            >
              📋 問券管理
            </button>
          )}

          {canManageEmails() && (
            <button
              onClick={() => navigate('/emails')}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#00bcd4',
                backgroundColor: '#fff',
                border: '2px solid #00bcd4',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 188, 212, 0.1)',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0f7fa';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 188, 212, 0.1)';
              }}
            >
              ✉️ 郵件管理
            </button>
          )}

          {/* 匯入測驗按鈕 */}
          <label
            htmlFor="import-json-input"
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '500',
              color: isImporting ? '#999' : '#ff5722',
              backgroundColor: '#fff',
              border: `2px solid ${isImporting ? '#ccc' : '#ff5722'}`,
              borderRadius: '8px',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(255, 87, 34, 0.1)',
              transition: 'all 0.2s ease',
              outline: 'none',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              if (!isImporting) {
                e.currentTarget.style.backgroundColor = '#fbe9e7';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 87, 34, 0.1)';
            }}
          >
            {isImporting ? '📦 匯入中...' : '📦 匯入測驗'}
            <input
              id="import-json-input"
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              disabled={isImporting}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 測驗列表 */}
        {exams.length === 0 ? (
          // 空狀態
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '80px 40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                marginBottom: '20px',
              }}
            >
              📝
            </div>
            <h2
              style={{
                margin: '0 0 12px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              尚無測驗
            </h2>
            <p
              style={{
                margin: '0 0 32px 0',
                fontSize: '16px',
                color: '#666',
              }}
            >
              點擊上方按鈕建立您的第一個測驗
            </p>
          </div>
        ) : (
          // 測驗卡片列表
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px',
            }}
          >
            {exams.map((exam) => (
              <div
                key={exam.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onClick={() => handleMonitorExam(exam.id)}
              >
                {/* 狀態標籤 */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    ...getStatusStyle(exam.status),
                  }}
                >
                  {getStatusText(exam.status)}
                </div>

                {/* 測驗標題 */}
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333',
                  }}
                >
                  {exam.title}
                </h3>

                {/* 測驗描述 */}
                <p
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.5',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {exam.description}
                </p>

                {/* 測驗資訊 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500' }}>題目：</span>
                    {exam.totalQuestions || 0} 題
                  </div>
                  <div>
                    <span style={{ fontWeight: '500' }}>學員：</span>
                    {exam.totalStudents || 0} 人
                  </div>
                  <div>
                    <span style={{ fontWeight: '500' }}>時限：</span>
                    {exam.questionTimeLimit} 秒
                  </div>
                </div>

                {/* 建立時間 */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: '12px',
                    marginBottom: '12px',
                  }}
                >
                  建立時間：{new Date(exam.createdAt).toLocaleString('zh-TW')}
                </div>

                {/* 操作按鈕 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* 編輯按鈕（僅 CREATED 狀態顯示） */}
                  {exam.status === 'CREATED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/instructor/exam/${exam.id}/edit`);
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2e7d32',
                        backgroundColor: '#fff',
                        border: '1px solid #2e7d32',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e8f5e9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      編輯測驗
                    </button>
                  )}

                  {/* 複製按鈕 */}
                  <button
                    onClick={(e) => handleDuplicateExam(exam.id, e)}
                    disabled={duplicatingExamId === exam.id}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: duplicatingExamId === exam.id ? '#999' : '#1976d2',
                      backgroundColor: '#fff',
                      border: `1px solid ${duplicatingExamId === exam.id ? '#ccc' : '#1976d2'}`,
                      borderRadius: '6px',
                      cursor: duplicatingExamId === exam.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (duplicatingExamId !== exam.id) {
                        e.currentTarget.style.backgroundColor = '#e3f2fd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    {duplicatingExamId === exam.id ? '複製中...' : '複製測驗'}
                  </button>

                  {/* 匯出講師版按鈕 */}
                  <button
                    onClick={(e) => handleExportMarkdown(exam.id, true, e)}
                    disabled={exportingExamId === exam.id}
                    title="匯出含答案的講師版 Markdown"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: exportingExamId === exam.id ? '#999' : '#7c4dff',
                      backgroundColor: '#fff',
                      border: `1px solid ${exportingExamId === exam.id ? '#ccc' : '#7c4dff'}`,
                      borderRadius: '6px',
                      cursor: exportingExamId === exam.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (exportingExamId !== exam.id) {
                        e.currentTarget.style.backgroundColor = '#ede7f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    {exportingExamId === exam.id ? '匯出中...' : '📝 匯出(答)'}
                  </button>

                  {/* 匯出學員版按鈕 */}
                  <button
                    onClick={(e) => handleExportMarkdown(exam.id, false, e)}
                    disabled={exportingExamId === exam.id}
                    title="匯出無答案的學員版 Markdown"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: exportingExamId === exam.id ? '#999' : '#9c27b0',
                      backgroundColor: '#fff',
                      border: `1px solid ${exportingExamId === exam.id ? '#ccc' : '#9c27b0'}`,
                      borderRadius: '6px',
                      cursor: exportingExamId === exam.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (exportingExamId !== exam.id) {
                        e.currentTarget.style.backgroundColor = '#f3e5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    {exportingExamId === exam.id ? '匯出中...' : '📄 匯出'}
                  </button>

                  {/* 匯出 JSON 按鈕 */}
                  <button
                    onClick={(e) => handleExportJson(exam.id, e)}
                    disabled={exportingExamId === exam.id}
                    title="匯出 JSON 格式，可用於匯入和備份"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: exportingExamId === exam.id ? '#999' : '#ff5722',
                      backgroundColor: '#fff',
                      border: `1px solid ${exportingExamId === exam.id ? '#ccc' : '#ff5722'}`,
                      borderRadius: '6px',
                      cursor: exportingExamId === exam.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (exportingExamId !== exam.id) {
                        e.currentTarget.style.backgroundColor = '#fbe9e7';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }}
                  >
                    {exportingExamId === exam.id ? '匯出中...' : '📦 JSON'}
                  </button>

                  {/* 清除 Session 按鈕（進行中或已結束時顯示） */}
                  {(exam.status === 'STARTED' || exam.status === 'ENDED') && (
                    <button
                      onClick={(e) => handleClearSession(exam.id, e)}
                      disabled={clearingSessionExamId === exam.id}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: clearingSessionExamId === exam.id ? '#999' : '#ff9800',
                        backgroundColor: '#fff',
                        border: `1px solid ${clearingSessionExamId === exam.id ? '#ccc' : '#ff9800'}`,
                        borderRadius: '6px',
                        cursor: clearingSessionExamId === exam.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (clearingSessionExamId !== exam.id) {
                          e.currentTarget.style.backgroundColor = '#fff3e0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      {clearingSessionExamId === exam.id ? '清除中...' : '清除 Session'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 說明區域 */}
        <div
          style={{
            marginTop: '48px',
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#333',
            }}
          >
            使用說明
          </h3>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 20px',
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.8',
            }}
          >
            <li>點擊「建立新測驗」開始建立測驗題目</li>
            <li>點擊「📦 匯入測驗」可從 JSON 檔案匯入測驗（若包含問卷配置會詢問是否一起匯入）</li>
            <li>建立完成後，可在測驗卡片中查看測驗資訊</li>
            <li>點擊「複製測驗」按鈕可快速複製現有測驗</li>
            <li>點擊「📝 匯出(答)」匯出講師版 Markdown（含答案），適合製作標準答案卷</li>
            <li>點擊「📄 匯出」匯出學員版 Markdown（無答案），適合列印紙本考卷</li>
            <li>點擊「📦 JSON」匯出 JSON 格式，包含題目和問卷調查欄位配置（若有設定）</li>
            <li>點擊測驗卡片進入監控頁面</li>
            <li>在監控頁面可以啟動測驗、推送題目、查看即時統計</li>
            <li>測驗結束後可查看完整統計報表與排行榜</li>
          </ul>
        </div>
      </div>

      {/* CSS 動畫 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default InstructorDashboard;
