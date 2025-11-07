# 即時互動測驗統計系統 - API 規格文件

## API 基本資訊

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`
- **字元編碼**: `UTF-8`
- **WebSocket Endpoint**: `ws://localhost:8080/ws`

## 狀態碼規範

| 狀態碼 | 說明                  |
|--------|----------------------|
| 200    | 請求成功              |
| 201    | 資源建立成功          |
| 400    | 請求參數錯誤          |
| 404    | 資源不存在            |
| 409    | 資源衝突（如重複作答）|
| 500    | 伺服器內部錯誤        |

## 錯誤回應格式

```json
{
  "timestamp": "2025-09-30T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "答題時間已結束",
  "path": "/api/answers"
}
```

---

## 1. 測驗管理 API (Exam Management)

### 1.1 建立測驗

**Endpoint**: `POST /api/exams`

**描述**: 講師建立新的測驗

**Request Body**:
```json
{
  "title": "Java 基礎測驗",
  "description": "測試 Java 基礎知識",
  "questionTimeLimit": 30,
  "questions": [
    {
      "questionOrder": 1,
      "questionText": "Java 是哪一年發布的？",
      "singleStatChartType": "BAR",
      "cumulativeChartType": "BAR",
      "options": [
        {
          "optionOrder": 1,
          "optionText": "1995"
        },
        {
          "optionOrder": 2,
          "optionText": "2000"
        },
        {
          "optionOrder": 3,
          "optionText": "2005"
        }
      ],
      "correctOptionOrder": 1
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "title": "Java 基礎測驗",
  "description": "測試 Java 基礎知識",
  "questionTimeLimit": 30,
  "status": "CREATED",
  "accessCode": "ABC123",
  "currentQuestionIndex": 0,
  "createdAt": "2025-09-30T10:00:00",
  "questions": [
    {
      "id": 1,
      "questionOrder": 1,
      "questionText": "Java 是哪一年發布的？",
      "singleStatChartType": "BAR",
      "cumulativeChartType": "BAR",
      "options": [
        {
          "id": 1,
          "optionOrder": 1,
          "optionText": "1995"
        },
        {
          "id": 2,
          "optionOrder": 2,
          "optionText": "2000"
        },
        {
          "id": 3,
          "optionOrder": 3,
          "optionText": "2005"
        }
      ],
      "correctOptionId": 1
    }
  ]
}
```

---

### 1.2 取得所有測驗

**Endpoint**: `GET /api/exams`

**描述**: 取得所有測驗列表（講師主控台用）

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Java 基礎測驗",
    "description": "測試 Java 基礎知識",
    "questionTimeLimit": 30,
    "status": "CREATED",
    "accessCode": "ABC123",
    "currentQuestionIndex": 0,
    "createdAt": "2025-09-30T10:00:00",
    "startedAt": null,
    "endedAt": null,
    "totalQuestions": 10,
    "totalStudents": 0
  },
  {
    "id": 2,
    "title": "Python 進階測驗",
    "description": "測試 Python 進階知識",
    "questionTimeLimit": 45,
    "status": "ENDED",
    "accessCode": "XYZ789",
    "currentQuestionIndex": 5,
    "createdAt": "2025-09-29T14:00:00",
    "startedAt": "2025-09-29T14:05:00",
    "endedAt": "2025-09-29T14:30:00",
    "totalQuestions": 5,
    "totalStudents": 30
  }
]
```

---

### 1.3 取得測驗資訊

**Endpoint**: `GET /api/exams/{examId}`

**描述**: 取得測驗詳細資訊（講師用）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Java 基礎測驗",
  "description": "測試 Java 基礎知識",
  "questionTimeLimit": 30,
  "status": "CREATED",
  "accessCode": "ABC123",
  "currentQuestionIndex": 0,
  "createdAt": "2025-09-30T10:00:00",
  "startedAt": null,
  "endedAt": null,
  "totalQuestions": 10,
  "totalStudents": 0
}
```

---

### 1.4 啟動測驗

**Endpoint**: `PUT /api/exams/{examId}/start`

**描述**: 講師啟動測驗，生成 QR Code

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Response** (200 OK):
```json
{
  "id": 1,
  "status": "STARTED",
  "accessCode": "ABC123",
  "qrCodeUrl": "http://localhost:8080/student/join?code=ABC123",
  "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "startedAt": "2025-09-30T10:05:00"
}
```

