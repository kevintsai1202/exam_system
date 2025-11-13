/**
 * 學員答題頁面
 *
 * 學員即時答題介面
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { answerApi, studentApi } from '../services/apiService';
import websocketService from '../services/websocketService';
import { useStudentStore } from '../store';
import { useExamWebSocket, useMediaQuery, useResponsiveValue, useMessage } from '../hooks';
import OptionButton from '../components/OptionButton';
import { Message } from '../components/Message';
import CountdownTimer from '../components/CountdownTimer';
import { AvatarDisplay } from '../components/AvatarSelector';
import type { WebSocketMessage, QuestionOption } from '../types';

/**
 * 學員答題頁面
 */
export const StudentExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { currentStudent, sessionId, setCurrentStudent, setSessionId, joinContext } = useStudentStore();
  const { messages, success, error, close } = useMessage();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromQuery = (() => {
    const value = searchParams.get('sessionId');
    return value ? value.trim() : null;
  })();
  // Zustand hydration 狀態（避免重整理立即導向）
  const [isStoreHydrated, setIsStoreHydrated] = useState(
    () => useStudentStore.persist?.hasHydrated?.() ?? false
  );

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
  const isFetchingStudentRef = useRef(false);
  const autoRejoinRef = useRef(false);

  /**
   * 自動重新加入（若 sessionId 遺失或無效）
   */
  const autoRejoin = useCallback(async () => {
    if (!joinContext || autoRejoinRef.current) {
      return false;
    }
    autoRejoinRef.current = true;
    try {
      const student = await studentApi.joinExam(joinContext);
      setCurrentStudent(student);
      setSessionId(student.sessionId);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('sessionId', student.sessionId);
      setSearchParams(nextParams, { replace: true });
      success('已重新連線，請繼續作答');
      return true;
    } catch (rejoinError) {
      console.error('[StudentExam] 自動重新加入失敗:', rejoinError);
      return false;
    }
  }, [joinContext, searchParams, setSearchParams, setCurrentStudent, setSessionId, success]);

  /**
   * 監控 Zustand hydration，等待 localStorage �}�o��� sessionId ���s��
   */
  useEffect(() => {
    if (useStudentStore.persist?.hasHydrated?.()) {
      setIsStoreHydrated(true);
    }

    const unsubscribeHydration = useStudentStore.persist?.onFinishHydration?.(() => {
      setIsStoreHydrated(true);
    });

    return () => {
      unsubscribeHydration?.();
    };
  }, []);

  /**
   * ���q URL ���� sessionId �M store �P��
   */
  useEffect(() => {
    if (sessionIdFromQuery && sessionIdFromQuery !== sessionId) {
      setSessionId(sessionIdFromQuery);
    }
  }, [sessionIdFromQuery, sessionId, setSessionId]);

  /**
   * �O�_���n�N store �� sessionId �I���� URL
   */
  useEffect(() => {
    if (!sessionId || sessionIdFromQuery === sessionId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sessionId', sessionId);
    setSearchParams(nextParams, { replace: true });
  }, [sessionId, sessionIdFromQuery, searchParams, setSearchParams]);

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
      setExamStatus('STARTED'); // 更新測驗狀態為進行中
    }
  }, []);

  const handleTimerExpired = useCallback(() => {
    setIsTimerExpired(true); // 標記計時器已到期

    // 時間到，自動提交（如果還沒提交的話）
    if (!hasSubmitted && selectedOptionId) {
      handleSubmitAnswer();
    }
  }, [hasSubmitted, selectedOptionId]);

  // WebSocket 連線（訂閱通用主題）
  const { isConnected } = useExamWebSocket(
    examId ? parseInt(examId) : null,
    {
      onExamStatus: handleExamStatus,
      onQuestionStarted: handleQuestionStarted,
      onTimerUpdate: handleTimerExpired,
    }
  );

  /**
   * 訂閱個人專屬的題目推送主題
   * 當學生在題目已推送後才加入時，後端會推送當前題目到個人主題
   */
  useEffect(() => {
    if (!examId || !sessionId || !isConnected) return;

    const examIdNum = parseInt(examId);

    console.log('[StudentExam] 訂閱個人題目主題:', `/topic/exam/${examIdNum}/question/${sessionId}`);

    // 訂閱個人題目主題
    const topic = websocketService.subscribePersonalQuestion(
      examIdNum,
      sessionId,
      handleQuestionStarted
    );

    // 清理函式
    return () => {
      console.log('[StudentExam] 取消訂閱個人題目主題');
      websocketService.unsubscribe(topic);
    };
  }, [examId, sessionId, isConnected, handleQuestionStarted]);

  /**
   * 從 currentStudent 載入當前題目（如果有的話）
   * 這解決了 WebSocket 訂閱時序問題：當學生加入時後端推送題目到個人主題，
   * 但前端可能還沒完成訂閱，所以從 API 回應中取得當前題目作為備援
   */
  useEffect(() => {
    if (!currentStudent?.currentQuestion || currentQuestion) return;

    console.log('[StudentExam] 從 API 回應載入當前題目:', currentStudent.currentQuestion);

    // 設定當前題目
    setCurrentQuestion({
      questionId: currentStudent.currentQuestion.questionId,
      questionIndex: currentStudent.currentQuestion.questionIndex,
      questionText: currentStudent.currentQuestion.questionText,
      options: currentStudent.currentQuestion.options,
      expiresAt: currentStudent.currentQuestion.expiresAt,
    });

    // 更新測驗狀態
    setExamStatus('STARTED');
  }, [currentStudent, currentQuestion]);

  /**
   * 送出答案
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
      success('答題已送出');
    } catch (err: any) {
      error(err.message || '提交答案失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 確認學員是否已登入，必要時自動重新加入
   */
  useEffect(() => {
    if (!isStoreHydrated) {
      return;
    }

    let isActive = true;

    const ensureStudentSession = async () => {
      if (!sessionId) {
        if (sessionIdFromQuery) {
          return;
        }

        const rejoined = await autoRejoin();
        if (rejoined || !isActive) {
          return;
        }

        setCurrentStudent(null);
        navigate('/student/join');
        return;
      }

      if (!currentStudent && !isFetchingStudentRef.current) {
        isFetchingStudentRef.current = true;
        try {
          console.debug('[StudentExam] Fetching student info with sessionId:', sessionId);
          const student = await studentApi.getStudent(sessionId);
          if (isActive) {
            setCurrentStudent(student);
          }
        } catch (err: any) {
          if (!isActive) {
            return;
          }

          const rejoined = await autoRejoin();
          if (rejoined || !isActive) {
            return;
          }

          error(err?.message || '無法載入學員資訊，請重新加入。');
          setCurrentStudent(null);
          setSessionId(null);
          navigate('/student/join');
        } finally {
          if (isActive) {
            isFetchingStudentRef.current = false;
          }
        }
      }
    };

    ensureStudentSession();

    return () => {
      isActive = false;
    };
  }, [
    isStoreHydrated,
    sessionId,
    currentStudent,
    sessionIdFromQuery,
    autoRejoin,
    navigate,
    setCurrentStudent,
    setSessionId,
    error,
  ]);

  // 響應式設計
  const { isMobile } = useMediaQuery();
  const containerPadding = useResponsiveValue('12px', '16px', '20px');
  const maxWidth = useResponsiveValue('100%', '700px', '800px');

  if (!isStoreHydrated) {


    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div style={{ fontSize: '16px', color: '#666' }}>正在恢復學員連線...</div>
      </div>
    );
  }




  if (!currentStudent) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div style={{ fontSize: '16px', color: '#666' }}>載入學員資料...</div>
      </div>
    );
  }

  return (
    <>
      {/* Message 訊息提示 */}
      {messages.map((msg) => (
        <Message
          key={msg.key}
          content={msg.content}
          type={msg.type}
          duration={msg.duration}
          onClose={() => close(msg.key)}
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

