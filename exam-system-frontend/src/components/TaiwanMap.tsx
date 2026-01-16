/**
 * 台灣地圖互動元件
 * 使用 SVG 顯示台灣縣市地圖，支援點擊選擇與熱力圖顯示
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 台灣縣市資料
export const TAIWAN_LOCATIONS = {
    TPE: { name: '台北市', x: 280, y: 85 },
    NTP: { name: '新北市', x: 295, y: 110 },
    KEL: { name: '基隆市', x: 310, y: 70 },
    TYN: { name: '桃園市', x: 250, y: 130 },
    HSC: { name: '新竹市', x: 230, y: 160 },
    HSH: { name: '新竹縣', x: 245, y: 180 },
    YLN: { name: '宜蘭縣', x: 330, y: 140 },
    TXG: { name: '台中市', x: 210, y: 230 },
    CHW: { name: '彰化縣', x: 185, y: 270 },
    NTO: { name: '南投縣', x: 230, y: 290 },
    YUN: { name: '雲林縣', x: 170, y: 310 },
    MIA: { name: '苗栗縣', x: 220, y: 200 },
    TNN: { name: '台南市', x: 155, y: 390 },
    KHH: { name: '高雄市', x: 180, y: 440 },
    CYI: { name: '嘉義市', x: 160, y: 350 },
    CYQ: { name: '嘉義縣', x: 180, y: 350 },
    PIF: { name: '屏東縣', x: 210, y: 500 },
    HUN: { name: '花蓮縣', x: 300, y: 280 },
    TTT: { name: '台東縣', x: 270, y: 420 },
    PEN: { name: '澎湖縣', x: 80, y: 320 },
    KIN: { name: '金門縣', x: 30, y: 180 },
    LNN: { name: '連江縣', x: 30, y: 50 },
};

interface TaiwanMapProps {
    selectedLocation?: string;
    onLocationSelect?: (locationCode: string) => void;
    statistics?: Record<string, number>;
    showLabels?: boolean;
    interactive?: boolean;
    width?: number;
    height?: number;
}

const TaiwanMap: React.FC<TaiwanMapProps> = ({
    selectedLocation,
    onLocationSelect,
    statistics,
    showLabels = true,
    interactive = true,
    width = 380,
    height = 600
}) => {
    const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

    // 計算熱力圖顏色
    const getHeatColor = (code: string) => {
        if (!statistics || !statistics[code]) return 'rgba(102, 126, 234, 0.3)';
        const maxCount = Math.max(...Object.values(statistics), 1);
        const count = statistics[code];
        const intensity = count / maxCount;
        // 從藍色到紅色的漸層
        const r = Math.round(102 + (234 - 102) * intensity);
        const g = Math.round(126 - 126 * intensity);
        const b = Math.round(234 - 234 * intensity);
        return `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.5})`;
    };

    // 取得選中或懸停的樣式
    const getLocationStyle = (code: string) => {
        const isSelected = selectedLocation === code;
        const isHovered = hoveredLocation === code;

        return {
            fill: isSelected
                ? '#667eea'
                : (statistics ? getHeatColor(code) : (isHovered ? 'rgba(102, 126, 234, 0.5)' : 'rgba(102, 126, 234, 0.2)')),
            stroke: isSelected || isHovered ? '#667eea' : 'rgba(255, 255, 255, 0.5)',
            strokeWidth: isSelected ? 3 : (isHovered ? 2 : 1),
            cursor: interactive ? 'pointer' : 'default',
        };
    };

    const handleLocationClick = (code: string) => {
        if (interactive && onLocationSelect) {
            onLocationSelect(code);
        }
    };

    return (
        <div className="taiwan-map-container">
            <svg width={width} height={height} viewBox="0 0 380 600">
                {/* 背景 */}
                <rect x="0" y="0" width="380" height="600" fill="transparent" />

                {/* 縣市圓點與標籤 */}
                {Object.entries(TAIWAN_LOCATIONS).map(([code, loc]) => {
                    const style = getLocationStyle(code);
                    const count = statistics?.[code] || 0;

                    return (
                        <motion.g
                            key={code}
                            onClick={() => handleLocationClick(code)}
                            onMouseEnter={() => interactive && setHoveredLocation(code)}
                            onMouseLeave={() => setHoveredLocation(null)}
                            whileHover={interactive ? { scale: 1.1 } : {}}
                            style={{ cursor: style.cursor }}
                        >
                            {/* 縣市圓點 */}
                            <circle
                                cx={loc.x}
                                cy={loc.y}
                                r={statistics ? Math.max(15, 15 + count * 3) : 20}
                                fill={style.fill}
                                stroke={style.stroke}
                                strokeWidth={style.strokeWidth}
                            />

                            {/* 縣市名稱 */}
                            {showLabels && (
                                <text
                                    x={loc.x}
                                    y={loc.y + 4}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill={selectedLocation === code || hoveredLocation === code ? '#fff' : 'rgba(255, 255, 255, 0.9)'}
                                    fontWeight={selectedLocation === code ? '600' : '400'}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {loc.name.slice(0, 2)}
                                </text>
                            )}

                            {/* 統計數字 */}
                            {statistics && count > 0 && (
                                <text
                                    x={loc.x}
                                    y={loc.y + 35}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="rgba(255, 255, 255, 0.8)"
                                    fontWeight="600"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {count}人
                                </text>
                            )}
                        </motion.g>
                    );
                })}

                {/* 台灣本島輪廓提示線（簡化版） */}
                <path
                    d="M 250 60 Q 340 100 340 180 Q 330 300 300 400 Q 270 500 200 550 Q 150 540 140 450 Q 130 350 150 280 Q 170 200 200 140 Q 230 80 250 60"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />
            </svg>

            {/* 懸停提示 */}
            {hoveredLocation && (
                <motion.div
                    className="location-tooltip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <strong>{TAIWAN_LOCATIONS[hoveredLocation as keyof typeof TAIWAN_LOCATIONS]?.name}</strong>
                    {statistics && statistics[hoveredLocation] !== undefined && (
                        <span> - {statistics[hoveredLocation]} 人</span>
                    )}
                </motion.div>
            )}

            <style>{`
        .taiwan-map-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .location-tooltip {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          white-space: nowrap;
        }
      `}</style>
        </div>
    );
};

export default TaiwanMap;
