/**
 * 學員加入頁面
 *
 * 學員輸入加入碼與個人資訊加入測驗
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentApi, examApi, surveyFieldApi } from '../services/apiService';
import { useStudentStore } from '../store';
import { useMediaQuery, useResponsiveValue } from '../hooks';
import AvatarSelector from '../components/AvatarSelector';
import type { AvatarIcon, JoinExamRequest, SurveyField } from '../types';

/**
 * 學員加入頁面
 */
export const StudentJoin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCurrentStudent, setJoinContext } = useStudentStore();

  // 從 URL 參數取得 Access Code
  const urlAccessCode = searchParams.get('accessCode') || searchParams.get('code') || '';

  // 表單狀態
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<AvatarIcon>('cat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 調查欄位狀態
  const [surveyFields, setSurveyFields] = useState<SurveyField[]>([]);
  const [surveyData, setSurveyData] = useState<Record<string, string>>({});
  const [customSurveyData, setCustomSurveyData] = useState<Record<string, string>>({});
  const [isLoadingSurveyFields, setIsLoadingSurveyFields] = useState(false);

  // 常用職業列表（保留向下兼容）
  const commonOccupations = [
    '學生',
    '教師',
    '工程師',
    '設計師',
    '行銷人員',
    '業務人員',
    '醫護人員',
    '公務員',
    '自由工作者',
    '其他',
  ];

  // 自動填入 URL 參數中的 Access Code
  useEffect(() => {
    if (urlAccessCode) {
      setAccessCode(urlAccessCode);
    }
  }, [urlAccessCode]);

  // 載入調查欄位（當 accessCode 變更時）
  useEffect(() => {
    const loadSurveyFields = async () => {
      // accessCode 需要至少 6 個字元才載入
      if (!accessCode || accessCode.trim().length < 6) {
        setSurveyFields([]);
        setSurveyData({});
        setCustomSurveyData({});
        return;
      }

      try {
        setIsLoadingSurveyFields(true);
        setError(null);

        // 取得測驗預覽資訊
        const exam = await examApi.getExamPreview(accessCode.trim());

        // 如果測驗有設定調查欄位
        if (exam.surveyFieldKeys && exam.surveyFieldKeys.length > 0) {
          // 載入所有調查欄位定義
          const fieldPromises = exam.surveyFieldKeys.map((fieldKey) =>
            surveyFieldApi.getSurveyFieldByKey(fieldKey)
          );
          const fields = await Promise.all(fieldPromises);

          // 過濾掉職業欄位（職業欄位使用舊有邏輯，保持向下兼容）
          const nonOccupationFields = fields.filter((field) => field.fieldKey !== 'occupation');
          setSurveyFields(nonOccupationFields);
        } else {
          setSurveyFields([]);
        }

        setIsLoadingSurveyFields(false);
      } catch (err: any) {
        console.error('[StudentJoin] 載入調查欄位失敗:', err);
        // 不要因為無法載入調查欄位而阻擋學員加入
        // 只是清空調查欄位即可
        setSurveyFields([]);
        setIsLoadingSurveyFields(false);
      }
    };

    // 使用 debounce 避免頻繁呼叫 API
    const timer = setTimeout(loadSurveyFields, 500);
    return () => clearTimeout(timer);
  }, [accessCode]);

  /**
   * 表單驗證
   */
  const validateForm = (): string | null => {
    if (!accessCode.trim()) return '請輸入加入碼';
    if (!name.trim()) return '請輸入姓名';
    if (!email.trim()) return '請輸入 Email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Email 格式不正確';
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
      // 處理職業資料：如果選擇「其他」，則使用自訂職業
      const finalOccupation = occupation === '其他'
        ? customOccupation.trim()
        : occupation;

      // 處理調查資料：合併選擇值和自訂值
      const finalSurveyData: Record<string, string> = {};
      Object.keys(surveyData).forEach((fieldKey) => {
        const value = surveyData[fieldKey];
        // 如果選擇「其他」，使用自訂值
        if (value === '其他' && customSurveyData[fieldKey]) {
          finalSurveyData[fieldKey] = customSurveyData[fieldKey].trim();
        } else if (value) {
          finalSurveyData[fieldKey] = value;
        }
      });

      const requestData: JoinExamRequest = {
        accessCode: accessCode.trim(),
        name: name.trim(),
        email: email.trim(),
        occupation: finalOccupation || undefined,
        surveyData: Object.keys(finalSurveyData).length > 0 ? finalSurveyData : undefined,
        avatarIcon,
      };

      // 呼叫 API
      const student = await studentApi.joinExam(requestData);

      // 儲存學員資訊
      setCurrentStudent(student);
      setJoinContext(requestData);

      // 導航至答題頁面
      navigate(`/student/exam/${student.examId}?sessionId=${encodeURIComponent(student.sessionId)}`);
    } catch (err: any) {
      // 顯示友善的錯誤訊息
      const errorMessage = err.message || '加入測驗失敗，請檢查加入碼是否正確';
      setError(errorMessage);

      // 如果是測驗已結束的錯誤，可以記錄到 console 以便除錯
      if (errorMessage.includes('測驗已結束') || errorMessage.includes('已結束')) {
        console.log('用戶嘗試加入已結束的測驗');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const { isMobile } = useMediaQuery();
  const containerPadding = useResponsiveValue('16px', '20px', '20px');
  const cardPadding = useResponsiveValue('24px', '32px', '40px');
  const maxWidth = useResponsiveValue('100%', '450px', '500px');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: containerPadding,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: '#fff',
          borderRadius: isMobile ? '12px' : '16px',
          padding: cardPadding,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: '700',
              color: '#333',
            }}
          >
            加入測驗
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            請填寫以下資訊開始答題
          </p>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit}>
          {/* 加入碼 */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
              }}
            >
              測驗加入碼 *
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="請輸入加入碼"
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          {/* 姓名 */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
              }}
            >
              姓名 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="請輸入您的姓名"
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
              }}
            >
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入您的 Email"
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          {/* 職業選擇 */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
              }}
            >
              職業
            </label>
            <select
              value={occupation}
              onChange={(e) => {
                setOccupation(e.target.value);
                if (e.target.value !== '其他') {
                  setCustomOccupation('');
                }
              }}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              <option value="">請選擇職業（選填）</option>
              {commonOccupations.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          </div>

          {/* 自訂職業輸入框（當選擇「其他」時顯示） */}
          {occupation === '其他' && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                請輸入您的職業
              </label>
              <input
                type="text"
                value={customOccupation}
                onChange={(e) => setCustomOccupation(e.target.value)}
                placeholder="請輸入您的職業"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
              />
            </div>
          )}

          {/* 動態調查欄位 */}
          {surveyFields.map((field) => (
            <div key={field.fieldKey} style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                }}
              >
                {field.fieldName}
              </label>
              <select
                value={surveyData[field.fieldKey] || ''}
                onChange={(e) => {
                  setSurveyData({ ...surveyData, [field.fieldKey]: e.target.value });
                  if (e.target.value !== '其他') {
                    setCustomSurveyData({ ...customSurveyData, [field.fieldKey]: '' });
                  }
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
              >
                <option value="">請選擇（選填）</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* 自訂輸入框（當選擇「其他」時顯示） */}
              {surveyData[field.fieldKey] === '其他' && (
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    value={customSurveyData[field.fieldKey] || ''}
                    onChange={(e) =>
                      setCustomSurveyData({ ...customSurveyData, [field.fieldKey]: e.target.value })
                    }
                    placeholder={`請輸入${field.fieldName}`}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                  />
                </div>
              )}
            </div>
          ))}

          {/* 頭像選擇 */}
          <div style={{ marginBottom: '32px' }}>
            <AvatarSelector
              selectedAvatar={avatarIcon}
              onSelect={setAvatarIcon}
              size="medium"
              columns={4}
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: isSubmitting ? '#999' : '#1976d2',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#1565c0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#1976d2';
              }
            }}
          >
            {isSubmitting ? '加入中...' : '加入測驗'}
          </button>
        </form>

        {/* 說明文字 */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.6',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>提示：</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>請向講師取得測驗加入碼</li>
            <li>確保您的姓名與 Email 正確無誤</li>
            <li>選擇一個喜歡的頭像作為您的識別標誌</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentJoin;


