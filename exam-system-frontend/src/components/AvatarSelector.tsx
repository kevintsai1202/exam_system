/**
 * 頭像選擇器元件
 *
 * 顯示可選擇的動物頭像列表（SVG 版本）
 */

import React from 'react';
import { AVAILABLE_AVATARS } from '../types';
import type { AvatarIcon } from '../types';

/**
 * 頭像選擇器 Props 介面
 */
interface AvatarSelectorProps {
  selectedAvatar: AvatarIcon | string;
  onSelect: (avatar: AvatarIcon) => void;
  size?: 'small' | 'medium' | 'large';
  columns?: number;
}

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
 * SVG 頭像圖示元件
 */
interface AvatarSvgProps {
  avatar: string;
  size: number;
}

const AvatarSvg: React.FC<AvatarSvgProps> = ({ avatar, size }) => {
  const svgSize = size * 0.7;

  const renderAvatar = () => {
    switch (avatar) {
      case 'cat':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="100%" stopColor="#FF9800" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="36" r="24" fill="url(#catGrad)" />
            <polygon points="12,20 20,36 8,32" fill="url(#catGrad)" />
            <polygon points="52,20 44,36 56,32" fill="url(#catGrad)" />
            <circle cx="24" cy="32" r="4" fill="#333" />
            <circle cx="40" cy="32" r="4" fill="#333" />
            <ellipse cx="32" cy="42" rx="4" ry="3" fill="#FF7043" />
            <path d="M28 46 Q32 50 36 46" stroke="#333" strokeWidth="2" fill="none" />
            <line x1="12" y1="38" x2="22" y2="40" stroke="#333" strokeWidth="1.5" />
            <line x1="12" y1="42" x2="22" y2="42" stroke="#333" strokeWidth="1.5" />
            <line x1="52" y1="38" x2="42" y2="40" stroke="#333" strokeWidth="1.5" />
            <line x1="52" y1="42" x2="42" y2="42" stroke="#333" strokeWidth="1.5" />
          </svg>
        );
      case 'dog':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="dogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8D6E63" />
                <stop offset="100%" stopColor="#6D4C41" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="36" r="24" fill="url(#dogGrad)" />
            <ellipse cx="16" cy="24" rx="8" ry="12" fill="url(#dogGrad)" />
            <ellipse cx="48" cy="24" rx="8" ry="12" fill="url(#dogGrad)" />
            <circle cx="24" cy="32" r="4" fill="#333" />
            <circle cx="40" cy="32" r="4" fill="#333" />
            <ellipse cx="32" cy="44" rx="8" ry="6" fill="#D7CCC8" />
            <circle cx="32" cy="42" r="4" fill="#333" />
            <path d="M28 48 Q32 52 36 48" stroke="#333" strokeWidth="2" fill="none" />
            <ellipse cx="32" cy="50" rx="3" ry="2" fill="#FF7043" />
          </svg>
        );
      case 'lion':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="lionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB300" />
                <stop offset="100%" stopColor="#FF8F00" />
              </linearGradient>
              <radialGradient id="maneGrad" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#FF8F00" />
                <stop offset="100%" stopColor="#E65100" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#maneGrad)" />
            <circle cx="32" cy="36" r="20" fill="url(#lionGrad)" />
            <circle cx="24" cy="32" r="3" fill="#333" />
            <circle cx="40" cy="32" r="3" fill="#333" />
            <ellipse cx="32" cy="42" rx="5" ry="4" fill="#8D6E63" />
            <path d="M28 46 Q32 50 36 46" stroke="#333" strokeWidth="2" fill="none" />
          </svg>
        );
      case 'tiger':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="tigerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF9800" />
                <stop offset="100%" stopColor="#EF6C00" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="36" r="24" fill="url(#tigerGrad)" />
            <polygon points="14,16 22,32 10,28" fill="url(#tigerGrad)" />
            <polygon points="50,16 42,32 54,28" fill="url(#tigerGrad)" />
            <path d="M20 24 L26 34" stroke="#333" strokeWidth="3" />
            <path d="M24 22 L28 32" stroke="#333" strokeWidth="3" />
            <path d="M44 24 L38 34" stroke="#333" strokeWidth="3" />
            <path d="M40 22 L36 32" stroke="#333" strokeWidth="3" />
            <circle cx="24" cy="36" r="3" fill="#333" />
            <circle cx="40" cy="36" r="3" fill="#333" />
            <ellipse cx="32" cy="46" rx="4" ry="3" fill="#333" />
            <path d="M28 50 Q32 54 36 50" stroke="#333" strokeWidth="2" fill="none" />
            <ellipse cx="32" cy="40" rx="10" ry="6" fill="#FFF3E0" />
          </svg>
        );
      case 'bear':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="bearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#795548" />
                <stop offset="100%" stopColor="#5D4037" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="10" fill="url(#bearGrad)" />
            <circle cx="48" cy="16" r="10" fill="url(#bearGrad)" />
            <circle cx="32" cy="36" r="24" fill="url(#bearGrad)" />
            <circle cx="24" cy="32" r="4" fill="#333" />
            <circle cx="40" cy="32" r="4" fill="#333" />
            <ellipse cx="32" cy="44" rx="12" ry="8" fill="#A1887F" />
            <ellipse cx="32" cy="42" rx="5" ry="4" fill="#333" />
            <path d="M28 50 Q32 54 36 50" stroke="#333" strokeWidth="2" fill="none" />
          </svg>
        );
      case 'rabbit':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="rabbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5F5F5" />
                <stop offset="100%" stopColor="#E0E0E0" />
              </linearGradient>
            </defs>
            <ellipse cx="22" cy="16" rx="6" ry="18" fill="url(#rabbitGrad)" />
            <ellipse cx="22" cy="16" rx="3" ry="12" fill="#FFCDD2" />
            <ellipse cx="42" cy="16" rx="6" ry="18" fill="url(#rabbitGrad)" />
            <ellipse cx="42" cy="16" rx="3" ry="12" fill="#FFCDD2" />
            <circle cx="32" cy="40" r="22" fill="url(#rabbitGrad)" />
            <circle cx="24" cy="36" r="4" fill="#F48FB1" />
            <circle cx="24" cy="36" r="2" fill="#333" />
            <circle cx="40" cy="36" r="4" fill="#F48FB1" />
            <circle cx="40" cy="36" r="2" fill="#333" />
            <ellipse cx="32" cy="46" rx="4" ry="3" fill="#FFCDD2" />
            <path d="M30 50 Q32 52 34 50" stroke="#333" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="44" r="4" fill="#FFCDD2" opacity="0.6" />
            <circle cx="44" cy="44" r="4" fill="#FFCDD2" opacity="0.6" />
          </svg>
        );
      case 'fox':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <defs>
              <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7043" />
                <stop offset="100%" stopColor="#E64A19" />
              </linearGradient>
            </defs>
            <polygon points="8,8 24,40 8,36" fill="url(#foxGrad)" />
            <polygon points="56,8 40,40 56,36" fill="url(#foxGrad)" />
            <circle cx="32" cy="40" r="22" fill="url(#foxGrad)" />
            <path d="M18 44 Q32 60 46 44 Q32 52 18 44" fill="#FFF" />
            <circle cx="24" cy="34" r="3" fill="#333" />
            <circle cx="40" cy="34" r="3" fill="#333" />
            <ellipse cx="32" cy="46" rx="3" ry="2" fill="#333" />
            <path d="M29 50 Q32 53 35 50" stroke="#333" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'panda':
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <circle cx="32" cy="36" r="24" fill="#FFF" />
            <circle cx="14" cy="18" r="10" fill="#333" />
            <circle cx="50" cy="18" r="10" fill="#333" />
            <ellipse cx="22" cy="32" rx="8" ry="10" fill="#333" />
            <ellipse cx="42" cy="32" rx="8" ry="10" fill="#333" />
            <circle cx="22" cy="32" r="4" fill="#FFF" />
            <circle cx="42" cy="32" r="4" fill="#FFF" />
            <circle cx="23" cy="33" r="2" fill="#333" />
            <circle cx="43" cy="33" r="2" fill="#333" />
            <ellipse cx="32" cy="44" rx="4" ry="3" fill="#333" />
            <path d="M28 48 Q32 52 36 48" stroke="#333" strokeWidth="2" fill="none" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 64 64" width={svgSize} height={svgSize}>
            <circle cx="32" cy="32" r="28" fill="#E0E0E0" />
            <text x="32" y="40" textAnchor="middle" fontSize="24" fill="#666">?</text>
          </svg>
        );
    }
  };

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{renderAvatar()}</div>;
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
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: 'inherit',
          textAlign: 'center',
        }}
      >
        選擇你的頭像
      </h3>

      <style>{`
        @keyframes avatar-bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-8px) rotate(-5deg); }
          50% { transform: translateY(-4px); }
          75% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes avatar-wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .avatar-button:hover .avatar-icon {
          animation: avatar-bounce 0.6s ease-in-out;
        }
      `}</style>

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
              className="avatar-button"
              onClick={() => onSelect(avatar)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${avatarSize}px`,
                height: `${avatarSize + 24}px`,
                padding: '8px',
                backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                border: isSelected ? '3px solid #667eea' : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                  : '0 2px 4px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = '#667eea';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              <div className="avatar-icon">
                <AvatarSvg avatar={avatar} size={avatarSize} />
              </div>
              <div
                style={{
                  fontSize: getNameFontSize(),
                  color: isSelected ? '#667eea' : 'inherit',
                  fontWeight: isSelected ? '600' : '400',
                  marginTop: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                {AVATAR_NAME_MAP[avatar] || avatar}
              </div>
            </button>
          );
        })}
      </div>

      {selectedAvatar && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <AvatarSvg avatar={selectedAvatar} size={32} />
          <span style={{ fontSize: '14px', color: '#4caf50', fontWeight: '600' }}>
            已選擇：{AVATAR_NAME_MAP[selectedAvatar]}
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
  const getSize = (): number => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      case 'medium':
      default:
        return 32;
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
      <AvatarSvg avatar={avatar} size={getSize()} />
      {showName && (
        <span style={{ fontSize: '14px', color: 'inherit' }}>
          {AVATAR_NAME_MAP[avatar] || avatar}
        </span>
      )}
    </div>
  );
};

export default AvatarSelector;
