/**
 * QR Code 顯示元件
 *
 * 使用 qrcode.react 生成並顯示 QR Code
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  // 複製狀態
  const [copied, setCopied] = useState(false);

  /**
   * 複製 URL 到剪貼簿
   * 使用降級方案以支援不同瀏覽器和環境
   */
  const handleCopyUrl = async () => {
    try {
      // 方法 1: 優先使用 Clipboard API (需要 HTTPS 或 localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // 方法 2: 降級使用 document.execCommand (適用於舊版瀏覽器)
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('execCommand 複製失敗');
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('複製失敗:', error);
      // 顯示友善的錯誤訊息，並提供手動複製的提示
      alert(`複製失敗，請手動複製以下 URL:\n\n${value}`);
    }
  };
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

      {/* QR Code 容器與波紋動畫 */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {/* 波紋動畫 - 外圈 */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1.3],
            opacity: [0.6, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size + 32,
            height: size + 32,
            marginTop: -(size + 32) / 2,
            marginLeft: -(size + 32) / 2,
            borderRadius: '8px',
            border: '3px solid #1976d2',
            pointerEvents: 'none',
          }}
        />

        {/* 波紋動畫 - 內圈 */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1.2],
            opacity: [0.8, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.5,
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size + 32,
            height: size + 32,
            marginTop: -(size + 32) / 2,
            marginLeft: -(size + 32) / 2,
            borderRadius: '8px',
            border: '3px solid #4caf50',
            pointerEvents: 'none',
          }}
        />

        {/* QR Code */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{
            padding: '16px',
            backgroundColor: bgColor,
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1,
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
        </motion.div>
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

      {/* 複製 URL 按鈕 */}
      <button
        onClick={handleCopyUrl}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: copied ? '#4caf50' : '#1976d2',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = '#1565c0';
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = '#1976d2';
          }
        }}
      >
        {copied ? '✓ 已複製!' : '📋 複製 URL'}
      </button>
    </div>
  );
};

export default QRCodeDisplay;
