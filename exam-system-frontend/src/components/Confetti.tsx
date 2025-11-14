/**
 * 彩带慶祝動畫元件
 *
 * 用於測驗結束時的慶祝效果
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Confetti Props 介面
 */
interface ConfettiProps {
  active?: boolean;      // 是否激活動畫
  duration?: number;     // 持續時間（秒）
  particleCount?: number; // 粒子數量
}

/**
 * 單個彩帶粒子
 */
interface ConfettiPiece {
  id: number;
  x: number;           // 起始 x 位置 (%)
  y: number;           // 起始 y 位置
  rotation: number;    // 初始旋轉角度
  color: string;       // 顏色
  size: number;        // 大小
  delay: number;       // 延遲時間
}

/**
 * 彩帶顏色列表
 */
const CONFETTI_COLORS = [
  '#FF6B6B', // 紅色
  '#4ECDC4', // 青色
  '#FFE66D', // 黃色
  '#A8E6CF', // 綠色
  '#FF8B94', // 粉紅色
  '#C7CEEA', // 紫色
  '#FFDAC1', // 橙色
  '#B4F8C8', // 淺綠色
];

/**
 * 生成隨機彩帶粒子
 */
const generateConfettiPieces = (count: number): ConfettiPiece[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -20,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 10 + 5,
    delay: Math.random() * 0.5,
  }));
};

/**
 * 彩帶慶祝動畫元件
 */
export const Confetti: React.FC<ConfettiProps> = ({
  active = true,
  duration = 3,
  particleCount = 50,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      setPieces(generateConfettiPieces(particleCount));
    }
  }, [active, particleCount]);

  if (!active || pieces.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: piece.y,
            rotate: piece.rotation,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0.5, 0],
          }}
          transition={{
            duration: duration + Math.random() * 2,
            delay: piece.delay,
            ease: 'easeIn',
          }}
          style={{
            position: 'absolute',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
