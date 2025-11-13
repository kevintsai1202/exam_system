/**
 * 調查欄位管理頁面
 *
 * 提供講師管理調查欄位的功能，包括：
 * - 查看所有調查欄位
 * - 新增調查欄位
 * - 編輯調查欄位（名稱、選項、啟用狀態、顯示順序）
 * - 刪除調查欄位
 * - 調整選項順序
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyFieldApi } from '../services/apiService';
import type { SurveyField } from '../types';
import { useMessage } from '../hooks';
import { Message } from '../components/Message';

/**
 * 表單模式
 */
type FormMode = 'create' | 'edit' | null;

/**
 * 表單資料介面
 */
interface FormData {
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  isActive: boolean;
  displayOrder: number;
}

/**
 * 調查欄位管理頁面元件
 */
export const SurveyFieldManager: React.FC = () => {
  const navigate = useNavigate();
  const message = useMessage();

  // 狀態管理
  const [surveyFields, setSurveyFields] = useState<SurveyField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fieldKey: '',
    fieldName: '',
    fieldType: 'SELECT',
    options: [''],
    isActive: true,
    displayOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 載入所有調查欄位
   */
  const loadSurveyFields = async () => {
    try {
      setIsLoading(true);
      const fields = await surveyFieldApi.getAllSurveyFields(false); // 載入所有欄位（包括未啟用的）
      // 按 displayOrder 排序
      fields.sort((a, b) => a.displayOrder - b.displayOrder);
      setSurveyFields(fields);
    } catch (err: any) {
      console.error('[SurveyFieldManager] 載入調查欄位失敗:', err);
      message.error('載入調查欄位失敗: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 初始載入
   */
  useEffect(() => {
    loadSurveyFields();
  }, []);

  /**
   * 開啟新增表單
   */
  const handleCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData({
      fieldKey: '',
      fieldName: '',
      fieldType: 'SELECT',
      options: [''],
      isActive: true,
      displayOrder: surveyFields.length, // 預設排在最後
    });
  };

  /**
   * 開啟編輯表單
   */
  const handleEdit = (field: SurveyField) => {
    setFormMode('edit');
    setEditingId(field.id);
    setFormData({
      fieldKey: field.fieldKey,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      options: [...field.options],
      isActive: field.isActive,
      displayOrder: field.displayOrder,
    });
  };

  /**
   * 關閉表單
   */
  const handleCancel = () => {
    setFormMode(null);
    setEditingId(null);
    setFormData({
      fieldKey: '',
      fieldName: '',
      fieldType: 'SELECT',
      options: [''],
      isActive: true,
      displayOrder: 0,
    });
  };

  /**
   * 新增選項
   */
  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    });
  };

  /**
   * 刪除選項
   */
  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 1) {
      message.warning('至少需要一個選項');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  /**
   * 更新選項內容
   */
  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  /**
   * 選項上移
   */
  const handleMoveOptionUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...formData.options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    setFormData({ ...formData, options: newOptions });
  };

  /**
   * 選項下移
   */
  const handleMoveOptionDown = (index: number) => {
    if (index === formData.options.length - 1) return;
    const newOptions = [...formData.options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setFormData({ ...formData, options: newOptions });
  };

  /**
   * 驗證表單
   */
  const validateForm = (): string | null => {
    if (!formData.fieldKey.trim()) return '欄位鍵值不能為空';
    if (!formData.fieldName.trim()) return '欄位名稱不能為空';
    if (formData.fieldKey.length > 50) return '欄位鍵值長度不能超過 50';
    if (formData.fieldName.length > 100) return '欄位名稱長度不能超過 100';

    // 驗證選項
    const validOptions = formData.options.filter((opt) => opt.trim() !== '');
    if (validOptions.length === 0) return '至少需要一個非空選項';

    // 檢查選項重複
    const uniqueOptions = new Set(validOptions);
    if (uniqueOptions.size !== validOptions.length) return '選項內容不能重複';

    return null;
  };

  /**
   * 提交表單
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證
    const error = validateForm();
    if (error) {
      message.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      // 過濾空選項
      const validOptions = formData.options.filter((opt) => opt.trim() !== '');

      if (formMode === 'create') {
        // 建立
        await surveyFieldApi.createSurveyField({
          fieldKey: formData.fieldKey.trim(),
          fieldName: formData.fieldName.trim(),
          fieldType: formData.fieldType,
          options: validOptions,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        });
        message.success('調查欄位建立成功！');
      } else if (formMode === 'edit' && editingId) {
        // 更新
        await surveyFieldApi.updateSurveyField(editingId, {
          fieldName: formData.fieldName.trim(),
          fieldType: formData.fieldType,
          options: validOptions,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        });
        message.success('調查欄位更新成功！');
      }

      // 重新載入列表
      await loadSurveyFields();
      handleCancel();
    } catch (err: any) {
      console.error('[SurveyFieldManager] 提交失敗:', err);
      message.error(err.message || '操作失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 刪除調查欄位
   */
  const handleDelete = async (field: SurveyField) => {
    if (!confirm(`確定要刪除調查欄位「${field.fieldName}」嗎？`)) {
      return;
    }

    try {
      await surveyFieldApi.deleteSurveyField(field.id);
      message.success('調查欄位刪除成功！');
      await loadSurveyFields();
    } catch (err: any) {
      console.error('[SurveyFieldManager] 刪除失敗:', err);
      message.error(err.message || '刪除失敗，請稍後再試');
    }
  };

  /**
   * 切換啟用狀態
   */
  const handleToggleActive = async (field: SurveyField) => {
    try {
      await surveyFieldApi.updateSurveyField(field.id, {
        fieldKey: field.fieldKey, // 必須包含 fieldKey (後端驗證需要)
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        options: field.options,
        isActive: !field.isActive,
        displayOrder: field.displayOrder,
      });
      message.success(`已${!field.isActive ? '啟用' : '停用'}「${field.fieldName}」`);
      await loadSurveyFields();
    } catch (err: any) {
      console.error('[SurveyFieldManager] 切換啟用狀態失敗:', err);
      message.error(err.message || '操作失敗，請稍後再試');
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
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* 頁面標題 */}
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#333',
                }}
              >
                調查欄位管理
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                管理測驗中學員加入時需填寫的調查欄位，如職業、年齡層、地區等
              </p>
            </div>
            <button
              onClick={() => navigate('/instructor')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              返回主控台
            </button>
          </div>

          {/* 新增按鈕 */}
          {!formMode && (
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={handleCreate}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: '#1976d2',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                + 新增調查欄位
              </button>
            </div>
          )}

          {/* 表單區域 */}
          {formMode && (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '32px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <h2
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                {formMode === 'create' ? '新增調查欄位' : '編輯調查欄位'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* 欄位鍵值 */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                    }}
                  >
                    欄位鍵值 * {formMode === 'edit' && <span style={{ color: '#999', fontSize: '12px' }}>(不可修改)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.fieldKey}
                    onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value })}
                    placeholder="例如: occupation, age_range, region"
                    required
                    disabled={formMode === 'edit'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: formMode === 'edit' ? '#f5f5f5' : '#fff',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    唯一識別碼，建議使用英文小寫與底線，例如：occupation、age_range
                  </div>
                </div>

                {/* 欄位名稱 */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                    }}
                  >
                    欄位名稱 *
                  </label>
                  <input
                    type="text"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                    placeholder="例如: 職業、年齡層、所在地區"
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
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    顯示給學員看的欄位名稱
                  </div>
                </div>

                {/* 選項列表 */}
                <div style={{ marginBottom: '20px' }}>
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
                      選項列表 *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
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

                  {formData.options.map((option, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ width: '30px', fontSize: '14px', fontWeight: '500', color: '#666' }}>
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                        placeholder={`選項 ${index + 1}`}
                        style={{
                          flex: 1,
                          padding: '10px',
                          fontSize: '14px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          outline: 'none',
                        }}
                      />

                      {/* 排序按鈕 */}
                      <button
                        type="button"
                        onClick={() => handleMoveOptionUp(index)}
                        disabled={index === 0}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: index === 0 ? '#ccc' : '#666',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOptionDown(index)}
                        disabled={index === formData.options.length - 1}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: index === formData.options.length - 1 ? '#ccc' : '#666',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          cursor: index === formData.options.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ↓
                      </button>

                      {/* 刪除按鈕 */}
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
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

                {/* 顯示順序 */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                    }}
                  >
                    顯示順序
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    min={0}
                    style={{
                      width: '200px',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    數字越小排序越前面
                  </div>
                </div>

                {/* 啟用狀態 */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{
                        marginRight: '8px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                    啟用此調查欄位
                  </label>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', marginLeft: '26px' }}>
                    只有啟用的欄位才會在建立測驗時顯示
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCancel}
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
                    {isSubmitting ? '處理中...' : (formMode === 'create' ? '建立' : '更新')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 列表區域 */}
          {!formMode && (
            <div>
              {surveyFields.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: '#999',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  尚無調查欄位，請點擊「新增調查欄位」按鈕建立
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {surveyFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: field.isActive ? '2px solid #e3f2fd' : '2px solid #f5f5f5',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* 左側資訊 */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#333',
                              }}
                            >
                              {field.fieldName}
                            </h3>
                            <span
                              style={{
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: field.isActive ? '#2e7d32' : '#999',
                                backgroundColor: field.isActive ? '#e8f5e9' : '#f5f5f5',
                                borderRadius: '4px',
                              }}
                            >
                              {field.isActive ? '已啟用' : '已停用'}
                            </span>
                            <span
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: '#666',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                              }}
                            >
                              順序: {field.displayOrder}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>
                            鍵值: {field.fieldKey}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>
                              選項列表 ({field.options.length} 個):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {field.options.map((option, index) => (
                                <span
                                  key={index}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '13px',
                                    color: '#333',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                  }}
                                >
                                  {index + 1}. {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 右側操作按鈕 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                          <button
                            onClick={() => handleEdit(field)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1976d2',
                              backgroundColor: '#fff',
                              border: '1px solid #1976d2',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleToggleActive(field)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: field.isActive ? '#f57c00' : '#2e7d32',
                              backgroundColor: '#fff',
                              border: `1px solid ${field.isActive ? '#f57c00' : '#2e7d32'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {field.isActive ? '停用' : '啟用'}
                          </button>
                          <button
                            onClick={() => handleDelete(field)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#f44336',
                              backgroundColor: '#fff',
                              border: '1px solid #f44336',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SurveyFieldManager;
