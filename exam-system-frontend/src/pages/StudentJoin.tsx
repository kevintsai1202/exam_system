/**
 * 學員加入頁面
 *
 * 學員輸入加入碼與個人資訊加入測驗
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentApi, examApi } from '../services/apiService';
import { useStudentStore } from '../store';
import { useMediaQuery, useResponsiveValue } from '../hooks';
import AvatarSelector from '../components/AvatarSelector';
import P5Background from '../components/P5Background';
import ThemeToggle from '../components/ThemeToggle';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useThemeStore, themes } from '../store/themeStore';
import {
  getStudentSessionByGmail,
  initiateGoogleLogin,
  getStoredGoogleUser,
  clearStoredGoogleUser,
  type GoogleUserInfo,
} from '../services/studentSessionService';
import type { AvatarIcon, JoinExamRequest, ExamSurveyFieldConfig } from '../types';

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
  const [occupation, _setOccupation] = useState('');
  const [customOccupation, _setCustomOccupation] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<AvatarIcon>('cat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 調查欄位狀態
  const [surveyFieldConfigs, setSurveyFieldConfigs] = useState<ExamSurveyFieldConfig[]>([]);
  const [surveyData, setSurveyData] = useState<Record<string, string>>({});
  const [customSurveyData, setCustomSurveyData] = useState<Record<string, string>>({});
  const [_isLoadingSurveyFields, setIsLoadingSurveyFields] = useState(false);

  // 測驗狀態
  const [examStatus, setExamStatus] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState<string>('');
  const [examId, setExamId] = useState<number | null>(null);

  // Google 登入狀態
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasCheckedReconnect, setHasCheckedReconnect] = useState(false);

  // 自動填入 URL 參數中的 Access Code
  useEffect(() => {
    if (urlAccessCode) {
      setAccessCode(urlAccessCode);
    }
  }, [urlAccessCode]);

  // 載入調查欄位配置（當 accessCode 變更時）
  useEffect(() => {
    const loadSurveyFieldConfigs = async () => {
      // accessCode 需要至少 6 個字元才載入
      if (!accessCode || accessCode.trim().length < 6) {
        setSurveyFieldConfigs([]);
        setSurveyData({});
        setCustomSurveyData({});
        return;
      }

      try {
        setIsLoadingSurveyFields(true);
        setError(null);

        // 取得測驗預覽資訊
        const exam = await examApi.getExamPreview(accessCode.trim());

        // 儲存測驗狀態和標題
        setExamStatus(exam.status);
        setExamTitle(exam.title);
        setExamId(exam.id);

        // 如果測驗有設定調查欄位配置
        if (exam.surveyFieldConfigs && exam.surveyFieldConfigs.length > 0) {
          // 使用動態調查欄位配置（包含職業欄位）
          setSurveyFieldConfigs(exam.surveyFieldConfigs);
        } else {
          setSurveyFieldConfigs([]);
        }

        setIsLoadingSurveyFields(false);
      } catch (err: any) {
        console.error('[StudentJoin] 載入調查欄位配置失敗:', err);
        // 清空狀態
        setExamStatus(null);
        setExamTitle('');
        setExamId(null);
        setSurveyFieldConfigs([]);
        setIsLoadingSurveyFields(false);
      }
    };

    // 使用 debounce 避免頻繁呼叫 API
    const timer = setTimeout(loadSurveyFieldConfigs, 500);
    return () => clearTimeout(timer);
  }, [accessCode]);

  // 檢查是否有暫存的 Google 用戶資訊（從 OAuth 回調返回）
  useEffect(() => {
    const stored = getStoredGoogleUser();
    if (stored) {
      setGoogleUser(stored);
      setName(stored.name);
      setEmail(stored.email);
    }
  }, []);

  // 當有 Google 用戶和 examId 時，檢查是否可以斷線重連
  useEffect(() => {
    const checkReconnect = async () => {
      if (!googleUser || !examId || hasCheckedReconnect) return;

      setHasCheckedReconnect(true);
      setIsGoogleLoading(true);

      try {
        const existingSession = await getStudentSessionByGmail(googleUser.email, examId);
        if (existingSession && existingSession.sessionId) {
          // 找到現有會話，設置 store 並導航到測驗頁面
          const studentData = {
            id: existingSession.id,
            sessionId: existingSession.sessionId,
            examId: existingSession.examId,
            name: existingSession.name,
            email: existingSession.email,
            avatarIcon: existingSession.avatarIcon as AvatarIcon,
            totalScore: existingSession.totalScore || 0,
            joinedAt: new Date().toISOString(),
          };
          setCurrentStudent(studentData as any);

          // 導航到測驗頁面
          navigate(`/student/exam?examId=${examId}`);
          return;
        }
      } catch (error) {
        console.error('[StudentJoin] 斷線重連檢查失敗:', error);
      } finally {
        setIsGoogleLoading(false);
      }
    };

    checkReconnect();
  }, [googleUser, examId, hasCheckedReconnect, setCurrentStudent, setJoinContext, navigate, accessCode]);

  /**
   * 處理 Google 登入
   */
  const handleGoogleLogin = () => {
    const returnUrl = window.location.href;
    initiateGoogleLogin(returnUrl);
  };

  /**
   * 清除 Google 登入狀態
   */
  const handleClearGoogleLogin = () => {
    clearStoredGoogleUser();
    setGoogleUser(null);
    setName('');
    setEmail('');
  };

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

    // 驗證必填的調查欄位
    for (const config of surveyFieldConfigs) {
      if (config.isRequired) {
        const fieldKey = config.fieldKey;
        const fieldName = config.fieldName || fieldKey;

        // 檢查欄位是否已填寫
        const value = surveyData[fieldKey];
        if (!value || value.trim() === '') {
          return `必填欄位「${fieldName}」不能為空`;
        }

        // 如果選擇「其他」，檢查自訂值是否已填寫
        if (value === '其他') {
          const customValue = customSurveyData[fieldKey];
          if (!customValue || customValue.trim() === '') {
            return `請輸入「${fieldName}」的自訂值`;
          }
        }
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

  // 主題狀態
  const { mode } = useThemeStore();
  const theme = themes[mode];
  const isDark = mode === 'dark';

  // 判斷表單是否應該被禁用（測驗未開始或已結束）
  const isFormDisabled = examStatus !== null && examStatus !== 'STARTED';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 50%, #f0f4f8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: containerPadding,
        position: 'relative',
      }}
    >
      {/* P5.js 動態背景層 - 使用雙層效果 */}
      <P5Background
        variant="network"
        opacity={isDark ? 0.9 : 0.5}
        color={isDark ? '#00ff88' : '#2e7d32'}
      />
      <P5Background
        variant="particles"
        opacity={isDark ? 0.7 : 0.4}
        color={isDark ? '#ff40ff' : '#7b1fa2'}
      />

      {/* 裝飾性光暈效果 - 加強版 */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '-15%',
          width: '55%',
          height: '55%',
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 230, 118, 0.3) 0%, rgba(0, 230, 118, 0.1) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.08) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'glow-pulse 6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          right: '-15%',
          width: '60%',
          height: '60%',
          background: isDark
            ? 'radial-gradient(circle, rgba(224, 64, 251, 0.25) 0%, rgba(224, 64, 251, 0.08) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'glow-pulse 8s ease-in-out infinite reverse',
        }}
      />

      {/* 光暈動畫樣式 */}
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
      `}</style>

      {/* 主題切換按鈕 */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      <div
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: isMobile ? '12px' : '16px',
          padding: cardPadding,
          boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: '700',
              color: isDark ? '#fff' : '#333',
            }}
          >
            加入測驗
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
            請填寫以下資訊開始答題
          </p>
        </div>

        {/* 測驗狀態提示（當測驗未開始或已結束時顯示） */}
        {examStatus && examStatus !== 'STARTED' && (
          <div
            style={{
              padding: '20px',
              marginBottom: '24px',
              backgroundColor: examStatus === 'CREATED' ? '#fff3cd' : '#f8d7da',
              border: `2px solid ${examStatus === 'CREATED' ? '#ffc107' : '#dc3545'}`,
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {examStatus === 'CREATED' ? '⏳' : '🔒'}
            </div>
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: examStatus === 'CREATED' ? '#856404' : '#721c24',
              }}
            >
              {examStatus === 'CREATED' ? '測驗尚未開始' : '測驗已結束'}
            </h2>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                color: examStatus === 'CREATED' ? '#856404' : '#721c24',
                lineHeight: '1.6',
              }}
            >
              {examStatus === 'CREATED'
                ? `測驗「${examTitle}」尚未開始，請等待講師啟動測驗後再加入。`
                : `測驗「${examTitle}」已經結束，無法再加入。`}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: examStatus === 'CREATED' ? '#856404' : '#721c24',
              }}
            >
              {examStatus === 'CREATED'
                ? '請保持此頁面開啟，或稍後重新輸入加入碼。'
                : '如有疑問，請聯繫講師。'}
            </p>
          </div>
        )}

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

          {/* Google 登入區塊 */}
          <div style={{ marginBottom: '24px' }}>
            {googleUser ? (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9',
                  border: `1px solid ${isDark ? 'rgba(76, 175, 80, 0.3)' : '#4caf50'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#4caf50">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <div>
                    <div style={{ fontWeight: '600', color: isDark ? '#fff' : '#333', fontSize: '14px' }}>
                      已連結 Google 帳號
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
                      {googleUser.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearGoogleLogin}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#666',
                    backgroundColor: 'transparent',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#ddd'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  解除連結
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDark ? '#fff' : '#333'
                }}>
                  使用 Google 登入（可用於斷線重連）
                </div>
                <GoogleLoginButton
                  onClick={handleGoogleLogin}
                  isLoading={isGoogleLoading}
                  disabled={isSubmitting}
                />
              </div>
            )}
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
              disabled={isSubmitting || isFormDisabled}
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
              disabled={isSubmitting || isFormDisabled}
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

          {/* 動態調查欄位 */}
          {surveyFieldConfigs.map((config) => {
            const fieldKey = config.fieldKey;
            const fieldName = config.fieldName || fieldKey;
            const isRequired = config.isRequired;
            const options = config.options || [];

            return (
              <div key={fieldKey} style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                  }}
                >
                  {fieldName} {isRequired && <span style={{ color: '#f44336' }}>*</span>}
                </label>
                <select
                  value={surveyData[fieldKey] || ''}
                  onChange={(e) => {
                    setSurveyData({ ...surveyData, [fieldKey]: e.target.value });
                    if (e.target.value !== '其他') {
                      setCustomSurveyData({ ...customSurveyData, [fieldKey]: '' });
                    }
                  }}
                  required={isRequired}
                  disabled={isSubmitting || isFormDisabled}
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
                  <option value="">
                    請選擇（{isRequired ? '必填' : '選填'}）
                  </option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                {/* 自訂輸入框（當選擇「其他」時顯示） */}
                {surveyData[fieldKey] === '其他' && (
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      value={customSurveyData[fieldKey] || ''}
                      onChange={(e) =>
                        setCustomSurveyData({ ...customSurveyData, [fieldKey]: e.target.value })
                      }
                      placeholder={`請輸入${fieldName}`}
                      required={isRequired}
                      disabled={isSubmitting || isFormDisabled}
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
            );
          })}

          {/* 頭像選擇（測驗未開始或已結束時隱藏） */}
          {!isFormDisabled && (
            <div style={{ marginBottom: '32px' }}>
              <AvatarSelector
                selectedAvatar={avatarIcon}
                onSelect={setAvatarIcon}
                size="medium"
                columns={4}
              />
            </div>
          )}

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
            disabled={isSubmitting || isFormDisabled}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: (isSubmitting || isFormDisabled) ? '#999' : '#1976d2',
              border: 'none',
              borderRadius: '8px',
              cursor: (isSubmitting || isFormDisabled) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && !isFormDisabled) {
                e.currentTarget.style.backgroundColor = '#1565c0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && !isFormDisabled) {
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