**WebSocket Broadcast**:
- Topic: `/topic/exam/{examId}/status`
- Payload:
```json
{
  "type": "EXAM_STARTED",
  "examId": 1,
  "status": "STARTED",
  "timestamp": "2025-09-30T10:05:00"
}
```

---

### 1.5 開始題目

**Endpoint**: `PUT /api/exams/{examId}/questions/{questionIndex}/start`

**描述**: 講師開始特定題目，學員開始作答

**Path Parameters**:
- `examId` (Long): 測驗 ID
- `questionIndex` (Integer): 題目索引（從 0 開始）

**Response** (200 OK):
```json
{
  "questionId": 1,
  "questionIndex": 0,
  "questionText": "Java 是哪一年發布的？",
  "timeLimit": 30,
  "startedAt": "2025-09-30T10:10:00",
  "expiresAt": "2025-09-30T10:10:30"
}
```

**WebSocket Broadcast**:
- Topic: `/topic/exam/{examId}/question`
- Payload:
```json
{
  "type": "QUESTION_STARTED",
  "questionId": 1,
  "questionIndex": 0,
  "questionText": "Java 是哪一年發布的？",
  "options": [
    {
      "id": 1,
      "optionOrder": 1,
      "optionText": "1995"
    },
    {
      "id": 2,
      "optionOrder": 2,
      "optionText": "2000"
    },
    {
      "id": 3,
      "optionOrder": 3,
      "optionText": "2005"
    }
  ],
  "timeLimit": 30,
  "startedAt": "2025-09-30T10:10:00",
  "expiresAt": "2025-09-30T10:10:30"
}
```

---

### 1.6 結束測驗

**Endpoint**: `PUT /api/exams/{examId}/end`

**描述**: 講師結束測驗，生成排行榜

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Response** (200 OK):
```json
{
  "id": 1,
  "status": "ENDED",
  "endedAt": "2025-09-30T10:30:00",
  "totalStudents": 50,
  "totalQuestions": 10
}
```

**WebSocket Broadcast**:
- Topic: `/topic/exam/{examId}/status`
- Payload:
```json
{
  "type": "EXAM_ENDED",
  "examId": 1,
  "status": "ENDED",
  "timestamp": "2025-09-30T10:30:00"
}
```

---

### 1.7 取得測驗題目列表

**Endpoint**: `GET /api/exams/{examId}/questions`

**描述**: 取得測驗的所有題目（講師用）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Response** (200 OK):
```json
{
  "examId": 1,
  "totalQuestions": 2,
  "questions": [
    {
      "id": 1,
      "questionOrder": 1,
      "questionText": "Java 是哪一年發布的？",
      "singleStatChartType": "BAR",
      "cumulativeChartType": "BAR",
      "options": [
        {
          "id": 1,
          "optionOrder": 1,
          "optionText": "1995"
        },
        {
          "id": 2,
          "optionOrder": 2,
          "optionText": "2000"
        },
        {
          "id": 3,
          "optionOrder": 3,
          "optionText": "2005"
        }
      ],
      "correctOptionId": 1
    },
    {
      "id": 2,
      "questionOrder": 2,
      "questionText": "JVM 代表什麼？",
      "singleStatChartType": "PIE",
      "cumulativeChartType": "BAR",
      "options": [
        {
          "id": 4,
          "optionOrder": 1,
          "optionText": "Java Virtual Machine"
        },
        {
          "id": 5,
          "optionOrder": 2,
          "optionText": "Java Variable Method"
        }
      ],
      "correctOptionId": 4
    }
  ]
}
```

---

## 2. 學員管理 API (Student Management)

### 2.1 學員加入測驗

**Endpoint**: `POST /api/students/join`

**描述**: 學員透過 accessCode 加入測驗

**Request Body**:
```json
{
  "accessCode": "ABC123",
  "name": "王小明",
  "email": "wang@example.com",
  "avatarIcon": "cat"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "examId": 1,
  "name": "王小明",
  "email": "wang@example.com",
  "avatarIcon": "cat",
  "totalScore": 0,
  "joinedAt": "2025-09-30T10:06:00",
  "examStatus": "STARTED"
}
```

**Error Response** (400 Bad Request):
```json
{
  "timestamp": "2025-09-30T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "測驗已開始，無法加入",
  "path": "/api/students/join"
}
```

