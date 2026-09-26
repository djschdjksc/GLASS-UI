import { ThemeConfig } from 'antd';

/**
 * Ant Design Glass Morphism Dark Theme
 * Matches the project's Apple-style dark Glass UI
 */
export const glassAntdTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: '#38bdf8',
    colorBgBase: '#0a0c10',
    colorBgContainer: 'rgba(15, 23, 42, 0.6)',
    colorBgElevated: 'rgba(13, 21, 38, 0.96)',
    colorBgLayout: '#0a0c10',
    colorBgSpotlight: 'rgba(56, 189, 248, 0.15)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
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

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
    fontSizeSM: 11,
    fontSizeLG: 15,
    fontWeightStrong: 700,

    // Borders
    borderRadius: 10,
    borderRadiusLG: 12,
    borderRadiusSM: 8,

    // Sizing
    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,

    // Shadows
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.6)',

    // Motion
    motionDurationFast: '0.15s',
    motionDurationMid: '0.3s',
    motionDurationSlow: '0.45s',
    motionEaseInOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  components: {
    Input: {
      colorBgContainer: 'rgba(15, 23, 42, 0.6)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      activeBorderColor: '#38bdf8',
      hoverBorderColor: 'rgba(255, 255, 255, 0.2)',
      activeShadow: '0 0 0 3px rgba(56, 189, 248, 0.15)',
      addonBg: 'rgba(15, 23, 42, 0.8)',
      borderRadius: 12,
      paddingInline: 14,
      paddingBlock: 8,
    },
    Select: {
      colorBgContainer: 'rgba(15, 23, 42, 0.6)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorBgElevated: 'rgba(13, 21, 38, 0.98)',
      optionActiveBg: 'rgba(56, 189, 248, 0.15)',
      optionSelectedBg: 'rgba(56, 189, 248, 0.25)',
      optionSelectedColor: '#38bdf8',
      borderRadius: 12,
      controlHeight: 36,
    },
    DatePicker: {
      colorBgContainer: 'rgba(15, 23, 42, 0.6)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorBgElevated: 'rgba(13, 21, 38, 0.98)',
      activeBorderColor: '#38bdf8',
      hoverBorderColor: 'rgba(255, 255, 255, 0.2)',
      activeShadow: '0 0 0 3px rgba(56, 189, 248, 0.15)',
      cellActiveWithRangeBg: 'rgba(56, 189, 248, 0.12)',
      cellHoverBg: 'rgba(56, 189, 248, 0.1)',
      borderRadius: 12,
    },
    Modal: {
      contentBg: 'rgba(13, 21, 38, 0.96)',
      headerBg: 'transparent',
      titleColor: '#f8fafc',
      colorBgMask: 'rgba(0, 0, 0, 0.7)',
      borderRadiusLG: 16,
    },
    Button: {
      colorPrimary: '#0ea5e9',
      colorPrimaryHover: '#38bdf8',
      colorPrimaryActive: '#0284c7',
      defaultBg: 'rgba(255, 255, 255, 0.06)',
      defaultBorderColor: 'rgba(255, 255, 255, 0.12)',
      defaultColor: '#f8fafc',
      borderRadius: 10,
      fontWeight: 700,
    },
    Table: {
      colorBgContainer: 'transparent',
      headerBg: 'rgba(0, 0, 0, 0.3)',
      headerColor: '#94a3b8',
      rowHoverBg: 'rgba(56, 189, 248, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.06)',
      headerSplitColor: 'rgba(255, 255, 255, 0.06)',
    },
    Tooltip: {
      colorBgSpotlight: 'rgba(13, 21, 38, 0.95)',
      colorTextLightSolid: '#f8fafc',
      borderRadius: 8,
    },
    Dropdown: {
      colorBgElevated: 'rgba(13, 21, 38, 0.98)',
      controlItemBgHover: 'rgba(56, 189, 248, 0.1)',
      controlItemBgActive: 'rgba(56, 189, 248, 0.2)',
      borderRadiusLG: 12,
    },
    Popover: {
      colorBgElevated: 'rgba(13, 21, 38, 0.98)',
      borderRadiusLG: 12,
    },
    Tag: {
      defaultBg: 'rgba(56, 189, 248, 0.12)',
      defaultColor: '#38bdf8',
      borderRadiusSM: 6,
    },
    Switch: {
      colorPrimary: '#0ea5e9',
      colorPrimaryHover: '#38bdf8',
    },
    Checkbox: {
      colorPrimary: '#0ea5e9',
      colorPrimaryHover: '#38bdf8',
      colorBgContainer: 'rgba(15, 23, 42, 0.6)',
      colorBorder: 'rgba(255, 255, 255, 0.2)',
    },
    Notification: {
      colorBgElevated: 'rgba(13, 21, 38, 0.96)',
      colorText: '#f8fafc',
    },
    Message: {
      contentBg: 'rgba(13, 21, 38, 0.96)',
    },
  },
};
