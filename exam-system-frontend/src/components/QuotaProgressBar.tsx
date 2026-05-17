import React from 'react';

interface Props {
  label: string;
  used: number;
  limit: number;
  resetPeriod: string;
}

/**
 * 配額進度條元件
 * limit=0 → 顯示「未開放」；>=80% → 紅；>=50% → 黃；else → 藍
 */
const QuotaProgressBar: React.FC<Props> = ({ label, used, limit, resetPeriod }) => {
  if (limit === 0) {
    return (
      <div className="quota-row">
        <div className="quota-label">{label}</div>
        <div className="quota-bar disabled">
          <span className="quota-text">未開放（升級 PAID 可用）</span>
        </div>
      </div>
    );
  }
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const color = percent >= 80 ? '#ef4444' : percent >= 50 ? '#f59e0b' : '#3b82f6';
  return (
    <div className="quota-row">
      <div className="quota-label">{label}</div>
      <div className="quota-bar">
        <div className="quota-fill" style={{ width: `${percent}%`, background: color }} />
        <span className="quota-text">
          {used.toLocaleString()} / {limit.toLocaleString()}
          {resetPeriod === 'MONTHLY' ? '（月度）' : '（永久）'}
        </span>
      </div>
    </div>
  );
};

export default QuotaProgressBar;