**WebSocket Broadcast**:
- Topic: `/topic/exam/{examId}/students`
- Payload:
```json
{
  "type": "STUDENT_JOINED",
  "student": {
    "id": 1,
    "name": "王小明",
    "avatarIcon": "cat",
    "totalScore": 0
  },
  "totalStudents": 1,
  "timestamp": "2025-09-30T10:06:00"
}
```

---

### 2.2 取得學員資訊

**Endpoint**: `GET /api/students/{sessionId}`

**描述**: 透過 sessionId 取得學員資訊

**Path Parameters**:
- `sessionId` (String): 學員 Session ID

**Response** (200 OK):
```json
{
  "id": 1,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "examId": 1,
  "name": "王小明",
  "email": "wang@example.com",
  "avatarIcon": "cat",
  "totalScore": 5,
  "joinedAt": "2025-09-30T10:06:00"
}
```

---

### 2.3 取得測驗的所有學員

**Endpoint**: `GET /api/exams/{examId}/students`

**描述**: 取得測驗的所有學員列表（講師用）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Query Parameters**:
- `page` (Integer, optional): 頁碼，預設 0
- `size` (Integer, optional): 每頁數量，預設 50

**Response** (200 OK):
```json
{
  "examId": 1,
  "totalStudents": 50,
  "students": [
    {
      "id": 1,
      "name": "王小明",
      "email": "wang@example.com",
      "avatarIcon": "cat",
      "totalScore": 8,
      "joinedAt": "2025-09-30T10:06:00"
    },
    {
      "id": 2,
      "name": "李小華",
      "email": "lee@example.com",
      "avatarIcon": "dog",
      "totalScore": 7,
      "joinedAt": "2025-09-30T10:06:05"
    }
  ]
}
```

---

## 3. 答案管理 API (Answer Management)

### 3.1 提交答案

**Endpoint**: `POST /api/answers`

**描述**: 學員提交題目答案

