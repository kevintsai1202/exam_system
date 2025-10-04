/**
 * 排行榜頁面
 *
 * 顯示測驗結束後的排行榜與統計
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { statisticsApi } from '../services/apiService';
import { useExamWebSocket, useResponsiveValue } from '../hooks';
import { useStudentStore } from '../store';
import { AvatarDisplay } from '../components/AvatarSelector';
import type { Leaderboard as LeaderboardType, WebSocketMessage } from '../types';

/**
 * 排行榜頁面
 */
export const Leaderboard: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { currentStudent } = useStudentStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * WebSocket 訊息處理 - 排行榜更新
   */
  const handleLeaderboardUpdated = useCallback((message: WebSocketMessage) => {
    console.log('[Leaderboard] 排行榜更新:', message);
    const msg = message as any;
    if (msg.data) {
      setLeaderboard(msg.data);
    }
  }, []);

  // WebSocket 連線
  const { isConnected } = useExamWebSocket(
    examId ? parseInt(examId) : null,
    {
      onLeaderboardUpdated: handleLeaderboardUpdated,
    }
  );

  /**
   * 載入排行榜資料
   */
  useEffect(() => {
    if (!examId) {
      setError('無效的測驗 ID');
      return;
    }

    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 如果有 currentStudent，傳入 studentId 確保顯示自己的排名
        const data = await statisticsApi.getLeaderboard(
          parseInt(examId),
          20,
          currentStudent?.id
        );
        setLeaderboard(data);

        setIsLoading(false);
      } catch (err: any) {
        console.error('[Leaderboard] 載入失敗:', err);
        setError(err.message || '載入排行榜失敗');
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [examId, currentStudent?.id]);

  // 載入中
  if (isLoading) {
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
        <div style={{ fontSize: '18px', color: '#666' }}>載入中...</div>
      </div>
    );
  }

  // 錯誤
  if (error || !leaderboard) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ fontSize: '18px', color: '#f44336' }}>
          {error || '載入失敗'}
        </div>
      </div>
    );
  }

  const containerPadding = useResponsiveValue('20px 16px', '32px 20px', '40px 20px');
  const maxWidth = useResponsiveValue('100%', '800px', '900px');

  return (
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
        {/* 頁面標題 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
          <h1
            style={{
              margin: '0 0 12px 0',
              fontSize: '36px',
              fontWeight: '700',
              color: '#333',
            }}
          >
            測驗排行榜
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
            共 {leaderboard.totalStudents} 位學員參與 • {leaderboard.totalQuestions} 題
          </p>
          {isConnected && (
            <div
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '6px 12px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              ● 即時更新中
            </div>
          )}
        </div>

        {/* 排行榜列表 */}
        {leaderboard.leaderboard.length === 0 ? (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '60px 40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
            <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
              暫無排行榜資料
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaderboard.leaderboard.map((entry) => {
              const isTop3 = entry.rank <= 3;
              const isGold = entry.rank === 1;
              const isSilver = entry.rank === 2;
              const isBronze = entry.rank === 3;
              const isCurrentStudent = currentStudent && entry.studentId === currentStudent.id;

              return (
                <div
                  key={entry.studentId}
                  style={{
                    backgroundColor: isCurrentStudent
                      ? '#e3f2fd'
                      : isTop3
                      ? '#fffbf0'
                      : '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: isCurrentStudent
                      ? '0 6px 16px rgba(25, 118, 210, 0.3)'
                      : isTop3
                      ? '0 4px 12px rgba(0,0,0,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    border: isCurrentStudent
                      ? '3px solid #1976d2'
                      : isGold
                      ? '3px solid #ffd700'
                      : isSilver
                      ? '3px solid #c0c0c0'
                      : isBronze
                      ? '3px solid #cd7f32'
                      : '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    position: 'relative',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* 排名 */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isGold
                        ? '#ffd700'
                        : isSilver
                        ? '#c0c0c0'
                        : isBronze
                        ? '#cd7f32'
                        : '#e0e0e0',
                      color: isTop3 ? '#fff' : '#666',
                      borderRadius: '50%',
                      fontSize: isTop3 ? '28px' : '24px',
                      fontWeight: '700',
                      flexShrink: 0,
                      boxShadow: isTop3
                        ? '0 4px 8px rgba(0,0,0,0.2)'
                        : 'none',
                    }}
                  >
                    {entry.rank}
                  </div>

                  {/* 頭像 */}
                  <div style={{ flexShrink: 0 }}>
                    <AvatarDisplay avatar={entry.avatarIcon} size="large" />
                  </div>

                  {/* 學員資訊 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {entry.name}
                      {isCurrentStudent && (
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#1976d2',
                            backgroundColor: '#bbdefb',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          你
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '2px' }}>
                      正確率：{entry.correctRate.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '13px', color: '#999' }}>
                      ⏱️ 答題時間：{Math.floor((entry.totalAnswerTimeSeconds || 0) / 60)}:{String((entry.totalAnswerTimeSeconds || 0) % 60).padStart(2, '0')}
                    </div>
                  </div>

                  {/* 分數 */}
                  <div
                    style={{
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: isTop3 ? '#1976d2' : '#333',
                        lineHeight: 1,
                      }}
                    >
                      {entry.totalScore}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        marginTop: '4px',
                      }}
                    >
                      分
                    </div>
                  </div>

                  {/* 前三名獎章 */}
                  {isTop3 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        fontSize: '32px',
                      }}
                    >
                      {isGold ? '🥇' : isSilver ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 說明文字 */}
        <div
          style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
            fontSize: '14px',
            color: '#666',
          }}
        >
          <p style={{ margin: 0 }}>
            🎉 恭喜所有參與測驗的學員！
          </p>
          <p style={{ margin: '8px 0 0 0' }}>
            排行榜會即時更新，請保持頁面開啟以查看最新排名
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
