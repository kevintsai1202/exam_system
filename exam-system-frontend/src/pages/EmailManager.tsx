/**
 * 郵件活動管理頁面
 *
 * 顯示郵件活動列表與操作入口
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailCampaignApi } from '../services/emailApiService';
import type { EmailCampaign, CampaignStatus } from '../types';
import { useThemeStore, themes } from '../store/themeStore';

/**
 * 郵件活動管理頁面組件
 */
const EmailManager: React.FC = () => {
    const navigate = useNavigate();
    const { mode: theme, isDark: isDarkFn } = useThemeStore();
    const isDark = isDarkFn();
    const currentTheme = themes[theme];

    // 狀態
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 載入活動列表
    const loadCampaigns = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await emailCampaignApi.getAllCampaigns();
            setCampaigns(data);
        } catch (err) {
            console.error('載入郵件活動列表失敗:', err);
            setError('無法載入郵件活動列表');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    // 建立新活動
    const handleCreateCampaign = () => {
        navigate('/emails/new');
    };

    // 編輯活動
    const handleEditCampaign = (campaignId: number) => {
        navigate(`/emails/${campaignId}/edit`);
    };

    // 發送活動
    const handleSendCampaign = async (campaignId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!confirm('確定要發送此郵件活動嗎？')) return;
        try {
            await emailCampaignApi.sendCampaign(campaignId);
            alert('郵件活動已開始發送！');
            loadCampaigns();
        } catch (err) {
            console.error('發送郵件活動失敗:', err);
            alert('發送郵件活動失敗');
        }
    };

    // 刪除活動
    const handleDeleteCampaign = async (campaignId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!confirm('確定要刪除此郵件活動嗎？')) return;
        try {
            await emailCampaignApi.deleteCampaign(campaignId);
            loadCampaigns();
        } catch (err) {
            console.error('刪除郵件活動失敗:', err);
            alert('刪除郵件活動失敗');
        }
    };

    // 取得狀態樣式
    const getStatusStyle = (status: CampaignStatus): React.CSSProperties => {
        switch (status) {
            case 'DRAFT':
                return { backgroundColor: '#6b7280', color: 'white' };
            case 'SCHEDULED':
                return { backgroundColor: '#f59e0b', color: 'white' };
            case 'SENDING':
                return { backgroundColor: '#3b82f6', color: 'white' };
            case 'SENT':
                return { backgroundColor: '#10b981', color: 'white' };
            case 'FAILED':
                return { backgroundColor: '#ef4444', color: 'white' };
            default:
                return { backgroundColor: '#6b7280', color: 'white' };
        }
    };

    // 取得狀態文字
    const getStatusText = (status: CampaignStatus): string => {
        switch (status) {
            case 'DRAFT':
                return '草稿';
            case 'SCHEDULED':
                return '已排程';
            case 'SENDING':
                return '發送中';
            case 'SENT':
                return '已發送';
            case 'FAILED':
                return '發送失敗';
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
        cardSubject: {
            color: currentTheme.textSecondary,
            fontSize: '0.9rem',
            marginBottom: '12px',
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
        progressBar: {
            height: '8px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(226, 232, 240, 1)',
            borderRadius: '4px',
            marginTop: '12px',
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            backgroundColor: '#10b981',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <header style={styles.header}>
                    <h1 style={styles.title}>✉️ 郵件管理</h1>
                    <div style={styles.headerButtons}>
                        <button style={styles.backButton} onClick={() => navigate('/instructor')}>
                            ← 返回主控台
                        </button>
                        <button style={styles.createButton} onClick={handleCreateCampaign}>
                            + 建立郵件活動
                        </button>
                    </div>
                </header>

                {loading && <p style={styles.loadingText}>載入中...</p>}
                {error && <p style={styles.errorText}>{error}</p>}
                {!loading && !error && campaigns.length === 0 && (
                    <p style={styles.emptyText}>尚無郵件活動，點擊「建立郵件活動」開始建立</p>
                )}

                <div style={styles.grid}>
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            style={styles.card}
                            onClick={() => handleEditCampaign(campaign.id)}
                        >
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>{campaign.name}</h3>
                                <span
                                    style={{
                                        ...styles.statusBadge,
                                        ...getStatusStyle(campaign.status),
                                    }}
                                >
                                    {getStatusText(campaign.status)}
                                </span>
                            </div>

                            <p style={styles.cardSubject}>📧 {campaign.subject}</p>

                            <div style={styles.cardMeta}>
                                <span>👥 {campaign.totalRecipients || 0} 收件人</span>
                                {campaign.examTitle && <span>🔗 {campaign.examTitle}</span>}
                            </div>

                            {/* 發送進度 */}
                            {(campaign.status === 'SENDING' || campaign.status === 'SENT') && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#10b981' }}>✓ {campaign.sentCount || 0}</span>
                                        {(campaign.failedCount || 0) > 0 && (
                                            <span style={{ color: '#ef4444' }}>✗ {campaign.failedCount}</span>
                                        )}
                                    </div>
                                    <div style={styles.progressBar}>
                                        <div
                                            style={{
                                                ...styles.progressFill,
                                                width: `${((campaign.sentCount || 0) / (campaign.totalRecipients || 1)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={styles.cardActions}>
                                {campaign.status === 'DRAFT' && (
                                    <>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                            }}
                                            onClick={(e) => handleSendCampaign(campaign.id, e)}
                                        >
                                            發送
                                        </button>
                                        <button
                                            style={{
                                                ...styles.actionButton,
                                                backgroundColor: currentTheme.primary,
                                                color: 'white',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCampaign(campaign.id);
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
                                            onClick={(e) => handleDeleteCampaign(campaign.id, e)}
                                        >
                                            刪除
                                        </button>
                                    </>
                                )}
                                {campaign.status === 'SENDING' && (
                                    <span style={{ color: currentTheme.textSecondary, fontSize: '0.85rem' }}>
                                        發送中...
                                    </span>
                                )}
                                {campaign.status === 'SENT' && (
                                    <button
                                        style={{
                                            ...styles.actionButton,
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                        }}
                                        onClick={(e) => handleDeleteCampaign(campaign.id, e)}
                                    >
                                        刪除
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmailManager;
