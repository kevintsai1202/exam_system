/**
 * 選項按鈕元件
 *
 * 用於學員答題的選項按鈕
 */

import React from 'react';
import type { QuestionOption } from '../types';

/**
 * 選項按鈕 Props 介面
 */
interface OptionButtonProps {
  option: QuestionOption;                 // 選項資料
  isSelected?: boolean;                   // 是否已選擇
  isCorrect?: boolean;                    // 是否為正確答案（結果顯示時使用）
  isWrong?: boolean;                      // 是否為錯誤答案（結果顯示時使用）
  disabled?: boolean;                     // 是否禁用
  showResult?: boolean;                   // 是否顯示結果
  onClick?: () => void;                   // 點擊回調
  size?: 'small' | 'medium' | 'large';    // 按鈕大小（預設 'medium'）
}

/**
 * 選項按鈕元件
 */
export const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  disabled = false,
  showResult = false,
  onClick,
  size = 'medium',
}) => {
  /**
   * 取得按鈕樣式
   */
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: getPadding(),
      fontSize: getFontSize(),
      fontWeight: isSelected || showResult ? '600' : '400',
      border: '2px solid',
      borderRadius: '12px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      backgroundColor: '#fff',
      textAlign: 'left',
    };

    // 顯示結果模式
    if (showResult) {
      if (isCorrect) {
        return {
          ...baseStyle,
          backgroundColor: '#e8f5e9',
          borderColor: '#4caf50',
          color: '#2e7d32',
          cursor: 'default',
        };
      }
      if (isWrong) {
        return {
          ...baseStyle,
          backgroundColor: '#ffebee',
          borderColor: '#f44336',
          color: '#c62828',
          cursor: 'default',
        };
      }
      return {
        ...baseStyle,
        borderColor: '#e0e0e0',
        color: '#999',
        cursor: 'default',
      };
    }

    // 一般模式
    if (isSelected) {
      return {
        ...baseStyle,
        backgroundColor: '#e3f2fd',
        borderColor: '#1976d2',
        color: '#1565c0',
      };
    }

    if (disabled) {
      return {
        ...baseStyle,
        borderColor: '#e0e0e0',
        color: '#999',
        opacity: 0.6,
      };
    }

    return {
      ...baseStyle,
      borderColor: '#e0e0e0',
      color: '#333',
    };
  };

  /**
   * 取得 Padding
   */
  const getPadding = (): string => {
    switch (size) {
      case 'small':
        return '10px 14px';
      case 'large':
        return '18px 20px';
      case 'medium':
      default:
        return '14px 16px';
    }
  };

  /**
   * 取得字體大小
   */
  const getFontSize = (): string => {
    switch (size) {
      case 'small':
        return '14px';
      case 'large':
        return '20px';
      case 'medium':
      default:
        return '16px';
    }
  };

  /**
   * 取得選項標籤大小
   */
  const getLabelSize = (): string => {
    switch (size) {
      case 'small':
        return '28px';
      case 'large':
        return '40px';
      case 'medium':
      default:
        return '36px';
    }
  };

  /**
   * 取得選項標籤字體大小
   */
  const getLabelFontSize = (): string => {
    switch (size) {
      case 'small':
        return '14px';
      case 'large':
        return '18px';
      case 'medium':
      default:
        return '16px';
    }
  };

  /**
   * Hover 效果
   */
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !showResult) {
      e.currentTarget.style.backgroundColor = isSelected ? '#bbdefb' : '#f5f5f5';
      e.currentTarget.style.transform = 'translateX(4px)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !showResult) {
      e.currentTarget.style.backgroundColor = isSelected ? '#e3f2fd' : '#fff';
      e.currentTarget.style.transform = 'translateX(0)';
    }
  };

  const labelSize = getLabelSize();
  const labelFontSize = getLabelFontSize();

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={getButtonStyle()}
      disabled={disabled}
    >
      {/* 選項編號 */}
      <div
        style={{
          width: labelSize,
          height: labelSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: showResult
            ? isCorrect
              ? '#4caf50'
              : isWrong
              ? '#f44336'
              : '#e0e0e0'
            : isSelected
            ? '#1976d2'
            : '#f5f5f5',
          color: showResult
            ? isCorrect || isWrong
              ? '#fff'
              : '#999'
            : isSelected
            ? '#fff'
            : '#666',
          borderRadius: '50%',
          fontWeight: '700',
          fontSize: labelFontSize,
          marginRight: '12px',
          flexShrink: 0,
        }}
      >
        {String.fromCharCode(65 + option.optionOrder - 1)}
      </div>

      {/* 選項文字 */}
      <div style={{ flex: 1 }}>{option.optionText}</div>

      {/* 結果標記 */}
      {showResult && isCorrect && (
        <div
          style={{
            marginLeft: '12px',
            fontSize: '20px',
          }}
        >
          ✓
        </div>
      )}
      {showResult && isWrong && (
        <div
          style={{
            marginLeft: '12px',
            fontSize: '20px',
          }}
        >
          ✗
        </div>
      )}
    </button>
  );
};

export default OptionButton;
