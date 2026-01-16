/**
 * 問券統計頁面
 *
 * 顯示問券回覆統計資料
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surveyApi } from '../services/surveyApiService';
import type { SurveyStatistics, SurveyQuestionStatistics, SurveyQuestionType } from '../types';

import { useThemeStore, themes } from '../store/themeStore';

/**
 * 問券統計頁面組件
 */
const SurveyStats: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { mode: theme, isDark: isDarkFn } = useThemeStore();
    const isDark = isDarkFn();
    const currentTheme = themes[theme];

    // 狀態
    const [statistics, setStatistics] = useState<SurveyStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 載入統計資料
    useEffect(() => {
        if (!id) return;

        const loadStatistics = async () => {
            try {
                setLoading(true);
                const data = await surveyApi.getSurveyStatistics(parseInt(id));
                setStatistics(data);
            } catch (err) {
                console.error('載入統計資料失敗:', err);
                setError('無法載入統計資料');
            } finally {
                setLoading(false);
            }
        };

        loadStatistics();
    }, [id]);

    // 取得題目類型文字
    const getQuestionTypeText = (type: SurveyQuestionType): string => {
        switch (type) {
            case 'SINGLE_CHOICE': return '單選題';
            case 'MULTIPLE_CHOICE': return '多選題';
            case 'TEXT': return '文字題';
            case 'RATING': return '評分題';
            default: return type;
        }
    };

    // 渲染選項分布圖表
    const renderOptionDistribution = (question: SurveyQuestionStatistics) => {
        if (!question.optionDistribution) return null;

        const options = Object.values(question.optionDistribution);
        const maxCount = Math.max(...options.map(o => o.count), 1);

        return (
            <div style={{ marginTop: '12px' }}>
                {options.map((option) => (
                    <div key={option.optionId} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: currentTheme.text, fontSize: '0.9rem' }}>
                                {option.optionText}
                            </span>
                            <span style={{ color: currentTheme.textSecondary, fontSize: '0.85rem' }}>
                                {option.count} ({option.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div style={{
                            height: '20px',
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(226, 232, 240, 1)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${(option.count / maxCount) * 100}%`,
                                backgroundColor: currentTheme.primary,
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // 渲染評分統計
    const renderRatingStatistics = (question: SurveyQuestionStatistics) => {
        if (!question.ratingStatistics) return null;

        const { averageRating, maxRating, distribution } = question.ratingStatistics;

        return (
            <div style={{ marginTop: '12px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px',
                }}>
                    <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: currentTheme.primary,
                    }}>
                        {averageRating.toFixed(1)}
                    </div>
                    <div style={{ color: currentTheme.textSecondary }}>
                        <div>平均分數</div>
                        <div style={{ fontSize: '0.85rem' }}>滿分 {maxRating} 分</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    {Object.entries(distribution || {}).map(([rating, count]) => (
                        <div key={rating} style={{ textAlign: 'center' }}>
                            <div style={{
                                height: `${Math.max((count as number) * 20, 4)}px`,
                                width: '40px',
                                backgroundColor: currentTheme.primary,
                                borderRadius: '4px 4px 0 0',
                                marginBottom: '4px',
                            }} />
                            <div style={{ color: currentTheme.text, fontSize: '0.85rem' }}>{rating}分</div>
                            <div style={{ color: currentTheme.textSecondary, fontSize: '0.75rem' }}>
                                {count as number}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 渲染文字回答
    const renderTextAnswers = (question: SurveyQuestionStatistics) => {
        if (!question.textAnswers || question.textAnswers.length === 0) {
            return (
                <p style={{ color: currentTheme.textSecondary, fontStyle: 'italic', marginTop: '12px' }}>
                    尚無回答
                </p>
            );
        }

        return (
            <div style={{ marginTop: '12px' }}>
                {question.textAnswers.slice(0, 10).map((answer, index) => (
                    <div key={index} style={{
                        padding: '12px',
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 1)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        color: currentTheme.text,
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                    }}>
                        {answer}
                    </div>
                ))}
                {question.textAnswers.length > 10 && (
                    <p style={{ color: currentTheme.textSecondary, fontSize: '0.85rem' }}>
                        還有 {question.textAnswers.length - 10} 則回答...
                    </p>
                )}
            </div>
        );
    };

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
        subtitle: {
            color: currentTheme.textSecondary,
            marginTop: '4px',
            fontSize: '0.9rem',
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
        summaryCard: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${currentTheme.border}`,
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
        },
        summaryItem: {
            textAlign: 'center' as const,
        },
        summaryValue: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: currentTheme.primary,
        },
        summaryLabel: {
            color: currentTheme.textSecondary,
            marginTop: '4px',
        },
        questionCard: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${currentTheme.border}`,
            marginBottom: '16px',
        },
        questionHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
        },
        questionNumber: {
            color: currentTheme.primary,
            fontWeight: '600',
            fontSize: '0.9rem',
            marginBottom: '4px',
        },
        questionText: {
            color: currentTheme.text,
            fontSize: '1.1rem',
            fontWeight: '500',
        },
        questionType: {
            padding: '4px 12px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(226, 232, 240, 1)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: currentTheme.textSecondary,
        },
        answersCount: {
            color: currentTheme.textSecondary,
            fontSize: '0.85rem',
            marginTop: '4px',
        },
        loadingText: {
            textAlign: 'center' as const,
            color: currentTheme.text,
            fontSize: '1.2rem',
            padding: '48px',
        },
        errorText: {
            textAlign: 'center' as const,
            color: '#ef4444',
            fontSize: '1.2rem',
            padding: '48px',
        },
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.content}>
                    <p style={styles.loadingText}>載入中...</p>
                </div>
            </div>
        );
    }

    if (error || !statistics) {
        return (
            <div style={styles.container}>
                <div style={styles.content}>
                    <p style={styles.errorText}>{error || '無法載入統計資料'}</p>
                    <div style={{ textAlign: 'center' }}>
                        <button style={styles.backButton} onClick={() => navigate('/surveys')}>
                            ← 返回列表
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>📊 {statistics.surveyTitle}</h1>
                        <p style={styles.subtitle}>問券統計報告</p>
                    </div>
                    <button style={styles.backButton} onClick={() => navigate('/surveys')}>
                        ← 返回列表
                    </button>
                </header>

                {/* 摘要卡片 */}
                <div style={styles.summaryCard}>
                    <div style={styles.summaryItem}>
                        <div style={styles.summaryValue}>{statistics.totalResponses}</div>
                        <div style={styles.summaryLabel}>總回覆數</div>
                    </div>
                    <div style={styles.summaryItem}>
                        <div style={styles.summaryValue}>{statistics.questionStatistics.length}</div>
                        <div style={styles.summaryLabel}>題目數</div>
                    </div>
                </div>

                {/* 各題統計 */}
                {statistics.questionStatistics.map((question, index) => (
                    <div key={question.questionId} style={styles.questionCard}>
                        <div style={styles.questionHeader}>
                            <div>
                                <div style={styles.questionNumber}>第 {index + 1} 題</div>
                                <div style={styles.questionText}>{question.questionText}</div>
                                <div style={styles.answersCount}>
                                    {question.totalAnswers} 則回答
                                </div>
                            </div>
                            <span style={styles.questionType}>
                                {getQuestionTypeText(question.questionType)}
                            </span>
                        </div>

                        {/* 根據題型渲染不同的統計圖表 */}
                        {(question.questionType === 'SINGLE_CHOICE' ||
                            question.questionType === 'MULTIPLE_CHOICE') &&
                            renderOptionDistribution(question)}

                        {question.questionType === 'RATING' && renderRatingStatistics(question)}

                        {question.questionType === 'TEXT' && renderTextAnswers(question)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SurveyStats;
