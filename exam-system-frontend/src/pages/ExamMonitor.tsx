/**
 * 測驗監控頁面
 *
 * 講師監控測驗進度、推送題目、查看即時統計
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, studentApi, statisticsApi } from '../services/apiService';
import { useExamStore, useStudentStore, useStatisticsStore } from '../store';
import { useExamWebSocket, useQuestionWebSocket, useMessage } from '../hooks';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StudentList from '../components/StudentList';
import QuestionCard from '../components/QuestionCard';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import { Message } from '../components/Message';
import type { WebSocketMessage } from '../types';

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
  const { currentQuestionStats, cumulativeStats, leaderboard, setCurrentQuestionStats, setCumulativeStats, setLeaderboard } = useStatisticsStore();

  // 本地狀態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'question' | 'cumulative' | 'leaderboard'>('students');
  const [showAnswer, setShowAnswer] = useState(false); // 控制答案顯示
  const [isLoadingStats, setIsLoadingStats] = useState(false); // 統計載入狀態
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false); // 排行榜載入狀態

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

  const handleStudentJoined = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 學員加入:', message);
    const msg = message as any;
    // 後端 WebSocketMessage 結構：{type, data, timestamp}
    // 學員資訊在 data 欄位中
    if (msg.data) {
      addStudent(msg.data);
    }
  }, [addStudent]);

  const handleQuestionStarted = useCallback((message: WebSocketMessage) => {
    console.log('[ExamMonitor] 題目開始:', message);
    const msg = message as any;
    const questionId = msg.data?.questionId;
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setCurrentQuestion(question);
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
   * 載入測驗資料
   */
  useEffect(() => {
    if (!examId) {
      setError('無效的測驗 ID');
      return;
    }

    const loadExamData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 載入測驗資訊
        const exam = await examApi.getExam(parseInt(examId));
        setCurrentExam(exam);

        // 載入題目列表
        const questionsData = await examApi.getQuestions(parseInt(examId));
        setQuestions(questionsData.questions);

        // 載入學員列表
        const studentsData = await studentApi.getStudents(parseInt(examId));
        setStudents(studentsData.students);

        // 如果測驗已結束，載入排行榜
        if (exam.status === 'ENDED') {
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
  }, [examId, setCurrentExam, setQuestions, setStudents, setLeaderboard]);

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
      const response = await examApi.startExam(parseInt(examId));
      setCurrentExam({
        ...currentExam!,
        status: response.status,
        currentQuestionIndex: 0  // 初始化為第一題
      });

      // 產生完整的學員加入 URL（含 Access Code）
      const joinUrl = `${window.location.origin}/student/join?accessCode=${response.accessCode}`;
      setQrCodeUrl(joinUrl);

      // 初始化顯示第一題（但不推送給學員）
      if (questions.length > 0) {
        setCurrentQuestion(questions[0]);
      }

      // 隱藏答案
      setShowAnswer(false);

      message.success('測驗已啟動！');
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
      await examApi.startQuestion(parseInt(examId), questionIndex);
      console.log('[handleStartQuestion] API 呼叫成功');

      // 取得剛推送的題目
      const pushedQuestion = questions[questionIndex];

      // 更新當前題目索引到下一題
      const nextIndex = questionIndex + 1;
      setCurrentExam({
        ...currentExam,
        currentQuestionIndex: nextIndex
      });

      // 立即顯示推送的題目（不等待 WebSocket）
      if (pushedQuestion) {
        setCurrentQuestion(pushedQuestion);
      }

      // 自動切換到「當前題目」標籤,讓講師可以看到題目
      setActiveTab('question');

      // 重置答案顯示狀態
      setShowAnswer(false);

      // 清除舊的統計數據
      setCurrentQuestionStats(null);

      // 清理舊的統計定時器
      if (statisticsTimerRef.current) {
        clearTimeout(statisticsTimerRef.current);
        statisticsTimerRef.current = null;
      }

      // 設定新的統計定時器：在題目時間到期後自動獲取統計
      const questionTimeLimit = currentExam.questionTimeLimit ?? 30;

      // 在時間快到時顯示載入狀態(提前1秒)
      setTimeout(() => {
        setIsLoadingStats(true);
      }, (questionTimeLimit - 1) * 1000);

      statisticsTimerRef.current = setTimeout(async () => {
        console.log('[handleStartQuestion] 題目時間到,自動獲取統計');
        try {
          const stats = await statisticsApi.getQuestionStatistics(parseInt(examId), pushedQuestion.id);
          setCurrentQuestionStats(stats);
          setIsLoadingStats(false);
          // 確保仍在「當前題目」標籤上
          setActiveTab('question');
          console.log('[handleStartQuestion] 統計資料已更新:', stats);
        } catch (error) {
          console.error('[handleStartQuestion] 獲取統計失敗:', error);
          setIsLoadingStats(false);
        }
      }, questionTimeLimit * 1000);

      message.success(`題目 ${questionIndex + 1} 已推送！`);
    } catch (err: any) {
      console.error('[handleStartQuestion] API 呼叫失敗:', err);
      message.error(err.message || '推送題目失敗');
    }
  };

  /**
   * 結束測驗
   */
  const handleEndExam = async () => {
    if (!examId) return;
    if (!confirm('確定要結束測驗嗎？')) return;

    try {
      const exam = await examApi.endExam(parseInt(examId));
      setCurrentExam(exam);

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
                <button onClick={handleStartQuestion} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#1976d2', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  推送下一題
                </button>
                <button onClick={handleEndExam} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#f44336', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  結束測驗
                </button>
              </>
            )}
          </div>
        </div>

        {/* 主要內容區 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* 左側 - QR Code 與學員列表 */}
          <div>
            {/* QR Code */}
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
            <StudentList students={students} showScore={isEnded} maxHeight="600px" />
          </div>

          {/* 右側 - 標籤頁內容 */}
          <div>
            {/* 標籤列 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['students', 'question', 'cumulative', 'leaderboard'] as const).map((tab) => (
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
                  {tab === 'students' ? '學員資訊' : tab === 'question' ? '當前題目' : tab === 'cumulative' ? '累積統計' : '排行榜'}
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
                </div>
              )}

              {activeTab === 'question' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  {currentQuestion ? (
                    <>
                      {/* 答案顯示控制按鈕 */}
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setShowAnswer(!showAnswer)}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fff',
                            backgroundColor: showAnswer ? '#f44336' : '#4caf50',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = showAnswer ? '#d32f2f' : '#45a049';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = showAnswer ? '#f44336' : '#4caf50';
                          }}
                        >
                          {showAnswer ? '🙈 隱藏答案' : '👁️ 顯示答案'}
                        </button>
                      </div>
                      <QuestionCard question={currentQuestion} questionIndex={questions.findIndex(q => q.id === currentQuestion.id)} totalQuestions={questions.length} showCorrectAnswer={showAnswer} highlightCorrect={showAnswer} />

                      {/* 統計區域 */}
                      {isLoadingStats && !currentQuestionStats && (
                        <div style={{ marginTop: '24px', padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                          <div style={{ fontSize: '16px', color: '#1976d2', marginBottom: '12px' }}>⏳ 正在計算統計數據...</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>題目時間已到,統計即將顯示</div>
                        </div>
                      )}

                      {currentQuestionStats && (
                        <div style={{ marginTop: '24px' }}>
                          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1976d2' }}>📊 答題統計</h3>
                          {currentQuestion.singleStatChartType === 'BAR' ? (
                            <BarChart data={currentQuestionStats.optionStatistics} dataType="option" height={300} />
                          ) : (
                            <PieChart data={currentQuestionStats.optionStatistics} dataType="option" height={400} />
                          )}
                          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', fontSize: '14px', border: '1px solid #4caf50' }}>
                            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>📝 答題人數：{currentQuestionStats.totalAnswers} 人</p>
                            <p style={{ margin: 0, fontWeight: '500' }}>✅ 正確率：{(currentQuestionStats.correctRate * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>尚未推送題目</div>
                  )}
                </div>
              )}

              {activeTab === 'cumulative' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>累積統計</h3>
                  {cumulativeStats ? (
                    <>
                      {cumulativeStats.chartType === 'BAR' ? (
                        <BarChart data={cumulativeStats.scoreDistribution} dataType="score" height={300} />
                      ) : (
                        <PieChart data={cumulativeStats.scoreDistribution} dataType="score" height={400} />
                      )}
                      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', fontSize: '14px' }}>
                        <p style={{ margin: 0 }}>平均分數：{cumulativeStats.averageScore.toFixed(1)} 分</p>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>暫無統計資料</div>
                  )}
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>排行榜</h3>

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
                  {!isLoadingLeaderboard && leaderboard && leaderboard.leaderboard.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {leaderboard.leaderboard.map((entry, index) => (
                        <div
                          key={entry.studentId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: entry.rank <= 3 ? '#fff9e6' : '#f9f9f9',
                            borderRadius: '8px',
                            border: entry.rank === 1 ? '2px solid #ffd700' : entry.rank === 2 ? '2px solid #c0c0c0' : entry.rank === 3 ? '2px solid #cd7f32' : '1px solid #e0e0e0',
                            transition: 'all 0.3s ease',
                            animation: `slideInUp 0.4s ease ${index * 0.1}s both`,
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : '#e0e0e0',
                            color: entry.rank <= 3 ? '#fff' : '#666',
                            borderRadius: '50%',
                            fontSize: '18px',
                            fontWeight: '700',
                            boxShadow: entry.rank <= 3 ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                            transition: 'transform 0.2s ease'
                          }}>
                            {entry.rank}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{entry.name}</div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>正確率：{(entry.correctRate * 100).toFixed(1)}%</div>
                          </div>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: entry.rank === 1 ? '#ffa000' : entry.rank === 2 ? '#757575' : entry.rank === 3 ? '#d84315' : '#1976d2'
                          }}>
                            {entry.totalScore} 分
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isLoadingLeaderboard && (
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