**Request Body**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "questionId": 1,
  "selectedOptionId": 1
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "studentId": 1,
  "questionId": 1,
  "selectedOptionId": 1,
  "isCorrect": true,
  "answeredAt": "2025-09-30T10:10:15",
  "currentTotalScore": 1
}
```

**Error Response** (409 Conflict):
```json
{
  "timestamp": "2025-09-30T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "已經作答過此題",
  "path": "/api/answers"
}
```

**Error Response** (400 Bad Request):
```json
{
  "timestamp": "2025-09-30T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "答題時間已結束",
  "path": "/api/answers"
}
```

**WebSocket Broadcast** (即時更新統計):
- Topic: `/topic/exam/{examId}/statistics/question/{questionId}`
- Payload: 參見 4.1 即時統計更新

---

### 3.2 取得學員答案記錄

**Endpoint**: `GET /api/students/{sessionId}/answers`

**描述**: 取得學員的所有答案記錄

**Path Parameters**:
- `sessionId` (String): 學員 Session ID

**Response** (200 OK):
```json
{
  "studentId": 1,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalScore": 8,
  "answers": [
    {
      "id": 1,
      "questionId": 1,
      "questionText": "Java 是哪一年發布的？",
      "selectedOptionId": 1,
      "selectedOptionText": "1995",
      "correctOptionId": 1,
      "isCorrect": true,
      "answeredAt": "2025-09-30T10:10:15"
    },
    {
      "id": 2,
      "questionId": 2,
      "questionText": "JVM 代表什麼？",
      "selectedOptionId": 5,
      "selectedOptionText": "Java Variable Method",
      "correctOptionId": 4,
      "isCorrect": false,
      "answeredAt": "2025-09-30T10:11:20"
    }
  ]
}
```

---

## 4. 統計分析 API (Statistics)

### 4.1 取得題目統計

**Endpoint**: `GET /api/exams/{examId}/questions/{questionId}/statistics`

**描述**: 取得特定題目的答題統計

**Path Parameters**:
- `examId` (Long): 測驗 ID
- `questionId` (Long): 題目 ID

**Response** (200 OK):
```json
{
  "questionId": 1,
  "questionText": "Java 是哪一年發布的？",
  "totalAnswers": 50,
  "chartType": "BAR",
  "optionStatistics": [
    {
      "optionId": 1,
      "optionText": "1995",
      "count": 35,
      "percentage": 70.0,
      "isCorrect": true
    },
    {
      "optionId": 2,
      "optionText": "2000",
      "count": 10,
      "percentage": 20.0,
      "isCorrect": false
    },
    {
      "optionId": 3,
      "optionText": "2005",
      "count": 5,
      "percentage": 10.0,
      "isCorrect": false
    }
  ],
  "correctRate": 70.0,
  "timestamp": "2025-09-30T10:10:30"
}
```

**WebSocket Broadcast** (自動推送):
- Topic: `/topic/exam/{examId}/statistics/question/{questionId}`
- Payload: 同上

---

### 4.2 取得累積分數統計

**Endpoint**: `GET /api/exams/{examId}/statistics/cumulative`

**描述**: 取得測驗的累積分數分布統計

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Response** (200 OK):
```json
{
  "examId": 1,
  "totalStudents": 50,
  "totalQuestions": 10,
  "chartType": "BAR",
  "scoreDistribution": [
    {
      "score": 0,
      "count": 2,
      "percentage": 4.0
    },
    {
      "score": 1,
      "count": 3,
      "percentage": 6.0
    },
    {
      "score": 2,
      "count": 5,
      "percentage": 10.0
    },
    {
      "score": 3,
      "count": 8,
      "percentage": 16.0
    },
    {
      "score": 4,
      "count": 10,
      "percentage": 20.0
    },
    {
      "score": 5,
      "count": 12,
      "percentage": 24.0
    },
    {
      "score": 6,
      "count": 7,
      "percentage": 14.0
    },
    {
      "score": 7,
      "count": 2,
      "percentage": 4.0
    },
    {
      "score": 8,
      "count": 1,
      "percentage": 2.0
    }
  ],
  "averageScore": 4.2,
  "timestamp": "2025-09-30T10:15:00"
}
```

**WebSocket Broadcast**:
- Topic: `/topic/exam/{examId}/statistics/cumulative`
- Payload: 同上

---

### 4.3 取得排行榜

**Endpoint**: `GET /api/exams/{examId}/leaderboard`

**描述**: 取得測驗排行榜（前 20 名）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Query Parameters**:
- `limit` (Integer, optional): 返回名次數量，預設 20

**Response** (200 OK):
```json
{
  "examId": 1,
  "totalStudents": 50,
  "totalQuestions": 10,
  "leaderboard": [
    {
      "rank": 1,
      "studentId": 15,
      "name": "張三",
      "avatarIcon": "lion",
      "totalScore": 10,
      "correctRate": 100.0
    },
    {
      "rank": 2,
      "studentId": 23,
      "name": "李四",
      "avatarIcon": "tiger",
      "totalScore": 9,
      "correctRate": 90.0
    },
    {
      "rank": 3,
      "studentId": 8,
      "name": "王五",
      "avatarIcon": "cat",
      "totalScore": 9,
      "correctRate": 90.0
    }
  ],
  "timestamp": "2025-09-30T10:30:00"
}
```

**WebSocket Broadcast** (測驗結束時):
- Topic: `/topic/exam/{examId}/leaderboard`
- Payload: 同上

---

## 5. WebSocket 通訊協定

### 5.1 連線設定

**WebSocket Endpoint**: `ws://localhost:8080/ws`

**Protocol**: STOMP (Simple Text Oriented Messaging Protocol)

**連線範例** (JavaScript):
```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
  console.log('Connected: ' + frame);

  // 訂閱測驗狀態
  stompClient.subscribe('/topic/exam/1/status', function(message) {
    const data = JSON.parse(message.body);
    console.log('Exam status:', data);
  });
});
```

---

### 5.2 訂閱主題 (Topics)

#### 5.2.1 測驗狀態更新
**Topic**: `/topic/exam/{examId}/status`

**事件類型**:
- `EXAM_STARTED`: 測驗啟動
- `EXAM_ENDED`: 測驗結束

**訊息格式**:
```json
{
  "type": "EXAM_STARTED",
  "examId": 1,
  "status": "STARTED",
  "timestamp": "2025-09-30T10:05:00"
}
```

---

#### 5.2.2 學員加入通知
**Topic**: `/topic/exam/{examId}/students`

**事件類型**:
- `STUDENT_JOINED`: 新學員加入

**訊息格式**:
```json
{
  "type": "STUDENT_JOINED",
  "student": {
    "id": 1,
    "name": "王小明",
    "avatarIcon": "cat",
    "totalScore": 0
  },
  "totalStudents": 1,
  "timestamp": "2025-09-30T10:06:00"
}
```

