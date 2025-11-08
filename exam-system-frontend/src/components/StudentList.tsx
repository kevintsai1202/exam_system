/**
 * 學員列表元件
 *
 * 顯示已加入的學員清單
 */

import React from 'react';
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
          students.map((student, index) => (
            <div
              key={student.id}
              style={{
                padding: '16px 20px',
                borderBottom:
                  index < students.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f9f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* 序號 */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '50%',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0,
                }}
              >
                {index + 1}
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
                  }}
                >
                  {student.name}
                </div>

                {/* Email */}
                {showEmail && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginTop: '2px',
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
            </div>
          ))
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
