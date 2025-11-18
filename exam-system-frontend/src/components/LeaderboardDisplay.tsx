/**
 * 排行榜顯示元件
 *
 * 共用的排行榜顯示元件，可用於講師端和學員端
 */

import React from 'react';
import { AvatarDisplay } from './AvatarSelector';
import type { Leaderboard } from '../types';

/**
 * 排行榜顯示 Props 介面
 */
interface LeaderboardDisplayProps {
  leaderboard: Leaderboard;               // 排行榜資料
  isConnected?: boolean;                  // 是否顯示即時更新標記（預設 false）
  compact?: boolean;                      // 是否使用緊湊模式（預設 false，用於講師端標籤頁）
}

/**
 * 排行榜顯示元件
 */
export const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({
  leaderboard,
  isConnected = false,
  compact = false,
}) => {
  return (
    <div>
      {/* 頁面標題 */}
      {!compact && (
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
      )}

      {/* 排行榜列表 */}
      {leaderboard.leaderboard.length === 0 ? (
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: compact ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: compact ? '48px' : '64px', marginBottom: '20px' }}>📊</div>
          <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
            暫無排行榜資料
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '16px' }}>
          {leaderboard.leaderboard.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const isGold = entry.rank === 1;
            const isSilver = entry.rank === 2;
            const isBronze = entry.rank === 3;

            return (
              <div
                key={entry.studentId}
                style={{
                  backgroundColor: isTop3 ? '#fffbf0' : '#fff',
                  borderRadius: '12px',
                  padding: compact ? '16px' : '24px',
                  boxShadow: isTop3
                    ? '0 4px 12px rgba(0,0,0,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  border: isGold
                    ? '3px solid #ffd700'
                    : isSilver
                    ? '3px solid #c0c0c0'
                    : isBronze
                    ? '3px solid #cd7f32'
                    : '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: compact ? '16px' : '20px',
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
                    width: compact ? '48px' : '64px',
                    height: compact ? '48px' : '64px',
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
                    fontSize: isTop3 ? (compact ? '20px' : '28px') : (compact ? '18px' : '24px'),
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
                  <AvatarDisplay avatar={entry.avatarIcon} size={compact ? 'medium' : 'large'} />
                </div>

                {/* 學員資訊 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: compact ? '16px' : '20px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px',
                    }}
                  >
                    {entry.name}
                  </div>
                  <div style={{ fontSize: compact ? '12px' : '14px', color: '#666' }}>
                    正確率：{((entry.correctRate ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* 前三名獎章（佔 2/3 欄寬） */}
                {isTop3 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      width: compact ? '80px' : '120px',
                      fontSize: compact ? '60px' : '80px',
                      lineHeight: 1,
                    }}
                  >
                    {isGold ? '🥇' : isSilver ? '🥈' : '🥉'}
                  </div>
                )}

                {/* 分數 */}
                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                    minWidth: compact ? '80px' : '100px',
                  }}
                >
                  <div
                    style={{
                      fontSize: compact ? '28px' : '36px',
                      fontWeight: '700',
                      color: isTop3 ? '#1976d2' : '#333',
                      lineHeight: 1,
                    }}
                  >
                    {entry.totalScore}
                  </div>
                  <div
                    style={{
                      fontSize: compact ? '14px' : '16px',
                      color: '#666',
                      marginTop: '4px',
                      fontWeight: '600',
                    }}
                  >
                    分
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 說明文字 */}
      {!compact && (
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
      )}
    </div>
  );
};

export default LeaderboardDisplay;
