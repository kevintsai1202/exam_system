/**
 * 問券管理頁面
 *
 * 顯示問券列表與操作入口
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../services/surveyApiService';
import type { Survey, SurveyStatus } from '../types';
import { useThemeStore, themes } from '../store/themeStore';

/**
 * 問券管理頁面組件
 */
const SurveyManager: React.FC = () => {
    const navigate = useNavigate();
    const { mode: theme, isDark: isDarkFn } = useThemeStore();
    const isDark = isDarkFn();
    const currentTheme = themes[theme];

    // 狀態
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 載入問券列表
    const loadSurveys = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await surveyApi.getAllSurveys();
            setSurveys(data);
        } catch (err) {
            console.error('載入問券列表失敗:', err);
            setError('無法載入問券列表');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSurveys();
    }, []);

    // 建立新問券
    const handleCreateSurvey = () => {
        navigate('/surveys/new');
    };

    // 編輯問券
    const handleEditSurvey = (surveyId: number) => {
        navigate(`/surveys/${surveyId}/edit`);
    };

    // 檢視統計
    const handleViewStatistics = (surveyId: number) => {
        navigate(`/surveys/${surveyId}/statistics`);
    };

    // 啟用問券
    const handleActivateSurvey = async (surveyId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await surveyApi.activateSurvey(surveyId);
            loadSurveys();
        } catch (err) {
            console.error('啟用問券失敗:', err);
            alert('啟用問券失敗');
        }
    };

    // 關閉問券
    const handleCloseSurvey = async (surveyId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!confirm('確定要關閉此問券嗎？')) return;
        try {
            await surveyApi.closeSurvey(surveyId);
            loadSurveys();
        } catch (err) {
            console.error('關閉問券失敗:', err);
            alert('關閉問券失敗');
        }
    };

    // 刪除問券
    const handleDeleteSurvey = async (surveyId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!confirm('確定要刪除此問券嗎？此操作無法復原。')) return;
        try {
            await surveyApi.deleteSurvey(surveyId);
            loadSurveys();
        } catch (err) {
            console.error('刪除問券失敗:', err);
            alert('刪除問券失敗');
        }
    };

    // 取得狀態樣式
    const getStatusStyle = (status: SurveyStatus): React.CSSProperties => {
        switch (status) {
            case 'DRAFT':
                return { backgroundColor: '#6b7280', color: 'white' };
            case 'ACTIVE':
                return { backgroundColor: '#10b981', color: 'white' };
            case 'CLOSED':
                return { backgroundColor: '#ef4444', color: 'white' };
            default:
                return { backgroundColor: '#6b7280', color: 'white' };
        }
    };

    // 取得狀態文字
    const getStatusText = (status: SurveyStatus): string => {
        switch (status) {
            case 'DRAFT':
                return '草稿';
            case 'ACTIVE':
                return '進行中';
            case 'CLOSED':
                return '已關閉';
            default:
                return status;
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
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 10,
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
        },
        title: {
            fontSize: '2rem',
            fontWeight: 'bold',
            color: currentTheme.text,
            textShadow: isDark ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
        },
        headerButtons: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
        },
        createButton: {
            padding: '12px 24px',
            backgroundColor: currentTheme.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s ease',
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
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
        },
        card: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${currentTheme.border}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
        },
        cardTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            color: currentTheme.text,
            margin: 0,
        },
        statusBadge: {
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
        },
        cardDescription: {
            color: currentTheme.textSecondary,
            fontSize: '0.9rem',
            marginBottom: '12px',
            lineHeight: 1.5,
        },
        cardMeta: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            fontSize: '0.85rem',
            color: currentTheme.textSecondary,
        },
        cardActions: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap' as const,
        },
        actionButton: {
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
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
        emptyText: {
            textAlign: 'center' as const,
            color: currentTheme.textSecondary,
            fontSize: '1.2rem',
            padding: '48px',
        },
        examLink: {
            color: currentTheme.primary,
            fontSize: '0.85rem',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <header style={styles.header}>
                    <h1 style={styles.title}>📋 問券管理</h1>
                    <div style={styles.headerButtons}>
                        <button
                            style={styles.backButton}
                            onClick={() => navigate('/instructor')}
                        >
                            ← 返回主控台
                        </button>
                        <button
                            style={styles.createButton}
                            onClick={handleCreateSurvey}
                        >
                            + 建立問券
                        </button>
                    </div>
                </header>

                {loading && <p style={styles.loadingText}>載入中...</p>}
                {error && <p style={styles.errorText}>{error}</p>}
                {!loading && !error && surveys.length === 0 && (
                    <p style={styles.emptyText}>尚無問券，點擊「建立問券」開始建立</p>
                )}

                <div style={styles.grid}>
                    {surveys.map((survey) => (
                        <div
                            key={survey.id}
                            style={styles.card}
                            onClick={() => handleEditSurvey(survey.id)}
                        >
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>{survey.title}</h3>
                                <span
                                    style={{
                                        ...styles.statusBadge,
                                        ...getStatusStyle(survey.status),
                                    }}
                                >
                                    {getStatusText(survey.status)}
                                </span>
                            </div>

                            {survey.description && (
                                <p style={styles.cardDescription}>
                                    {survey.description.length > 100
                                        ? survey.description.substring(0, 100) + '...'
                                        : survey.description}
                                </p>
                            )}

                            <div style={styles.cardMeta}>
                                <span>📝 {survey.totalQuestions || 0} 題</span>
                                <span>📊 {survey.totalResponses || 0} 回覆</span>
                                {survey.examTitle && (
                                    <span style={styles.examLink}>
                                        🔗 {survey.examTitle}
                                    </span>
                                )}
                            </div>

                            <div style={styles.cardActions}>
                                {survey.status === 'DRAFT' && (
                                    <>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                            }}
                                            onClick={(e) => handleActivateSurvey(survey.id, e)}
                                        >
                                            啟用
                                        </button>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: currentTheme.primary,
                                                color: 'white',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSurvey(survey.id);
                                            }}
                                        >
                                            編輯
                                        </button>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                            }}
                                            onClick={(e) => handleDeleteSurvey(survey.id, e)}
                                        >
                                            刪除
                                        </button>
                                    </>
                                )}
                                {survey.status === 'ACTIVE' && (
                                    <>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: '#f59e0b',
                                                color: 'white',
                                            }}
                                            onClick={(e) => handleCloseSurvey(survey.id, e)}
                                        >
                                            關閉
                                        </button>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: currentTheme.primary,
                                                color: 'white',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewStatistics(survey.id);
                                            }}
                                        >
                                            統計
                                        </button>
                                    </>
                                )}
                                {survey.status === 'CLOSED' && (
                                    <>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: currentTheme.primary,
                                                color: 'white',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewStatistics(survey.id);
                                            }}
                                        >
                                            統計
                                        </button>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                            }}
                                            onClick={(e) => handleDeleteSurvey(survey.id, e)}
                                        >
                                            刪除
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SurveyManager;
