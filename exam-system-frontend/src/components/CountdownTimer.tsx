/**
 * 倒數計時器元件
 *
 * 使用 useCountdown Hook 顯示倒數計時
 */

import React from 'react';
import { useCountdown, useExamTimer } from '../hooks';

/**
 * 倒數計時器 Props 介面
 */
interface CountdownTimerProps {
  type?: 'basic' | 'exam';           // 計時器類型（預設 'basic'）
  initialSeconds?: number;           // 初始秒數（basic 模式使用）
  expiresAt?: string | null;         // 到期時間（exam 模式使用）
  onExpire?: () => void;             // 時間到期回調
  autoStart?: boolean;               // 是否自動開始（預設 true）
  size?: 'small' | 'medium' | 'large'; // 顯示大小（預設 'medium'）
  showLabel?: boolean;               // 是否顯示標籤（預設 true）
  warningThreshold?: number;         // 警告閾值（秒，預設 10）
  dangerThreshold?: number;          // 危險閾值（秒，預設 5）
}

/**
 * 倒數計時器元件
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  type = 'basic',
  initialSeconds = 60,
  expiresAt = null,
  onExpire,
  autoStart = true,
  size = 'medium',
  showLabel = true,
  warningThreshold = 10,
  dangerThreshold = 5,
}) => {
  // 根據類型選擇 Hook
  const basicTimer = useCountdown(initialSeconds, onExpire, autoStart);
  const examTimer = useExamTimer(expiresAt, onExpire);

  const timer = type === 'exam' ? examTimer : basicTimer;
  const { secondsRemaining, formattedTime, isExpired } = timer;

  /**
   * 取得顏色狀態
   */
  const getColorStatus = (): string => {
    if (isExpired) return '#9e9e9e'; // 灰色
    if (secondsRemaining <= dangerThreshold) return '#f44336'; // 紅色
    if (secondsRemaining <= warningThreshold) return '#ff9800'; // 橙色
    return '#4caf50'; // 綠色
  };

  /**
   * 取得字體大小
   */
  const getFontSize = (): string => {
    switch (size) {
      case 'small':
        return '24px';
      case 'large':
        return '64px';
      case 'medium':
      default:
        return '48px';
    }
  };

  /**
   * 取得標籤字體大小
   */
  const getLabelFontSize = (): string => {
    switch (size) {
      case 'small':
        return '12px';
      case 'large':
        return '18px';
      case 'medium':
      default:
        return '14px';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* 標籤 */}
      {showLabel && (
        <div
          style={{
            fontSize: getLabelFontSize(),
            color: '#666',
            fontWeight: '500',
          }}
        >
          {isExpired ? '時間到' : '剩餘時間'}
        </div>
      )}

      {/* 計時器顯示 */}
      <div
        style={{
          fontSize: getFontSize(),
          fontWeight: 'bold',
          color: getColorStatus(),
          fontFamily: 'monospace',
          letterSpacing: '2px',
          transition: 'color 0.3s ease',
          textShadow:
            secondsRemaining <= dangerThreshold
              ? '0 0 10px rgba(244, 67, 54, 0.5)'
              : 'none',
        }}
      >
        {formattedTime}
      </div>

      {/* 進度條（可選） */}
      {type === 'basic' && !isExpired && (
        <div
          style={{
            width: '200px',
            height: '6px',
            backgroundColor: '#e0e0e0',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(secondsRemaining / initialSeconds) * 100}%`,
              height: '100%',
              backgroundColor: getColorStatus(),
              transition: 'width 1s linear, background-color 0.3s ease',
            }}
          />
        </div>
      )}

      {/* 過期提示 */}
      {isExpired && (
        <div
          style={{
            fontSize: getLabelFontSize(),
            color: '#f44336',
            fontWeight: '500',
            marginTop: '4px',
          }}
        >
          ⏰ 時間已到期
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
