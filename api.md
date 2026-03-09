# 即時互動測驗統計系統 - API 規格文件

> 文件定位：本文件已升級為 `v2.0-draft` 規劃版。既有 v1 即時測驗 API 仍保留；以下新增 V2 資源管理與授權規劃。

## API 基本資訊

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`
- **字元編碼**: `UTF-8`
- **WebSocket Endpoint**: `ws://localhost:8080/ws`
- **Docker/Compose**: 建議使用 `8080:8080` 對外映射，因此對外 Base URL 與 WebSocket 端點維持 `8080`。

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
  "surveyFieldConfigs": [
    {
      "fieldKey": "occupation",
      "isRequired": true,
      "displayOrder": 1
    },
    {
      "fieldKey": "age_range",
      "isRequired": false,
      "displayOrder": 2
    }
  ],
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
  "surveyFieldConfigs": [
    {
      "id": 1,
      "fieldKey": "occupation",
      "fieldName": "職業",
      "fieldType": "SELECT",
      "options": ["學生", "工程師", "其他"],
      "isRequired": true,
      "displayOrder": 1
    },
    {
      "id": 2,
      "fieldKey": "age_range",
      "fieldName": "年齡層",
      "fieldType": "SELECT",
      "options": ["18-25", "26-35", "36-45", "46+"],
      "isRequired": false,
      "displayOrder": 2
    }
  ],
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

### 1.8 調整題目順序

**Endpoint**: `PUT /api/exams/{examId}/questions/reorder`

**描述**: 調整測驗中的題目順序（僅限 CREATED 狀態）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Request Body**:
```json
{
  "questionIds": [3, 1, 2]
}
```

**說明**:
- `questionIds`: 題目 ID 的新順序陣列
- 陣列中的 ID 順序即為新的題目順序
- 必須包含該測驗的所有題目 ID
- 僅在測驗狀態為 CREATED 時可調整

**Response** (200 OK):
```json
{
  "message": "題目順序更新成功",
  "examId": 1,
  "newOrder": [3, 1, 2]
}
```

**錯誤回應**:
- `400 Bad Request`: 題目數量不符或題目不屬於此測驗
- `403 Forbidden`: 測驗已啟動，無法調整順序
- `404 Not Found`: 測驗或題目不存在

---

### 1.9 調整選項順序

**Endpoint**: `PUT /api/exams/{examId}/questions/{questionId}/options/reorder`

**描述**: 調整題目中的選項順序（僅限 CREATED 狀態）

**Path Parameters**:
- `examId` (Long): 測驗 ID
- `questionId` (Long): 題目 ID

**Request Body**:
```json
{
  "optionIds": [2, 3, 1]
}
```

**說明**:
- `optionIds`: 選項 ID 的新順序陣列
- 陣列中的 ID 順序即為新的選項順序
- 必須包含該題目的所有選項 ID
- 僅在測驗狀態為 CREATED 時可調整

**Response** (200 OK):
```json
{
  "message": "選項順序更新成功",
  "questionId": 1,
  "newOrder": [2, 3, 1]
}
```

**錯誤回應**:
- `400 Bad Request`: 選項數量不符或選項不屬於此題目
- `403 Forbidden`: 測驗已啟動，無法調整順序
- `404 Not Found`: 測驗、題目或選項不存在

---

### 1.10 匯出測驗為 Markdown 檔案

**Endpoint**: `POST /api/exams/{examId}/export/markdown`

**描述**: 將測驗題目匯出為 Markdown 格式檔案，支援講師版（含答案）和學員版（無答案）兩種格式

**認證需求**: 需要 Bearer Token（講師或管理員）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Request Body** (可選):
```json
{
  "includeAnswers": true,
  "showQuestionNumbers": true,
  "showOptionLabels": true,
  "showExamInfo": true
}
```

**參數說明**:
- `includeAnswers` (Boolean, 預設: true): 是否包含答案
  - `true`: 匯出講師版（含正確答案標註）
  - `false`: 匯出學員版（無答案）
- `showQuestionNumbers` (Boolean, 預設: true): 是否顯示題號（第 1 題、第 2 題...）
- `showOptionLabels` (Boolean, 預設: true): 是否顯示選項編號（A、B、C、D...）
- `showExamInfo` (Boolean, 預設: true): 是否顯示測驗資訊（標題、描述、題數等）

