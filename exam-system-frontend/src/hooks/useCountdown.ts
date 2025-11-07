/**
 * useCountdown Hook - 倒數計時自定義 Hook
 *
 * 提供倒數計時功能，適用於測驗題目計時
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useCountdown Hook 介面
 */
interface UseCountdownReturn {
  secondsRemaining: number;
  isRunning: boolean;
  isExpired: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newSeconds?: number) => void;
}

/**
 * useCountdown Hook
 *
 * 倒數計時器，每秒更新一次
 *
 * @param initialSeconds - 初始秒數
 * @param onExpire - 時間到期時的回調函式
 * @param autoStart - 是否自動開始（預設 true）
 * @returns 倒數計時狀態與控制方法
 */
export const useCountdown = (
  initialSeconds: number,
  onExpire?: () => void,
  autoStart = true
): UseCountdownReturn => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // 更新 onExpire ref（避免過時的閉包）
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  /**
   * 格式化時間為 MM:SS
   */
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * 開始計時
   */
  const start = useCallback(() => {
    setIsRunning(true);
    setIsExpired(false);
  }, []);

  /**
   * 暫停計時
   */
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * 繼續計時
   */
  const resume = useCallback(() => {
    if (!isExpired) {
      setIsRunning(true);
    }
  }, [isExpired]);

  /**
   * 重置計時器
   */
  const reset = useCallback((newSeconds?: number) => {
    const resetSeconds = newSeconds ?? initialSeconds;
    setSecondsRemaining(resetSeconds);
    setIsRunning(false);
    setIsExpired(false);
  }, [initialSeconds]);

  /**
   * 倒數計時邏輯
   */
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 建立計時器
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // 時間到期
          setIsRunning(false);
          setIsExpired(true);

          // 呼叫過期回調
          if (onExpireRef.current) {
            onExpireRef.current();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 清理函式
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  /**
   * 元件卸載時清理計時器
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    secondsRemaining,
    isRunning,
    isExpired,
    formattedTime: formatTime(secondsRemaining),
    start,
    pause,
    resume,
    reset,
  };
};

/**
 * useExamTimer Hook
 *
 * 專門用於測驗題目計時，支援伺服器時間同步
 *
 * @param expiresAt - 到期時間（ISO 字串）
 * @param onExpire - 時間到期回調
 * @returns 倒數計時狀態與控制方法
 */
export const useExamTimer = (
  expiresAt: string | null,
  onExpire?: () => void
): UseCountdownReturn => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // 更新 onExpire ref
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  /**
   * 計算剩餘秒數
   */
  const calculateRemainingSeconds = useCallback((expireTime: string): number => {
    const now = new Date().getTime();
    const expire = new Date(expireTime).getTime();
    const diffMs = expire - now;
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, []);

  /**
   * 格式化時間
   */
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * 初始化計時器
   */
  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(0);
      setIsRunning(false);
      setIsExpired(false);
      return;
    }

    // 計算初始剩餘秒數
    const remaining = calculateRemainingSeconds(expiresAt);
    setSecondsRemaining(remaining);
    setIsExpired(remaining === 0);
    setIsRunning(remaining > 0);
  }, [expiresAt, calculateRemainingSeconds]);

  /**
   * 倒數計時邏輯
   */
  useEffect(() => {
    if (!isRunning || !expiresAt) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 建立計時器
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemainingSeconds(expiresAt);

      if (remaining <= 0) {
        // 時間到期
        setSecondsRemaining(0);
        setIsRunning(false);
        setIsExpired(true);

        // 清除計時器
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // 呼叫過期回調
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    // 清理函式
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, expiresAt, calculateRemainingSeconds]);

  /**
   * 元件卸載時清理
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // useExamTimer 不提供手動控制（由伺服器時間控制）
  const start = useCallback(() => {}, []);
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);
  const reset = useCallback(() => {}, []);

  return {
    secondsRemaining,
    isRunning,
    isExpired,
    formattedTime: formatTime(secondsRemaining),
    start,
    pause,
    resume,
    reset,
  };
};

export default useCountdown;
