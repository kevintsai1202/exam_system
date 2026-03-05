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
import { useThemeStore } from '../store/themeStore';
import { useExamWebSocket, useMediaQuery, useResponsiveValue, useMessage } from '../hooks';
import OptionButton from '../components/OptionButton';
import { Message } from '../components/Message';
import CountdownTimer from '../components/CountdownTimer';
import { AvatarDisplay } from '../components/AvatarSelector';
import ThemeToggle from '../components/ThemeToggle';
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
  const [revealedCorrectOptionIds, setRevealedCorrectOptionIds] = useState<number[]>([]);
  const [revealedCorrectRate, setRevealedCorrectRate] = useState<number | null>(null);
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
      setRevealedCorrectOptionIds([]); // 重置正確答案顯示
      setRevealedCorrectRate(null); // 重置正確率顯示
      setExamStatus('STARTED'); // 更新測驗狀態為進行中
    }
  }, []);

  const handleTimerExpired = useCallback(() => {
    if (isTimerExpired) return;

    setIsTimerExpired(true); // 標記計時器已到期

    // 時間到，自動提交（如果還沒提交的話）
    if (!hasSubmitted && selectedOptionId) {
      handleSubmitAnswer();
    }
  }, [hasSubmitted, selectedOptionId, isTimerExpired]);

  /**
   * 計時器 WebSocket 訊息處理
   * 僅在真正時間到（TIMER_EXPIRED 或 remainingSeconds=0）時觸發到期邏輯
   */
  const handleTimerUpdate = useCallback((message: WebSocketMessage) => {
    const msg = message as any;
    const type = msg?.type;
    const remainingSeconds = msg?.data?.remainingSeconds ?? msg?.remainingSeconds;

    if (type === 'TIMER_EXPIRED' || remainingSeconds === 0) {
      handleTimerExpired();
    }
  }, [handleTimerExpired]);

  /**
   * 題目統計更新處理
   * 只有在收到 includeAnswer=true（包含 isCorrect）時才顯示正確答案
   */
  const handleQuestionStatisticsUpdated = useCallback((message: WebSocketMessage) => {
    const msg = message as any;
    const statistics = msg?.data;

    if (!statistics || !currentQuestion || statistics.questionId !== currentQuestion.questionId) {
      return;
    }

    const optionStatistics = Array.isArray(statistics.optionStatistics) ? statistics.optionStatistics : [];
    const hasAnswerReveal = optionStatistics.some((option: any) => typeof option?.isCorrect === 'boolean');
    if (!hasAnswerReveal) {
      return;
    }

    const correctOptionIds = optionStatistics
      .filter((option: any) => option?.isCorrect === true)
      .map((option: any) => Number(option.optionId))
      .filter((optionId: number) => Number.isFinite(optionId));

    if (correctOptionIds.length === 0) {
      return;
    }

    setRevealedCorrectOptionIds(correctOptionIds);
    setRevealedCorrectRate(typeof statistics.correctRate === 'number' ? statistics.correctRate : null);
    setIsTimerExpired(true);
  }, [currentQuestion]);

  // WebSocket 連線（訂閱通用主題）
  const { isConnected } = useExamWebSocket(
    examId ? parseInt(examId) : null,
    {
      onExamStatus: handleExamStatus,
      onQuestionStarted: handleQuestionStarted,
      onTimerUpdate: handleTimerUpdate,
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
   * 訂閱當前題目的統計主題
   * 用於在時間到後接收包含正確答案的統計資料
   */
  useEffect(() => {
    if (!examId || !currentQuestion?.questionId || !isConnected) return;

    const examIdNum = parseInt(examId);
    const questionId = currentQuestion.questionId;

    console.log('[StudentExam] 訂閱題目統計主題:', `/topic/exam/${examIdNum}/statistics/question/${questionId}`);

    const topic = websocketService.subscribeQuestionStatistics(
      examIdNum,
      questionId,
      handleQuestionStatisticsUpdated
    );

    return () => {
      console.log('[StudentExam] 取消訂閱題目統計主題:', questionId);
      websocketService.unsubscribe(topic);
    };
  }, [examId, currentQuestion?.questionId, isConnected, handleQuestionStatisticsUpdated]);

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

  /**
   * 監聽 WebSocket 重連成功事件
   * 當學生中途斷線（例如手機休眠）後重新連線時，自動獲取當前題目狀態
   */
  useEffect(() => {
    if (!sessionId) return;

    const handleReconnectSuccess = async () => {
      console.log('[StudentExam] WebSocket 重新連線成功，獲取當前題目狀態');
      try {
        const student = await studentApi.getStudent(sessionId);

        // 更新學員資訊
        setCurrentStudent(student);

        // 如果有當前題目，更新題目狀態
        if (student.currentQuestion) {
          console.log('[StudentExam] 重連後載入當前題目:', student.currentQuestion);

          setCurrentQuestion({
            questionId: student.currentQuestion.questionId,
            questionIndex: student.currentQuestion.questionIndex,
            questionText: student.currentQuestion.questionText,
            options: student.currentQuestion.options,
            expiresAt: student.currentQuestion.expiresAt,
          });

          // 重置答題狀態（如果是新題目）
          if (currentQuestion?.questionId !== student.currentQuestion.questionId) {
            setSelectedOptionId(null);
            setHasSubmitted(false);
            setIsTimerExpired(false);
          }

          setExamStatus('STARTED');
          success('已重新連線，顯示當前題目');
        }
      } catch (err: any) {
        console.error('[StudentExam] 重連後獲取題目失敗:', err);
        error(err?.message || '重新連線後無法載入題目');
      }
    };

    // 註冊重連成功監聽器
    websocketService.onReconnectSuccess(handleReconnectSuccess);

    // 清理函式：移除監聽器
    return () => {
      websocketService.removeReconnectSuccessListener(handleReconnectSuccess);
    };
  }, [sessionId, currentQuestion, setCurrentStudent, success, error]);

  // 響應式設計
  const { isMobile } = useMediaQuery();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const containerPadding = useResponsiveValue('12px', '16px', '20px');
  const maxWidth = useResponsiveValue('100%', '700px', '800px');
  const showAnswerResult = revealedCorrectOptionIds.length > 0;
  const pageBackgroundColor = isDark ? '#0f172a' : '#f5f5f5';
  const cardBackgroundColor = isDark ? 'rgba(15, 23, 42, 0.92)' : '#fff';
  const cardShadow = isDark ? '0 8px 20px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.1)';
  const cardBorder = isDark ? '1px solid rgba(148, 163, 184, 0.25)' : '1px solid transparent';
  const textPrimary = isDark ? '#f8fafc' : '#333';
  const textSecondary = isDark ? 'rgba(226, 232, 240, 0.75)' : '#666';
  const questionBackground = isDark ? 'rgba(30, 41, 59, 0.85)' : '#f5f5f5';
  const statusBadgeBackgroundColor = examStatus === 'ENDED'
    ? (isDark ? 'rgba(71, 85, 105, 0.45)' : '#f5f5f5')
    : examStatus === 'STARTED'
    ? (isDark ? 'rgba(34, 197, 94, 0.22)' : '#e8f5e9')
    : (isDark ? 'rgba(59, 130, 246, 0.25)' : '#e3f2fd');
  const statusBadgeTextColor = examStatus === 'ENDED'
    ? (isDark ? '#cbd5e1' : '#666')
    : examStatus === 'STARTED'
    ? '#2e7d32'
    : '#1976d2';
  const connectedBadgeBackgroundColor = isDark ? 'rgba(34, 197, 94, 0.22)' : '#e8f5e9';
  const connectedBadgeTextColor = '#2e7d32';
  const submitDisabledColor = isDark ? 'rgba(100, 116, 139, 0.82)' : '#999';
  const successHintBackgroundColor = isDark ? 'rgba(34, 197, 94, 0.2)' : '#e8f5e9';
  const successHintTextColor = isDark ? '#bbf7d0' : '#2e7d32';
  const dangerHintBackgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : '#ffebee';
  const dangerHintTextColor = isDark ? '#fecaca' : '#c62828';

  if (!isStoreHydrated) {


    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pageBackgroundColor,
        }}
      >
        <div style={{ fontSize: '16px', color: textSecondary }}>正在恢復學員連線...</div>
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
          backgroundColor: pageBackgroundColor,
        }}
      >
        <div style={{ fontSize: '16px', color: textSecondary }}>載入學員資料...</div>
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
        backgroundColor: pageBackgroundColor,
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
            backgroundColor: cardBackgroundColor,
            borderRadius: isMobile ? '8px' : '12px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '16px' : '24px',
            boxShadow: cardShadow,
            border: cardBorder,
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
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: textPrimary }}>
                {currentStudent.name}
              </div>
              <div style={{ fontSize: '14px', color: textSecondary, marginTop: '2px' }}>
                總分：{currentStudent.totalScore} 分
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <ThemeToggle />
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: statusBadgeBackgroundColor,
                color: statusBadgeTextColor,
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
                  backgroundColor: connectedBadgeBackgroundColor,
                  color: connectedBadgeTextColor,
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
              backgroundColor: cardBackgroundColor,
              borderRadius: '12px',
              padding: '32px',
              boxShadow: cardShadow,
              border: cardBorder,
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
                color: textPrimary,
                lineHeight: '1.6',
                marginBottom: '32px',
                padding: '20px',
                backgroundColor: questionBackground,
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
                    isCorrect={showAnswerResult && revealedCorrectOptionIds.includes(option.id)}
                    isWrong={
                      showAnswerResult &&
                      selectedOptionId === option.id &&
                      !revealedCorrectOptionIds.includes(option.id)
                    }
                    showResult={showAnswerResult}
                    disabled={hasSubmitted || isSubmitting || isTimerExpired || showAnswerResult}
                    onClick={() => !hasSubmitted && !isTimerExpired && !showAnswerResult && setSelectedOptionId(option.id)}
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
                    !selectedOptionId || isSubmitting ? submitDisabledColor : '#4caf50',
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
                  backgroundColor: successHintBackgroundColor,
                  color: successHintTextColor,
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
            {isTimerExpired && !hasSubmitted && !showAnswerResult && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: dangerHintBackgroundColor,
                  color: dangerHintTextColor,
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                ⏰ 時間已到，無法作答
              </div>
            )}

            {/* 正確答案揭露提示 */}
            {showAnswerResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: successHintBackgroundColor,
                  color: successHintTextColor,
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                <div>
                  ✅ 正確答案已公布
                  {selectedOptionId
                    ? revealedCorrectOptionIds.includes(selectedOptionId)
                      ? '，你答對了'
                      : '，你這題答錯'
                    : '，你本題未作答'}
                </div>
                {revealedCorrectRate !== null && (
                  <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>
                    本題正確率：{(revealedCorrectRate * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: cardBackgroundColor,
              borderRadius: '12px',
              padding: '80px 40px',
              textAlign: 'center',
              boxShadow: cardShadow,
              border: cardBorder,
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h2
              style={{
                margin: '0 0 12px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: textPrimary,
              }}
            >
              {examStatus === 'ENDED' ? '測驗已結束' : '等待講師推送題目'}
            </h2>
            <p style={{ margin: 0, fontSize: '16px', color: textSecondary }}>
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