**Response** (200 OK):
- **Content-Type**: `text/markdown; charset=UTF-8`
- **Content-Disposition**: `attachment; filename="[測驗標題]_[版本].md"`
- **Body**: Markdown 格式的文字內容

**Markdown 格式範例**（講師版）:
```markdown
# Java 基礎測驗

**描述**: 測試 Java 基本知識
**題數**: 2 題
**每題時間**: 30 秒
**測驗代碼**: ABC123
**版本**: 講師版（含答案）

---

## 第 1 題

Java 是什麼類型的程式語言？

- [ ] A. 編譯型語言 **✓**
- [ ] B. 直譯型語言
- [ ] C. 混合型語言
- [ ] D. 腳本語言

**正確答案**: A

---

## 第 2 題

JVM 的全名是什麼？

- [ ] A. Java Virtual Machine **✓**
- [ ] B. Java Variable Manager
- [ ] C. Java Version Manager

**正確答案**: A
```

**使用場景**:
1. **講師版**（`includeAnswers: true`）: 用於製作標準答案卷、教學參考
2. **學員版**（`includeAnswers: false`）: 用於列印紙本考卷供學員作答

**錯誤回應**:
- `404 Not Found`: 測驗不存在
- `401 Unauthorized`: 未登入、Token 無效或過期

**前端調用範例**:
```javascript
// 匯出講師版（含答案）
const response = await apiClient.post(`/exams/${examId}/export/markdown`, {
  includeAnswers: true
}, {
  responseType: 'blob'
});

// apiClient 會自動帶入 Authorization: Bearer <token>
const blob = response.data;

// 匯出學員版（無答案）
const response = await apiClient.post(`/exams/${examId}/export/markdown`, {
  includeAnswers: false
}, {
  responseType: 'blob'
});
```

---

### 1.11 匯出測驗為 JSON 檔案

**Endpoint**: `GET /api/exams/{examId}/export/json`

**描述**: 匯出指定測驗為 JSON 檔案，供備份或後續匯入使用

**認證需求**: 需要 Bearer Token（講師或管理員）

**Path Parameters**:
- `examId` (Long): 測驗 ID

**Response** (200 OK):
- **Content-Type**: `application/json`
- **Content-Disposition**: `attachment; filename="[測驗標題].json"`
- **Body**: `ExamExportDTO`

**錯誤回應**:
- `401 Unauthorized`: 未登入、Token 無效或過期
- `404 Not Found`: 測驗不存在

**前端調用範例**:
```javascript
const response = await apiClient.get(`/exams/${examId}/export/json`, {
  responseType: 'json'
});

// apiClient 會自動帶入 Authorization: Bearer <token>
const jsonData = response.data;
```

---

### 1.12 從 JSON 匯入測驗

**Endpoint**: `POST /api/exams/import?importSurveyFields=true|false`

**描述**: 從 JSON 檔案匯入測驗，可選擇是否一併匯入問卷調查欄位配置

**認證需求**: 需要 Bearer Token（講師或管理員）

**Query Parameters**:
- `importSurveyFields` (Boolean, 預設: `false`): 是否匯入問卷欄位配置

**Request Body**:
```json
{
  "title": "Java 基礎測驗",
  "description": "測試 Java 基本知識",
  "questionTimeLimit": 30,
  "surveyFieldConfigs": [
    {
      "fieldKey": "occupation",
      "isRequired": true,
      "displayOrder": 1
    }
  ],
  "questions": [
    {
      "questionOrder": 1,
      "questionText": "Java 是哪一年發布的？",
      "correctOptionOrder": 1,
      "singleStatChartType": "BAR",
      "cumulativeChartType": "BAR",
      "exportable": true,
      "options": [
        {
          "optionOrder": 1,
          "optionText": "1995"
        }
      ]
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "title": "Java 基礎測驗",
  "description": "測試 Java 基本知識"
}
```

**錯誤回應**:
- `400 Bad Request`: JSON 結構或欄位驗證失敗
- `401 Unauthorized`: 未登入、Token 無效或過期

