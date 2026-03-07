import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { userApiService } from '../services/userApiService';
import type { User } from '../store/authStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    // @ts-ignore
    const { user, isAdmin } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/');
            return;
        }
        fetchUsers();
    }, [isAdmin, navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userApiService.getAllUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || '無法取得用戶列表');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeToInstructor = async (userId: number) => {
        try {
            setProcessingId(userId);
            await userApiService.upgradeToInstructor(userId);
            alert('成功升級為講師！');
            await fetchUsers();
        } catch (err: any) {
            console.error('升級失敗錯誤:', err);
            const errMsg = err?.message || err?.response?.data?.message || '未知錯誤';
            alert(`升級講師失敗: ${errMsg}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpgradeToAdmin = async (userId: number) => {
        try {
            setProcessingId(userId);
            await userApiService.upgradeToAdmin(userId);
            alert('成功升級為系統管理員！');
            await fetchUsers();
        } catch (err: any) {
            console.error('升級為管理員失敗錯誤:', err);
            const errMsg = err?.message || err?.response?.data?.message || '未知錯誤';
            alert(`升級為管理員失敗: ${errMsg}`);
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * 切換使用者功能權限
     */
    const handleToggleFeature = async (
        userId: number,
        featureKey: 'surveyManagementEnabled' | 'emailManagementEnabled',
        currentValue: boolean | undefined
    ) => {
        try {
            setProcessingId(userId);
            await userApiService.updateUserFeatures(userId, {
                [featureKey]: currentValue === false ? true : false,
            });
            await fetchUsers();
        } catch (err: any) {
            console.error('更新功能權限失敗:', err);
            const errMsg = err?.message || err?.response?.data?.message || '未知錯誤';
            alert(`更新功能權限失敗: ${errMsg}`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <div style={{ fontSize: '18px', color: '#666' }}>載入中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '18px', color: '#f44336' }}>{error}</div>
                <button onClick={fetchUsers} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>重新載入</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <div>
                        <h1 style={{ margin: '0 0 12px 0', fontSize: '36px', fontWeight: 700, color: '#333' }}>系統管理中心 (Admin)</h1>
                        <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>管理系統內所有用戶的身分與權限。</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        返回首頁
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}
                >
                    <table style={{ width: '100%', minWidth: '1040px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>ID</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>Email</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>名稱</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>目前角色</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>問券管理</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>郵件管理</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: '#333', fontWeight: 600 }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '16px', color: '#666' }}>{u.id}</td>
                                    <td style={{ padding: '16px', color: '#333' }}>{u.email}</td>
                                    <td style={{ padding: '16px', color: '#333', fontWeight: 500 }}>{u.name || '未設定'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: u.role === 'ADMIN' ? '#ffebee' : u.role === 'INSTRUCTOR' ? '#e8f5e9' : '#f5f5f5',
                                            color: u.role === 'ADMIN' ? '#c62828' : u.role === 'INSTRUCTOR' ? '#2e7d32' : '#666'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#333', fontSize: '13px' }}>
                                            <input
                                                type="checkbox"
                                                checked={u.role === 'ADMIN' ? true : u.surveyManagementEnabled !== false}
                                                disabled={processingId === u.id || u.role === 'ADMIN'}
                                                onChange={() => handleToggleFeature(u.id, 'surveyManagementEnabled', u.surveyManagementEnabled)}
                                            />
                                            {u.role === 'ADMIN' ? '永遠開啟' : (u.surveyManagementEnabled !== false ? '已開啟' : '已停用')}
                                        </label>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#333', fontSize: '13px' }}>
                                            <input
                                                type="checkbox"
                                                checked={u.role === 'ADMIN' ? true : u.emailManagementEnabled !== false}
                                                disabled={processingId === u.id || u.role === 'ADMIN'}
                                                onChange={() => handleToggleFeature(u.id, 'emailManagementEnabled', u.emailManagementEnabled)}
                                            />
                                            {u.role === 'ADMIN' ? '永遠開啟' : (u.emailManagementEnabled !== false ? '已開啟' : '已停用')}
                                        </label>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {u.role === 'STUDENT' && (
                                                <button
                                                    onClick={() => handleUpgradeToInstructor(u.id)}
                                                    disabled={processingId === u.id}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: processingId === u.id ? '#9e9e9e' : '#1976d2',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: processingId === u.id ? 'not-allowed' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        transition: 'background-color 0.2s',
                                                        outline: 'none'
                                                    }}
                                                    onMouseEnter={(e) => { if (processingId !== u.id) e.currentTarget.style.backgroundColor = '#1565c0'; }}
                                                    onMouseLeave={(e) => { if (processingId !== u.id) e.currentTarget.style.backgroundColor = '#1976d2'; }}
                                                >
                                                    {processingId === u.id ? '處理中...' : '升級講師'}
                                                </button>
                                            )}
                                            {u.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => handleUpgradeToAdmin(u.id)}
                                                    disabled={processingId === u.id}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: processingId === u.id ? '#9e9e9e' : '#d32f2f',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: processingId === u.id ? 'not-allowed' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        transition: 'background-color 0.2s',
                                                        outline: 'none'
                                                    }}
                                                    onMouseEnter={(e) => { if (processingId !== u.id) e.currentTarget.style.backgroundColor = '#b71c1c'; }}
                                                    onMouseLeave={(e) => { if (processingId !== u.id) e.currentTarget.style.backgroundColor = '#d32f2f'; }}
                                                >
                                                    {processingId === u.id ? '處理中...' : '設為管理員'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: '16px' }}>
                            沒有找到任何用戶
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
