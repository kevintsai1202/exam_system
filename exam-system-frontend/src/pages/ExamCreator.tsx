/**
 * 測驗建立頁面
 *
 * 提供表單建立測驗與題目
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi, surveyFieldApi } from '../services/apiService';
import { ChartType } from '../types';
import type { CreateExamRequest, SurveyField } from '../types';
import { useMessage } from '../hooks';
import { Message } from '../components/Message';

/**
 * 表單題目狀態介面
 */
interface FormQuestion {
  questionOrder: number;
  questionText: string;
  singleStatChartType: ChartType;
  cumulativeChartType: ChartType;
  options: FormOption[];
  correctOptionOrder: number;
}

/**
 * 表單選項狀態介面
 */
interface FormOption {
  optionOrder: number;
  optionText: string;
}

/**
 * 測驗建立頁面
 */
export const ExamCreator: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const message = useMessage();
  const isEditMode = !!examId;

  // 測驗基本資訊
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // 調查欄位
  const [availableSurveyFields, setAvailableSurveyFields] = useState<SurveyField[]>([]);
  const [selectedSurveyFieldKeys, setSelectedSurveyFieldKeys] = useState<string[]>([]);
  const [isLoadingSurveyFields, setIsLoadingSurveyFields] = useState(true);

  // 題目列表
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      questionOrder: 1,
      questionText: '',
      singleStatChartType: ChartType.BAR,
      cumulativeChartType: ChartType.BAR,
      options: [
        { optionOrder: 1, optionText: '' },
        { optionOrder: 2, optionText: '' },
      ],
      correctOptionOrder: 1,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 載入可用的調查欄位
   */
  useEffect(() => {
    const loadSurveyFields = async () => {
      try {
        setIsLoadingSurveyFields(true);
        const fields = await surveyFieldApi.getAllSurveyFields(true); // 只載入啟用的欄位
        setAvailableSurveyFields(fields);
        setIsLoadingSurveyFields(false);
      } catch (err: any) {
        console.error('[ExamCreator] 載入調查欄位失敗:', err);
        setIsLoadingSurveyFields(false);
      }
    };

    loadSurveyFields();
  }, []);

  /**
   * 載入測驗資料（編輯模式）
   */
  useEffect(() => {
    const loadExamData = async () => {
      if (!isEditMode || !examId) return;

      try {
        setIsLoading(true);
        const [examData, questionsData] = await Promise.all([
          examApi.getExam(parseInt(examId)),
          examApi.getQuestions(parseInt(examId)),
        ]);

        // 載入基本資訊
        setTitle(examData.title);
        setDescription(examData.description);
        setQuestionTimeLimit(examData.questionTimeLimit);
        setSelectedSurveyFieldKeys(examData.surveyFieldKeys || []);

        // 轉換題目資料格式
        const formQuestions: FormQuestion[] = questionsData.questions.map((q: any) => ({
          questionOrder: q.questionOrder,
          questionText: q.questionText,
          singleStatChartType: q.singleStatChartType,
          cumulativeChartType: q.cumulativeChartType,
          options: q.options.map((opt: any) => ({
            optionOrder: opt.optionOrder,
            optionText: opt.optionText,
          })),
          correctOptionOrder: q.options.find((opt: any) => opt.id === q.correctOptionId)?.optionOrder || 1,
        }));

        setQuestions(formQuestions);
        setIsLoading(false);
      } catch (err: any) {
        console.error('[ExamCreator] 載入測驗失敗:', err);
        setError(err.message || '載入測驗失敗');
        setIsLoading(false);
      }
    };

    loadExamData();
  }, [isEditMode, examId]);

  /**
   * 新增題目
   */
  const handleAddQuestion = () => {
    const newQuestion: FormQuestion = {
      questionOrder: questions.length + 1,
      questionText: '',
      singleStatChartType: ChartType.BAR,
      cumulativeChartType: ChartType.BAR,
      options: [
        { optionOrder: 1, optionText: '' },
        { optionOrder: 2, optionText: '' },
      ],
      correctOptionOrder: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  /**
   * 刪除題目
   */
  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      message.warning('至少需要一個題目');
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    // 重新排序
    updated.forEach((q, i) => {
      q.questionOrder = i + 1;
    });
    setQuestions(updated);
  };

  /**
   * 更新題目
   */
  const handleUpdateQuestion = (index: number, field: keyof FormQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  /**
   * 新增選項
   */
  const handleAddOption = (questionIndex: number) => {
    const updated = [...questions];
    const question = updated[questionIndex];
    const newOption: FormOption = {
      optionOrder: question.options.length + 1,
      optionText: '',
    };
    question.options.push(newOption);
    setQuestions(updated);
  };

  /**
   * 刪除選項
   */
  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const question = updated[questionIndex];

    if (question.options.length <= 2) {
      message.warning('至少需要兩個選項');
      return;
    }

    question.options = question.options.filter((_, i) => i !== optionIndex);
    // 重新排序
    question.options.forEach((opt, i) => {
      opt.optionOrder = i + 1;
    });

    // 調整正確答案索引
    if (question.correctOptionOrder > question.options.length) {
      question.correctOptionOrder = question.options.length;
    }

    setQuestions(updated);
  };

  /**
   * 更新選項
   */
  const handleUpdateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex].optionText = value;
    setQuestions(updated);
  };

  /**
   * 表單驗證
   */
  const validateForm = (): string | null => {
    if (!title.trim()) return '請輸入測驗標題';
    if (!description.trim()) return '請輸入測驗描述';
    if (questionTimeLimit < 5 || questionTimeLimit > 300) {
      return '題目時限需介於 5-300 秒';
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        return `第 ${i + 1} 題題目不可為空`;
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].optionText.trim()) {
          return `第 ${i + 1} 題選項 ${j + 1} 不可為空`;
        }
      }

      if (q.correctOptionOrder < 1 || q.correctOptionOrder > q.options.length) {
        return `第 ${i + 1} 題正確答案無效`;
      }
    }

    return null;
  };

  /**
   * 提交表單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 驗證
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // 準備 API 請求資料
      const requestData: CreateExamRequest = {
        title,
        description,
        questionTimeLimit,
        surveyFieldKeys: selectedSurveyFieldKeys.length > 0 ? selectedSurveyFieldKeys : undefined,
        questions: questions.map((q) => ({
          questionOrder: q.questionOrder,
          questionText: q.questionText,
          singleStatChartType: q.singleStatChartType,
          cumulativeChartType: q.cumulativeChartType,
          options: q.options.map((opt) => ({
            optionOrder: opt.optionOrder,
            optionText: opt.optionText,
          })),
          correctOptionOrder: q.correctOptionOrder,
        })),
      };

      // 呼叫 API（建立或更新）
      const exam = isEditMode && examId
        ? await examApi.updateExam(parseInt(examId), requestData)
        : await examApi.createExam(requestData);

      // 成功，導航至監控頁面
      message.success(isEditMode ? '測驗更新成功！' : '測驗建立成功！');
      navigate(`/instructor/exam/${exam.id}/monitor`);
    } catch (err: any) {
      setError(err.message || '建立測驗失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>載入中...</div>
      </div>
    );
  }

  return (
    <>
      {/* Message 訊息提示 */}
      {message.messages.map((msg) => (
        <Message
          key={msg.key}
          content={msg.content}
          type={msg.type}
          duration={msg.duration}
          onClose={() => message.close(msg.key)}
        />
      ))}

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          padding: '40px 20px',
        }}
      >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* 頁面標題 */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: '700',
              color: '#333',
            }}
          >
            {isEditMode ? '編輯測驗' : '建立新測驗'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            {isEditMode ? '修改測驗資訊與題目內容' : '填寫測驗資訊與題目內容'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 測驗基本資訊 */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              基本資訊
            </h2>

            {/* 標題 */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                測驗標題 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="請輸入測驗標題"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 描述 */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                測驗描述 *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="請輸入測驗描述"
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 時限 */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                每題倒數時間（秒）*
              </label>
              <input
                type="number"
                value={questionTimeLimit}
                onChange={(e) => setQuestionTimeLimit(parseInt(e.target.value))}
                min={5}
                max={300}
                required
                style={{
                  width: '200px',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                (5-300 秒)
              </span>
            </div>

            {/* 調查欄位選擇 */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                📊 調查欄位設定（選填）
              </label>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                選擇學員加入時需要填寫的調查資訊，如職業、年齡層等。系統將自動統計並顯示圖表。
              </p>

              {isLoadingSurveyFields ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  載入調查欄位中...
                </div>
              ) : availableSurveyFields.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  目前沒有可用的調查欄位
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {availableSurveyFields.map((field) => {
                    const isSelected = selectedSurveyFieldKeys.includes(field.fieldKey);
                    return (
                      <label
                        key={field.fieldKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 16px',
                          border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          userSelect: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#1976d2';
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.backgroundColor = '#fff';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSurveyFieldKeys([...selectedSurveyFieldKeys, field.fieldKey]);
                            } else {
                              setSelectedSurveyFieldKeys(
                                selectedSurveyFieldKeys.filter((key) => key !== field.fieldKey)
                              );
                            }
                          }}
                          style={{
                            marginRight: '8px',
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            {field.fieldName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                            {field.options.length} 個選項
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedSurveyFieldKeys.length > 0 && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', fontSize: '13px', color: '#2e7d32' }}>
                  ✓ 已選擇 {selectedSurveyFieldKeys.length} 個調查欄位
                </div>
              )}
            </div>
          </div>

          {/* 題目列表 */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                題目列表
              </h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: '#1976d2',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                + 新增題目
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div
                key={qIndex}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* 題目標題列 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1976d2',
                    }}
                  >
                    第 {qIndex + 1} 題
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#f44336',
                        backgroundColor: '#fff',
                        border: '1px solid #f44336',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      刪除題目
                    </button>
                  )}
                </div>

                {/* 題目文字 */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                    }}
                  >
                    題目內容 *
                  </label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) =>
                      handleUpdateQuestion(qIndex, 'questionText', e.target.value)
                    }
                    placeholder="請輸入題目內容"
                    required
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 選項列表 */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333',
                      }}
                    >
                      選項 *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#1976d2',
                        backgroundColor: '#fff',
                        border: '1px solid #1976d2',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      + 新增選項
                    </button>
                  </div>

                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          width: '24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#666',
                        }}
                      >
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <input
                        type="text"
                        value={option.optionText}
                        onChange={(e) =>
                          handleUpdateOption(qIndex, oIndex, e.target.value)
                        }
                        placeholder={`選項 ${oIndex + 1}`}
                        required
                        style={{
                          flex: 1,
                          padding: '10px',
                          fontSize: '14px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          outline: 'none',
                        }}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: '#f44336',
                            backgroundColor: '#fff',
                            border: '1px solid #f44336',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 正確答案 */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                    }}
                  >
                    正確答案 *
                  </label>
                  <select
                    value={question.correctOptionOrder}
                    onChange={(e) =>
                      handleUpdateQuestion(
                        qIndex,
                        'correctOptionOrder',
                        parseInt(e.target.value)
                      )
                    }
                    required
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  >
                    {question.options.map((_, oIndex) => (
                      <option key={oIndex} value={oIndex + 1}>
                        選項 {String.fromCharCode(65 + oIndex)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 圖表類型 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333',
                      }}
                    >
                      單題統計圖表
                    </label>
                    <select
                      value={question.singleStatChartType}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          qIndex,
                          'singleStatChartType',
                          e.target.value as ChartType
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        outline: 'none',
                      }}
                    >
                      <option value="BAR">長條圖</option>
                      <option value="PIE">圓餅圖</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333',
                      }}
                    >
                      累積統計圖表
                    </label>
                    <select
                      value={question.cumulativeChartType}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          qIndex,
                          'cumulativeChartType',
                          e.target.value as ChartType
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        outline: 'none',
                      }}
                    >
                      <option value="BAR">長條圖</option>
                      <option value="PIE">圓餅圖</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* 操作按鈕 */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/instructor')}
              disabled={isSubmitting}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#666',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#fff',
                backgroundColor: isSubmitting ? '#999' : '#1976d2',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting
                ? (isEditMode ? '更新中...' : '建立中...')
                : (isEditMode ? '更新測驗' : '建立測驗')}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default ExamCreator;
