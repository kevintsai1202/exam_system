import React, { useEffect, useState } from 'react';
import { tierQuotaApi } from '../services/apiService';
import type { QuotaSnapshot } from '../types';
import QuotaProgressBar from '../components/QuotaProgressBar';

/** 維度的中文顯示名稱 */
const DIMENSION_LABELS: Record<string, string> = {
  MEMBER_COUNT: '會員數',
  MONTHLY_SEND: '本期寄送量',
  AI_QUESTION_GEN: 'AI 出題',
  AI_DATA_ANALYSIS: 'AI 數據分析',
  AI_NEWSLETTER_GEN: 'AI 電子報生成',
  ACTIVE_CAMPAIGNS: '進行中活動',
  SURVEY_COUNT: '問卷數',
};

/**
 * 講師配額儀表板
 * 顯示當前 tier、當期區間、剩餘天數、7 個維度的使用量
 */
const InstructorQuotaDashboard: React.FC = () => {
  const [snapshot, setSnapshot] = useState<QuotaSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tierQuotaApi.fetchSnapshot()
      .then(setSnapshot)
      .catch((err: Error) => setError(err.message ?? '載入失敗'));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!snapshot) return <div style={{ padding: 24 }}>載入中...</div>;

  return (
    <div className="quota-dashboard">
      <header className="quota-header">
        <h2>配額儀表板</h2>
        <div
          className="tier-badge"
          style={{
            background: snapshot.tier === 'PAID' ? '#dbeafe' : '#f3f4f6',
            color: snapshot.tier === 'PAID' ? '#1e40af' : '#374151',
          }}
        >
          {snapshot.tier === 'PAID' ? '付費版 PAID' : '免費版 FREE'}
        </div>
      </header>

      <div className="period-info">
        <span>當期：{snapshot.periodStart} ~ {snapshot.periodEnd}</span>
        <span>距下次重置：{snapshot.daysUntilReset} 天</span>
      </div>

      <div className="quota-list">
        {snapshot.items.map(item => (
          <QuotaProgressBar
            key={item.dimension}
            label={DIMENSION_LABELS[item.dimension] ?? item.dimension}
            used={item.used}
            limit={item.limit}
            resetPeriod={item.resetPeriod}
          />
        ))}
      </div>

      {snapshot.tier === 'FREE' && (
        <div className="upgrade-cta">
          <strong>需要更多配額？</strong>
          <p>請聯絡管理員升級 PAID 帳號，可解鎖 AI 功能、廣告活動與更高寄送量。</p>
        </div>
      )}
    </div>
  );
};

export default InstructorQuotaDashboard;