---

#### 5.2.3 題目推送
**Topic**: `/topic/exam/{examId}/question`

**事件類型**:
- `QUESTION_STARTED`: 新題目開始

**訊息格式**:
```json
{
  "type": "QUESTION_STARTED",
  "questionId": 1,
  "questionIndex": 0,
  "questionText": "Java 是哪一年發布的？",
  "options": [
    {
      "id": 1,
      "optionOrder": 1,
      "optionText": "1995"
    },
    {
      "id": 2,
      "optionOrder": 2,
      "optionText": "2000"
    },
    {
      "id": 3,
      "optionOrder": 3,
      "optionText": "2005"
    }
  ],
  "timeLimit": 30,
  "startedAt": "2025-09-30T10:10:00",
  "expiresAt": "2025-09-30T10:10:30"
}
```

---

#### 5.2.4 題目統計推送
**Topic**: `/topic/exam/{examId}/statistics/question/{questionId}`

**事件類型**:
- `STATISTICS_UPDATED`: 統計更新（即時）
- `QUESTION_CLOSED`: 題目結束（最終統計）

**訊息格式**:
```json
{
  "type": "QUESTION_CLOSED",
  "questionId": 1,
  "questionText": "Java 是哪一年發布的？",
  "totalAnswers": 50,
  "chartType": "BAR",
  "optionStatistics": [
    {
      "optionId": 1,
      "optionText": "1995",
      "count": 35,
      "percentage": 70.0,
      "isCorrect": true
    },
    {
      "optionId": 2,
      "optionText": "2000",
      "count": 10,
      "percentage": 20.0,
      "isCorrect": false
    },
    {
      "optionId": 3,
      "optionText": "2005",
      "count": 5,
      "percentage": 10.0,
      "isCorrect": false
    }
  ],
  "correctRate": 70.0,
  "timestamp": "2025-09-30T10:10:30"
}
```

---

#### 5.2.5 累積統計推送
**Topic**: `/topic/exam/{examId}/statistics/cumulative`

**事件類型**:
- `CUMULATIVE_UPDATED`: 累積統計更新

**訊息格式**:
```json
{
  "type": "CUMULATIVE_UPDATED",
  "examId": 1,
  "totalStudents": 50,
  "totalQuestions": 10,
  "chartType": "BAR",
  "scoreDistribution": [
    {
      "score": 0,
      "count": 2,
      "percentage": 4.0
    },
    {
      "score": 1,
      "count": 3,
      "percentage": 6.0
    }
  ],
  "averageScore": 4.2,
  "timestamp": "2025-09-30T10:15:00"
}
```

---

#### 5.2.6 排行榜推送
**Topic**: `/topic/exam/{examId}/leaderboard`

**事件類型**:
- `LEADERBOARD_UPDATED`: 排行榜更新（測驗結束時）

**訊息格式**:
```json
{
  "type": "LEADERBOARD_UPDATED",
  "examId": 1,
  "totalStudents": 50,
  "totalQuestions": 10,
  "leaderboard": [
    {
      "rank": 1,
      "studentId": 15,
      "name": "張三",
      "avatarIcon": "lion",
      "totalScore": 10,
      "correctRate": 100.0
    },
    {
      "rank": 2,
      "studentId": 23,
      "name": "李四",
      "avatarIcon": "tiger",
      "totalScore": 9,
      "correctRate": 90.0
    }
  ],
  "timestamp": "2025-09-30T10:30:00"
}
```

---

#### 5.2.7 倒數計時同步
**Topic**: `/topic/exam/{examId}/timer`

**事件類型**:
- `TIMER_UPDATE`: 倒數計時更新（每秒推送）
- `TIMER_EXPIRED`: 時間到

**訊息格式**:
```json
{
  "type": "TIMER_UPDATE",
  "questionId": 1,
  "remainingSeconds": 25,
  "timestamp": "2025-09-30T10:10:05"
}
```

```json
{
  "type": "TIMER_EXPIRED",
  "questionId": 1,
  "timestamp": "2025-09-30T10:10:30"
}
```

---

### 5.3 客戶端發送訊息 (Client -> Server)

#### 5.3.1 學員心跳檢測
**Destination**: `/app/exam/{examId}/heartbeat`

