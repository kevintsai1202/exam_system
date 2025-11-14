/**
 * 波紋按鈕元件
 *
 * 實現 Material Design 風格的波紋擴散效果
 */

import React, { useState, useRef, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ripple 介面
 */
interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * RippleButton Props 介面
 */
interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  rippleColor?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * 波紋按鈕元件
 */
export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  style = {},
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  type = 'button',
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  /**
   * 處理點擊事件，創建波紋
   */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    // 獲取點擊位置相對於按鈕的座標
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 計算波紋大小（確保能覆蓋整個按鈕）
    const size = Math.max(rect.width, rect.height) * 2;

    // 創建新波紋
    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // 600ms 後移除波紋
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    // 執行 onClick 回調
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}

      {/* 波紋容器 */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{
              width: 0,
              height: 0,
              opacity: 1,
              x: ripple.x,
              y: ripple.y,
            }}
            animate={{
              width: ripple.size,
              height: ripple.size,
              opacity: 0,
              x: ripple.x - ripple.size / 2,
              y: ripple.y - ripple.size / 2,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              backgroundColor: rippleColor,
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

export default RippleButton;
