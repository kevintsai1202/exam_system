/**
 * 題目卡片元件
 *
 * 顯示測驗題目與相關資訊
 */

import React from 'react';
import type { Question } from '../types';

/**
 * 題目卡片 Props 介面
 */
interface QuestionCardProps {
  question: Question;                     // 題目資料
  questionIndex?: number;                 // 題目索引（從 0 開始）
  totalQuestions?: number;                // 總題目數
  showOrder?: boolean;                    // 是否顯示題號（預設 true）
  showCorrectAnswer?: boolean;            // 是否顯示正確答案（預設 false）
  highlightCorrect?: boolean;             // 是否高亮正確答案（預設 false）
}

/**
 * 題目卡片元件
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  showOrder = true,
  showCorrectAnswer = false,
  highlightCorrect = false,
}) => {
  const displayIndex = questionIndex !== undefined ? questionIndex + 1 : question.questionOrder;

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
      }}
    >
      {/* 題號標題 */}
      {showOrder && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1976d2',
            }}
          >
            第 {displayIndex} 題
            {totalQuestions && (
              <span style={{ color: '#666', fontWeight: '400' }}>
                {' '}
                / 共 {totalQuestions} 題
              </span>
            )}
          </div>

          {/* 圖表類型標籤 */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <span
              style={{
                padding: '4px 8px',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '4px',
                fontWeight: '500',
              }}
            >
              統計圖表: {question.chartType === 'BAR' ? '長條圖' : '圓餅圖'}
            </span>
          </div>
        </div>
      )}

      {/* 題目內容 */}
      <div
        style={{
          fontSize: '20px',
          fontWeight: '500',
          color: '#333',
          lineHeight: '1.6',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          borderLeft: '4px solid #1976d2',
        }}
      >
        {question.questionText}
      </div>

      {/* 選項列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {question.options
          .sort((a, b) => a.optionOrder - b.optionOrder)
          .map((option) => {
            const isCorrect = option.id === question.correctOptionId;
            const shouldHighlight = highlightCorrect && isCorrect;

            return (
              <div
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  backgroundColor: shouldHighlight ? '#e8f5e9' : '#fff',
                  border: shouldHighlight
                    ? '2px solid #4caf50'
                    : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* 選項編號 */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: shouldHighlight ? '#4caf50' : '#f5f5f5',
                    color: shouldHighlight ? '#fff' : '#666',
                    borderRadius: '50%',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginRight: '12px',
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + option.optionOrder - 1)}
                </div>

                {/* 選項文字 */}
                <div
                  style={{
                    flex: 1,
                    fontSize: '16px',
                    color: shouldHighlight ? '#2e7d32' : '#333',
                    fontWeight: shouldHighlight ? '500' : '400',
                  }}
                >
                  {option.optionText}
                </div>

                {/* 正確答案標記 */}
                {showCorrectAnswer && isCorrect && (
                  <div
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginLeft: '12px',
                    }}
                  >
                    ✓ 正確答案
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default QuestionCard;
