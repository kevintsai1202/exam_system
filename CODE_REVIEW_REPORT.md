# Code Review 報告

**專案**: 即時互動測驗統計系統
**審查日期**: 2025-11-08
**審查範圍**: 前端 (React + TypeScript) + 後端 (Spring Boot + Java 21)

---

## 📊 執行摘要

### 整體評分: 6.5/10

**優點**:
- 架構清晰，遵循前後端分離與三層架構設計
- 良好的程式碼註解與文檔
- 使用現代化技術棧 (Spring Boot 3.5, React 18, TypeScript)
- 完整的測試覆蓋 (63+ 測試案例)
- WebSocket 即時通訊實作完善

**主要問題**:
- ❌ **Critical**: 完全缺少身份驗證與授權機制
- ❌ **Critical**: WebSocket 連線無安全防護
- ⚠️ **High**: 多項並發與事務處理問題
- ⚠️ **High**: 前端 TypeScript 類型安全性不足
- ⚠️ **High**: 缺少 Rate Limiting 防禦機制

---

## 🔴 Critical 嚴重問題 (必須立即修復)

### 後端

#### 1. **完全缺少身份驗證與授權機制** 🔥
- **影響**: 任何人都可以創建、修改、刪除測驗；查看所有測驗資料
- **檔案**: 所有 Controller
- **風險**: 資料外洩、惡意操作、系統濫用
- **建議**:
  ```java
  // 引入 Spring Security
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
  </dependency>

  // 實作 JWT 認證
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {
      @Bean
      public SecurityFilterChain filterChain(HttpSecurity http) {
          return http
              .authorizeHttpRequests(auth -> auth
                  .requestMatchers("/api/exams/**").hasRole("TEACHER")
                  .requestMatchers("/api/students/**").permitAll()
                  .anyRequest().authenticated()
              )
              .build();
      }
  }
  ```

#### 2. **WebSocket 連線無身份驗證**
- **影響**: 任何人可訂閱任何測驗的 WebSocket topic，洩露題目與答案
- **檔案**: `WebSocketConfig.java`
- **建議**:
  ```java
  @Configuration
  public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
      @Override
      public void configureClientInboundChannel(ChannelRegistration registration) {
          registration.interceptors(new ChannelInterceptor() {
              @Override
              public Message<?> preSend(Message<?> message, MessageChannel channel) {
                  StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                  if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                      // 驗證訂閱權限
                      String destination = accessor.getDestination();
                      String sessionId = accessor.getSessionId();
                      validateSubscription(destination, sessionId);
                  }
                  return message;
              }
          });
      }
  }
  ```

#### 3. **H2 Console 在生產環境可能開啟**
- **影響**: 完整資料庫存取權限暴露
- **檔案**: `application.yml:20`
- **建議**:
  ```yaml
  # application-prod.yml
  spring:
    h2:
      console:
        enabled: false  # 生產環境必須關閉
  ```

#### 4. **事務中使用 Thread.sleep() 阻塞資源**
- **影響**: 高並發下資料庫連接池耗盡，系統癱瘓
- **檔案**: `ExamService.java:114-119`
- **當前程式碼**:
  ```java
  @Transactional
  public ExamDTO createExam(ExamDTO examDTO, String baseUrl) {
      while (retries < maxRetries) {
          try {
              Thread.sleep(50); // ❌ 在事務中阻塞
              exam.setAccessCode(qrCodeService.generateAccessCode());
  ```
- **建議**: 使用樂觀鎖或移除重試邏輯，改用 UUID 生成
  ```java
  // 方案1: 使用 UUID (推薦)
  exam.setAccessCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase());

  // 方案2: 移出事務外處理
  String accessCode = generateUniqueAccessCode(); // 在事務外重試
  createExamInTransaction(examDTO, accessCode);
  ```

### 前端

#### 5. **useCountdown Hook 記憶體洩漏**
- **影響**: 多個計時器同時運行，導致記憶體洩漏與計時錯誤
- **檔案**: `hooks/useCountdown.ts:95-121`
- **建議**:
  ```typescript
  useEffect(() => {
    // 先清除舊的 interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]); // 確保依賴正確
  ```

---

## 🟠 High 高優先級問題

### 後端

#### 6. **正確答案洩露風險**
- **檔案**: `ExamService.java:307-311`
- **問題**: `getExamQuestions` 返回包含 `correctOptionId` 的完整題目
- **建議**: 創建不同的 DTO
  ```java
  public List<PublicQuestionDTO> getExamQuestionsForStudent(Long examId) {
      // 不包含 correctOptionId
  }

  public List<AdminQuestionDTO> getExamQuestionsForTeacher(Long examId) {
      // 包含完整資訊
  }
  ```

