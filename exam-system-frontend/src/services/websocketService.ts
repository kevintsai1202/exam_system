/**
 * WebSocket Service - STOMP over WebSocket 連線管理
 *
 * 負責所有與後端的即時通訊
 * 使用 SockJS + STOMP 協定
 */

import { Client } from '@stomp/stompjs';
import type { StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WebSocketMessage } from '../types';

// WebSocket Endpoint
// 開發環境使用完整 URL，生產環境使用動態 URL
const WS_ENDPOINT = import.meta.env.PROD
  ? `${window.location.protocol}//${window.location.host}/ws` // 生產環境：動態 URL
  : 'http://localhost:8080/ws'; // 開發環境：完整 URL

/**
 * 訂閱主題類型
 */
export enum SubscriptionTopic {
  EXAM_STATUS = 'status',              // 測驗狀態
  STUDENTS = 'students',                // 學員加入
  QUESTION = 'question',                // 題目推送
  STATISTICS = 'statistics',            // 題目統計
  CUMULATIVE = 'cumulative',            // 累積統計
  LEADERBOARD = 'leaderboard',          // 排行榜
  TIMER = 'timer',                      // 倒數計時
}

/**
 * 訂閱回調函式類型
 */
export type SubscriptionCallback = (message: WebSocketMessage) => void;

/**
 * WebSocket 連線狀態
 */
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

