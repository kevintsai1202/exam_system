/**
 * 問券填寫頁面
 *
 * 讓學員填寫問券
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { surveyApi } from '../services/surveyApiService';
import type { Survey, SurveyAnswer } from '../types';

import { useThemeStore, themes } from '../store/themeStore';

/**
 * 問券填寫頁面組件
 */
const SurveyResponse: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { mode: theme, isDark: isDarkFn } = useThemeStore();
    const isDark = isDarkFn();
    const currentTheme = themes[theme];

    // 狀態
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [answers, setAnswers] = useState<Record<number, SurveyAnswer>>({});
    const [responderName, setResponderName] = useState('');
    const [responderEmail, setResponderEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // 載入問券
    useEffect(() => {
        if (!id) return;

        const loadSurvey = async () => {
            try {
                setLoading(true);
                const data = await surveyApi.getSurvey(parseInt(id));
                setSurvey(data);

                // 初始化答案
                if (data.questions) {
                    const initialAnswers: Record<number, SurveyAnswer> = {};
                    data.questions.forEach((q) => {
                        initialAnswers[q.id!] = {
                            questionId: q.id!,
                        };
                    });
                    setAnswers(initialAnswers);
                }
            } catch (err) {
                console.error('載入問券失敗:', err);
                setError('無法載入問券');
            } finally {
                setLoading(false);
            }
        };

        loadSurvey();
    }, [id]);

    // 更新單選題答案
    const handleSingleChoice = (questionId: number, optionId: number) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                questionId,
                selectedOptionId: optionId,
            },
        }));
    };

    // 更新多選題答案
    const handleMultipleChoice = (questionId: number, optionId: number, checked: boolean) => {
        setAnswers((prev) => {
            const current = prev[questionId]?.multipleOptionIds || [];
            const updated = checked
                ? [...current, optionId]
                : current.filter((id) => id !== optionId);
            return {
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    questionId,
                    multipleOptionIds: updated,
                },
            };
        });
    };

    // 更新文字題答案
    const handleTextAnswer = (questionId: number, text: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                questionId,
                textAnswer: text,
            },
        }));
    };

    // 更新評分題答案
    const handleRatingAnswer = (questionId: number, rating: number) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                questionId,
                ratingValue: rating,
            },
        }));
    };

    // 驗證表單
    const validateForm = (): string | null => {
        if (!survey?.questions) return null;

        if (!survey.isAnonymous) {
            if (!responderName.trim()) return '請輸入您的姓名';
            if (!responderEmail.trim()) return '請輸入您的 Email';
        }

        for (const question of survey.questions) {
            if (question.isRequired) {
                const answer = answers[question.id!];
                if (!answer) return `第 ${question.questionOrder} 題為必填`;

                switch (question.questionType) {
                    case 'SINGLE_CHOICE':
                        if (!answer.selectedOptionId) {
                            return `第 ${question.questionOrder} 題為必填`;
                        }
                        break;
                    case 'MULTIPLE_CHOICE':
                        if (!answer.multipleOptionIds || answer.multipleOptionIds.length === 0) {
                            return `第 ${question.questionOrder} 題為必填`;
                        }
                        break;
                    case 'TEXT':
                        if (!answer.textAnswer?.trim()) {
                            return `第 ${question.questionOrder} 題為必填`;
                        }
                        break;
                    case 'RATING':
                        if (!answer.ratingValue) {
                            return `第 ${question.questionOrder} 題為必填`;
                        }
                        break;
                }
            }
        }

        return null;
    };

    // 提交問券
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        try {
            setSubmitting(true);

            await surveyApi.submitResponse(parseInt(id!), {
                responderName: responderName.trim() || undefined,
                responderEmail: responderEmail.trim() || undefined,
                answers: Object.values(answers),
            });

            setSubmitted(true);
        } catch (err: any) {
            console.error('提交問券失敗:', err);
            alert(err.response?.data?.message || '提交問券失敗');
        } finally {
            setSubmitting(false);
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
            maxWidth: '700px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 10,
        },
        header: {
            textAlign: 'center' as const,
            marginBottom: '24px',
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: currentTheme.text,
            marginBottom: '8px',
        },
        description: {
            color: currentTheme.textSecondary,
            lineHeight: 1.6,
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
            minHeight: '100px',
            resize: 'vertical' as const,
            boxSizing: 'border-box' as const,
        },
        questionCard: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 1)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            border: `1px solid ${currentTheme.border}`,
        },
        questionText: {
            color: currentTheme.text,
            fontSize: '1.05rem',
            fontWeight: '500',
            marginBottom: '12px',
        },
        required: {
            color: '#ef4444',
            marginLeft: '4px',
        },
        optionLabel: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '8px',
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'white',
            border: `1px solid ${currentTheme.border}`,
            color: currentTheme.text,
            transition: 'all 0.2s ease',
        },
        ratingContainer: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap' as const,
        },
        ratingButton: {
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            border: `2px solid ${currentTheme.border}`,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'white',
            color: currentTheme.text,
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        ratingButtonActive: {
            backgroundColor: currentTheme.primary,
            borderColor: currentTheme.primary,
            color: 'white',
        },
        submitButton: {
            width: '100%',
            padding: '14px',
            backgroundColor: currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1.1rem',
            marginTop: '16px',
        },
        successCard: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderRadius: '12px',
            padding: '48px 24px',
            border: `1px solid ${currentTheme.border}`,
            textAlign: 'center' as const,
        },
        successTitle: {
            fontSize: '2rem',
            color: '#10b981',
            marginBottom: '16px',
        },
        successText: {
            color: currentTheme.text,
            fontSize: '1.1rem',
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

    if (error || !survey) {
        return (
            <div style={styles.container}>

                <div style={styles.content}>
                    <p style={{ color: '#ef4444', textAlign: 'center', padding: '48px' }}>
                        {error || '無法載入問券'}
                    </p>
                </div>
            </div>
        );
    }

    if (survey.status !== 'ACTIVE') {
        return (
            <div style={styles.container}>

                <div style={styles.content}>
                    <div style={styles.successCard}>
                        <h2 style={{ ...styles.successTitle, color: '#f59e0b' }}>⚠️</h2>
                        <p style={styles.successText}>此問券目前未開放填寫</p>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={styles.container}>

                <div style={styles.content}>
                    <div style={styles.successCard}>
                        <h2 style={styles.successTitle}>✓ 感謝您的填寫！</h2>
                        <p style={styles.successText}>您的回覆已成功送出</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>

            <div style={styles.content}>
                <header style={styles.header}>
                    <h1 style={styles.title}>{survey.title}</h1>
                    {survey.description && <p style={styles.description}>{survey.description}</p>}
                </header>

                <form style={styles.form} onSubmit={handleSubmit}>
                    {/* 填寫者資訊（非匿名） */}
                    {!survey.isAnonymous && (
                        <>
                            <div style={styles.section}>
                                <label style={styles.label}>
                                    您的姓名 <span style={styles.required}>*</span>
                                </label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    value={responderName}
                                    onChange={(e) => setResponderName(e.target.value)}
                                    placeholder="請輸入您的姓名"
                                    required
                                />
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>
                                    您的 Email <span style={styles.required}>*</span>
                                </label>
                                <input
                                    style={styles.input}
                                    type="email"
                                    value={responderEmail}
                                    onChange={(e) => setResponderEmail(e.target.value)}
                                    placeholder="請輸入您的 Email"
                                    required
                                />
                            </div>
                            <hr style={{ borderColor: currentTheme.border, marginBottom: '24px' }} />
                        </>
                    )}

                    {/* 題目列表 */}
                    {survey.questions?.map((question, index) => (
                        <div key={question.id} style={styles.questionCard}>
                            <div style={styles.questionText}>
                                {index + 1}. {question.questionText}
                                {question.isRequired && <span style={styles.required}>*</span>}
                            </div>

                            {/* 單選題 */}
                            {question.questionType === 'SINGLE_CHOICE' &&
                                question.options?.map((option) => (
                                    <label key={option.id} style={styles.optionLabel}>
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={answers[question.id!]?.selectedOptionId === option.id}
                                            onChange={() => handleSingleChoice(question.id!, option.id!)}
                                        />
                                        {option.optionText}
                                    </label>
                                ))}

                            {/* 多選題 */}
                            {question.questionType === 'MULTIPLE_CHOICE' &&
                                question.options?.map((option) => (
                                    <label key={option.id} style={styles.optionLabel}>
                                        <input
                                            type="checkbox"
                                            checked={answers[question.id!]?.multipleOptionIds?.includes(option.id!) || false}
                                            onChange={(e) =>
                                                handleMultipleChoice(question.id!, option.id!, e.target.checked)
                                            }
                                        />
                                        {option.optionText}
                                    </label>
                                ))}

                            {/* 文字題 */}
                            {question.questionType === 'TEXT' && (
                                <textarea
                                    style={styles.textarea}
                                    value={answers[question.id!]?.textAnswer || ''}
                                    onChange={(e) => handleTextAnswer(question.id!, e.target.value)}
                                    placeholder="請輸入您的回答"
                                />
                            )}

                            {/* 評分題 */}
                            {question.questionType === 'RATING' && (
                                <div style={styles.ratingContainer}>
                                    {Array.from({ length: question.maxRating || 5 }, (_, i) => i + 1).map(
                                        (rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                style={{
                                                    ...styles.ratingButton,
                                                    ...(answers[question.id!]?.ratingValue === rating
                                                        ? styles.ratingButtonActive
                                                        : {}),
                                                }}
                                                onClick={() => handleRatingAnswer(question.id!, rating)}
                                            >
                                                {rating}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    <button type="submit" style={styles.submitButton} disabled={submitting}>
                        {submitting ? '提交中...' : '提交問券'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SurveyResponse;
