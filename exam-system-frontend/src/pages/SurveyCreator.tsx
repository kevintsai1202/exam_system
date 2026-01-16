/**
 * 問券建立/編輯頁面
 *
 * 提供表單建立問券與題目
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surveyApi } from '../services/surveyApiService';
import { examApi } from '../services/apiService';
import {
    SurveyQuestionType,
} from '../types';
import type { Exam } from '../types';

import { useThemeStore, themes } from '../store/themeStore';

/**
 * 表單題目狀態介面
 */
interface FormQuestion {
    id?: number;
    questionOrder: number;
    questionText: string;
    questionType: SurveyQuestionType;
    isRequired: boolean;
    maxRating: number;
    options: FormOption[];
}

/**
 * 表單選項狀態介面
 */
interface FormOption {
    id?: number;
    optionOrder: number;
    optionText: string;
}

/**
 * 問券建立頁面組件
 */
const SurveyCreator: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id && id !== 'new');
    const { mode: theme, isDark: isDarkFn } = useThemeStore();
    const isDark = isDarkFn();
    const currentTheme = themes[theme];

    // 基本資訊狀態
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [examId, setExamId] = useState<number | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);

    // 題目狀態
    const [questions, setQuestions] = useState<FormQuestion[]>([]);

    // 測驗列表（供選擇）
    const [exams, setExams] = useState<Exam[]>([]);

    // UI 狀態
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    // 載入問券（編輯模式）
    useEffect(() => {
        if (isEditMode && id) {
            const loadSurvey = async () => {
                try {
                    setLoading(true);
                    const survey = await surveyApi.getSurvey(parseInt(id));
                    setTitle(survey.title);
                    setDescription(survey.description || '');
                    setExamId(survey.examId);
                    setIsAnonymous(survey.isAnonymous);

                    // 轉換題目格式
                    if (survey.questions) {
                        const formQuestions: FormQuestion[] = survey.questions.map((q) => ({
                            id: q.id,
                            questionOrder: q.questionOrder,
                            questionText: q.questionText,
                            questionType: q.questionType,
                            isRequired: q.isRequired,
                            maxRating: q.maxRating || 5,
                            options: (q.options || []).map((o) => ({
                                id: o.id,
                                optionOrder: o.optionOrder,
                                optionText: o.optionText,
                            })),
                        }));
                        setQuestions(formQuestions);
                    }
                } catch (err) {
                    console.error('載入問券失敗:', err);
                    setError('無法載入問券');
                } finally {
                    setLoading(false);
                }
            };
            loadSurvey();
        }
    }, [id, isEditMode]);

    // 新增題目
    const handleAddQuestion = () => {
        const newQuestion: FormQuestion = {
            questionOrder: questions.length + 1,
            questionText: '',
            questionType: SurveyQuestionType.SINGLE_CHOICE,
            isRequired: true,
            maxRating: 5,
            options: [
                { optionOrder: 1, optionText: '' },
                { optionOrder: 2, optionText: '' },
            ],
        };
        setQuestions([...questions, newQuestion]);
    };

    // 刪除題目
    const handleRemoveQuestion = (index: number) => {
        const updated = questions.filter((_, i) => i !== index);
        // 重新編號
        updated.forEach((q, i) => {
            q.questionOrder = i + 1;
        });
        setQuestions(updated);
    };

    // 更新題目
    const handleUpdateQuestion = (
        index: number,
        field: keyof FormQuestion,
        value: any
    ) => {
        const updated = [...questions];
        (updated[index] as any)[field] = value;

        // 如果切換到選擇題類型，確保有選項
        if (field === 'questionType') {
            const type = value as SurveyQuestionType;
            if (
                (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') &&
                updated[index].options.length === 0
            ) {
                updated[index].options = [
                    { optionOrder: 1, optionText: '' },
                    { optionOrder: 2, optionText: '' },
                ];
            }
        }

        setQuestions(updated);
    };

    // 新增選項
    const handleAddOption = (questionIndex: number) => {
        const updated = [...questions];
        const options = updated[questionIndex].options;
        options.push({
            optionOrder: options.length + 1,
            optionText: '',
        });
        setQuestions(updated);
    };

    // 刪除選項
    const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
        const updated = [...questions];
        const options = updated[questionIndex].options;
        if (options.length <= 2) {
            alert('選擇題至少需要 2 個選項');
            return;
        }
        options.splice(optionIndex, 1);
        // 重新編號
        options.forEach((o, i) => {
            o.optionOrder = i + 1;
        });
        setQuestions(updated);
    };

    // 更新選項
    const handleUpdateOption = (
        questionIndex: number,
        optionIndex: number,
        value: string
    ) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex].optionText = value;
        setQuestions(updated);
    };

    // 表單驗證
    const validateForm = (): string | null => {
        if (!title.trim()) return '請輸入問券標題';
        if (!examId) return '請選擇關聯的測驗';
        if (questions.length === 0) return '請至少新增一個題目';

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) {
                return `第 ${i + 1} 題的題目內容不能為空`;
            }

            if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
                if (q.options.length < 2) {
                    return `第 ${i + 1} 題至少需要 2 個選項`;
                }
                for (let j = 0; j < q.options.length; j++) {
                    if (!q.options[j].optionText.trim()) {
                        return `第 ${i + 1} 題的選項 ${j + 1} 不能為空`;
                    }
                }
            }
        }

        return null;
    };

    // 提交表單
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        try {
            setSubmitting(true);

            const surveyData = {
                examId: examId!,
                title: title.trim(),
                description: description.trim() || undefined,
                isAnonymous,
                questions: questions.map((q) => ({
                    id: q.id,
                    questionOrder: q.questionOrder,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    isRequired: q.isRequired,
                    maxRating: q.questionType === 'RATING' ? q.maxRating : undefined,
                    options:
                        q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE'
                            ? q.options
                            : undefined,
                })),
            };

            if (isEditMode && id) {
                await surveyApi.updateSurvey(parseInt(id), surveyData);
                alert('問券更新成功！');
            } else {
                await surveyApi.createSurvey(surveyData);
                alert('問券建立成功！');
            }

            navigate('/surveys');
        } catch (err) {
            console.error('儲存問券失敗:', err);
            alert('儲存問券失敗');
        } finally {
            setSubmitting(false);
        }
    };

    // 題目類型選項
    const questionTypes: { value: SurveyQuestionType; label: string }[] = [
        { value: SurveyQuestionType.SINGLE_CHOICE, label: '單選題' },
        { value: SurveyQuestionType.MULTIPLE_CHOICE, label: '多選題' },
        { value: SurveyQuestionType.TEXT, label: '文字題' },
        { value: SurveyQuestionType.RATING, label: '評分題' },
    ];

    // 樣式
    const styles: Record<string, React.CSSProperties> = {
        container: {
            minHeight: '100vh',
            padding: '24px',
            position: 'relative',
        },
        content: {
            maxWidth: '900px',
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
            marginBottom: '24px',
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
        textarea: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'white',
            color: currentTheme.text,
            fontSize: '1rem',
            minHeight: '80px',
            resize: 'vertical' as const,
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
        checkbox: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        questionCard: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 1)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            border: `1px solid ${currentTheme.border}`,
        },
        questionHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
        },
        questionNumber: {
            fontWeight: '600',
            color: currentTheme.primary,
            fontSize: '1.1rem',
        },
        removeButton: {
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
        },
        optionRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
        },
        optionInput: {
            flex: 1,
            padding: '10px',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
            color: currentTheme.text,
            fontSize: '0.95rem',
        },
        smallButton: {
            padding: '6px 10px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
        },
        addButton: {
            padding: '12px 24px',
            backgroundColor: currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            marginTop: '16px',
        },
        submitButton: {
            padding: '14px 32px',
            backgroundColor: currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            marginTop: '24px',
        },
        row: {
            display: 'flex',
            gap: '16px',
        },
        halfWidth: {
            flex: 1,
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
                        {isEditMode ? '📝 編輯問券' : '📋 建立問券'}
                    </h1>
                    <button style={styles.backButton} onClick={() => navigate('/surveys')}>
                        ← 返回列表
                    </button>
                </header>

                {error && (
                    <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
                )}

                <form style={styles.form} onSubmit={handleSubmit}>
                    {/* 基本資訊 */}
                    <div style={styles.section}>
                        <label style={styles.label}>問券標題 *</label>
                        <input
                            style={styles.input}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="請輸入問券標題"
                            required
                        />
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>問券說明</label>
                        <textarea
                            style={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="請輸入問券說明（選填）"
                        />
                    </div>

                    <div style={styles.row}>
                        <div style={{ ...styles.section, ...styles.halfWidth }}>
                            <label style={styles.label}>關聯測驗 *</label>
                            <select
                                style={styles.select}
                                value={examId || ''}
                                onChange={(e) => setExamId(e.target.value ? parseInt(e.target.value) : null)}
                                required
                            >
                                <option value="">請選擇測驗</option>
                                {exams.map((exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ ...styles.section, ...styles.halfWidth }}>
                            <label style={styles.label}>匿名調查</label>
                            <div style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    id="isAnonymous"
                                />
                                <label htmlFor="isAnonymous" style={{ color: currentTheme.text }}>
                                    不記錄填寫者身份
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 題目列表 */}
                    <div style={styles.section}>
                        <h2 style={{ ...styles.label, fontSize: '1.2rem', marginBottom: '16px' }}>
                            題目列表 ({questions.length} 題)
                        </h2>

                        {questions.map((question, qIndex) => (
                            <div key={qIndex} style={styles.questionCard}>
                                <div style={styles.questionHeader}>
                                    <span style={styles.questionNumber}>第 {qIndex + 1} 題</span>
                                    <button
                                        type="button"
                                        style={styles.removeButton}
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                    >
                                        刪除
                                    </button>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <input
                                        style={styles.input}
                                        type="text"
                                        value={question.questionText}
                                        onChange={(e) =>
                                            handleUpdateQuestion(qIndex, 'questionText', e.target.value)
                                        }
                                        placeholder="請輸入題目內容"
                                    />
                                </div>

                                <div style={styles.row}>
                                    <div style={styles.halfWidth}>
                                        <label style={{ ...styles.label, fontSize: '0.9rem' }}>題目類型</label>
                                        <select
                                            style={styles.select}
                                            value={question.questionType}
                                            onChange={(e) =>
                                                handleUpdateQuestion(qIndex, 'questionType', e.target.value)
                                            }
                                        >
                                            {questionTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={styles.halfWidth}>
                                        <label style={{ ...styles.label, fontSize: '0.9rem' }}>必填</label>
                                        <div style={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={question.isRequired}
                                                onChange={(e) =>
                                                    handleUpdateQuestion(qIndex, 'isRequired', e.target.checked)
                                                }
                                                id={`required-${qIndex}`}
                                            />
                                            <label
                                                htmlFor={`required-${qIndex}`}
                                                style={{ color: currentTheme.text }}
                                            >
                                                此題必填
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* 評分題的最大分數 */}
                                {question.questionType === 'RATING' && (
                                    <div style={{ marginTop: '12px' }}>
                                        <label style={{ ...styles.label, fontSize: '0.9rem' }}>最大分數</label>
                                        <select
                                            style={{ ...styles.select, width: '120px' }}
                                            value={question.maxRating}
                                            onChange={(e) =>
                                                handleUpdateQuestion(qIndex, 'maxRating', parseInt(e.target.value))
                                            }
                                        >
                                            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                                <option key={n} value={n}>{n} 分</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* 選擇題的選項 */}
                                {(question.questionType === 'SINGLE_CHOICE' ||
                                    question.questionType === 'MULTIPLE_CHOICE') && (
                                        <div style={{ marginTop: '16px' }}>
                                            <label style={{ ...styles.label, fontSize: '0.9rem' }}>選項</label>
                                            {question.options.map((option, oIndex) => (
                                                <div key={oIndex} style={styles.optionRow}>
                                                    <span style={{ color: currentTheme.textSecondary, width: '24px' }}>
                                                        {oIndex + 1}.
                                                    </span>
                                                    <input
                                                        style={styles.optionInput}
                                                        type="text"
                                                        value={option.optionText}
                                                        onChange={(e) =>
                                                            handleUpdateOption(qIndex, oIndex, e.target.value)
                                                        }
                                                        placeholder={`選項 ${oIndex + 1}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        style={{
                                                            ...styles.smallButton,
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                        }}
                                                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                style={{
                                                    ...styles.smallButton,
                                                    backgroundColor: currentTheme.primary,
                                                    color: 'white',
                                                    marginTop: '8px',
                                                }}
                                                onClick={() => handleAddOption(qIndex)}
                                            >
                                                + 新增選項
                                            </button>
                                        </div>
                                    )}
                            </div>
                        ))}

                        <button type="button" style={styles.addButton} onClick={handleAddQuestion}>
                            + 新增題目
                        </button>
                    </div>

                    {/* 提交按鈕 */}
                    <button type="submit" style={styles.submitButton} disabled={submitting}>
                        {submitting ? '儲存中...' : isEditMode ? '更新問券' : '建立問券'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SurveyCreator;
