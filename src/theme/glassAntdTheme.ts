import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

export type AppThemeMode = 'dark' | 'glass';

/**
 * Unified Ant Design Themes for Modern Summary App
 * Supports:
 * - 'dark': shadcn-inspired slick dark theme (obsidian / zinc canvas)
 * - 'glass': frosted glassmorphism dark theme (liquid retina translucent)
 */
export function getAntdTheme(mode: AppThemeMode): ThemeConfig {
  // Dark or Glass
  const isGlass = mode === 'glass';
  return {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#38bdf8',
      colorBgBase: isGlass ? '#0a0c10' : '#09090b',
      colorBgContainer: isGlass ? 'rgba(15, 23, 42, 0.6)' : '#121215',
      colorBgElevated: isGlass ? 'rgba(13, 21, 38, 0.96)' : '#18181b',
      colorBgLayout: isGlass ? '#0a0c10' : '#09090b',
      colorBgSpotlight: 'rgba(56, 189, 248, 0.15)',
      colorBorder: isGlass ? 'rgba(255, 255, 255, 0.1)' : '#27272a',
      colorBorderSecondary: isGlass ? 'rgba(255, 255, 255, 0.06)' : '#1f1f23',
      colorText: '#f8fafc',
      colorTextSecondary: '#94a3b8',
      colorTextTertiary: '#64748b',
      colorTextPlaceholder: '#475569',
      colorTextDisabled: '#334155',
      colorFill: 'rgba(255, 255, 255, 0.04)',
      colorFillSecondary: 'rgba(255, 255, 255, 0.06)',
      colorFillTertiary: 'rgba(255, 255, 255, 0.03)',
      colorSuccess: '#34d399',
      colorWarning: '#fbbf24',
      colorError: '#f87171',
      colorInfo: '#38bdf8',

      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 13,
      fontSizeSM: 11,
      fontSizeLG: 15,
      fontWeightStrong: 700,

      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,

      controlHeight: 34,
      controlHeightLG: 38,
      controlHeightSM: 26,

      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.6)',
    },
    components: {
      Input: {
        colorBgContainer: isGlass ? 'rgba(15, 23, 42, 0.6)' : '#18181b',
        colorBorder: isGlass ? 'rgba(255, 255, 255, 0.1)' : '#27272a',
        activeBorderColor: '#38bdf8',
        hoverBorderColor: 'rgba(255, 255, 255, 0.25)',
        activeShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)',
        borderRadius: 8,
      },
      Select: {
        colorBgContainer: isGlass ? 'rgba(15, 23, 42, 0.6)' : '#18181b',
        colorBorder: isGlass ? 'rgba(255, 255, 255, 0.1)' : '#27272a',
        colorBgElevated: isGlass ? 'rgba(13, 21, 38, 0.98)' : '#18181b',
        optionActiveBg: 'rgba(56, 189, 248, 0.15)',
        optionSelectedBg: 'rgba(56, 189, 248, 0.25)',
        optionSelectedColor: '#38bdf8',
        borderRadius: 8,
      },
      Modal: {
        contentBg: isGlass ? 'rgba(13, 21, 38, 0.96)' : '#121215',
        headerBg: 'transparent',
        titleColor: '#f8fafc',
        colorBgMask: 'rgba(0, 0, 0, 0.7)',
        borderRadiusLG: 14,
      },
      Button: {
        colorPrimary: '#0ea5e9',
        colorPrimaryHover: '#38bdf8',
        colorPrimaryActive: '#0284c7',
        defaultBg: isGlass ? 'rgba(255, 255, 255, 0.06)' : '#18181b',
        defaultBorderColor: isGlass ? 'rgba(255, 255, 255, 0.12)' : '#27272a',
        defaultColor: '#f8fafc',
        borderRadius: 8,
        fontWeight: 600,
      },
      Table: {
        colorBgContainer: 'transparent',
        headerBg: isGlass ? 'rgba(0, 0, 0, 0.3)' : '#18181b',
        headerColor: '#94a3b8',
        rowHoverBg: 'rgba(56, 189, 248, 0.06)',
        borderColor: isGlass ? 'rgba(255, 255, 255, 0.06)' : '#27272a',
      }
    }
  };
}

export const glassAntdTheme = getAntdTheme('glass');
