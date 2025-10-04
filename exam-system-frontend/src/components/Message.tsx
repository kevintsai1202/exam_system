/**
 * Message 訊息提示元件
 *
 * 替代 alert，提供更友善的訊息提示
 */

import React, { useEffect } from 'react';
import type { MessageType } from '../hooks/useMessage';

export interface MessageProps {
  /** 訊息內容 */
  content: string;
  /** 訊息類型 */
  type?: MessageType;
  /** 顯示時長（毫秒），0 表示不自動關閉 */
  duration?: number;
  /** 關閉回調 */
  onClose?: () => void;
}

/**
 * Message 元件
 */
export const Message: React.FC<MessageProps> = ({
  content,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // 根據類型設定顏色
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#52c41a',
          borderColor: '#52c41a',
          icon: '✓'
        };
      case 'error':
        return {
          backgroundColor: '#ff4d4f',
          borderColor: '#ff4d4f',
          icon: '✕'
        };
      case 'warning':
        return {
          backgroundColor: '#faad14',
          borderColor: '#faad14',
          icon: '!'
        };
      default:
        return {
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          icon: 'ℹ'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: '300px',
        maxWidth: '500px',
        padding: '16px 20px',
        backgroundColor: styles.backgroundColor,
        color: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'messageSlideIn 0.3s ease-out',
        fontSize: '14px',
      }}
    >
      <style>{`
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <span
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
        }}
      >
        {styles.icon}
      </span>

      <span style={{ flex: 1 }}>{content}</span>

      {duration === 0 && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 4px',
            opacity: 0.8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          ×
        </button>
      )}
    </div>
  );
};
