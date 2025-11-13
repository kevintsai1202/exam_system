/**
 * 圓餅圖元件
 *
 * 使用 Recharts 顯示統計資料
 */

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { OptionStatistic, ScoreDistribution, OccupationStatistic, SurveyFieldValueStatistic } from '../types';

/**
 * 調查欄位值統計（簡化版，用於圖表）
 */
interface SurveyFieldChartData {
  value: string;
  count: number;
  percentage: number;
}

/**
 * 圓餅圖 Props 介面
 */
interface PieChartProps {
  data: OptionStatistic[] | ScoreDistribution[] | OccupationStatistic[] | SurveyFieldChartData[];
  dataType: 'option' | 'score' | 'occupation' | 'surveyField';  // 資料類型
  width?: string | number;                       // 寬度
  height?: number;                               // 高度
  showLegend?: boolean;                          // 是否顯示圖例
  showLabel?: boolean;                           // 是否顯示標籤
  colors?: string[];                             // 自訂顏色
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
 * 圓餅圖元件
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataType,
  width = '100%',
  height = 400,
  showLegend = true,
  showLabel = true,
  colors = DEFAULT_COLORS,
}) => {
  /**
   * 格式化選項統計資料
   */
  const formatOptionData = (optionStats: OptionStatistic[]) => {
    return optionStats.map((stat) => ({
      name: stat.optionText,
      value: stat.count,
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
      value: stat.count,
      percentage: stat.percentage,
    }));
  };

  /**
   * 格式化職業統計資料
   */
  const formatOccupationData = (occupationStats: OccupationStatistic[]) => {
    return occupationStats.map((stat) => ({
      name: stat.occupation,
      value: stat.count,
      percentage: stat.percentage,
    }));
  };

  /**
   * 格式化調查欄位統計資料
   */
  const formatSurveyFieldData = (surveyStats: SurveyFieldChartData[]) => {
    return surveyStats.map((stat) => ({
      name: stat.value,
      value: stat.count,
      percentage: stat.percentage,
    }));
  };

  /**
   * 取得圖表資料
   */
  const chartData =
    dataType === 'option'
      ? formatOptionData(data as OptionStatistic[])
      : dataType === 'score'
      ? formatScoreData(data as ScoreDistribution[])
      : dataType === 'occupation'
      ? formatOccupationData(data as OccupationStatistic[])
      : formatSurveyFieldData(data as SurveyFieldChartData[]);

  /**
   * 自訂標籤
   */
  const renderLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

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
          人數: {data.value}
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
   * 取得扇形顏色
   */
  const getCellColor = (entry: any, index: number) => {
    if (dataType === 'option' && entry.isCorrect !== undefined) {
      return entry.isCorrect ? CORRECT_COLOR : INCORRECT_COLOR;
    }
    return colors[index % colors.length];
  };

  /**
   * 自訂圖例
   */
  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '20px 0 0 0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        {payload.map((entry: any, index: number) => (
          <li
            key={`legend-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: entry.color,
                marginRight: '6px',
                borderRadius: '2px',
              }}
            />
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={showLabel}
          label={showLabel ? renderLabel : false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCellColor(entry, index)} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={renderLegend} />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;
