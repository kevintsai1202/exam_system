/**
 * 頭像選擇器元件
 *
 * 顯示可選擇的動物頭像列表
 */

import React from 'react';
import { AVAILABLE_AVATARS } from '../types';
import type { AvatarIcon } from '../types';

/**
 * 頭像選擇器 Props 介面
 */
interface AvatarSelectorProps {
  selectedAvatar: AvatarIcon | string;        // 當前選中的頭像
  onSelect: (avatar: AvatarIcon) => void;     // 選擇回調
  size?: 'small' | 'medium' | 'large';        // 頭像大小（預設 'medium'）
  columns?: number;                           // 每行顯示數量（預設 4）
}

/**
 * 頭像圖示映射（使用 emoji）
 */
const AVATAR_EMOJI_MAP: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  lion: '🦁',
  tiger: '🐯',
  bear: '🐻',
  rabbit: '🐰',
  fox: '🦊',
  panda: '🐼',
};

/**
 * 頭像名稱映射
 */
const AVATAR_NAME_MAP: Record<string, string> = {
  cat: '貓咪',
  dog: '小狗',
  lion: '獅子',
  tiger: '老虎',
  bear: '小熊',
  rabbit: '兔子',
  fox: '狐狸',
  panda: '熊貓',
};

/**
 * 頭像選擇器元件
 */
export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelect,
  size = 'medium',
  columns = 4,
}) => {
  /**
   * 取得頭像大小（px）
   */
  const getAvatarSize = (): number => {
    switch (size) {
      case 'small':
        return 48;
      case 'large':
        return 96;
      case 'medium':
      default:
        return 72;
    }
  };

  /**
   * 取得 Emoji 字體大小
   */
  const getEmojiFontSize = (): string => {
    switch (size) {
      case 'small':
        return '28px';
      case 'large':
        return '56px';
      case 'medium':
      default:
        return '42px';
    }
  };

  /**
   * 取得名稱字體大小
   */
  const getNameFontSize = (): string => {
    switch (size) {
      case 'small':
        return '10px';
      case 'large':
        return '14px';
      case 'medium':
      default:
        return '12px';
    }
  };

  const avatarSize = getAvatarSize();

  return (
    <div>
      {/* 標題 */}
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
          textAlign: 'center',
        }}
      >
        選擇你的頭像
      </h3>

      {/* 頭像網格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '12px',
          justifyItems: 'center',
        }}
      >
        {AVAILABLE_AVATARS.map((avatar) => {
          const isSelected = selectedAvatar === avatar;

          return (
            <button
              key={avatar}
              onClick={() => onSelect(avatar)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${avatarSize}px`,
                height: `${avatarSize + 24}px`,
                padding: '8px',
                backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                border: isSelected ? '3px solid #1976d2' : '2px solid #e0e0e0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: isSelected
                  ? '0 4px 8px rgba(25, 118, 210, 0.3)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              {/* Emoji 圖示 */}
              <div
                style={{
                  fontSize: getEmojiFontSize(),
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {AVATAR_EMOJI_MAP[avatar] || '❓'}
              </div>

              {/* 名稱 */}
              <div
                style={{
                  fontSize: getNameFontSize(),
                  color: isSelected ? '#1976d2' : '#666',
                  fontWeight: isSelected ? '600' : '400',
                }}
              >
                {AVATAR_NAME_MAP[avatar] || avatar}
              </div>
            </button>
          );
        })}
      </div>

      {/* 已選擇提示 */}
      {selectedAvatar && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '14px', color: '#2e7d32' }}>
            已選擇：{AVATAR_EMOJI_MAP[selectedAvatar]} {AVATAR_NAME_MAP[selectedAvatar]}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * 頭像顯示元件（僅顯示，不可選擇）
 */
interface AvatarDisplayProps {
  avatar: AvatarIcon | string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  size = 'medium',
  showName = false,
}) => {
  const getSize = (): string => {
    switch (size) {
      case 'small':
        return '24px';
      case 'large':
        return '48px';
      case 'medium':
      default:
        return '32px';
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ fontSize: getSize(), lineHeight: 1 }}>
        {AVATAR_EMOJI_MAP[avatar] || '❓'}
      </span>
      {showName && (
        <span style={{ fontSize: '14px', color: '#666' }}>
          {AVATAR_NAME_MAP[avatar] || avatar}
        </span>
      )}
    </div>
  );
};

export default AvatarSelector;