#### 7. **缺少 Rate Limiting**
- **影響**: 易遭受 DDoS 攻擊或 API 濫用
- **建議**: 使用 Bucket4j
  ```java
  @Configuration
  public class RateLimitConfig {
      @Bean
      public Bucket createAnswerBucket() {
          Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofSeconds(1)));
          return Bucket.builder().addLimit(limit).build();
      }
  }

  @PostMapping("/answers")
  public ResponseEntity<AnswerDTO> submitAnswer(@RequestBody AnswerSubmitDTO dto) {
      if (!bucket.tryConsume(1)) {
          throw new RateLimitExceededException();
      }
      // ...
  }
  ```

#### 8. **baseUrl 參數 SSRF 風險**
- **檔案**: `ExamController.java:72`
- **建議**: 白名單驗證
  ```java
  private static final Set<String> ALLOWED_DOMAINS = Set.of(
      "localhost:5173",
      "localhost:3000",
      "your-production-domain.com"
  );

  private void validateBaseUrl(String baseUrl) {
      URI uri = new URI(baseUrl);
      if (!ALLOWED_DOMAINS.contains(uri.getHost() + ":" + uri.getPort())) {
          throw new BusinessException("Invalid base URL");
      }
  }
  ```

#### 9. **Repository @Modifying 註解缺失**
- **檔案**: `AnswerRepository.java:94`
- **問題**: DELETE query 缺少必要註解，可能導致執行失敗
- **建議**:
  ```java
  @Modifying
  @Transactional
  @Query("DELETE FROM Answer a WHERE a.question.exam.id = :examId")
  void deleteByExamId(@Param("examId") Long examId);
  ```

#### 10. **循環依賴問題**
- **檔案**: `ExamService` ↔ `StatisticsService`
- **當前解法**: 使用 `@Lazy` (治標不治本)
- **建議**: 重構為事件驅動架構
  ```java
  @Service
  public class ExamEventPublisher {
      private final ApplicationEventPublisher eventPublisher;

      public void publishQuestionStarted(Long examId, Long questionId) {
          eventPublisher.publishEvent(new QuestionStartedEvent(examId, questionId));
      }
  }

  @Component
  public class StatisticsEventListener {
      @EventListener
      public void onQuestionStarted(QuestionStartedEvent event) {
          // 處理統計邏輯
      }
  }
  ```

### 前端

#### 11. **WebSocket 訊息類型不安全**
- **檔案**: `pages/StudentExam.tsx:46,59,61,66`
- **問題**: 使用 `message as any` 繞過類型檢查
- **建議**:
  ```typescript
  // 定義類型守衛
  function isExamStatusMessage(msg: WebSocketMessage): msg is ExamStatusMessage {
      return msg.type === WebSocketMessageType.EXAM_STARTED ||
             msg.type === WebSocketMessageType.EXAM_ENDED;
  }

  const handleExamStatus = useCallback((message: WebSocketMessage) => {
      if (isExamStatusMessage(message)) {
          const status = message.status; // 類型安全
          setExamStatus(status);
      }
  }, []);
  ```

#### 12. **缺少全域錯誤邊界 (Error Boundary)**
- **影響**: 組件錯誤導致整個應用白屏
- **建議**:
  ```tsx
  class ErrorBoundary extends React.Component {
      state = { hasError: false };

      static getDerivedStateFromError() {
          return { hasError: true };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          console.error('Error:', error, errorInfo);
      }

      render() {
          if (this.state.hasError) {
              return <ErrorFallback />;
          }
          return this.props.children;
      }
  }

  // App.tsx
  <ErrorBoundary>
      <App />
  </ErrorBoundary>
  ```

#### 13. **ExamMonitor 計時器未清理**
- **檔案**: `pages/ExamMonitor.tsx:291-311`
- **建議**:
  ```typescript
  useEffect(() => {
      const timers: NodeJS.Timeout[] = [];

      if (currentQuestion) {
          const timer = setTimeout(() => {
              setIsLoadingStats(false);
          }, 500);
          timers.push(timer);
      }

      return () => {
          timers.forEach(t => clearTimeout(t));
      };
  }, [currentQuestion]);
  ```

---

## 🟡 Medium 中優先級問題

### 後端

#### 14. **統計更新阻塞答題響應**
- **檔案**: `AnswerService.java:132-133`
- **建議**: 使用 `@Async` 異步處理
  ```java
  @Async
  public void updateStatisticsAsync(Long examId, Long questionId) {
      statisticsService.calculateQuestionStatistics(examId, questionId);
  }
  ```

#### 15. **accessCode 強度不足**
- **檔案**: `QRCodeService.java:37-48`
- **問題**: 6 位字元可能被暴力破解
- **建議**: 增加長度至 8-10 位，並添加 Rate Limiting

