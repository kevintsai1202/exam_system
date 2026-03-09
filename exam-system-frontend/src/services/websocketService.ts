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

/**
 * 解析 WebSocket 端點
 * 優先順序：
 * 1. VITE_WS_ENDPOINT
 * 2. VITE_API_BASE_URL + /ws
 * 3. 生產環境 fallback: window.location.host + /ws
 * 4. 開發環境 fallback: http://localhost:8080/ws
 */
type WebSocketEndpointSource =
  | 'VITE_WS_ENDPOINT'
  | 'VITE_API_BASE_URL'
  | 'WINDOW_HOST'
  | 'DEV_DEFAULT';

interface ResolvedWebSocketEndpoint {
  endpoint: string;
  source: WebSocketEndpointSource;
}

function resolveWebSocketEndpoint(): ResolvedWebSocketEndpoint {
  const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT as string | undefined;
  if (wsEndpoint && wsEndpoint.trim().length > 0) {
    return {
      endpoint: wsEndpoint,
      source: 'VITE_WS_ENDPOINT',
    };
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (apiBaseUrl && apiBaseUrl.trim().length > 0) {
    return {
      endpoint: `${apiBaseUrl.replace(/\/+$/, '')}/ws`,
      source: 'VITE_API_BASE_URL',
    };
  }

  if (import.meta.env.PROD) {
    return {
      endpoint: `${window.location.protocol}//${window.location.host}/ws`,
      source: 'WINDOW_HOST',
    };
  }

  return {
    endpoint: 'http://localhost:8080/ws',
    source: 'DEV_DEFAULT',
  };
}

// WebSocket Endpoint
const WS_RESOLVED = resolveWebSocketEndpoint();
const WS_ENDPOINT = WS_RESOLVED.endpoint;

console.info('[WebSocket Config]', {
  source: WS_RESOLVED.source,
  endpoint: WS_ENDPOINT,
  VITE_WS_ENDPOINT: import.meta.env.VITE_WS_ENDPOINT,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

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
  private subscriptionCallbacks: Map<string, SubscriptionCallback> = new Map();
  private pendingSubscriptions: Set<string> = new Set();
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 秒
  private statusChangeListeners: ((status: ConnectionStatus) => void)[] = [];
  private reconnectSuccessListeners: (() => void)[] = []; // 重連成功回調
  private hasConnectedBefore = false; // 追蹤是否曾經連線過

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
          const isReconnect = this.hasConnectedBefore;
          console.log(`[WebSocket] 連線成功 (${isReconnect ? '重新連線' : '首次連線'})`);

          this.reconnectAttempts = 0;
          this.updateStatus(ConnectionStatus.CONNECTED);
          this.restoreSubscriptions();

          // 如果是重新連線，觸發重連成功回調
          if (isReconnect) {
            this.notifyReconnectSuccess();
          }

          this.hasConnectedBefore = true;
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
    // 底層連線已失效，既有 STOMP subscription 物件不可再使用
    this.subscriptions.clear();
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
   * 訂閱題目推送（通用主題，所有學員）
   */
  subscribeQuestion(examId: number, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/question`;
    return this.subscribe(topic, callback);
  }

  /**
   * 訂閱個人題目推送（個人專屬主題，用於後加入的學員）
   */
  subscribePersonalQuestion(examId: number, sessionId: string, callback: SubscriptionCallback): string {
    const topic = `/topic/exam/${examId}/question/${sessionId}`;
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

    // 檢查是否已訂閱
    if (this.subscriptions.has(topic)) {
      this.subscriptionCallbacks.set(topic, callback);
      console.warn(`[WebSocket] 主題 ${topic} 已訂閱`);
      return topic;
    }

    this.subscriptionCallbacks.set(topic, callback);

    if (!this.isClientReady()) {
      console.warn(`[WebSocket] STOMP 尚未 ready，先暫存待訂閱主題: ${topic}`);
      this.pendingSubscriptions.add(topic);
      return topic;
    }

    this.performSubscribe(topic);
    return topic;
  }

  /**
   * 執行實際的訂閱操作
   */
  private performSubscribe(topic: string): void {
    const callback = this.subscriptionCallbacks.get(topic);
    if (!callback) {
      console.warn(`[WebSocket] 缺少 callback，略過訂閱: ${topic}`);
      return;
    }

    if (!this.isClientReady()) {
      console.warn(`[WebSocket] STOMP 尚未 ready，延後訂閱: ${topic}`);
      this.pendingSubscriptions.add(topic);
      return;
    }

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
      this.pendingSubscriptions.delete(topic);
      console.log(`[WebSocket] 訂閱成功: ${topic}`);
    } catch (error) {
      this.pendingSubscriptions.add(topic);
      console.error(`[WebSocket] 訂閱主題失敗 [${topic}]:`, error);
      throw error;
    }
  }

  /**
   * 檢查底層 STOMP client 是否已可安全訂閱
   */
  private isClientReady(): boolean {
    return !!this.client && this.client.connected;
  }

  /**
   * 恢復所有已註冊但尚未建立的訂閱
   */
  private restoreSubscriptions(): void {
    const topicsToRestore = new Set<string>([
      ...this.subscriptionCallbacks.keys(),
      ...this.pendingSubscriptions.values(),
    ]);

    if (topicsToRestore.size === 0) {
      return;
    }

    console.log('[WebSocket] 準備恢復訂閱，topics:', Array.from(topicsToRestore));
    topicsToRestore.forEach((topic) => {
      if (!this.subscriptions.has(topic)) {
        this.performSubscribe(topic);
      }
    });
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

    this.pendingSubscriptions.delete(topic);
    this.subscriptionCallbacks.delete(topic);
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
    this.pendingSubscriptions.clear();
    this.subscriptionCallbacks.clear();
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

  /**
   * 監聽重連成功事件
   * 當 WebSocket 斷線後重新連線成功時觸發
   */
  onReconnectSuccess(listener: () => void): void {
    this.reconnectSuccessListeners.push(listener);
  }

  /**
   * 移除重連成功監聽器
   */
  removeReconnectSuccessListener(listener: () => void): void {
    const index = this.reconnectSuccessListeners.indexOf(listener);
    if (index > -1) {
      this.reconnectSuccessListeners.splice(index, 1);
    }
  }

  /**
   * 通知所有重連成功監聽器
   */
  private notifyReconnectSuccess(): void {
    console.log('[WebSocket] 觸發重連成功回調，監聽器數量:', this.reconnectSuccessListeners.length);
    this.reconnectSuccessListeners.forEach((listener) => listener());
  }
}

// 匯出單例實例
export const websocketService = new WebSocketService();

export default websocketService;
