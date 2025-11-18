/**
 * 測驗監控頁面
 *
 * 講師監控測驗進度、推送題目、查看即時統計
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { examApi, studentApi, statisticsApi } from '../services/apiService';
import { useExamStore, useStudentStore, useStatisticsStore, useInstructorStore } from '../store';
import { useExamWebSocket, useQuestionWebSocket, useMessage } from '../hooks';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StudentList from '../components/StudentList';
import QuestionCard from '../components/QuestionCard';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import CountdownTimer from '../components/CountdownTimer';
import AnimatedNumber from '../components/AnimatedNumber';
import Confetti from '../components/Confetti';
import RippleButton from '../components/RippleButton';
import LeaderboardDisplay from '../components/LeaderboardDisplay';
import { Message } from '../components/Message';
import type { WebSocketMessage, SurveyFieldDistribution } from '../types';

/**
 * 測驗監控頁面
 */
export const ExamMonitor: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const message = useMessage();

  // Store
  const { currentExam, questions, currentQuestion, setCurrentExam, setQuestions, setCurrentQuestion } = useExamStore();
  const { students, setStudents, addStudent } = useStudentStore();
  const { currentQuestionStats, leaderboard, setCurrentQuestionStats, setCumulativeStats, setLeaderboard } = useStatisticsStore();
  const { instructorSessionId, setInstructorSessionId } = useInstructorStore();

  // 本地狀態
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'question' | 'leaderboard'>('students');
  const [isLoadingStats, setIsLoadingStats] = useState(false); // 統計載入狀態
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false); // 排行榜載入狀態
  const [surveyDistributions, setSurveyDistributions] = useState<SurveyFieldDistribution[]>([]); // 調查欄位統計
  const [isLoadingSurveyStats, setIsLoadingSurveyStats] = useState(false); // 調查統計載入狀態
  const [currentQuestionExpiresAt, setCurrentQuestionExpiresAt] = useState<string | null>(null); // 當前題目到期時間
  const [currentQuestionChartType, setCurrentQuestionChartType] = useState<'BAR' | 'PIE'>('BAR'); // 當前題目統計圖表類型
  const [showConfetti, setShowConfetti] = useState(false); // 顯示慶祝彩帶
  const [isQuestionTimeExpired, setIsQuestionTimeExpired] = useState(false); // 當前題目時間是否已結束
  const [enableStudentNewAnimation, setEnableStudentNewAnimation] = useState(true); // 是否啟用學員列表 NEW 動畫

  // 統計自動獲取定時器
  const statisticsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentExamRef = useRef(currentExam);

  // 保持 currentExamRef 同步
  useEffect(() => {
    currentExamRef.current = currentExam;
  }, [currentExam]);

  /**
   * WebSocket 訊息處理
   */
  const handleExamStatus = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 測驗狀態更新:', message);
    const msg = message as any;
    if (msg.data?.status && currentExamRef.current) {
      setCurrentExam({ ...currentExamRef.current, status: msg.data.status });
    }
  }, [setCurrentExam]);

  const handleStudentJoined = useCallback(async (message: WebSocketMessage) => {
    console.log('[ExamMonitor] 學員加入:', message);
    const msg = message as any;
    // 後端 WebSocketMessage 結構：{type, data, timestamp}
    // 學員資訊在 data 欄位中
    if (msg.data) {
      addStudent(msg.data);

      // 重新獲取調查欄位統計
      if (examId) {
        try {
          const surveyData = await statisticsApi.getAllSurveyFieldDistributions(parseInt(examId));
          setSurveyDistributions(surveyData);
        } catch (err) {
          console.error('[ExamMonitor] 更新調查欄位統計失敗:', err);
        }
      }
    }
  }, [addStudent, examId]);

  const handleQuestionStarted = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 題目開始:', message);
    const msg = message as any;
    const questionId = msg.data?.questionId;
    const expiresAt = msg.data?.expiresAt;
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setCurrentQuestion(question);
    }
    // 設定題目到期時間（用於倒數計時）
    if (expiresAt) {
      setCurrentQuestionExpiresAt(expiresAt);
    }
  }, [questions, setCurrentQuestion]);

  const handleStatisticsUpdated = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 統計更新:', message);
    const msg = message as any;
    if (msg.data) {
      setCurrentQuestionStats(msg.data);
    }
  }, [setCurrentQuestionStats]);

  const handleCumulativeUpdated = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 累積統計更新:', message);
    const msg = message as any;
    if (msg.data) {
      setCumulativeStats(msg.data);
    }
  }, [setCumulativeStats]);

  const handleLeaderboardUpdated = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 排行榜更新:', message);
    const msg = message as any;
    if (msg.data) {
      setLeaderboard(msg.data);
    }
  }, [setLeaderboard]);

  // WebSocket 連線
  const { isConnected } = useExamWebSocket(
    examId ? parseInt(examId) : null,
    {
      onExamStatus: handleExamStatus,
      onStudentJoined: handleStudentJoined,
      onQuestionStarted: handleQuestionStarted,
      onStatisticsUpdated: handleStatisticsUpdated,
      onCumulativeUpdated: handleCumulativeUpdated,
      onLeaderboardUpdated: handleLeaderboardUpdated,
    }
  );

  // 訂閱當前題目統計
  useQuestionWebSocket(
    examId ? parseInt(examId) : null,
    currentQuestion?.id ?? null,
    handleStatisticsUpdated
  );

  /**
   * 等待 Store hydration
   */
  useEffect(() => {
    if (useInstructorStore.persist?.hasHydrated?.()) {
      setIsStoreHydrated(true);
    }
  }, []);

  /**
   * 載入測驗資訊和 Session
   */
  useEffect(() => {
    if (!isStoreHydrated || !examId) return;

    const loadExamAndSession = async () => {
      try {
        // 載入測驗資訊（不需要驗證 Session）
        const exam = await examApi.getExam(parseInt(examId));
        setCurrentExam(exam);

        // 從 localStorage 載入 Session ID
        const localStorageKey = `exam_${examId}_sessionId`;
        const savedSessionId = localStorage.getItem(localStorageKey);

        // 根據測驗狀態決定是否使用 Session ID
        if (exam.status === 'CREATED' || exam.status === 'ENDED') {
          // CREATED 或 ENDED 狀態不需要 Session，清除舊的 Session
          if (savedSessionId) {
            console.log('[ExamMonitor] 測驗狀態為', exam.status, '，清除舊的 Session ID');
            localStorage.removeItem(localStorageKey);
            setInstructorSessionId('');
          }
        } else if (exam.status === 'STARTED') {
          // STARTED 狀態需要 Session

          // 產生 QR Code URL（測驗進行中時始終顯示，讓學生可隨時加入）
          const joinUrl = `${window.location.origin}/student/join?accessCode=${exam.accessCode}`;
          setQrCodeUrl(joinUrl);

          // 特殊情況：測驗已啟動但尚未推送題目（後端重啟後 session 清空）
          if (!exam.currentQuestionStartedAt && !savedSessionId) {
            console.log('[ExamMonitor] 測驗已啟動但尚未推送題目，且沒有 Session ID，生成新的 Session ID 以進入');
            // 生成新的 UUID 作為 sessionId
            const newSessionId = crypto.randomUUID();
            localStorage.setItem(localStorageKey, newSessionId);
            setInstructorSessionId(newSessionId);

            console.log('[ExamMonitor] 新的 Session ID 已生成:', newSessionId);
          } else if (savedSessionId) {
            console.log('[ExamMonitor] 從 localStorage 載入 Session ID:', savedSessionId);
            setInstructorSessionId(savedSessionId);
          } else {
            // 沒有 Session 且已經推送過題目，不允許進入
            console.error('[ExamMonitor] 測驗已啟動且已推送題目，但沒有 Session ID，非講師無法進入');
            message.error('此測驗正在進行中，僅限講師進入');
            navigate('/instructor');
          }
        }
      } catch (err: any) {
        console.error('[ExamMonitor] 載入測驗失敗:', err);
        message.error('載入測驗失敗');
        navigate('/instructor');
      }
    };

    loadExamAndSession();
  }, [isStoreHydrated, examId]);

  /**
   * 載入測驗資料
   */
  useEffect(() => {
    if (!examId || !currentExam) {
      return;
    }

    const loadExamData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 載入題目列表
        const questionsData = await examApi.getQuestions(parseInt(examId));
        setQuestions(questionsData.questions);

        // 載入學員列表
        const studentsData = await studentApi.getStudents(parseInt(examId));
        setStudents(studentsData.students);

        // 載入調查欄位統計
        try {
          setIsLoadingSurveyStats(true);
          const surveyData = await statisticsApi.getAllSurveyFieldDistributions(parseInt(examId));
          setSurveyDistributions(surveyData);
          setIsLoadingSurveyStats(false);
        } catch (err) {
          console.error('[ExamMonitor] 載入調查欄位統計失敗:', err);
          setIsLoadingSurveyStats(false);
        }

        // 如果測驗已結束，載入排行榜
        if (currentExam?.status === 'ENDED') {
          try {
            setIsLoadingLeaderboard(true);
            const leaderboardData = await statisticsApi.getLeaderboard(parseInt(examId));
            setLeaderboard(leaderboardData);
            setIsLoadingLeaderboard(false);
          } catch (err) {
            console.error('[ExamMonitor] 載入排行榜失敗:', err);
            setIsLoadingLeaderboard(false);
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('[ExamMonitor] 載入失敗:', err);
        setError(err.message || '載入測驗資料失敗');
        setIsLoading(false);
      }
    };

    loadExamData();
  }, [examId, currentExam, setQuestions, setStudents, setLeaderboard]);

  /**
   * 監聽測驗狀態，結束時自動切換到排行榜頁籤並觸發慶祝動畫
   */
  useEffect(() => {
    if (currentExam?.status === 'ENDED') {
      // 測驗結束，自動切換到排行榜頁籤
      setActiveTab('leaderboard');

      // 觸發慶祝彩帶動畫
      setShowConfetti(true);

      // 5 秒後關閉彩帶動畫
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  }, [currentExam?.status]);

  /**
   * 清理定時器
   */
  useEffect(() => {
    return () => {
      if (statisticsTimerRef.current) {
        clearTimeout(statisticsTimerRef.current);
      }
    };
  }, []);

  /**
   * 啟動測驗
   */
  const handleStartExam = async () => {
    if (!examId) return;

    try {
      // 呼叫啟動測驗 API（不需要傳入 Session ID）
      const response = await examApi.startExam(parseInt(examId));

      // 儲存 Session ID 到 localStorage
      const localStorageKey = `exam_${examId}_sessionId`;
      localStorage.setItem(localStorageKey, response.instructorSessionId);
      console.log('[ExamMonitor] Session ID 已儲存至 localStorage:', response.instructorSessionId);

      // 更新 store 中的 Session ID
      setInstructorSessionId(response.instructorSessionId);

      setCurrentExam({
        ...currentExam!,
        status: response.status,
        currentQuestionIndex: 0  // 初始化為第一題
      });

      // 產生完整的學員加入 URL（含 Access Code）
      // QR Code 會在測驗進行中持續顯示，讓學生可隨時加入
      const joinUrl = `${window.location.origin}/student/join?accessCode=${response.accessCode}`;
      setQrCodeUrl(joinUrl);

      // 清空 currentQuestion（還沒推送題目）
      setCurrentQuestion(null);

      message.success('測驗已啟動！學生可隨時掃描 QR Code 加入');
    } catch (err: any) {
      message.error(err.message || '啟動測驗失敗');
    }
  };

  /**
   * 推送題目
   */
  const handleStartQuestion = async () => {
    console.log('[handleStartQuestion] 開始推送題目');
    console.log('[handleStartQuestion] examId:', examId);
    console.log('[handleStartQuestion] currentExam:', currentExam);

    if (!examId || !currentExam) {
      console.error('[handleStartQuestion] examId 或 currentExam 為空');
      return;
    }

    // 如果測驗狀態為 CREATED，需要先啟動測驗
    if (currentExam.status === 'CREATED') {
      console.log('[handleStartQuestion] 測驗尚未啟動，先呼叫 handleStartExam');
      await handleStartExam();
      // handleStartExam 會設定 instructorSessionId，等待狀態更新
      // 注意：這裡不繼續執行，因為測驗啟動後會顯示 QR Code，讓講師再次點擊推送題目
      return;
    }

    // 檢查 instructorSessionId（STARTED 狀態必須有）
    if (!instructorSessionId) {
      console.error('[handleStartQuestion] instructorSessionId 為空');
      message.error('Session 尚未載入完成，請重新整理頁面以建立 Session');
      return;
    }

    // 使用當前題目索引，如果沒有則使用 0
    const questionIndex = currentExam.currentQuestionIndex ?? 0;
    console.log('[handleStartQuestion] questionIndex:', questionIndex);

    // 檢查是否還有題目可以推送
    if (questionIndex >= questions.length) {
      message.warning('已經是最後一題了！');
      return;
    }

    try {
      console.log('[handleStartQuestion] 呼叫 API: startQuestion');

      // 推送題目前暫時禁用學員列表 NEW 動畫
      setEnableStudentNewAnimation(false);

      await examApi.startQuestion(parseInt(examId), questionIndex, instructorSessionId);
      console.log('[handleStartQuestion] API 呼叫成功');

      // 取得剛推送的題目
      const pushedQuestion = questions[questionIndex];

      // 更新當前題目索引到下一題
      const nextIndex = questionIndex + 1;
      setCurrentExam({
        ...currentExamRef.current!,
        currentQuestionIndex: nextIndex
      });

      // 立即顯示推送的題目（不等待 WebSocket）
      if (pushedQuestion) {
        setCurrentQuestion(pushedQuestion);
        // 設定圖表類型為題目的預設值
        setCurrentQuestionChartType(pushedQuestion.singleStatChartType || 'BAR');
      }

      // 計算題目到期時間並設定（與後端同步）
      const questionTimeLimit = currentExam.questionTimeLimit ?? 30;
      const expiresAt = new Date(Date.now() + questionTimeLimit * 1000).toISOString();
      setCurrentQuestionExpiresAt(expiresAt);

      // 自動切換到「當前題目」標籤,讓講師可以看到題目
      setActiveTab('question');

      // 初始化空的統計數據（顯示 0 人作答），等待 WebSocket 推送更新
      setCurrentQuestionStats({
        questionId: pushedQuestion.id,
        questionText: pushedQuestion.questionText,
        totalAnswers: 0,
        correctRate: 0,
        chartType: pushedQuestion.singleStatChartType || 'BAR',
        timestamp: new Date().toISOString(),
        optionStatistics: pushedQuestion.options.map(option => ({
          optionId: option.id,
          optionText: option.optionText,
          count: 0,
          percentage: 0,
          isCorrect: option.id === pushedQuestion.correctOptionId
        }))
      });

      // 重置題目時間狀態（題目開始時不顯示正確答案）
      setIsQuestionTimeExpired(false);

      // 清理舊的統計定時器
      if (statisticsTimerRef.current) {
        clearTimeout(statisticsTimerRef.current);
        statisticsTimerRef.current = null;
      }

      // 設定新的統計定時器：在題目時間到期後自動獲取統計
      // 在時間快到時顯示載入狀態(提前1秒)
      setTimeout(() => {
        setIsLoadingStats(true);
      }, (questionTimeLimit - 1) * 1000);

      statisticsTimerRef.current = setTimeout(async () => {
        console.log('[handleStartQuestion] 題目時間到,自動觸發完整統計');
        try {
          // 題目時間到，現在可以顯示正確答案了
          setIsQuestionTimeExpired(true);

          // 調用 API 推送包含正確答案的完整統計（會透過 WebSocket 推送給所有人）
          await examApi.completeQuestion(parseInt(examId), pushedQuestion.id);
          console.log('[handleStartQuestion] 完整統計已推送');

          // 同時主動獲取題目統計資料（確保立即更新）
          const stats = await statisticsApi.getQuestionStatistics(parseInt(examId), pushedQuestion.id);
          setCurrentQuestionStats(stats);
          setIsLoadingStats(false);

          // 暫時禁用學員列表 NEW 動畫
          setEnableStudentNewAnimation(false);

          // 重新獲取學員列表,更新答對題數和總分
          console.log('[handleStartQuestion] 重新獲取學員列表');
          const studentsData = await studentApi.getStudents(parseInt(examId));
          setStudents(studentsData.students);
          console.log('[handleStartQuestion] 學員列表已更新');

          // 延遲後重新啟用 NEW 動畫（給予足夠時間讓列表更新完成）
          setTimeout(() => {
            setEnableStudentNewAnimation(true);
          }, 500);

          // 確保仍在「當前題目」標籤上
          setActiveTab('question');
          console.log('[handleStartQuestion] 統計資料已更新:', stats);
        } catch (error) {
          console.error('[handleStartQuestion] 獲取統計失敗:', error);
          setIsLoadingStats(false);
        }
      }, questionTimeLimit * 1000);

      message.success(`題目 ${questionIndex + 1} 已推送！`);

      // 延遲後重新啟用 NEW 動畫（給予足夠時間讓狀態更新完成）
      setTimeout(() => {
        setEnableStudentNewAnimation(true);
      }, 500);
    } catch (err: any) {
      console.error('[handleStartQuestion] API 呼叫失敗:', err);
      message.error(err.message || '推送題目失敗');

      // 失敗時也需要重新啟用 NEW 動畫
      setEnableStudentNewAnimation(true);
    }
  };

  /**
   * 結束測驗
   */
  const handleEndExam = async () => {
    // 檢查必要參數
    if (!examId) {
      message.error('測驗 ID 不存在');
      return;
    }

    // 檢查 instructorSessionId
    if (!instructorSessionId) {
      console.error('[handleEndExam] instructorSessionId 為空');
      message.error('Session 尚未載入完成，請重新整理頁面以建立 Session');
      return;
    }

    if (!confirm('確定要結束測驗嗎？')) return;

    try {
      const exam = await examApi.endExam(parseInt(examId), instructorSessionId);
      setCurrentExam(exam);

      // 清除 localStorage 中的講師 Session
      const localStorageKey = `exam_${examId}_sessionId`;
      localStorage.removeItem(localStorageKey);
      console.log('[handleEndExam] 已清除 localStorage 中的 Session ID');

      // 清除 store 中的 Session ID
      setInstructorSessionId('');

      // 獲取排行榜資料
      try {
        setIsLoadingLeaderboard(true);
        const leaderboardData = await statisticsApi.getLeaderboard(parseInt(examId));
        setLeaderboard(leaderboardData);
        setIsLoadingLeaderboard(false);
      } catch (err) {
        console.error('[handleEndExam] 獲取排行榜失敗:', err);
        setIsLoadingLeaderboard(false);
      }

      message.success('測驗已結束！');
    } catch (err: any) {
      message.error(err.message || '結束測驗失敗');
    }
  };

  /**
   * 返回主控台
   */
  const handleBack = () => {
    navigate('/instructor');
  };


  // 載入中
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>載入中...</div>
      </div>
    );
  }

  // 錯誤
  if (error || !currentExam) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ fontSize: '18px', color: '#f44336' }}>{error || '載入失敗'}</div>
        <button onClick={handleBack} style={{ padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
          返回主控台
        </button>
      </div>
    );
  }

  const isCreated = currentExam.status === 'CREATED';
  const isStarted = currentExam.status === 'STARTED';
  const isEnded = currentExam.status === 'ENDED';

  return (
    <>
      {/* 慶祝彩帶動畫 */}
      <Confetti active={showConfetti} duration={4} particleCount={80} />

      {/* CSS 動畫定義 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

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

      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 頂部控制列 */}
        <div style={{ marginBottom: '24px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#333' }}>
                {currentExam.title}
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{currentExam.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '8px 16px', backgroundColor: isEnded ? '#f5f5f5' : isStarted ? '#e8f5e9' : '#e3f2fd', color: isEnded ? '#666' : isStarted ? '#2e7d32' : '#1976d2', borderRadius: '6px', fontSize: '14px', fontWeight: '600' }}>
                {isEnded ? '已結束' : isStarted ? '進行中' : '已建立'}
              </div>
              {isConnected && (
                <div style={{ padding: '8px 16px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  ● 已連線
                </div>
              )}
            </div>
          </div>

          {/* 控制按鈕 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleBack} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: '#666', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', cursor: 'pointer' }}>
              返回主控台
            </button>
            {isCreated && (
              <button onClick={handleStartExam} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#4caf50', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                啟動測驗
              </button>
            )}
            {isStarted && (
              <>
                <RippleButton
                  onClick={handleStartQuestion}
                  disabled={currentExam.currentQuestionIndex >= questions.length}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#fff',
                    backgroundColor: currentExam.currentQuestionIndex >= questions.length ? '#ccc' : '#1976d2',
                    border: 'none',
                    borderRadius: '6px',
                    opacity: currentExam.currentQuestionIndex >= questions.length ? 0.6 : 1
                  }}
                >
                  推送題目 ({Math.min(currentExam.currentQuestionIndex + 1, questions.length)}/{questions.length})
                </RippleButton>
                <RippleButton
                  onClick={handleEndExam}
                  rippleColor="rgba(255, 255, 255, 0.5)"
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#fff',
                    backgroundColor: '#f44336',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  結束測驗
                </RippleButton>
              </>
            )}
          </div>
        </div>

        {/* 主要內容區 */}
        <div style={{ display: 'grid', gridTemplateColumns: isEnded ? '1fr' : '1fr 2fr', gap: '24px' }}>
          {/* 左側 - QR Code 與學員列表（測驗結束時隱藏） */}
          {!isEnded && (
            <div>
              {/* QR Code - 測驗進行中時始終顯示，讓學生可隨時加入 */}
              {isStarted && qrCodeUrl && (
                <div style={{ marginBottom: '24px' }}>
                  <QRCodeDisplay
                    value={qrCodeUrl}
                    displayText={currentExam?.accessCode}
                    size={200}
                    title="掃描加入測驗"
                    showValue={true}
                  />
                </div>
              )}

              {/* 學員列表 */}
              <StudentList students={students} showScore={isEnded} maxHeight="600px" enableNewAnimation={enableStudentNewAnimation} />
            </div>
          )}

          {/* 右側 - 標籤頁內容 */}
          <div>
            {/* 標籤列 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['students', 'question', 'leaderboard'] as const)
                .filter((tab) => {
                  // 測驗結束時只顯示排行榜標籤
                  if (isEnded) {
                    return tab === 'leaderboard';
                  }
                  return true;
                })
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: activeTab === tab ? '#1976d2' : '#666',
                      backgroundColor: activeTab === tab ? '#e3f2fd' : '#fff',
                      border: 'none',
                      borderRadius: '8px 8px 0 0',
                      cursor: 'pointer',
                      boxShadow: activeTab === tab ? '0 -2px 8px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {tab === 'students' ? '學員資訊' : tab === 'question' ? '當前題目' : '排行榜'}
                  </button>
                ))}
            </div>

            {/* 標籤內容 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '0 0 12px 12px', padding: '24px', minHeight: '600px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {activeTab === 'students' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>學員資訊</h3>
                  <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                    <p>總學員數：{students.length} 人</p>
                    <p>總題目數：{questions.length} 題</p>
                    <p>每題時限：{currentExam.questionTimeLimit} 秒</p>
                  </div>

                  {/* 調查欄位統計 */}
                  {isLoadingSurveyStats && surveyDistributions.length === 0 && (
                    <div style={{ marginTop: '24px', padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                      <div style={{ fontSize: '16px', color: '#1976d2', marginBottom: '12px' }}>⏳ 正在載入調查統計...</div>
                    </div>
                  )}

                  {surveyDistributions.length === 0 && !isLoadingSurveyStats && (
                    <div style={{ marginTop: '24px', padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <div style={{ fontSize: '16px', color: '#999', marginBottom: '8px' }}>此測驗未設定調查欄位</div>
                      <div style={{ fontSize: '14px', color: '#999' }}>建立測驗時可選擇要調查的欄位</div>
                    </div>
                  )}

                  {/* 調查欄位統計 - 暫時隱藏 */}
                  {surveyDistributions.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1976d2' }}>
                        📊 調查欄位統計
                      </h3>
                      <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', fontSize: '14px' }}>
                        {surveyDistributions.map((dist) => (
                          <div key={dist.fieldKey} style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '500' }}>{dist.fieldName}：</span>
                            {dist.respondentCount} 人填寫 / 共 {dist.totalStudents} 人
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'question' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  {currentQuestion ? (
                    <>
                      {/* 倒數計時器 */}
                      {currentQuestionExpiresAt && (
                        <div style={{ marginBottom: '24px', padding: '24px', backgroundColor: '#f5f5f5', borderRadius: '12px', textAlign: 'center' }}>
                          <CountdownTimer
                            type="exam"
                            expiresAt={currentQuestionExpiresAt}
                            size="large"
                            showLabel={true}
                            warningThreshold={10}
                            dangerThreshold={5}
                          />
                        </div>
                      )}

                      <QuestionCard question={currentQuestion} questionIndex={questions.findIndex(q => q.id === currentQuestion.id)} totalQuestions={questions.length} showCorrectAnswer={isQuestionTimeExpired} highlightCorrect={isQuestionTimeExpired} />

                      {/* 統計區域 */}
                      {isLoadingStats && !currentQuestionStats && (
                        <div style={{ marginTop: '24px', padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                          <div style={{ fontSize: '16px', color: '#1976d2', marginBottom: '12px' }}>⏳ 正在計算統計數據...</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>題目時間已到,統計即將顯示</div>
                        </div>
                      )}

                      {currentQuestionStats && (
                        <div style={{ marginTop: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1976d2' }}>📊 答題統計</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <motion.button
                                onClick={() => setCurrentQuestionChartType('BAR')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{
                                  backgroundColor: currentQuestionChartType === 'BAR' ? '#1976d2' : '#f5f5f5',
                                  color: currentQuestionChartType === 'BAR' ? '#fff' : '#666',
                                }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                📊 長條圖
                              </motion.button>
                              <motion.button
                                onClick={() => setCurrentQuestionChartType('PIE')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{
                                  backgroundColor: currentQuestionChartType === 'PIE' ? '#1976d2' : '#f5f5f5',
                                  color: currentQuestionChartType === 'PIE' ? '#fff' : '#666',
                                }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                🥧 圓餅圖
                              </motion.button>
                            </div>
                          </div>
                          <AnimatePresence mode="wait">
                            {currentQuestionChartType === 'BAR' ? (
                              <motion.div
                                key="bar-chart"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                              >
                                <BarChart data={currentQuestionStats.optionStatistics} dataType="option" height={300} showCorrectAnswer={isQuestionTimeExpired} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="pie-chart"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                              >
                                <PieChart data={currentQuestionStats.optionStatistics} dataType="option" height={400} showCorrectAnswer={isQuestionTimeExpired} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', fontSize: '14px', border: '1px solid #4caf50' }}>
                            <p style={{ margin: isQuestionTimeExpired ? '0 0 8px 0' : 0, fontWeight: '500' }}>
                              📝 答題人數：<AnimatedNumber value={currentQuestionStats.totalAnswers} fontSize="18px" color="#2e7d32" suffix=" 人" />
                            </p>
                            {isQuestionTimeExpired && (
                              <p style={{ margin: 0, fontWeight: '500' }}>
                                ✅ 正確率：<AnimatedNumber value={(currentQuestionStats.correctRate ?? 0) * 100} decimals={1} fontSize="18px" color="#2e7d32" suffix="%" />
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>尚未推送題目</div>
                  )}
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  {/* 載入中動畫 */}
                  {isLoadingLeaderboard && (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #e0e0e0',
                        borderTop: '4px solid #1976d2',
                        borderRadius: '50%',
                        margin: '0 auto 16px',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <div style={{ fontSize: '14px', color: '#999' }}>載入排行榜中...</div>
                    </div>
                  )}

                  {/* 排行榜內容 */}
                  {!isLoadingLeaderboard && leaderboard && (
                    <LeaderboardDisplay
                      leaderboard={leaderboard}
                      isConnected={isConnected}
                      compact={false}
                    />
                  )}

                  {/* 無排行榜資料 */}
                  {!isLoadingLeaderboard && !leaderboard && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', animation: 'fadeIn 0.3s ease-in' }}>
                      暫無排行榜資料
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ExamMonitor;
