/**
 * 講師主控台頁面
 *
 * 顯示講師測驗列表與操作入口
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../services/apiService';
import { useMessage } from '../hooks';
import { Message } from '../components/Message';
import type { Exam, ExamStatus } from '../types';

/**
 * 講師主控台頁面
 */
export const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const message = useMessage();

  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 載入測驗列表
   */
  useEffect(() => {
    const loadExams = async () => {
      try {
        setIsLoading(true);
        setError(null);
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
   * 前往監控頁面
   */
  const handleMonitorExam = (examId: number) => {
    navigate(`/instructor/exam/${examId}/monitor`);
  };

  /**
   * 編輯測驗
   */
  const handleEditExam = (examId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發卡片的點擊事件
    navigate(`/instructor/exam/${examId}/edit`);
  };

  /**
   * 複製測驗
   */
  const handleDuplicateExam = async (examId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發卡片的點擊事件

    try {
      const duplicatedExam = await examApi.duplicateExam(examId);
      message.success(`測驗「${duplicatedExam.title}」已成功複製！`);

      // 重新載入測驗列表
      const data = await examApi.getAllExams();
      setExams(data);
    } catch (err: any) {
      message.error(err.message || '複製測驗失敗');
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>載入中...</div>
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
    <>
      {/* Message 訊息提示 */}
      {message.messages.map((msg) => (
        <Message
          key={msg.key}
          content={msg.content}
          type={msg.type}
          duration={msg.duration}
          onClose={() => message.close(msg.key)}
        />
      ))}

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          padding: '40px 20px',
        }}
      >
        <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
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
              color: '#333',
            }}
          >
            講師主控台
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              color: '#666',
            }}
          >
            管理您的測驗與監控學員答題狀況
          </p>
        </div>

        {/* 建立測驗按鈕 */}
        <div
          style={{
            marginBottom: '32px',
            textAlign: 'center',
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

                {/* 操作按鈕群組 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* 編輯按鈕 - 只在 CREATED 狀態顯示 */}
                  {exam.status === 'CREATED' && (
                    <button
                      onClick={(e) => handleEditExam(exam.id, e)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#fff',
                        backgroundColor: '#4caf50',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#388e3c';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#4caf50';
                      }}
                    >
                      ✏️ 編輯測驗
                    </button>
                  )}

                  {/* 複製按鈕 */}
                  <button
                    onClick={(e) => handleDuplicateExam(exam.id, e)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1976d2',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #1976d2',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1976d2';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.color = '#1976d2';
                    }}
                  >
                    📋 複製測驗
                  </button>
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
            <li>建立完成後，可在測驗卡片中查看測驗資訊</li>
            <li>點擊測驗卡片進入監控頁面</li>
            <li>在監控頁面可以啟動測驗、推送題目、查看即時統計</li>
            <li>測驗結束後可查看完整統計報表與排行榜</li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
};

export default InstructorDashboard;
