/**
 * 排行榜頁面
 *
 * 顯示測驗結束後的排行榜與統計
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { statisticsApi } from '../services/apiService';
import { useExamWebSocket, useResponsiveValue } from '../hooks';
import { LeaderboardDisplay } from '../components/LeaderboardDisplay';
import type { Leaderboard as LeaderboardType, WebSocketMessage } from '../types';

/**
 * 排行榜頁面
 */
export const Leaderboard: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * WebSocket 訊息處理 - 排行榜更新
   */
  const handleLeaderboardUpdated = useCallback((message: WebSocketMessage) => {
    console.log('[Leaderboard] 排行榜更新:', message);
    setLeaderboard(message as any);
  }, []);

  // WebSocket 連線
  const { isConnected } = useExamWebSocket(
    examId ? parseInt(examId) : null,
    {
      onLeaderboardUpdated: handleLeaderboardUpdated,
    }
  );

  // 響應式數值（必須在所有條件判斷之前呼叫）
  const containerPadding = useResponsiveValue('20px 16px', '32px 20px', '40px 20px');
  const maxWidth = useResponsiveValue('100%', '800px', '900px');

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

        const data = await statisticsApi.getLeaderboard(parseInt(examId));
        setLeaderboard(data);

        setIsLoading(false);
      } catch (err: any) {
        console.error('[Leaderboard] 載入失敗:', err);
        setError(err.message || '載入排行榜失敗');
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [examId]);

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
        <LeaderboardDisplay
          leaderboard={leaderboard}
          isConnected={isConnected}
          compact={false}
        />
      </div>
    </div>
  );
};

export default Leaderboard;

