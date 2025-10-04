/**
 * 螢幕尺寸媒體查詢 Hook
 *
 * 提供響應式設計所需的螢幕尺寸偵測功能
 */

import { useState, useEffect } from 'react';

/**
 * 斷點定義
 */
export const breakpoints = {
  mobile: 375,   // 手機
  tablet: 768,   // 平板
  desktop: 1024, // 電腦
} as const;

/**
 * 裝置類型
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * 媒體查詢返回值
 */
export interface UseMediaQueryReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  width: number;
}

/**
 * 媒體查詢 Hook
 *
 * @returns 螢幕尺寸資訊
 */
export const useMediaQuery = (): UseMediaQueryReturn => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;

  const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    width,
  };
};

/**
 * 響應式數值 Hook
 *
 * 根據螢幕尺寸返回對應的數值
 *
 * @param mobileValue - 手機版數值
 * @param tabletValue - 平板版數值（可選，預設使用桌面版數值）
 * @param desktopValue - 桌面版數值
 * @returns 當前螢幕對應的數值
 */
export const useResponsiveValue = <T,>(
  mobileValue: T,
  tabletValue: T | undefined,
  desktopValue: T
): T => {
  const { isMobile, isTablet } = useMediaQuery();

  if (isMobile) return mobileValue;
  if (isTablet) return tabletValue ?? desktopValue;
  return desktopValue;
};