**前端調用範例**:
```javascript
const response = await apiClient.post(
  `/exams/import?importSurveyFields=${importSurveyFields}`,
  jsonData
);

// apiClient 會自動帶入 Authorization: Bearer <token>
const createdExam = response.data;
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

**補充說明**:
- 前端會把 `sessionId` 與 `currentStudent` 一併持久化在 localStorage，重新整理可先還原畫面，再視需要呼叫此 API 驗證最新狀態。
- StudentJoin 轉導至 StudentExam 時會透過 querystring 附帶 sessionId，即使瀏覽器無法使用 localStorage 也能恢復連線。
- 若 sessionId 已失效，前端會使用持久化的 Join Context（accessCode、姓名、Email 等）重新呼叫 `POST /api/students/join` 以恢復連線，成功後再呼叫本 API 取得最新資料。
- StudentExam 若偵測到 sessionId（URL 或 localStorage），會在 hydration 完成後自動呼叫 `GET /api/students/{sessionId}` 取回資料。


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

## 11. 認證 API (Authentication)

### 11.1 Email 註冊

**Endpoint**: `POST /api/auth/register`  
**描述**: 以 Email 建立帳號並直接取得 JWT。

**Request Body**:
```json
{
  "name": "王小明",
  "email": "ming@example.com",
  "password": "Passw0rd123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "authenticated": true,
  "user": {
    "id": 12,
    "email": "ming@example.com",
    "name": "王小明",
    "avatarUrl": null,
    "role": "STUDENT",
    "googleLinked": false,
    "passwordSet": true
  }
}
```

**Error**:
- `409 Conflict`: Email 已存在  
- `400 Bad Request`: 欄位驗證失敗

### 11.2 Email 登入

**Endpoint**: `POST /api/auth/login`  
**描述**: 以 Email + Password 登入並取得 JWT。

**Request Body**:
```json
{
  "email": "ming@example.com",
  "password": "Passw0rd123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "authenticated": true,
  "user": {
    "id": 12,
    "email": "ming@example.com",
    "name": "王小明",
    "avatarUrl": null,
    "role": "STUDENT",
    "googleLinked": true,
    "passwordSet": true
  }
}
```

**Error**:
- `401 Unauthorized`: 帳號或密碼錯誤  
- `400 Bad Request`: 帳號未設定密碼（Google-only 帳號）

### 11.3 Google OAuth2 登入與綁定

**Endpoint**: `GET /oauth2/authorization/google`  
**描述**: 導向 Google OAuth2，回呼後由後端發 JWT 並轉導前端 `/auth/callback`。

**綁定規則**:
1. 若 `googleId` 已存在，直接登入對應帳號。  
2. 若 `googleId` 不存在但 `email` 已存在，將 Google 帳號綁定至該 Email 帳號。  
3. 若兩者皆不存在，建立 Google-only 帳號。

### 11.4 取得目前登入使用者

**Endpoint**: `GET /api/auth/user`  
**描述**: 依 Bearer Token 取得當前使用者資訊。

**Response** (200 OK):
```json
{
  "authenticated": true,
  "user": {
    "id": 12,
    "email": "ming@example.com",
    "name": "王小明",
    "avatarUrl": "https://lh3.googleusercontent.com/...",
    "role": "STUDENT",
    "googleLinked": true,
    "passwordSet": true
  }
}
```

### 11.5 驗證規則（認證）
- `name`: 必填，1-100 字元
- `email`: 必填，合法 Email 格式
- `password`: 必填，8-72 字元

### 11.6 401 行為規範
- 當受保護 API 因 token 無效或過期回傳 `401 Unauthorized` 時，前端應：
  1. 清除本地 `auth-storage` 與 Authorization 狀態。
  2. 保留當前路徑於 `sessionStorage.returnTo`。
  3. 導向 `/login`，完成登入後再返回原頁。

### 11.7 Google Callback 前端處理規範
- `GET /oauth2/authorization/google` 成功回呼後，前端 `/auth/callback` 對同一個 `token` 僅可處理一次。
- 若前端框架於開發模式啟用 `StrictMode`，callback 頁面需自行防重，避免：
  - 重複呼叫登入流程
  - 提前清除 `sessionStorage.returnTo`
  - 第二次導頁 fallback 到 `/`
- 此規範不新增後端 endpoint，屬前端消費既有 OAuth2 callback 的行為約束。

### 11.8 Google OAuth 首次建帳直接登入規範（2026-03-09）
- 本次不新增 endpoint，沿用：
  - `GET /oauth2/authorization/google`
  - 前端 `/auth/callback`
- 成功回呼要求：
  - 前端 callback 在收到 `token` 後，必須立即建立前端登入態，不可要求使用者再次點擊登入。
- 前端 callback redirect URL 格式：
```text
/auth/callback?token={jwt}
```
- 前端導頁優先序：
  1. `sessionStorage.oauthReturnTo`
  2. `sessionStorage.returnTo`
  3. `/`
- 適用情境：
  - 從登入頁發起 Google OAuth：登入後返回原始受保護頁或首頁
  - 從學員加入頁發起 Google OAuth：首次建帳後直接返回加入頁，延續加入測驗流程
- 實作約束：
  - 前端發起 OAuth 前，需先將原始返回頁保存至 `sessionStorage.oauthReturnTo`
  - 不可自行覆寫 OAuth `state` 參數，以免與 Spring Security 內建 state 機制衝突

## 11.9 學員答題頁導向路由一致性（2026-03-09）
- 本次不新增 endpoint，但補充前端路由約束：
  - `StudentJoin` 成功加入後，必須導向 `/student/exam/{examId}?sessionId={UUID}`
  - Gmail / Google 斷線重連成功後，也必須導向同一格式
- 目的：
  - 保持與 React Router 路由 `/student/exam/:examId` 一致
  - 避免正式環境以 `/student/exam?examId=...` 導頁時命中不到前端路由而顯示 404

## 11.10 學員地區選擇擴充規範（2026-03-07）
- 本次不新增 endpoint，沿用既有：
  - `POST /api/students/join`
  - `GET /api/locations/statistics/{examId}`
- `POST /api/students/join` 的 `location` 驗證規則擴充如下：
  - 台灣地區：沿用既有地區代碼。
  - 海外固定選項：允許 `HKG`、`MAC`、`CHN`、`SGP`、`USA`。
  - 自訂其他地區：允許 `OTHER:{自訂文字}` 格式，且 `{自訂文字}` 不可為空。
- 前端互動規則：
  - 台灣地圖需限制拖曳邊界與縮放範圍，降低手機誤操作。
  - 若選擇 `OTHER`，前端必須顯示自訂輸入框並要求必填。
- 統計規則：
  - `GET /api/locations/statistics/{examId}` 回傳的 `locationNames` 需能正確顯示海外固定選項與 `OTHER:{文字}` 的自訂名稱。

## 12. 主環境資料庫設定（2026-03-05）
- 本次僅調整後端主環境資料庫連線設定，API Endpoint 與 Request/Response 格式無變更。
- `application.yml` 主環境改為 PostgreSQL，連線資訊由環境變數提供：
  - `DB_HOST`（預設 `postgresql`）
  - `DB_PORT`（預設 `5432`）
  - `DB_NAME`（預設 `exam_system`）
  - `DB_USERNAME`（預設 `exam_user`）
  - `DB_PASSWORD`（預設 `exam_password`）

## 13. Gateway WebSocket 路由要求（2026-03-05）
- `/ws` 為 SockJS/STOMP 端點，部署於 gateway 時必須與 `/api` 同樣轉發到 backend。
- 若 `/ws` 被前端靜態服務攔截，瀏覽器會收到 `text/html`，並在 console 出現 `eventsource/websocket` 連線錯誤。
- 此調整僅影響反向代理路由，不改動任何 API endpoint 規格。

## 14. Frontend WebSocket Endpoint 解析規則（2026-03-05）
- 前端 WebSocket 連線端點採以下優先序：
  1. `VITE_WS_ENDPOINT`
  2. `VITE_API_BASE_URL + /ws`
  3. `window.location.host + /ws`（最終 fallback）
- 此規則僅影響前端連線策略，不影響既有 REST/WebSocket API 路徑。

## 15. Frontend WS 部署診斷（2026-03-05）
- 前端在初始化 WebSocket 服務時會輸出 endpoint 解析資訊（來源 + 最終 URL）。
- 此輸出僅為部署診斷用途，不影響 API 合約與後端行為。

## 16. 題目時間到後顯示正確答案（2026-03-06）
- 本次不新增 REST endpoint，延續既有 `PUT /api/exams/{examId}/questions/{questionId}/complete`。
- 關鍵行為為 WebSocket payload 變化：
  - Topic：`/topic/exam/{examId}/statistics/question/{questionId}`
  - Message Type：`STATISTICS_UPDATED`
  - 內容位於 `data` 欄位（外層仍為 `{ type, data, timestamp }`）
- `data.optionStatistics[].isCorrect` 與 `data.correctRate` 規則：
  1. 題目作答期間（一般統計更新）為 `null`
  2. 題目時間到後（completeQuestion）帶入實際值

**WebSocket 範例（時間到後）**:
```json
{
  "type": "STATISTICS_UPDATED",
  "data": {
    "questionId": 12,
    "questionText": "Java 是哪一年發布的？",
    "totalAnswers": 18,
    "chartType": "BAR",
    "optionStatistics": [
      { "optionId": 101, "optionText": "1995", "count": 15, "percentage": 83.33, "isCorrect": true },
      { "optionId": 102, "optionText": "2000", "count": 2, "percentage": 11.11, "isCorrect": false },
      { "optionId": 103, "optionText": "2005", "count": 1, "percentage": 5.56, "isCorrect": false }
    ],
    "correctRate": 0.8333,
    "timestamp": "2026-03-06T11:20:00"
  },
  "timestamp": "2026-03-06T11:20:00"
}
```

## 17. 講師端開測前地點統計（2026-03-06）
- 講師端「學員資訊」頁籤會呼叫地點統計 API，即使尚未推送題目也可先查看目前報名分布。
- Endpoint：`GET /api/locations/statistics/{examId}`
- 用途：顯示縣市人數與比例（搭配既有學員/調查欄位統計）

**Response** (200 OK):
```json
{
  "totalCount": 12,
  "locationCounts": {
    "TPE": 5,
    "NTP": 4,
    "KHH": 3
  },
  "locationNames": {
    "TPE": "台北市",
    "NTP": "新北市",
    "KHH": "高雄市"
  }
}
```

### 17.1 開測前統計展示規則（前端流程）
- 講師端在推送第一題前，需顯示以下圖表：
  1. 地區統計圖表（資料來源：`GET /api/locations/statistics/{examId}`）
  2. 每個問券欄位統計圖表（資料來源：`GET /api/statistics/exams/{examId}/survey-fields`）
- 在講師完成「已展示統計」確認前，前端不得呼叫第一題推送 API：
  - `PUT /api/exams/{examId}/questions/0/start`
- 此規則不影響既有 REST API 合約，屬前端操作流程約束。

## 18. 測驗頁日夜模式（2026-03-06）
- 本次不新增/調整後端 API。
- 講師測驗頁（`/instructor/exam/{examId}/monitor`）與學員答題頁（`/student/exam/{examId}`）改為使用前端主題狀態：
  - 來源：`themeStore.mode`
  - 持久化：`theme-storage`
- 頁面上提供 `ThemeToggle` 讓使用者即時切換日夜模式，並套用於主要容器樣式。

## 19. 移除訪客模式（2026-03-06）
- 本次不新增/調整後端 API。
- 前端登入頁 `LoginPage` 移除訪客模式入口，不再提供直接以訪客身分導向首頁的操作。
- 登入行為維持：
  - `POST /api/auth/login`（Email 登入）
  - `POST /api/auth/register`（Email 註冊）
  - `GET /oauth2/authorization/google`（Google OAuth2）

## 20. 前端建置依賴修正：prop-types（2026-03-06）
- 本次不新增/調整後端 API。
- 前端補上 `prop-types` 套件依賴，解決 `react-simple-maps` 在 production build 時的依賴解析錯誤。
- 對外 API endpoint 與 request/response 合約皆無變更。

## 21. 學員地點必填與講師入口等待（2026-03-06）
- 本次不新增 API endpoint，但調整既有 `POST /api/students/join` 驗證規則：
  - `location` 改為必填。
  - 僅接受有效地區代碼（例如 `TPE`、`KHH`）。
- `GET /api/locations/statistics/{examId}` 仍使用既有合約，資料來源改為嚴格依賴已儲存的 `Student.location`。
- 講師 `ExamMonitor` 預設頁籤行為屬前端流程調整，不影響 API 合約。

## 22. V2 API 規劃（2026-03-07）

### 22.1 版本策略
- V2 新增資源採用 `/api/v2/**`。
- 既有即時測驗執行 API（例如 `/api/exams/{examId}/start`、`/api/exams/{examId}/questions/{questionIndex}/start`）在 V2 第一階段仍保留。
- V2 的核心策略是：
  - 題庫 / 模板 / 結果查詢 改走 `/api/v2`
  - 即時開測與答題流程先沿用既有 `/api/exams`、`/api/students`、`/api/answers`

### 22.2 題庫 API（Question Bank）

#### 22.2.1 取得我的題庫題目
**Endpoint**: `GET /api/v2/question-bank/mine`

**描述**: 取得目前登入講師建立的私有與公開題目

**認證需求**: Bearer Token（`INSTRUCTOR` / `ADMIN`）

#### 22.2.2 取得公開題庫題目
**Endpoint**: `GET /api/v2/question-bank/public`

**描述**: 取得可被所有講師引用的公開題目

**認證需求**: Bearer Token（`INSTRUCTOR` / `ADMIN`）

#### 22.2.3 建立題庫題目
**Endpoint**: `POST /api/v2/question-bank`

**描述**: 建立單一道題，預設為私有

**認證需求**: Bearer Token（`INSTRUCTOR` / `ADMIN`）

**Request Body**:
```json
{
  "questionText": "Java 是哪一年發布的？",
  "singleStatChartType": "BAR",
  "cumulativeChartType": "BAR",
  "correctOptionOrder": 1,
  "visibility": "PRIVATE",
  "options": [
    { "optionOrder": 1, "optionText": "1995" },
    { "optionOrder": 2, "optionText": "2000" }
  ]
}
```

#### 22.2.4 切換題庫可見性
**Endpoint**: `PATCH /api/v2/question-bank/{itemId}/visibility`

**描述**: 將題目切換為 `PRIVATE` 或 `PUBLIC`

**認證需求**: Bearer Token（owner 或 `ADMIN`）

### 22.3 模板 API（Exam Template）

#### 22.3.1 取得我的模板
**Endpoint**: `GET /api/v2/templates/mine`

**描述**: 取得目前登入講師建立的模板

#### 22.3.2 建立模板
**Endpoint**: `POST /api/v2/templates`

**描述**: 以題庫題目建立可重複使用的模板

**Request Body**:
```json
{
  "title": "Java 基礎題組",
  "description": "V2 模板示例",
  "questionTimeLimit": 30,
  "visibility": "PRIVATE",
  "questionItems": [
    {
      "questionBankItemId": 101,
      "questionOrder": 1,
      "exportable": true,
      "singleStatChartType": "BAR",
      "cumulativeChartType": "BAR"
    }
  ]
}
```

#### 22.3.3 從模板建立新場次
**Endpoint**: `POST /api/v2/templates/{templateId}/launch`

**描述**: 由模板建立一筆新的 `Exam` 場次，回傳既有 `ExamDTO`

**認證需求**: Bearer Token（owner、可讀取 public 模板的講師、或 `ADMIN`）

**Response** (201 Created):
```json
{
  "id": 88,
  "title": "Java 基礎題組",
  "description": "V2 模板示例",
  "questionTimeLimit": 30,
  "status": "CREATED",
  "accessCode": "A1B2C3",
  "currentQuestionIndex": 0
}
```

### 22.4 測驗場次與結果 API（Exam Run / Result）

#### 22.4.1 取得我的測驗場次
**Endpoint**: `GET /api/v2/exams/mine`

**描述**: 取得目前講師擁有的測驗場次；`ADMIN` 可另用管理端 API 查全部

#### 22.4.2 取得測驗結果總覽
**Endpoint**: `GET /api/v2/exams/{examId}/results`

**描述**: 取得單次測驗的整體結果摘要（學員數、平均分、排行榜、作答完成率）

**認證需求**: Bearer Token（owner 或 `ADMIN`）

#### 22.4.3 取得學生作答明細
**Endpoint**: `GET /api/v2/exams/{examId}/student-answers`

**描述**: 取得該場次所有學生的逐題作答明細

**認證需求**: Bearer Token（owner 或 `ADMIN`）

**Response** (200 OK):
```json
[
  {
    "studentId": 501,
    "studentName": "王小明",
    "email": "wang@example.com",
    "totalScore": 8,
    "answers": [
      {
        "questionId": 1001,
        "questionOrder": 1,
        "questionText": "Java 是哪一年發布的？",
        "selectedOptionId": 3001,
        "selectedOptionText": "1995",
        "correctOptionId": 3001,
        "isCorrect": true,
        "answeredAt": "2026-03-07T10:05:00"
      }
    ]
  }
]
```

### 22.5 管理員 API（Admin Read Scope）

#### 22.5.1 取得全部題庫題目
**Endpoint**: `GET /api/v2/admin/question-bank`

**描述**: 管理員查看所有講師的題庫題目

**認證需求**: Bearer Token（`ADMIN`）

#### 22.5.2 取得全部測驗場次
**Endpoint**: `GET /api/v2/admin/exams`

**描述**: 管理員查看全部測驗場次與擁有者

**認證需求**: Bearer Token（`ADMIN`）

#### 22.5.3 取得任一測驗結果
**Endpoint**: `GET /api/v2/admin/exams/{examId}/results`

**描述**: 管理員查看任何場次的結果與作答明細

**認證需求**: Bearer Token（`ADMIN`）

### 22.6 學生歷史 API（Student History）

#### 22.6.1 取得我的測驗歷史
**Endpoint**: `GET /api/v2/me/exam-history`

**描述**: 取得當前登入學生參與過的所有測驗場次，包含不同講師的考試

**認證需求**: Bearer Token（已綁定學生身分）

#### 22.6.2 取得我的單次測驗作答明細
**Endpoint**: `GET /api/v2/me/exam-history/{examId}`

**描述**: 取得目前學生在指定場次的逐題作答狀況

**認證需求**: Bearer Token（該學生本人）

### 22.7 V2 授權規則
- `INSTRUCTOR`
  - 可讀寫自己的題庫題目與模板
  - 可讀取 `PUBLIC` 題庫題目與 `PUBLIC` 模板
  - 只能查看自己 `ownerUserId` 的測驗結果
- `ADMIN`
  - 可查看所有題庫、模板、測驗結果
  - 可管理使用者與資料審查
- `STUDENT`
  - 不得查看講師端結果
  - 僅可查看自己參與過的場次歷史與個人作答明細

### 22.8 V2 與既有 v1 API 的對應
- `POST /api/v2/templates/{templateId}/launch`
  - 產生既有 `Exam`
  - 回傳既有 `ExamDTO`
  - 後續仍由 `PUT /api/exams/{examId}/start` 進入即時考試流程
- `GET /api/v2/exams/mine`
  - 長期可取代目前無 owner 過濾的 `GET /api/exams`
- `GET /api/v2/exams/{examId}/student-answers`
  - 補齊目前只有聚合統計、缺乏逐人逐題明細的缺口

### 22.9 學員答題頁桌機版型規範（2026-03-07）
- 本次為前端表現層調整，不新增或修改 REST API。
- `StudentExam` 必須維持既有資料來源不變：
  - `GET /api/students/{sessionId}`
  - WebSocket 題目推送與倒數主題
  - `POST /api/answers`
- 響應式約束：
  - 桌機版型調整不得改變學員作答請求格式。
  - 桌機版型調整不得改變 WebSocket topic 與 payload。
  - 桌機版型調整後，手機版 API 呼叫時機與互動流程需保持一致。

### 22.10 專案技能納入版本控管（2026-03-07）
- 本次新增 repo 內 AI 專案技能，屬開發流程資產，不新增或修改任何 REST API。
- 專案技能僅提供以下資訊：
  - 專案目錄與責任分層
  - 文件更新順序
  - 常用建置 / 測試 / 發布檢查指令
  - 發布報告所需內容摘要
- 因此：
  - 不變更 endpoint
  - 不變更 request / response schema
  - 不變更認證與授權規則

### 22.11 測驗頁固定選單避讓與主題切換精簡（2026-03-07）
- 本次為前端共用 layout 與頁面視覺行為調整，不新增或修改 REST API。
- 約束如下：
  - 固定左上導覽列不得遮擋測驗頁主要內容。
  - 主題切換按鈕只保留右上全域入口，不在個別測驗頁重複渲染。
  - 此調整不得改變 `ExamMonitor`、`StudentExam` 的 API 呼叫順序、WebSocket topic、或請求格式。

### 22.12 講師問券/郵件功能開關（2026-03-07）

#### 22.12.1 UserDTO 擴充
- `GET /api/auth/user` 回傳的 `user` 需新增：
```json
{
  "surveyManagementEnabled": true,
  "emailManagementEnabled": true
}
```

#### 22.12.2 Admin 更新使用者功能開關
**Endpoint**: `PUT /api/roles/users/{userId}/features`

**描述**: 管理員更新指定使用者的問券/郵件管理功能開關

**認證需求**: Bearer Token（`ADMIN`）

**Request Body**
```json
{
  "surveyManagementEnabled": true,
  "emailManagementEnabled": false
}
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "使用者功能權限已更新",
  "user": {
    "id": 12,
    "email": "teacher@example.com",
    "role": "INSTRUCTOR",
    "surveyManagementEnabled": true,
    "emailManagementEnabled": false
  }
}
```

#### 22.12.3 Admin 刪除使用者
**Endpoint**: `DELETE /api/roles/users/{userId}`

**描述**: 管理員刪除指定使用者帳號

**認證需求**: Bearer Token（`ADMIN`）

**Response** (200 OK)
```json
{
  "success": true,
  "message": "使用者已刪除",
  "deletedUserId": 12
}
```

**Error**
- `403 Forbidden`: 非管理員，或嘗試刪除目前登入中的管理員自己
- `404 Not Found`: 使用者不存在

#### 22.12.4 授權規則
- `ADMIN`
  - 永遠可使用問券管理與郵件管理
  - 可調整任意使用者的功能開關
  - 可刪除其他使用者帳號，但不可刪除自己
- `INSTRUCTOR`
  - 需同時符合角色與功能旗標才可使用對應管理功能
- `STUDENT`
  - 不可進入問券管理與郵件管理
- 公開問券填寫 API 不受此功能開關影響

### 22.13 使用者功能欄位 migration 相容性（2026-03-07）
- 本次不新增 API，但補充後端資料模型相容性要求。
- 若 `User` 新增布林功能欄位且資料庫已存在舊資料，欄位 DDL 必須帶有資料庫預設值，例如：
  - `boolean default true`
- 目的：
  - 避免 PostgreSQL 在 Hibernate `ddl-auto=update` 時因 `NOT NULL` 新欄位含舊資料 null 而失敗
  - 避免後端啟動失敗後，前端誤判為帳號密碼錯誤

### 22.14 固定左上選單安全區修正（2026-03-07）
- 本次為前端共用 layout 間距修正，不新增或修改 REST API。
- 約束如下：
  - `PageLayout` 必須為固定左上選單預留足夠內容安全區。
  - 安全區需能覆蓋桌機與手機下的實際遮擋高度。
  - 此調整不得改變任何 API 呼叫或頁面資料流。

### 22.15 固定左上選單預設收合、靠近展開（2026-03-07）
- 本次為前端共用導覽互動調整，不新增或修改 REST API。
- 約束如下：
  - 桌機版導覽列預設收合，hover / focus 才展開。
  - 手機版不得依賴 hover 才能操作導覽。
  - 此調整不得改變任何既有路由與導頁邏輯。

### 22.16 手機版固定選單預設收合、點擊展開（2026-03-07）
- 本次為前端互動調整，不新增或修改 REST API。
- 約束如下：
  - 手機版導覽列需預設收合。
  - 手機版需以點擊展開完整選單，不可依賴 hover。
  - 此調整不得改變任何既有路由與導頁邏輯。

---

**文件版本**：v2.0-draft
**最後更新**：2026-03-07
