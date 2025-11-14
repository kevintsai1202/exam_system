/**
 * 學員列表元件
 *
 * 顯示已加入的學員清單
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarSelector';
import type { Student } from '../types';

/**
 * 學員列表 Props 介面
 */
interface StudentListProps {
  students: Student[];                    // 學員列表
  totalStudents?: number;                 // 總學員數（可選）
  showScore?: boolean;                    // 是否顯示分數（預設 false）
  showEmail?: boolean;                    // 是否顯示 Email（預設 false）
  maxHeight?: string | number;            // 最大高度（預設無限制）
  emptyMessage?: string;                  // 空列表提示訊息
}

/**
 * 學員列表元件
 */
export const StudentList: React.FC<StudentListProps> = ({
  students,
  totalStudents,
  showScore = false,
  showEmail = false,
  maxHeight,
  emptyMessage = '尚無學員加入',
}) => {
  const displayTotal = totalStudents ?? students.length;
  const [newStudentIds, setNewStudentIds] = useState<Set<number>>(new Set());
  const prevStudentIdsRef = useRef<Set<number>>(new Set());

  // 檢測新學員加入
  useEffect(() => {
    const currentIds = new Set(students.map(s => s.id));
    const prevIds = prevStudentIdsRef.current;

    // 找出新加入的學員
    const newIds = new Set<number>();
    currentIds.forEach(id => {
      if (!prevIds.has(id)) {
        newIds.add(id);
      }
    });

    if (newIds.size > 0) {
      setNewStudentIds(newIds);

      // 3 秒後清除高亮
      setTimeout(() => {
        setNewStudentIds(new Set());
      }, 3000);
    }

    prevStudentIdsRef.current = currentIds;
  }, [students]);

  // 按答對題數排序（從高到低），然後按分數排序，最後按加入時間排序
  const sortedStudents = React.useMemo(() => {
    return [...students].sort((a, b) => {
      // 先按答對題數排序（從高到低）
      const correctA = a.correctAnswersCount ?? 0;
      const correctB = b.correctAnswersCount ?? 0;
      if (correctB !== correctA) {
        return correctB - correctA;
      }

      // 答對題數相同時，按分數排序（從高到低）
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      // 分數也相同時，按加入時間排序（早加入的在前）
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [students]);

  // 計算最大答對題數，用於計算條狀圖比例
  const maxCorrectAnswers = React.useMemo(() => {
    return Math.max(...sortedStudents.map(s => s.correctAnswersCount ?? 0), 1);
  }, [sortedStudents]);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}
    >
      {/* 標題列 */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
          }}
        >
          學員列表
        </h3>
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: '#1976d2',
            color: '#fff',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {displayTotal} 人
        </div>
      </div>

      {/* 學員列表 */}
      <div
        style={{
          maxHeight: maxHeight || 'none',
          overflowY: maxHeight ? 'auto' : 'visible',
        }}
      >
        {students.length === 0 ? (
          // 空列表提示
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          // 學員項目
          <AnimatePresence mode="popLayout">
            {sortedStudents.map((student, index) => {
              const rank = index + 1;
              const correctAnswers = student.correctAnswersCount ?? 0;
              const barWidth = maxCorrectAnswers > 0 ? (correctAnswers / maxCorrectAnswers) * 100 : 0;
              const isTop3 = rank <= 3;
              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;
              const isNewStudent = newStudentIds.has(student.id);

              return (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    backgroundColor: isNewStudent
                      ? ['#e3f2fd', '#fff9c4', '#e3f2fd', '#fff9c4', '#e3f2fd']
                      : isTop3
                      ? '#fffbf0'
                      : 'transparent',
                  }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 300, damping: 30 },
                    backgroundColor: { duration: 1.5, times: [0, 0.25, 0.5, 0.75, 1] },
                  }}
                  whileHover={{
                    backgroundColor: isTop3 ? '#fff8e1' : '#f9f9f9',
                  }}
                  style={{
                    padding: '16px 20px',
                    borderBottom:
                      index < sortedStudents.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                  }}
                >
                {/* 排名 */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isGold
                      ? '#ffd700'
                      : isSilver
                      ? '#c0c0c0'
                      : isBronze
                      ? '#cd7f32'
                      : '#e3f2fd',
                    color: isTop3 ? '#fff' : '#1976d2',
                    borderRadius: '50%',
                    fontSize: isTop3 ? '18px' : '14px',
                    fontWeight: '700',
                    flexShrink: 0,
                    boxShadow: isTop3 ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {rank}
                </div>

                {/* 頭像 */}
                <div style={{ flexShrink: 0 }}>
                  <AvatarDisplay avatar={student.avatarIcon} size="medium" />
                </div>

                {/* 學員資訊 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 姓名 */}
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '6px',
                    }}
                  >
                    {student.name}
                  </div>

                  {/* 答對題數條狀圖 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '20px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          backgroundColor: isGold
                            ? '#ffd700'
                            : isSilver
                            ? '#c0c0c0'
                            : isBronze
                            ? '#cd7f32'
                            : '#4caf50',
                          borderRadius: '10px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#666',
                        minWidth: '50px',
                        textAlign: 'right',
                      }}
                    >
                      {correctAnswers} 題
                    </div>
                  </div>

                  {/* Email */}
                  {showEmail && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {student.email}
                    </div>
                  )}
                </div>

                {/* 分數 */}
                {showScore && (
                  <div
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    {student.totalScore} 分
                  </div>
                )}

                {/* 新學員標記 */}
                {isNewStudent && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: 0,
                    }}
                    transition={{
                      scale: { duration: 0.5, repeat: Infinity, repeatDelay: 1 },
                      rotate: { duration: 0.3 },
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)',
                    }}
                  >
                    NEW
                  </motion.div>
                )}

                {/* 加入時間 */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    flexShrink: 0,
                  }}
                >
                  {student.joinedAt ? new Date(student.joinedAt).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '--:--'}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

/**
 * 精簡版學員列表（適用於小空間顯示）
 */
interface CompactStudentListProps {
  students: Student[];
  maxDisplay?: number;                    // 最多顯示幾個（預設顯示全部）
}

export const CompactStudentList: React.FC<CompactStudentListProps> = ({
  students,
  maxDisplay,
}) => {
  const displayStudents = maxDisplay
    ? students.slice(0, maxDisplay)
    : students;
  const remainingCount = maxDisplay
    ? Math.max(0, students.length - maxDisplay)
    : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      {displayStudents.map((student) => (
        <div
          key={student.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '20px',
            fontSize: '14px',
          }}
        >
          <AvatarDisplay avatar={student.avatarIcon} size="small" />
          <span style={{ color: '#333', fontWeight: '500' }}>
            {student.name}
          </span>
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: '#e0e0e0',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#666',
            fontWeight: '600',
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default StudentList;
