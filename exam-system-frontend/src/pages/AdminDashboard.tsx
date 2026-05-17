import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { userApiService } from '../services/userApiService';
import { examApi } from '../services/apiService';
import type { User } from '../store/authStore';
import type { Exam } from '../types/exam.types';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

/** 頁籤類型 */
type TabKey = 'users' | 'exams';

const AdminDashboard: React.FC = () => {
    // ── 共用狀態 ──────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabKey>('users');
    // @ts-ignore
    const { user, isAdmin } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/');
        }
    }, [isAdmin, navigate]);

    // ── 用戶管理狀態 ──────────────────────────────────────────────
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // ── 測驗管理狀態 ──────────────────────────────────────────────
    const [exams, setExams] = useState<Exam[]>([]);
    const [examsLoading, setExamsLoading] = useState(false);
    const [examsError, setExamsError] = useState<string | null>(null);
    /** 每張測驗卡片選中的新 owner ID（key=examId） */
    const [selectedNewOwner, setSelectedNewOwner] = useState<Record<number, number>>({});
    const [transferringId, setTransferringId] = useState<number | null>(null);

    // ── 資料載入 ──────────────────────────────────────────────────

    /**
     * 載入所有用戶（admin 視圖）
     */
    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            setUsersError(null);
            const data = await userApiService.getAllUsers();
            setUsers(data);
        } catch (err: any) {
            setUsersError(err.message || '無法取得用戶列表');
        } finally {
            setUsersLoading(false);
        }
    };

    /**
     * 載入所有測驗（admin 視圖，含 ownerId/ownerName）
     */
    const fetchExams = async () => {
        try {
            setExamsLoading(true);
            setExamsError(null);
            const data = await examApi.getAllExams();
            setExams(data);
        } catch (err: any) {
            setExamsError(err.message || '無法取得測驗列表');
        } finally {
            setExamsLoading(false);
        }
    };

    // 初次載入用戶資料；切換到測驗 tab 時才載入測驗
    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'exams' && exams.length === 0 && !examsLoading) {
            fetchExams();
        }
    }, [activeTab]);

    // ── 用戶管理操作 ──────────────────────────────────────────────

    const handleUpgradeToInstructor = async (userId: number) => {
        try {
            setProcessingId(userId);
            await userApiService.upgradeToInstructor(userId);
            alert('成功升級為講師！');
            await fetchUsers();
        } catch (err: any) {
            const errMsg = err?.message || '未知錯誤';
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
            const errMsg = err?.message || '未知錯誤';
            alert(`升級為管理員失敗: ${errMsg}`);
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * 刪除使用者
     */
    const handleDeleteUser = async (targetUser: User) => {
        if (user?.id === targetUser.id) {
            alert('不可刪除目前登入中的管理員帳號');
            return;
        }
        const confirmed = window.confirm(
            `確定要刪除使用者「${targetUser.name || targetUser.email}」嗎？此操作無法復原。`
        );
        if (!confirmed) return;

        try {
            setProcessingId(targetUser.id);
            await userApiService.deleteUser(targetUser.id);
            await fetchUsers();
        } catch (err: any) {
            const errMsg = err?.message || '未知錯誤';
            alert(`刪除使用者失敗: ${errMsg}`);
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
            const errMsg = err?.message || '未知錯誤';
            alert(`更新功能權限失敗: ${errMsg}`);
        } finally {
            setProcessingId(null);
        }
    };

    // ── 測驗管理操作 ──────────────────────────────────────────────

    /**
     * 執行測驗所有者轉移
     * 需確認後才呼叫後端，成功後刷新測驗列表
     */
    const handleTransferOwner = async (exam: Exam) => {
        const newOwnerId = selectedNewOwner[exam.id];
        if (!newOwnerId) {
            alert('請先選擇新的所有者');
            return;
        }
        const newOwnerUser = users.find(u => u.id === newOwnerId);
        const confirmed = window.confirm(
            `確定將測驗「${exam.title}」的所有者轉移給「${newOwnerUser?.name || newOwnerUser?.email}」嗎？`
        );
        if (!confirmed) return;

        try {
            setTransferringId(exam.id);
            await userApiService.transferExamOwner(exam.id, newOwnerId);
            // 清除此測驗的下拉選擇並刷新列表
            setSelectedNewOwner(prev => {
                const next = { ...prev };
                delete next[exam.id];
                return next;
            });
            await fetchExams();
        } catch (err: any) {
            const errMsg = err?.message || '未知錯誤';
            alert(`轉移所有者失敗: ${errMsg}`);
        } finally {
            setTransferringId(null);
        }
    };

    // ── 可作為 owner 的用戶（INSTRUCTOR 或 ADMIN） ────────────────
    const eligibleOwners = users.filter(u => u.role === 'INSTRUCTOR' || u.role === 'ADMIN');

    // ── 樣式常數 ──────────────────────────────────────────────────
    const tabStyle = (tab: TabKey): React.CSSProperties => ({
        padding: '10px 24px',
        fontSize: '15px',
        fontWeight: activeTab === tab ? 700 : 400,
        color: activeTab === tab ? '#1976d2' : '#666',
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: activeTab === tab ? '3px solid #1976d2' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
    });

    const btnStyle = (color: string, disabled: boolean): React.CSSProperties => ({
        padding: '8px 16px',
        backgroundColor: disabled ? '#9e9e9e' : color,
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontWeight: 500,
    });

    // ── 狀態對應標籤 ──────────────────────────────────────────────
    const statusLabel: Record<string, string> = {
        CREATED: '未開始',
        STARTED: '進行中',
        ENDED: '已結束',
    };
    const statusColor: Record<string, string> = {
        CREATED: '#757575',
        STARTED: '#2e7d32',
        ENDED: '#c62828',
    };

    // ── 渲染 ──────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* 標題列 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700, color: '#333' }}>
                            系統管理中心 (Admin)
                        </h1>
                        <p style={{ margin: 0, fontSize: '15px', color: '#666' }}>
                            管理系統內所有用戶的身分、權限與測驗所有者。
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        返回首頁
                    </button>
                </motion.div>

                {/* Tab 切換列 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '24px', backgroundColor: '#fff', borderRadius: '8px 8px 0 0', padding: '0 8px' }}>
                    <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>
                        用戶管理 ({users.length})
                    </button>
                    <button style={tabStyle('exams')} onClick={() => setActiveTab('exams')}>
                        測驗管理 {exams.length > 0 ? `(${exams.length})` : ''}
                    </button>
                </div>

                {/* ── 用戶管理 Tab ── */}
                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ backgroundColor: '#fff', borderRadius: '0 0 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}
                    >
                        {usersLoading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>載入中...</div>
                        ) : usersError ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#f44336' }}>
                                {usersError}
                                <button onClick={fetchUsers} style={{ marginLeft: '16px', padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>重新載入</button>
                            </div>
                        ) : (
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
                                        <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                            <td style={{ padding: '16px', color: '#666' }}>{u.id}</td>
                                            <td style={{ padding: '16px', color: '#333' }}>{u.email}</td>
                                            <td style={{ padding: '16px', color: '#333', fontWeight: 500 }}>{u.name || '未設定'}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
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
                                                            style={btnStyle('#1976d2', processingId === u.id)}
                                                        >
                                                            {processingId === u.id ? '處理中...' : '升級講師'}
                                                        </button>
                                                    )}
                                                    {u.role !== 'ADMIN' && (
                                                        <button
                                                            onClick={() => handleUpgradeToAdmin(u.id)}
                                                            disabled={processingId === u.id}
                                                            style={btnStyle('#d32f2f', processingId === u.id)}
                                                        >
                                                            {processingId === u.id ? '處理中...' : '設為管理員'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        disabled={processingId === u.id || user?.id === u.id}
                                                        style={btnStyle('#5d4037', processingId === u.id || user?.id === u.id)}
                                                    >
                                                        {processingId === u.id ? '處理中...' : user?.id === u.id ? '不可刪除自己' : '刪除使用者'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!usersLoading && !usersError && users.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: '16px' }}>
                                沒有找到任何用戶
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── 測驗管理 Tab ── */}
                {activeTab === 'exams' && (
                    <motion.div
                        key="exams"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ backgroundColor: '#fff', borderRadius: '0 0 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}
                    >
                        {examsLoading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>載入中...</div>
                        ) : examsError ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#f44336' }}>
                                {examsError}
                                <button onClick={fetchExams} style={{ marginLeft: '16px', padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>重新載入</button>
                            </div>
                        ) : (
                            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>測驗標題</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>狀態</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>目前所有者</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>題目數 / 學員數</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: '#333', fontWeight: 600 }}>轉移所有者</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.map((exam) => (
                                        <tr key={exam.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                            <td style={{ padding: '16px', color: '#666' }}>{exam.id}</td>
                                            <td style={{ padding: '16px', color: '#333', fontWeight: 500, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {exam.title}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    backgroundColor: exam.status === 'STARTED' ? '#e8f5e9' : exam.status === 'ENDED' ? '#ffebee' : '#f5f5f5',
                                                    color: statusColor[exam.status as string] || '#666'
                                                }}>
                                                    {statusLabel[exam.status as string] || exam.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', color: '#333' }}>
                                                {exam.ownerName || `ID: ${exam.ownerId}` || '—'}
                                            </td>
                                            <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
                                                {exam.totalQuestions ?? 0} 題 / {exam.totalStudents ?? 0} 人
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    {/* 下拉選單：僅列出可作為 owner 的用戶 */}
                                                    <select
                                                        value={selectedNewOwner[exam.id] ?? ''}
                                                        onChange={e => setSelectedNewOwner(prev => ({
                                                            ...prev,
                                                            [exam.id]: Number(e.target.value)
                                                        }))}
                                                        disabled={transferringId === exam.id}
                                                        style={{
                                                            padding: '7px 10px', fontSize: '13px', borderRadius: '6px',
                                                            border: '1px solid #ccc', backgroundColor: '#fafafa', color: '#333', minWidth: '160px'
                                                        }}
                                                    >
                                                        <option value="">— 選擇新所有者 —</option>
                                                        {eligibleOwners
                                                            .filter(u => u.id !== exam.ownerId)
                                                            .map(u => (
                                                                <option key={u.id} value={u.id}>
                                                                    [{u.role}] {u.name || u.email}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleTransferOwner(exam)}
                                                        disabled={transferringId === exam.id || !selectedNewOwner[exam.id]}
                                                        style={btnStyle('#7b1fa2', transferringId === exam.id || !selectedNewOwner[exam.id])}
                                                    >
                                                        {transferringId === exam.id ? '轉移中...' : '確認轉移'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!examsLoading && !examsError && exams.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: '16px' }}>
                                系統中尚無任何測驗
                            </div>
                        )}
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
