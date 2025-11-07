/**
 * QR Code 顯示元件
 *
 * 使用 qrcode.react 生成並顯示 QR Code
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * QR Code 顯示 Props 介面
 */
interface QRCodeDisplayProps {
  value: string;                  // QR Code 內容（完整 URL 或加入碼）
  displayText?: string;           // 顯示的文字（選填，預設使用 value）
  size?: number;                  // QR Code 大小（預設 256）
  level?: 'L' | 'M' | 'Q' | 'H';  // 錯誤修正等級（預設 'M'）
  includeMargin?: boolean;        // 是否包含邊距（預設 true）
  bgColor?: string;               // 背景顏色（預設白色）
  fgColor?: string;               // 前景顏色（預設黑色）
  title?: string;                 // 顯示標題
  description?: string;           // 顯示描述
  showValue?: boolean;            // 是否顯示加入碼文字（預設 true）
}

/**
 * QR Code 顯示元件
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  displayText,
  size = 256,
  level = 'M',
  includeMargin = true,
  bgColor = '#ffffff',
  fgColor = '#000000',
  title = '掃描加入測驗',
  description,
  showValue = true,
}) => {
  // 使用 displayText 或 value 作為顯示文字
  const textToDisplay = displayText || value;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* 標題 */}
      {title && (
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
          }}
        >
          {title}
        </h2>
      )}

      {/* 描述 */}
      {description && (
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#666',
            textAlign: 'center',
          }}
        >
          {description}
        </p>
      )}

      {/* QR Code */}
      <div
        style={{
          padding: '16px',
          backgroundColor: bgColor,
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
          bgColor={bgColor}
          fgColor={fgColor}
        />
      </div>

      {/* 加入碼文字 */}
      {showValue && (
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#666',
            }}
          >
            加入碼
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1976d2',
              letterSpacing: '4px',
              fontFamily: 'monospace',
            }}
          >
            {textToDisplay}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
