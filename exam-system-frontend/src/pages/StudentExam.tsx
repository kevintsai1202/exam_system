/**
 * 學員答題頁面
 *
 * 學員即時答題介面
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { answerApi } from '../services/apiService';
import { useStudentStore } from '../store';
import { useExamWebSocket, useQuestionWebSocket, useMediaQuery, useResponsiveValue, useMessage } from '../hooks';
import OptionButton from '../components/OptionButton';
import { Message } from '../components/Message';
import CountdownTimer from '../components/CountdownTimer';
import { AvatarDisplay } from '../components/AvatarSelector';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import type { WebSocketMessage, QuestionOption, StatisticsDTO } from '../types';

/**
 * 學員答題頁面
 */
export const StudentExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { currentStudent, sessionId } = useStudentStore();
  const message = useMessage();

  // 當前題目狀態
  const [currentQuestion, setCurrentQuestion] = useState<{
    questionId: number;
    questionIndex: number;
    questionText: string;
    options: QuestionOption[];
    expiresAt: string;
  } | null>(null);

  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [examStatus, setExamStatus] = useState<'CREATED' | 'STARTED' | 'ENDED'>('CREATED');
  const [questionStats, setQuestionStats] = useState<StatisticsDTO.QuestionStatistics | null>(null);

  /**
   * WebSocket 訊息處理
   */
  const handleExamStatus = useCallback((message: WebSocketMessage) => {
    const msg = message as any;
    const status = msg.data?.status;
    if (status) {
      setExamStatus(status);
      if (status === 'ENDED') {
        // 測驗結束，導航至排行榜
        setTimeout(() => {
          navigate(`/leaderboard/${examId}`);
        }, 2000);
      }
    }
  }, [examId, navigate]);

  const handleQuestionStarted = useCallback((message: WebSocketMessage) => {
    const msg = message as any;
    const data = msg.data;
    if (data) {
      setCurrentQuestion({
        questionId: data.questionId,
        questionIndex: data.questionIndex,
        questionText: data.questionText,
        options: data.options,
        expiresAt: data.expiresAt,
      });
      setSelectedOptionId(null);
      setHasSubmitted(false);
      setIsTimerExpired(false); // 重置計時器到期狀態
      setQuestionStats(null); // 清除舊的統計資料
      setExamStatus('STARTED'); // 更新測驗狀態為進行中
    }
  }, []);

  const handleStatisticsUpdated = useCallback((message: WebSocketMessage) => {
    console.log('[StudentExam] 統計更新:', message);
    const msg = message as any;
    if (msg.data) {
      setQuestionStats(msg.data);
    }
  }, []);

  const handleTimerExpired = useCallback(() => {
    setIsTimerExpired(true); // 標記計時器已到期

    // 時間到，自動提交（如果還沒提交的話）
    if (!hasSubmitted && selectedOptionId) {
      handleSubmitAnswer();
    }
  }, [hasSubmitted, selectedOptionId]);

  // WebSocket 連線
  const { isConnected } = useExamWebSocket(
    examId ? parseInt(examId) : null,
    {
      onExamStatus: handleExamStatus,
      onQuestionStarted: handleQuestionStarted,
      onTimerUpdate: handleTimerExpired,
    }
  );

  // 訂閱當前題目統計
  useQuestionWebSocket(
    examId ? parseInt(examId) : null,
    currentQuestion?.questionId ?? null,
    handleStatisticsUpdated
  );

  /**
   * 提交答案
   */
  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion || !selectedOptionId || hasSubmitted) return;

    setIsSubmitting(true);

    try {
      await answerApi.submitAnswer({
        sessionId,
        questionId: currentQuestion.questionId,
        selectedOptionId,
      });

      setHasSubmitted(true);
      message.success('答案已提交！');
    } catch (err: any) {
      message.error(err.message || '提交答案失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 檢查是否已登入
   */
  useEffect(() => {
    if (!sessionId || !currentStudent) {
      navigate('/student/join');
    }
  }, [sessionId, currentStudent, navigate]);

  // 響應式設計
  const { isMobile } = useMediaQuery();
  const containerPadding = useResponsiveValue('12px', '16px', '20px');
  const maxWidth = useResponsiveValue('100%', '700px', '800px');

  if (!currentStudent) {
    return null;
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
        padding: containerPadding,
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
        }}
      >
        {/* 頂部資訊列 */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: isMobile ? '8px' : '12px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '16px' : '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '16px' : '0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AvatarDisplay avatar={currentStudent.avatarIcon} size={isMobile ? 'medium' : 'large'} />
            <div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#333' }}>
                {currentStudent.name}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                總分：{currentStudent.totalScore} 分
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 16px',
                backgroundColor:
                  examStatus === 'ENDED'
                    ? '#f5f5f5'
                    : examStatus === 'STARTED'
                    ? '#e8f5e9'
                    : '#e3f2fd',
                color:
                  examStatus === 'ENDED'
                    ? '#666'
                    : examStatus === 'STARTED'
                    ? '#2e7d32'
                    : '#1976d2',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {examStatus === 'ENDED' ? '已結束' : examStatus === 'STARTED' ? '進行中' : '等待開始'}
            </div>
            {isConnected && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                ● 已連線
              </div>
            )}
          </div>
        </div>

        {/* 題目區域 */}
        {currentQuestion ? (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {/* 題號與倒數計時 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1976d2',
                }}
              >
                第 {currentQuestion.questionIndex + 1} 題
              </h2>
              <CountdownTimer
                type="exam"
                expiresAt={currentQuestion.expiresAt}
                onExpire={handleTimerExpired}
                size="medium"
                showLabel={true}
              />
            </div>

            {/* 題目內容 */}
            <div
              style={{
                fontSize: '22px',
                fontWeight: '500',
                color: '#333',
                lineHeight: '1.6',
                marginBottom: '32px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                borderLeft: '4px solid #1976d2',
              }}
            >
              {currentQuestion.questionText}
            </div>

            {/* 選項列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {currentQuestion.options
                .sort((a, b) => a.optionOrder - b.optionOrder)
                .map((option) => (
                  <OptionButton
                    key={option.id}
                    option={option}
                    isSelected={selectedOptionId === option.id}
                    disabled={hasSubmitted || isSubmitting || isTimerExpired}
                    onClick={() => !hasSubmitted && !isTimerExpired && setSelectedOptionId(option.id)}
                    size="large"
                  />
                ))}
            </div>

            {/* 提交按鈕 */}
            {!hasSubmitted && !isTimerExpired && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedOptionId || isSubmitting || isTimerExpired}
                style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor:
                    !selectedOptionId || isSubmitting ? '#999' : '#4caf50',
                  border: 'none',
                  borderRadius: '8px',
                  cursor:
                    !selectedOptionId || isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedOptionId && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#45a049';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedOptionId && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#4caf50';
                  }
                }}
              >
                {isSubmitting ? '提交中...' : '提交答案'}
              </button>
            )}

            {/* 已提交提示 */}
            {hasSubmitted && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                ✓ 答案已提交，請等待下一題
              </div>
            )}

            {/* 時間到期提示 */}
            {isTimerExpired && !hasSubmitted && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                ⏰ 時間已到，無法作答
              </div>
            )}

            {/* 統計圖表區域 - 在已提交或時間到期後顯示 */}
            {(hasSubmitted || isTimerExpired) && questionStats && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px solid #e0e0e0' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: isMobile ? '18px' : '20px', fontWeight: '600', color: '#1976d2' }}>
                  📊 大家的答題統計
                </h3>

                {/* 圖表顯示 */}
                {questionStats.chartType === 'BAR' ? (
                  <BarChart
                    data={questionStats.optionStatistics}
                    dataType="option"
                    height={isMobile ? 250 : 300}
                  />
                ) : (
                  <PieChart
                    data={questionStats.optionStatistics}
                    dataType="option"
                    height={isMobile ? 300 : 400}
                  />
                )}

                {/* 統計資訊 */}
                <div
                  style={{
                    marginTop: '20px',
                    padding: isMobile ? '12px' : '16px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '8px',
                    fontSize: isMobile ? '13px' : '14px',
                    border: '1px solid #4caf50'
                  }}
                >
                  <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                    📝 總答題人數：{questionStats.totalAnswers} 人
                  </p>
                  <p style={{ margin: 0, fontWeight: '500' }}>
                    ✅ 正確率：{questionStats.correctRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '80px 40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h2
              style={{
                margin: '0 0 12px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              {examStatus === 'ENDED' ? '測驗已結束' : '等待講師推送題目'}
            </h2>
            <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
              {examStatus === 'ENDED'
                ? '即將跳轉至排行榜...'
                : '請耐心等候'}
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default StudentExam;
