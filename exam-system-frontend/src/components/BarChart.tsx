/**
 * 長條圖元件
 *
 * 使用 Recharts 顯示統計資料
 */

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { OptionStatistic, ScoreDistribution } from '../types';

/**
 * 長條圖 Props 介面
 */
interface BarChartProps {
  data: OptionStatistic[] | ScoreDistribution[];
  dataType: 'option' | 'score';           // 資料類型
  width?: string | number;                 // 寬度
  height?: number;                         // 高度
  showLegend?: boolean;                    // 是否顯示圖例
  colors?: string[];                       // 自訂顏色
}

/**
 * 預設顏色配置
 */
const DEFAULT_COLORS = [
  '#8884d8', // 藍色
  '#82ca9d', // 綠色
  '#ffc658', // 橙色
  '#ff7c7c', // 紅色
  '#a28dff', // 紫色
  '#ffb6c1', // 粉色
  '#87ceeb', // 天藍色
  '#98d8c8', // 青色
];

/**
 * 正確答案顏色
 */
const CORRECT_COLOR = '#4caf50'; // 綠色

/**
 * 錯誤答案顏色
 */
const INCORRECT_COLOR = '#f44336'; // 紅色

/**
 * 長條圖元件
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  dataType,
  width = '100%',
  height = 300,
  showLegend = false,
  colors = DEFAULT_COLORS,
}) => {
  /**
   * 格式化選項統計資料
   */
  const formatOptionData = (optionStats: OptionStatistic[]) => {
    return optionStats.map((stat) => ({
      name: stat.optionText,
      count: stat.count,
      percentage: stat.percentage,
      isCorrect: stat.isCorrect,
    }));
  };

  /**
   * 格式化分數分布資料
   */
  const formatScoreData = (scoreStats: ScoreDistribution[]) => {
    return scoreStats.map((stat) => ({
      name: `${stat.score} 分`,
      count: stat.count,
      percentage: stat.percentage,
    }));
  };

  /**
   * 取得圖表資料
   */
  const chartData =
    dataType === 'option'
      ? formatOptionData(data as OptionStatistic[])
      : formatScoreData(data as ScoreDistribution[]);

  /**
   * 自訂 Tooltip
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
        <p style={{ margin: '4px 0 0 0', color: '#666' }}>
          人數: {data.count}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#666' }}>
          百分比: {data.percentage.toFixed(1)}%
        </p>
        {dataType === 'option' && data.isCorrect !== undefined && (
          <p style={{ margin: '4px 0 0 0', color: data.isCorrect ? CORRECT_COLOR : INCORRECT_COLOR }}>
            {data.isCorrect ? '✓ 正確答案' : '✗ 錯誤答案'}
          </p>
        )}
      </div>
    );
  };

  /**
   * 取得長條顏色
   */
  const getBarColor = (entry: any, index: number) => {
    if (dataType === 'option' && entry.isCorrect !== undefined) {
      return entry.isCorrect ? CORRECT_COLOR : INCORRECT_COLOR;
    }
    return colors[index % colors.length];
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <RechartsBarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Bar dataKey="count" name="人數" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
