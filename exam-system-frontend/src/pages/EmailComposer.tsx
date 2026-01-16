/**
 * 郵件編輯/發送頁面
 *
 * 提供 WYSIWYG 郵件編輯器
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { emailCampaignApi, emailTemplateApi } from '../services/emailApiService';
import { examApi } from '../services/apiService';
import { surveyApi } from '../services/surveyApiService';
import type { EmailTemplate, Exam, Survey } from '../types';
import { useThemeStore, themes } from '../store/themeStore';

/**
 * 郵件編輯頁面組件
 */
const EmailComposer: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id && id !== 'new');
    const { mode: theme, isDark: isDarkFn } = useThemeStore();
    const isDark = isDarkFn();
    const currentTheme = themes[theme];

    // 基本資訊狀態
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [examId, setExamId] = useState<number | null>(null);
    const [surveyId, setSurveyId] = useState<number | null>(null);
    const [htmlContent, setHtmlContent] = useState('');

    // 資料來源
    const [exams, setExams] = useState<Exam[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [recipientCount, setRecipientCount] = useState(0);

    // UI 狀態
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    // 載入測驗列表
    useEffect(() => {
        const loadExams = async () => {
            try {
                const data = await examApi.getAllExams();
                setExams(data);
            } catch (err) {
                console.error('載入測驗列表失敗:', err);
            }
        };
        loadExams();
    }, []);

    // 載入範本列表
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const data = await emailTemplateApi.getAllTemplates();
                setTemplates(data);
            } catch (err) {
                console.error('載入範本列表失敗:', err);
            }
        };
        loadTemplates();
    }, []);

    // 當選擇測驗時，載入相關問券和統計收件人數
    useEffect(() => {
        if (!examId) {
            setSurveys([]);
            setRecipientCount(0);
            return;
        }

        const loadExamData = async () => {
            try {
                // 載入問券
                const surveysData = await surveyApi.getSurveysByExamId(examId);
                setSurveys(surveysData);

                // 取得測驗的學員數作為收件人數
                const exam = exams.find(e => e.id === examId);
                setRecipientCount(exam?.totalStudents || 0);
            } catch (err) {
                console.error('載入測驗資料失敗:', err);
            }
        };
        loadExamData();
    }, [examId, exams]);

    // 載入郵件活動（編輯模式）
    useEffect(() => {
        if (isEditMode && id) {
            const loadCampaign = async () => {
                try {
                    setLoading(true);
                    const campaign = await emailCampaignApi.getCampaign(parseInt(id));
                    setName(campaign.name);
                    setSubject(campaign.subject);
                    setExamId(campaign.examId);
                    setSurveyId(campaign.surveyId || null);
                    setHtmlContent(campaign.htmlContent || '');
                    setRecipientCount(campaign.totalRecipients || 0);
                } catch (err) {
                    console.error('載入郵件活動失敗:', err);
                    setError('無法載入郵件活動');
                } finally {
                    setLoading(false);
                }
            };
            loadCampaign();
        }
    }, [id, isEditMode]);

    // 使用範本
    const handleUseTemplate = (templateId: number) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setHtmlContent(template.htmlContent || '');
        }
    };

    // 插入變數
    const insertVariable = (variable: string) => {
        setHtmlContent(prev => prev + `{{${variable}}}`);
    };

    // 驗證表單
    const validateForm = (): string | null => {
        if (!name.trim()) return '請輸入活動名稱';
        if (!subject.trim()) return '請輸入郵件主旨';
        if (!examId) return '請選擇目標測驗';
        if (!htmlContent.trim()) return '請輸入郵件內容';
        return null;
    };

    // 儲存活動
    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        try {
            setSubmitting(true);

            const campaignData = {
                examId: examId!,
                surveyId: surveyId || undefined,
                name: name.trim(),
                subject: subject.trim(),
                htmlContent,
            };

            if (isEditMode && id) {
                await emailCampaignApi.updateCampaign(parseInt(id), campaignData);
                alert('郵件活動更新成功！');
            } else {
                const created = await emailCampaignApi.createCampaign(campaignData);
                // 自動新增測驗學員為收件人
                await emailCampaignApi.addExamStudentsAsRecipients(created.id);
                alert('郵件活動建立成功！');
            }

            navigate('/emails');
        } catch (err) {
            console.error('儲存郵件活動失敗:', err);
            alert('儲存郵件活動失敗');
        } finally {
            setSubmitting(false);
        }
    };

    // 儲存為範本
    const handleSaveAsTemplate = async () => {
        const templateName = prompt('請輸入範本名稱：');
        if (!templateName) return;

        try {
            await emailTemplateApi.createTemplate({
                name: templateName,
                subject,
                htmlContent,
            });
            alert('範本儲存成功！');
            // 重新載入範本
            const data = await emailTemplateApi.getAllTemplates();
            setTemplates(data);
        } catch (err) {
            console.error('儲存範本失敗:', err);
            alert('儲存範本失敗');
        }
    };

    // 樣式
    const styles: Record<string, React.CSSProperties> = {
        container: {
            minHeight: '100vh',
            padding: '24px',
            position: 'relative',
        },
        content: {
            maxWidth: '1000px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 10,
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: currentTheme.text,
        },
        headerButtons: {
            display: 'flex',
            gap: '12px',
        },
        backButton: {
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: currentTheme.text,
            border: `2px solid ${currentTheme.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
        },
        form: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${currentTheme.border}`,
        },
        section: {
            marginBottom: '20px',
        },
        row: {
            display: 'flex',
            gap: '16px',
        },
        halfWidth: {
            flex: 1,
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: currentTheme.text,
        },
        input: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'white',
            color: currentTheme.text,
            fontSize: '1rem',
            boxSizing: 'border-box' as const,
        },
        select: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'white',
            color: currentTheme.text,
            fontSize: '1rem',
            boxSizing: 'border-box' as const,
        },
        tabs: {
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
        },
        tab: {
            padding: '10px 20px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 1)',
            color: currentTheme.text,
            fontWeight: '500',
        },
        activeTab: {
            backgroundColor: currentTheme.primary,
            color: 'white',
            borderColor: currentTheme.primary,
        },
        toolbar: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap' as const,
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 1)',
            borderRadius: '8px',
        },
        toolbarButton: {
            padding: '8px 12px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
            color: currentTheme.text,
            cursor: 'pointer',
            fontSize: '0.85rem',
        },
        editor: {
            minHeight: '300px',
            padding: '16px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'white',
            color: currentTheme.text,
            fontSize: '1rem',
            lineHeight: 1.6,
            outline: 'none',
            fontFamily: 'inherit',
        },
        preview: {
            minHeight: '300px',
            padding: '16px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#1f2937',
        },
        infoBox: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 1)',
            borderRadius: '8px',
            marginBottom: '20px',
        },
        infoItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: currentTheme.textSecondary,
            fontSize: '0.9rem',
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
        },
        primaryButton: {
            padding: '14px 32px',
            backgroundColor: currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
        },
        secondaryButton: {
            padding: '14px 24px',
            backgroundColor: 'transparent',
            color: currentTheme.text,
            border: `2px solid ${currentTheme.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '1rem',
        },
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.content}>
                    <p style={{ color: currentTheme.text, textAlign: 'center', padding: '48px' }}>
                        載入中...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>

            <div style={styles.content}>
                <header style={styles.header}>
                    <h1 style={styles.title}>
                        {isEditMode ? '✏️ 編輯郵件活動' : '✉️ 建立郵件活動'}
                    </h1>
                    <div style={styles.headerButtons}>
                        <button style={styles.backButton} onClick={() => navigate('/emails')}>
                            ← 返回列表
                        </button>
                    </div>
                </header>

                {error && (
                    <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
                )}

                <div style={styles.form}>
                    {/* 基本資訊 */}
                    <div style={styles.row}>
                        <div style={{ ...styles.section, ...styles.halfWidth }}>
                            <label style={styles.label}>活動名稱 *</label>
                            <input
                                style={styles.input}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例：課程滿意度調查邀請"
                            />
                        </div>
                        <div style={{ ...styles.section, ...styles.halfWidth }}>
                            <label style={styles.label}>目標測驗 *</label>
                            <select
                                style={styles.select}
                                value={examId || ''}
                                onChange={(e) => setExamId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">請選擇測驗</option>
                                {exams.map((exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title} ({exam.totalStudents || 0} 學員)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={{ ...styles.section, ...styles.halfWidth }}>
                            <label style={styles.label}>附加問券（選填）</label>
                            <select
                                style={styles.select}
                                value={surveyId || ''}
                                onChange={(e) => setSurveyId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">不附加問券</option>
                                {surveys.map((survey) => (
                                    <option key={survey.id} value={survey.id}>
                                        {survey.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ ...styles.section, ...styles.halfWidth }}>
                            <label style={styles.label}>套用範本（選填）</label>
                            <select
                                style={styles.select}
                                onChange={(e) => e.target.value && handleUseTemplate(parseInt(e.target.value))}
                            >
                                <option value="">選擇範本...</option>
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>郵件主旨 *</label>
                        <input
                            style={styles.input}
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="例：邀請您填寫課程滿意度調查"
                        />
                    </div>

                    {/* 收件人資訊 */}
                    <div style={styles.infoBox}>
                        <div style={styles.infoItem}>
                            <span>👥</span>
                            <span>收件人數：{recipientCount} 人</span>
                        </div>
                        {surveyId && (
                            <div style={styles.infoItem}>
                                <span>📋</span>
                                <span>附加問券連結</span>
                            </div>
                        )}
                    </div>

                    {/* 郵件內容編輯器 */}
                    <div style={styles.section}>
                        <label style={styles.label}>郵件內容 *</label>

                        <div style={styles.tabs}>
                            <button
                                style={{ ...styles.tab, ...(activeTab === 'edit' ? styles.activeTab : {}) }}
                                onClick={() => setActiveTab('edit')}
                            >
                                編輯
                            </button>
                            <button
                                style={{ ...styles.tab, ...(activeTab === 'preview' ? styles.activeTab : {}) }}
                                onClick={() => setActiveTab('preview')}
                            >
                                預覽
                            </button>
                        </div>

                        {activeTab === 'edit' && (
                            <>
                                <div style={styles.toolbar}>
                                    <button
                                        type="button"
                                        style={styles.toolbarButton}
                                        onClick={() => insertVariable('name')}
                                    >
                                        插入姓名
                                    </button>
                                    <button
                                        type="button"
                                        style={styles.toolbarButton}
                                        onClick={() => insertVariable('surveyLink')}
                                    >
                                        插入問券連結
                                    </button>
                                    <button
                                        type="button"
                                        style={styles.toolbarButton}
                                        onClick={() => setHtmlContent(prev => prev + '<br/>')}
                                    >
                                        換行
                                    </button>
                                    <button
                                        type="button"
                                        style={styles.toolbarButton}
                                        onClick={() => setHtmlContent(prev => `<b>${prev}</b>`)}
                                    >
                                        粗體
                                    </button>
                                </div>

                                <textarea
                                    style={{ ...styles.editor, resize: 'vertical' as const }}
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                    placeholder="在此輸入郵件 HTML 內容...&#10;&#10;可使用 {{name}} 插入收件人姓名"
                                />
                            </>
                        )}

                        {activeTab === 'preview' && (
                            <div
                                style={styles.preview}
                                dangerouslySetInnerHTML={{
                                    __html: htmlContent.replace(/\{\{name\}\}/g, '王小明'),
                                }}
                            />
                        )}
                    </div>

                    {/* 按鈕 */}
                    <div style={styles.buttonGroup}>
                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={handleSave}
                            disabled={submitting}
                        >
                            {submitting ? '儲存中...' : isEditMode ? '更新活動' : '建立活動'}
                        </button>
                        <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={handleSaveAsTemplate}
                        >
                            儲存為範本
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailComposer;
