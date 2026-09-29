import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

export type AppThemeMode = 'dark' | 'white' | 'glass';

/**
 * Unified Ant Design Themes for Modern Summary App
 * Supports:
 * - 'dark': shadcn-inspired slick dark theme (obsidian / zinc canvas)
 * - 'white': shadcn-inspired clean white theme (crisp surfaces, high contrast)
 * - 'glass': frosted glassmorphism dark theme (liquid retina translucent)
 */
export function getAntdTheme(mode: AppThemeMode): ThemeConfig {
  if (mode === 'white') {
    return {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#0284c7',
        colorBgBase: '#ffffff',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f8fafc',
        colorBgSpotlight: 'rgba(2, 132, 199, 0.1)',
        colorBorder: '#e2e8f0',
        colorBorderSecondary: '#f1f5f9',
        colorText: '#000000',
        colorTextSecondary: '#000000',
        colorTextTertiary: '#1e293b',
        colorTextPlaceholder: '#64748b',
        colorTextHeading: '#000000',
        colorTextDisabled: '#94a3b8',
        colorFill: '#f1f5f9',
        colorFillSecondary: '#e2e8f0',
        colorFillTertiary: '#f8fafc',
        colorSuccess: '#10b981',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#0284c7',

        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
        fontSizeSM: 11,
        fontSizeLG: 15,
        fontWeightStrong: 700,

        borderRadius: 8,
        borderRadiusLG: 10,
        borderRadiusSM: 6,

        controlHeight: 34,
        controlHeightLG: 38,
        controlHeightSM: 26,

        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      components: {
        Input: {
          colorBgContainer: '#ffffff',
          colorBorder: '#cbd5e1',
          activeBorderColor: '#0284c7',
          hoverBorderColor: '#94a3b8',
          activeShadow: '0 0 0 2px rgba(2, 132, 199, 0.2)',
          colorText: '#000000',
          borderRadius: 8,
        },
        Select: {
          colorBgContainer: '#ffffff',
          colorBorder: '#cbd5e1',
          colorBgElevated: '#ffffff',
          optionActiveBg: '#f1f5f9',
          optionSelectedBg: 'rgba(2, 132, 199, 0.1)',
          optionSelectedColor: '#0284c7',
          colorText: '#000000',
          borderRadius: 8,
        },
        Button: {
          colorPrimary: '#0284c7',
          colorPrimaryHover: '#0369a1',
          colorPrimaryActive: '#075985',
          defaultBg: '#ffffff',
          defaultBorderColor: '#e2e8f0',
          defaultColor: '#000000',
          borderRadius: 8,
          fontWeight: 600,
        },
        Modal: {
          contentBg: '#ffffff',
          headerBg: '#ffffff',
          titleColor: '#000000',
          colorBgMask: 'rgba(15, 23, 42, 0.45)',
          borderRadiusLG: 12,
        },
        Table: {
          colorBgContainer: '#ffffff',
          headerBg: '#f8fafc',
          headerColor: '#000000',
          colorText: '#000000',
          rowHoverBg: 'rgba(2, 132, 199, 0.05)',
          borderColor: '#e2e8f0',
        },
        Tag: {
          defaultBg: '#f1f5f9',
          defaultColor: '#0284c7',
          borderRadiusSM: 4,
        }
      }
    };
  }

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