**訊息格式**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-09-30T10:10:00"
}
```

**用途**: 維持連線狀態，偵測學員斷線

---

## 6. 錯誤處理與驗證

### 6.1 常見錯誤情境

#### 6.1.1 測驗未啟動
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "測驗尚未啟動",
  "code": "EXAM_NOT_STARTED"
}
```

#### 6.1.2 測驗已開始無法加入
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "測驗已開始答題，無法加入",
  "code": "EXAM_ALREADY_STARTED"
}
```

#### 6.1.3 答題時間已結束
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "答題時間已結束",
  "code": "ANSWER_TIME_EXPIRED"
}
```

#### 6.1.4 重複作答
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "已經作答過此題",
  "code": "ANSWER_ALREADY_EXISTS"
}
```

#### 6.1.5 無效的 accessCode
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "無效的測驗代碼",
  "code": "INVALID_ACCESS_CODE"
}
```

#### 6.1.6 無效的 sessionId
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "找不到學員資訊",
  "code": "STUDENT_NOT_FOUND"
}
```

---

## 7. 資料驗證規則

### 7.1 測驗建立驗證
- `title`: 必填，1-100 字元
- `description`: 選填，最多 500 字元
- `questionTimeLimit`: 必填，10-300 秒
- `questions`: 必填，至少 1 題，最多 50 題

### 7.2 題目驗證
- `questionText`: 必填，1-500 字元
- `options`: 必填，2-6 個選項
- `correctOptionOrder`: 必填，必須對應有效的選項順序

### 7.3 學員加入驗證
- `accessCode`: 必填，6 位英數字
- `name`: 必填，1-50 字元
- `email`: 必填，有效的 Email 格式
- `avatarIcon`: 必填，必須為預定義的頭像名稱

### 7.4 答案提交驗證
- `sessionId`: 必填，有效的 UUID 格式
- `questionId`: 必填，必須為有效的題目 ID
- `selectedOptionId`: 必填，必須為有效的選項 ID

---

## 8. 效能考量

### 8.1 快取策略
- 測驗資訊：快取 5 分鐘
- 題目列表：快取直到測驗結束
- 統計資料：即時計算，不快取

### 8.2 資料庫索引
- `Exam.accessCode`: 唯一索引
- `Student.sessionId`: 唯一索引
- `Answer.studentId + questionId`: 複合唯一索引

### 8.3 WebSocket 優化
- 統計更新頻率限制：最多每秒 1 次
- 心跳檢測間隔：30 秒
- 自動斷線重連機制

---

## 9. 安全性考量

### 9.1 CORS 設定
```java
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
```

### 9.2 輸入驗證
- 所有輸入參數進行 Bean Validation 驗證
- SQL Injection 防護（使用 JPA）
- XSS 防護（HTML 編碼）

### 9.3 訪問控制
- accessCode 驗證：防止未授權訪問
- sessionId 驗證：確保學員身份
- 講師操作驗證：限制敏感操作

---

## 10. API 測試範例

### 10.1 建立測驗並啟動（cURL）
```bash
# 1. 建立測驗
curl -X POST http://localhost:8080/api/exams \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Java 基礎測驗",
    "description": "測試 Java 基礎知識",
    "questionTimeLimit": 30,
    "questions": [
      {
        "questionOrder": 1,
        "questionText": "Java 是哪一年發布的？",
        "singleStatChartType": "BAR",
        "cumulativeChartType": "BAR",
        "options": [
          {"optionOrder": 1, "optionText": "1995"},
          {"optionOrder": 2, "optionText": "2000"},
          {"optionOrder": 3, "optionText": "2005"}
        ],
        "correctOptionOrder": 1
      }
    ]
  }'

# 2. 啟動測驗
curl -X POST http://localhost:8080/api/exams/1/start

# 3. 開始第一題
curl -X POST http://localhost:8080/api/exams/1/questions/0/start
```

### 10.2 學員加入並作答（cURL）
```bash
# 1. 加入測驗
curl -X POST http://localhost:8080/api/students/join \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "ABC123",
    "name": "王小明",
    "email": "wang@example.com",
    "avatarIcon": "cat"
  }'

# 回傳 sessionId: 550e8400-e29b-41d4-a716-446655440000

# 2. 提交答案
curl -X POST http://localhost:8080/api/answers \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "questionId": 1,
    "selectedOptionId": 1
  }'
```

---

**文件版本**：v1.0
**最後更新**：2025-09-30