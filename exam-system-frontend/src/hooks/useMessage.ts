/**
 * Message Hook
 *
 * 提供訊息提示功能
 */

import { useState, useCallback } from 'react';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageConfig {
  /** 訊息內容 */
  content: string;
  /** 訊息類型 */
  type: MessageType;
  /** 顯示時長（毫秒） */
  duration?: number;
  /** 唯一鍵值 */
  key: string;
}

/**
 * useMessage Hook
 *
 * @returns message 相關方法和狀態
 */
export const useMessage = () => {
  const [messages, setMessages] = useState<MessageConfig[]>([]);

  /**
   * 顯示訊息
   */
  const showMessage = useCallback((
    content: string,
    type: MessageType = 'info',
    duration: number = 3000
  ) => {
    const key = `message_${Date.now()}_${Math.random()}`;
    const newMessage: MessageConfig = {
      content,
      type,
      duration,
      key,
    };

    setMessages((prev) => [...prev, newMessage]);

    // 自動移除訊息
    if (duration > 0) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.key !== key));
      }, duration);
    }

    return key;
  }, []);

  /**
   * 成功訊息
   */
  const success = useCallback((content: string, duration?: number) => {
    return showMessage(content, 'success', duration);
  }, [showMessage]);

  /**
   * 錯誤訊息
   */
  const error = useCallback((content: string, duration?: number) => {
    return showMessage(content, 'error', duration);
  }, [showMessage]);

  /**
   * 警告訊息
   */
  const warning = useCallback((content: string, duration?: number) => {
    return showMessage(content, 'warning', duration);
  }, [showMessage]);

  /**
   * 一般訊息
   */
  const info = useCallback((content: string, duration?: number) => {
    return showMessage(content, 'info', duration);
  }, [showMessage]);

  /**
   * 關閉指定訊息
   */
  const close = useCallback((key: string) => {
    setMessages((prev) => prev.filter((msg) => msg.key !== key));
  }, []);

  /**
   * 關閉所有訊息
   */
  const closeAll = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    success,
    error,
    warning,
    info,
    close,
    closeAll,
  };
};
