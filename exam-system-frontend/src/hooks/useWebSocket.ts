/**
 * useWebSocket Hook - WebSocket 連線管理自定義 Hook
 *
 * 封裝 WebSocket 連線邏輯，提供 React 元件使用
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import websocketService, { ConnectionStatus } from '../services/websocketService';
import type { SubscriptionCallback } from '../services/websocketService';

/**
 * useWebSocket Hook 介面
 */
interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (topic: string, callback: SubscriptionCallback) => void;
  unsubscribe: (topic: string) => void;
}

/**
 * useWebSocket Hook
 *
 * 用於管理 WebSocket 連線生命週期
 *
 * @param autoConnect - 是否自動連線（預設 true）
 * @returns WebSocket 連線狀態與方法
 */
export const useWebSocket = (autoConnect = true): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  /**
   * 連線狀態變化處理
   */
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    setIsConnected(status === ConnectionStatus.CONNECTED);
  }, []);

  /**
   * 連線方法
   */
  const connect = useCallback(async () => {
    try {
      await websocketService.connect();
    } catch (error) {
      console.error('[useWebSocket] 連線失敗:', error);
      throw error;
    }
  }, []);

  /**
   * 斷線方法
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  /**
   * 訂閱主題
   */
  const subscribe = useCallback((topic: string, callback: SubscriptionCallback) => {
    try {
      websocketService.subscribe(topic, callback);
      subscriptionsRef.current.add(topic);
    } catch (error) {
      console.error(`[useWebSocket] 訂閱失敗 [${topic}]:`, error);
    }
  }, []);

  /**
   * 取消訂閱
   */
  const unsubscribe = useCallback((topic: string) => {
    websocketService.unsubscribe(topic);
    subscriptionsRef.current.delete(topic);
  }, []);

  /**
   * 初始化 WebSocket 連線
   */
  useEffect(() => {
    // 註冊狀態監聽器
    websocketService.onStatusChange(handleStatusChange);

    // 自動連線
    if (autoConnect) {
      connect().catch((error) => {
        console.error('[useWebSocket] 自動連線失敗:', error);
      });
    }

    // 清理函式
    return () => {
      // 取消所有訂閱
      subscriptionsRef.current.forEach((topic) => {
        websocketService.unsubscribe(topic);
      });
      subscriptionsRef.current.clear();

      // 移除狀態監聽器
      websocketService.removeStatusListener(handleStatusChange);

      // 斷開連線
      if (websocketService.isConnected()) {
        websocketService.disconnect();
      }
    };
  }, [autoConnect, connect, handleStatusChange]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
};

/**
 * useExamWebSocket Hook
 *
 * 專門用於測驗的 WebSocket 訂閱管理
 *
 * @param examId - 測驗 ID
 * @param callbacks - 各種訂閱的回調函式
 */
interface ExamWebSocketCallbacks {
  onExamStatus?: SubscriptionCallback;
  onStudentJoined?: SubscriptionCallback;
  onQuestionStarted?: SubscriptionCallback;
  onStatisticsUpdated?: SubscriptionCallback;
  onCumulativeUpdated?: SubscriptionCallback;
  onLeaderboardUpdated?: SubscriptionCallback;
  onTimerUpdate?: SubscriptionCallback;
}

export const useExamWebSocket = (
  examId: number | null,
  callbacks: ExamWebSocketCallbacks = {}
) => {
  const { isConnected, connectionStatus, connect, disconnect } = useWebSocket(true);
  const callbacksRef = useRef(callbacks);

  // 更新 ref 保持最新的 callbacks
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!examId || !isConnected) return;

    console.log('[useExamWebSocket] 開始訂閱，examId:', examId);

    // 訂閱測驗相關主題
    const topics: string[] = [];

    try {
      if (callbacksRef.current.onExamStatus) {
        const topic = websocketService.subscribeExamStatus(examId, callbacksRef.current.onExamStatus);
        topics.push(topic);
      }

      if (callbacksRef.current.onStudentJoined) {
        const topic = websocketService.subscribeStudents(examId, callbacksRef.current.onStudentJoined);
        topics.push(topic);
      }

      if (callbacksRef.current.onQuestionStarted) {
        const topic = websocketService.subscribeQuestion(examId, callbacksRef.current.onQuestionStarted);
        topics.push(topic);
      }

      if (callbacksRef.current.onStatisticsUpdated) {
        // 注意：題目統計需要在推送題目時訂閱特定題目的統計主題
        // 這裡我們先訂閱通用的統計更新（如果後端有提供）
        // 實際上應該在 ExamMonitor 中動態訂閱當前題目的統計
        console.log('[useExamWebSocket] onStatisticsUpdated callback provided');
      }

      if (callbacksRef.current.onCumulativeUpdated) {
        const topic = websocketService.subscribeCumulativeStatistics(examId, callbacksRef.current.onCumulativeUpdated);
        topics.push(topic);
      }

      if (callbacksRef.current.onLeaderboardUpdated) {
        const topic = websocketService.subscribeLeaderboard(examId, callbacksRef.current.onLeaderboardUpdated);
        topics.push(topic);
      }

      if (callbacksRef.current.onTimerUpdate) {
        const topic = websocketService.subscribeTimer(examId, callbacksRef.current.onTimerUpdate);
        topics.push(topic);
      }

      console.log('[useExamWebSocket] 訂閱完成，topics:', topics);
    } catch (error) {
      console.error('[useExamWebSocket] 訂閱失敗:', error);
    }

    // 清理函式：取消所有訂閱
    return () => {
      console.log('[useExamWebSocket] 清理訂閱');
      topics.forEach((topic) => websocketService.unsubscribe(topic));
    };
  }, [examId, isConnected]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
  };
};

/**
 * useQuestionWebSocket Hook
 *
 * 專門用於題目統計的 WebSocket 訂閱
 *
 * @param examId - 測驗 ID
 * @param questionId - 題目 ID
 * @param onStatisticsUpdated - 統計更新回調
 */
export const useQuestionWebSocket = (
  examId: number | null,
  questionId: number | null,
  onStatisticsUpdated?: SubscriptionCallback
) => {
  const { isConnected } = useWebSocket(false);

  useEffect(() => {
    if (!examId || !questionId || !isConnected || !onStatisticsUpdated) return;

    // 訂閱題目統計
    const topic = websocketService.subscribeQuestionStatistics(examId, questionId, onStatisticsUpdated);

    // 清理函式
    return () => {
      websocketService.unsubscribe(topic);
    };
  }, [examId, questionId, isConnected, onStatisticsUpdated]);

  return {
    isConnected,
  };
};

export default useWebSocket;
