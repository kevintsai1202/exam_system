/**
 * 位置統計視覺化元件
 * 整合台灣地圖顯示學員分布熱力圖
 */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaiwanMap, { TAIWAN_LOCATIONS } from './TaiwanMap';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface LocationStatisticsProps {
    examId: number;
    refreshInterval?: number; // 自動刷新間隔（毫秒）
}

interface StatisticsData {
    totalCount: number;
    locationCounts: Record<string, number>;
    locationNames: Record<string, string>;
}

const LocationStatistics: React.FC<LocationStatisticsProps> = ({
    examId,
    refreshInterval = 5000
}) => {
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = async () => {
        try {
            const response = await axios.get<StatisticsData>(
                `${API_BASE_URL}/api/locations/statistics/${examId}`
            );
            setStatistics(response.data);
            setError(null);
        } catch (err) {
            setError('無法載入位置統計');
            console.error('Failed to fetch location statistics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();

        // 設定自動刷新
        if (refreshInterval > 0) {
            const interval = setInterval(fetchStatistics, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [examId, refreshInterval]);

    // 計算排行榜
    const getTopLocations = () => {
        if (!statistics?.locationCounts) return [];

        return Object.entries(statistics.locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([code, count]) => ({
                code,
                name: TAIWAN_LOCATIONS[code as keyof typeof TAIWAN_LOCATIONS]?.name || code,
                count
            }));
    };

    if (loading) {
        return (
            <div className="location-stats-loading">
                <div className="spinner"></div>
                <p>載入統計資料中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="location-stats-error">
                <p>⚠️ {error}</p>
                <button onClick={fetchStatistics}>重試</button>
            </div>
        );
    }

    const topLocations = getTopLocations();

    return (
        <motion.div
            className="location-statistics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <h3 className="stats-title">學員分布地圖</h3>

            <div className="stats-content">
                <div className="map-section">
                    <TaiwanMap
                        statistics={statistics?.locationCounts}
                        interactive={false}
                        showLabels={true}
                        width={320}
                        height={500}
                    />
                </div>

                <div className="ranking-section">
                    <h4>地區排行</h4>
                    <div className="total-count">
                        總計: <strong>{statistics?.totalCount || 0}</strong> 人
                    </div>

                    {topLocations.length > 0 ? (
                        <ul className="location-ranking">
                            {topLocations.map(({ code, name, count }, index) => (
                                <motion.li
                                    key={code}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <span className="rank">{index + 1}</span>
                                    <span className="name">{name}</span>
                                    <span className="count">{count} 人</span>
                                </motion.li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">尚無位置資料</p>
                    )}
                </div>
            </div>

            <style>{`
        .location-statistics {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stats-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 20px;
          text-align: center;
        }

        .stats-content {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .map-section {
          flex: 1;
          min-width: 320px;
          display: flex;
          justify-content: center;
        }

        .ranking-section {
          flex: 1;
          min-width: 200px;
          max-width: 280px;
        }

        .ranking-section h4 {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 12px;
        }

        .total-count {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 8px;
        }

        .total-count strong {
          color: #667eea;
          font-size: 1.2rem;
        }

        .location-ranking {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .location-ranking li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .location-ranking .rank {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
        }

        .location-ranking .name {
          flex: 1;
          color: rgba(255, 255, 255, 0.9);
        }

        .location-ranking .count {
          color: #667eea;
          font-weight: 600;
        }

        .no-data {
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          padding: 20px;
        }

        .location-stats-loading,
        .location-stats-error {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.7);
        }

        .location-stats-loading .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .location-stats-error button {
          margin-top: 12px;
          padding: 8px 24px;
          background: #667eea;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
        </motion.div>
    );
};

export default LocationStatistics;
