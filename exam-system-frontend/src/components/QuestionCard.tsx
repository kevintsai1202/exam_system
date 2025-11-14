/**
 * 題目卡片元件
 *
 * 顯示測驗題目與相關資訊
 */

import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        duration: 0.6,
      }}
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
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
          </motion.div>

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
              單題: {question.singleStatChartType === 'BAR' ? '長條圖' : '圓餅圖'}
            </span>
            <span
              style={{
                padding: '4px 8px',
                backgroundColor: '#f3e5f5',
                color: '#7b1fa2',
                borderRadius: '4px',
                fontWeight: '500',
              }}
            >
              累積: {question.cumulativeChartType === 'BAR' ? '長條圖' : '圓餅圖'}
            </span>
          </div>
        </div>
      )}

      {/* 題目內容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
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
      </motion.div>

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
          .map((option, index) => {
            const isCorrect = option.id === question.correctOptionId;
            const shouldHighlight = highlightCorrect && isCorrect;

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.5 + index * 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                whileHover={{ scale: 1.02, x: 5 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  backgroundColor: shouldHighlight ? '#e8f5e9' : '#fff',
                  border: shouldHighlight
                    ? '2px solid #4caf50'
                    : '1px solid #e0e0e0',
                  borderRadius: '8px',
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
              </motion.div>
            );
          })}
      </div>
    </motion.div>
  );
};

export default QuestionCard;