#### 16. **魔術數字硬編碼**
- **檔案**: `ExamService.java:71,115`
- **建議**:
  ```java
  private static final int MAX_RETRY_ATTEMPTS = 5;
  private static final long RETRY_DELAY_MS = 50L;
  ```

#### 17. **缺少 CSRF 保護**
- **建議**: 啟用 Spring Security CSRF
  ```java
  http.csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
  ```

### 前端

#### 18. **API URL 硬編碼**
- **檔案**: `services/apiService.ts:36`, `services/websocketService.ts:14`
- **建議**:
  ```typescript
  // .env
  VITE_API_BASE_URL=http://localhost:8080/api
  VITE_WS_ENDPOINT=http://localhost:8080/ws

  // apiService.ts
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  ```

#### 19. **錯誤處理使用 any**
- **多處**: `StudentExam.tsx:113`, `ExamMonitor.tsx:179`
- **建議**:
  ```typescript
  catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      message.error(errorMessage);
  }
  ```

#### 20. **WebSocket 重連無指數退避**
- **檔案**: `services/websocketService.ts:121-134`
- **建議**:
  ```typescript
  const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // 最大 30 秒
  );
  ```

#### 21. **Zustand Store 使用 Map 結構**
- **檔案**: `store/statisticsStore.ts:43`
- **問題**: Map 不可序列化，無法持久化
- **建議**: 使用 `Record<number, QuestionStatistics>`

#### 22. **ExamMonitor 組件過於龐大**
- **檔案**: `pages/ExamMonitor.tsx` (755 行)
- **建議**: 拆分為子組件
  - `ExamHeader` - 控制列
  - `QuestionTab` - 題目管理
  - `LeaderboardTab` - 排行榜
  - `StatisticsTab` - 統計圖表

---

## 🟢 Low 低優先級問題

### 後端

23. **DTO 轉換邏輯散佈** - 考慮使用 MapStruct
24. **過長方法** - `ExamService.createExam` (60+ 行)
25. **缺少 API 版本控制** - 使用 `/api/v1/exams` 格式
26. **Native Query 降低可移植性** - `StudentRepository.java:76`

### 前端

27. **Email 驗證正則過於簡單** - `StudentJoin.tsx:64`
28. **WebSocket 配置硬編碼** - 應可配置
29. **缺少 PropTypes/JSDoc 註解** - 組件說明不足
30. **useMediaQuery SSR 不相容** - 直接訪問 `window.innerWidth`

---

## 📈 測試覆蓋率分析

### 後端測試

**測試檔案**: 7 個
**測試案例**: 63+

**涵蓋範圍**:
- ✅ Service 層: `ExamServiceTest`, `AnswerServiceTest`, `StudentServiceTest`, `QRCodeServiceTest`, `StatisticsServiceTest`
- ✅ Repository 層: `ExamRepositoryTest`
- ✅ 整合測試: `ExamFlowIntegrationTest`

**優點**:
- 使用 Mockito 進行單元測試
- 整合測試覆蓋完整業務流程
- 使用 AssertJ 提供流暢的斷言
- 測試資料建構器 (`TestDataBuilder`) 統一測試資料

**缺失**:
- ❌ 無 Controller 單元測試 (應使用 `@WebMvcTest`)
- ❌ 無 WebSocket 測試
- ❌ 無並發測試 (應測試 300 學員同時答題場景)
- ❌ 缺少負面測試案例 (邊界條件、異常情況)

**建議新增測試**:
```java
// 並發測試
@Test
void testConcurrentAnswerSubmission() throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(300);
    CountDownLatch latch = new CountDownLatch(300);

    for (int i = 0; i < 300; i++) {
        executor.submit(() -> {
            try {
                answerService.submitAnswer(createAnswerDTO());
            } finally {
                latch.countDown();
            }
        });
    }

    latch.await(10, TimeUnit.SECONDS);
    // 驗證結果
}

// WebSocket 測試
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class WebSocketIntegrationTest {
    @Test
    void testQuestionBroadcast() {
        StompSession session = stompClient.connect(...).get();
        session.subscribe("/topic/exam/1/question", handler);
        // 觸發題目推送並驗證
    }
}
```

### 前端測試

**狀態**: ❌ **完全缺少測試**

**建議**:
- 使用 Vitest + React Testing Library
- 組件測試: 關鍵頁面 (StudentExam, ExamMonitor, InstructorDashboard)
- Hook 測試: useWebSocket, useCountdown
- Store 測試: studentStore, examStore, statisticsStore
- E2E 測試: 使用 Playwright 測試完整流程

---

## 🔒 安全性檢查清單

