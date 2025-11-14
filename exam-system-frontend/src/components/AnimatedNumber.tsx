/**
 * 動畫數字元件
 *
 * 用於顯示滾動計數器動畫
 */

import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * AnimatedNumber Props 介面
 */
interface AnimatedNumberProps {
  value: number;           // 目標數字
  decimals?: number;       // 小數位數（預設 0）
  duration?: number;       // 動畫持續時間（秒，預設 1）
  fontSize?: string;       // 字體大小
  fontWeight?: string;     // 字體粗細
  color?: string;          // 文字顏色
  suffix?: string;         // 後綴（如 '%', '分'）
  prefix?: string;         // 前綴（如 '$'）
}

/**
 * 動畫數字元件
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  duration = 1,
  fontSize = '32px',
  fontWeight = '700',
  color = '#1976d2',
  suffix = '',
  prefix = '',
}) => {
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    (Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals)
  );

  const prevValue = useRef(0);

  useEffect(() => {
    // 只有當數值真的變化時才觸發動畫
    if (value !== prevValue.current) {
      spring.set(value);
      prevValue.current = value;
    }
  }, [spring, value]);

  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3 }}
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily: 'monospace',
      }}
    >
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};

export default AnimatedNumber;