/**
 * WebSocket Service 類別
 */
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 秒
  private statusChangeListeners: ((status: ConnectionStatus) => void)[] = [];

  /**
   * 初始化 WebSocket 連線
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client && this.client.connected) {
        console.log('[WebSocket] 已連線，無需重複連線');
        // 確保觸發狀態更新，讓訂閱 Hook 可以重新執行
        this.updateStatus(ConnectionStatus.CONNECTED);
        resolve();
        return;
      }

      this.updateStatus(ConnectionStatus.CONNECTING);

      // 建立 STOMP Client
      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_ENDPOINT) as any,
        debug: (str) => {
          console.log('[WebSocket Debug]', str);
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // 連線成功回調
        onConnect: () => {
          console.log('[WebSocket] 連線成功');
          this.reconnectAttempts = 0;
          this.updateStatus(ConnectionStatus.CONNECTED);
          resolve();
        },

        // 連線錯誤回調
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP 錯誤:', frame.headers['message']);
          console.error('[WebSocket] 錯誤詳情:', frame.body);
          this.updateStatus(ConnectionStatus.ERROR);
          reject(new Error(frame.headers['message']));
        },

        // WebSocket 關閉回調
        onWebSocketClose: () => {
          console.warn('[WebSocket] 連線已關閉');
          this.handleDisconnect();
        },

        // WebSocket 錯誤回調
        onWebSocketError: (error) => {
          console.error('[WebSocket] 連線錯誤:', error);
          this.updateStatus(ConnectionStatus.ERROR);
        },
      });

      // 啟動連線
      this.client.activate();
    });
  }

  /**
   * 斷線處理
   */
  private handleDisconnect(): void {
    this.updateStatus(ConnectionStatus.DISCONNECTED);

    // 嘗試重新連線
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] 嘗試重新連線 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.updateStatus(ConnectionStatus.RECONNECTING);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[WebSocket] 重新連線失敗:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('[WebSocket] 已達最大重連次數，停止重連');
      this.updateStatus(ConnectionStatus.ERROR);
    }
  }

  /**
   * 訂閱測驗狀態
   */
  subscribeExamStatus(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/status`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱學員加入通知
   */
  subscribeStudents(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/students`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱題目推送
   */
  subscribeQuestion(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/question`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱題目統計
   */
  subscribeQuestionStatistics(examId: number, questionId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/statistics/question/${questionId}`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱累積統計
   */
  subscribeCumulativeStatistics(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/statistics/cumulative`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱排行榜
   */
  subscribeLeaderboard(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/leaderboard`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱倒數計時
   */
  subscribeTimer(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/timer`;
    return this.subscribe(topic, callback);
  }

  /**
   * 通用訂閱方法
   */
  public subscribe(topic: string, callback: SubscriptionCallback): string {
    console.log(`[WebSocket] 嘗試訂閱主題: ${topic}`);
    console.log(`[WebSocket] Client 狀態: connected=${this.client?.connected}, client存在=${!!this.client}, connectionStatus=${this.connectionStatus}`);

    // 檢查連線狀態
    if (!this.client || this.connectionStatus !== ConnectionStatus.CONNECTED) {
      const error = new Error(`WebSocket 未連線，無法訂閱（狀態：${this.connectionStatus}）`);
      console.error('[WebSocket] 訂閱失敗:', error);
      throw error;
    }

    // 檢查是否已訂閱
    if (this.subscriptions.has(topic)) {
      console.warn(`[WebSocket] 主題 ${topic} 已訂閱`);
      return topic;
    }

    // 等待 client.connected 變為 true（最多等待 100ms）
    // 因為 STOMP client 內部的 connected 屬性可能在 onConnect callback 之後才被設定
    const maxWaitTime = 100;
    const checkInterval = 10;
    let waitedTime = 0;

    const waitForConnection = (): void => {
      if (this.client!.connected) {
        console.log('[WebSocket] Client 已完全連線，開始訂閱');
        this.performSubscribe(topic, callback);
      } else if (waitedTime < maxWaitTime) {
        waitedTime += checkInterval;
        setTimeout(() => waitForConnection(), checkInterval);
      } else {
        console.warn('[WebSocket] 等待連線超時，嘗試強制訂閱');
        this.performSubscribe(topic, callback);
      }
    };

    waitForConnection();
    return topic;
  }

  /**
   * 執行實際的訂閱操作
   */
  private performSubscribe(topic: string, callback: SubscriptionCallback): void {
    try {
      // 建立訂閱
      const subscription = this.client!.subscribe(topic, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body) as WebSocketMessage;
          console.log(`[WebSocket] 收到訊息 [${topic}]:`, data);
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] 解析訊息失敗 [${topic}]:`, error);
        }
      });

      this.subscriptions.set(topic, subscription);
      console.log(`[WebSocket] 訂閱成功: ${topic}`);
    } catch (error) {
      console.error(`[WebSocket] 訂閱主題失敗 [${topic}]:`, error);
      throw error;
    }
  }

  /**
   * 取消訂閱
   */
  unsubscribe(topic: string): void {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`[WebSocket] 取消訂閱: ${topic}`);
    }
  }

  /**
   * 取消所有訂閱
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, topic) => {
      subscription.unsubscribe();
      console.log(`[WebSocket] 取消訂閱: ${topic}`);
    });
    this.subscriptions.clear();
  }

  /**
   * 斷開連線
   */
  disconnect(): void {
    if (this.client) {
      this.unsubscribeAll();
      this.client.deactivate();
      this.client = null;
      this.updateStatus(ConnectionStatus.DISCONNECTED);
      console.log('[WebSocket] 已斷開連線');
    }
  }

  /**
   * 取得連線狀態
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * 檢查是否已連線
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * 監聽連線狀態變化
   */
  onStatusChange(listener: (status: ConnectionStatus) => void): void {
    this.statusChangeListeners.push(listener);
  }

  /**
   * 移除狀態監聽器
   */
  removeStatusListener(listener: (status: ConnectionStatus) => void): void {
    const index = this.statusChangeListeners.indexOf(listener);
    if (index > -1) {
      this.statusChangeListeners.splice(index, 1);
    }
  }

  /**
   * 更新連線狀態並通知監聽器
   */
  private updateStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusChangeListeners.forEach((listener) => listener(status));
  }
}

// 匯出單例實例
export const websocketService = new WebSocketService();

export default websocketService;