| 項目 | 狀態 | 嚴重性 |
|------|------|--------|
| 身份驗證 | ❌ 缺失 | Critical |
| 授權控制 | ❌ 缺失 | Critical |
| WebSocket 安全 | ❌ 缺失 | Critical |
| SQL Injection | ✅ 使用 JPA/參數綁定 | Low Risk |
| XSS 防護 | ⚠️ 部分 (依賴 Spring Boot 默認) | Medium |
| CSRF 保護 | ❌ 缺失 | High |
| Rate Limiting | ❌ 缺失 | High |
| HTTPS | ⚠️ 未驗證 | High |
| 敏感資料加密 | ⚠️ 資料庫密碼為空 | Medium |
| Session 管理 | ⚠️ sessionId 無 TTL | Medium |
| 輸入驗證 | ✅ 使用 Bean Validation | Good |
| 錯誤訊息洩露 | ✅ GlobalExceptionHandler | Good |
| 依賴漏洞 | ⚠️ 未掃描 | Medium |

**建議行動**:
1. 立即實作 Spring Security
2. 添加 JWT 或 Session 認證
3. 實作 RBAC (Role-Based Access Control)
4. 啟用 HTTPS Only
5. 定期執行 `mvn dependency-check:check`

---

## 📋 建議修復優先級

### 第一階段 (立即修復 - 1-2 天)
1. ✅ 實作基礎認證系統 (Spring Security + JWT)
2. ✅ 保護 WebSocket 連線
3. ✅ 修復 `Thread.sleep` 事務問題
4. ✅ 修復 `@Modifying` 缺失問題
5. ✅ 修復前端記憶體洩漏 (useCountdown)

### 第二階段 (高優先級 - 3-5 天)
1. 添加 Rate Limiting
2. 修復正確答案洩露問題
3. 實作 CSRF 保護
4. 加強 TypeScript 類型安全
5. 添加全域錯誤邊界

### 第三階段 (中優先級 - 1-2 週)
1. 重構循環依賴 (事件驅動)
2. 環境變數配置化
3. 拆分大型組件
4. 改進錯誤處理
5. 添加前端測試

### 第四階段 (長期優化 - 持續)
1. 提升測試覆蓋率至 80%+
2. 添加並發測試
3. 程式碼重構 (DRY)
4. 性能優化
5. 文檔完善

---

## 💡 架構改進建議

### 後端

#### 1. 引入多層級快取
```java
@Cacheable(value = "exams", key = "#examId")
public ExamDTO getExam(Long examId) {
    // Redis 快取熱門測驗
}
```

#### 2. 訊息隊列解耦
```java
// 使用 Spring AMQP
@RabbitListener(queues = "answer.queue")
public void processAnswer(AnswerSubmitDTO dto) {
    // 異步處理答案與統計
}
```

#### 3. 資料庫升級
- 生產環境使用 PostgreSQL/MySQL
- 實作 Read/Write 分離
- 添加資料庫索引優化查詢

#### 4. 監控與日誌
```java
// 引入 Spring Boot Actuator + Prometheus
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### 前端

#### 1. 效能優化
```typescript
// 虛擬滾動處理大量學員
import { FixedSizeList } from 'react-window';

// 組件懶加載
const ExamMonitor = lazy(() => import('./pages/ExamMonitor'));
```

#### 2. PWA 支援
- 離線答題能力
- Service Worker 快取
- 推送通知

#### 3. 狀態管理升級
- 考慮使用 Redux Toolkit (更複雜場景)
- 或保持 Zustand 但添加 DevTools

---

## 📚 參考資源

### 安全性
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security 文檔](https://spring.io/projects/spring-security)
- [JWT 最佳實踐](https://tools.ietf.org/html/rfc8725)

### 測試
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### 效能
- [Spring Boot Performance Tuning](https://spring.io/blog/2015/11/29/how-not-to-hate-spring-in-2016)
- [React Performance](https://react.dev/learn/render-and-commit)

---

## 🎯 總結

這是一個**功能完善但安全性嚴重不足**的專案。

**核心問題**:
- **安全性**: 完全開放的 API 與 WebSocket，無任何認證機制
- **並發**: 事務中阻塞操作可能導致高並發下系統崩潰
- **類型安全**: 前端過度使用 `any` 繞過 TypeScript 保護

**行動建議**:
1. **立即** 實作認證系統 (建議使用 Spring Security + JWT)
2. **立即** 修復事務中的 `Thread.sleep` 問題
3. **優先** 添加 Rate Limiting 與 CSRF 保護
4. **規劃** 前端測試與組件重構
5. **持續** 改進程式碼品質與測試覆蓋率

**預估工作量**:
- Critical 問題修復: 3-5 天
- High 問題修復: 1 週
- Medium/Low 問題修復: 2-3 週
- 完整重構與優化: 1-2 個月

---

**審查人**: Claude Code
**聯絡**: 如有問題請參考文檔或提出 Issue
