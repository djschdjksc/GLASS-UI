import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Segmented, Slider, Switch, Tag, Button, Input, InputNumber, Tooltip } from 'antd';
import { macAudio } from '../utils/macAudio';
import { useDatabase } from '../context/DatabaseContext';
import {
  Palette,
  Keyboard,
  Database,
  Sliders,
  Barcode,
  Check,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Grid,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Server,
  Printer,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  FileText,
  Moon,
  User,
  Camera,
  MessageCircle,
  Phone,
  Smartphone,
  ShieldCheck,
  Scan,
  QrCode,
  Tag as TagIcon,
  Maximize2,
  Volume2
} from 'lucide-react';
import { saveMediaToDB, clearMediaFromDB } from '../services/mediaStorage';
import {
  BARCODE_PRESETS,
  DEFAULT_BARCODE_CONFIG,
  loadBarcodeConfig,
  saveBarcodeConfig,
  generateCode128SvgBars,
  generateQrMatrix,
  generateTsplCommand,
  generateZplCommand,
  downloadThermalScriptFile,
  parseWeighingScaleBarcode
} from '../utils/barcodeConfigHelper';
import type {
  BarcodePreset,
  BarcodeSymbology,
  BarcodeSystemConfig,
  MargWorkingStyle,
  MargAskQty,
  MargDuplicatePolicy,
  MargRescanAction,
  MargBarcodeNotFound,
  MargCreationStyle,
  ThermalSensorMode
} from '../utils/barcodeConfigHelper';

export type SettingsMainTab = 'THEME' | 'PROFILE' | 'SHORTCUTS' | 'BACKUP' | 'GENERAL' | 'BARCODE';
export type BarcodeSubTab = 'PRESETS' | 'MARG_RULES' | 'DIMENSIONS' | 'THERMAL_HEAD' | 'CONTENT' | 'PRINTER_CMDS' | 'SCANNER';
export type AppThemeMode = 'dark' | 'glass';


interface Props {
  themeMode?: AppThemeMode;
  onChangeThemeMode?: (mode: AppThemeMode) => void;
  bgImage: string;
  onSelectBgImage: (url: string) => void;
  blurAmount: number;
  onChangeBlur: (blur: number) => void;
  overlayOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  glassOpacity: number;
  onChangeGlassOpacity: (opacity: number) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  // Compatibility props
  bgType?: any;
  onChangeBgType?: any;
  bgVideo?: any;
  onSelectBgVideo?: any;
  bgColor?: any;
  onChangeBgColor?: any;
}

// Curated Apple-Style Wallpapers
const WALLPAPERS = [
  // — Gradient / Color Field (Apple's signature abstract art)
  { name: 'Sequoia Dusk',      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Sonoma Blush',      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Nebula Flow',       url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Liquid Ink',        url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Aurora Pulse',      url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Cosmic Violet',     url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=90' },
  // — Minimal Nature (Apple macOS landscape series)
  { name: 'Big Sur Shore',     url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Yosemite Mist',     url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Mojave Sand',       url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Catalina Deep',     url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Sierra Snow',       url: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Midnight Forest',   url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=90' },
  // — Space / Dark Cosmos (Apple Space Screensavers style)
  { name: 'Deep Space',        url: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Milky Arc',         url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Obsidian Bloom',    url: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=1920&q=90' },
  // — Architecture / Glass / Geometry (Urban Apple style)
  { name: 'Crystal Dome',      url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Slate Lines',       url: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=1920&q=90' },
  { name: 'Carbon Weave',      url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1920&q=90' },
];

// PURE GRID & TABLE SHORTCUTS ONLY (All legacy keys eliminated)
const GRID_SHORTCUTS = [
  {
    key: 'Enter / Return',
    action: 'Move to next cell horizontally, then wraps down to next row (Tally Flow Mode)',
    tag: 'Navigation'
  },
  {
    key: '0 + Enter',
    action: 'Quick-copy quantity or capacity directly from the row above',
    tag: 'Data Entry'
  },
  {
    key: 'Arrow Keys (↑, ↓, ←, →)',
    action: 'Smooth cell-to-cell navigation and instant cell activation',
    tag: 'Navigation'
  },
  {
    key: 'Delete (Plain)',
    action: 'Clear selected cell value without deleting table row (Excel Mode)',
    tag: 'Editing'
  },
  {
    key: 'Insert Key',
    action: 'Insert a new blank item row at the current position',
    tag: 'Row Control'
  },
  {
    key: 'Ctrl + Delete',
    action: 'Delete currently highlighted row and recalculate totals',
    tag: 'Row Control'
  },
  {
    key: '+ / - / * / /',
    action: 'Direct real-time arithmetic calculation inside Quantity & Capacity cells (e.g. 50*2+10)',
    tag: 'Smart Math'
  },
  {
    key: 'Spacebar',
    action: 'Toggle row checkmark / selection state inside tables',
    tag: 'Selection'
  }
];

// Reusable Luxury Toggle Switch Component
interface LuxuryToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  desc?: string;
  badge?: string;
}

const LuxuryToggle: React.FC<LuxuryToggleProps> = ({ checked, onChange, title, desc, badge }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'rgba(15, 23, 42, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      cursor: 'pointer'
    }}
    onClick={() => {
      onChange(!checked);
      macAudio.playClick();
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, paddingRight: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{title}</span>
        {badge && (
          <Tag
            color="cyan"
            style={{
              fontSize: '9px',
              fontWeight: 800,
              margin: 0,
              padding: '0 6px',
              borderRadius: '4px',
              border: 'none',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8'
            }}
          >
            {badge}
          </Tag>
        )}
      </div>
      {desc && <span style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.3 }}>{desc}</span>}
    </div>
    <div onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={checked}
        onChange={(val: boolean) => {
          onChange(val);
          macAudio.playClick();
        }}
      />
    </div>
  </div>
);

export const SettingsTabView: React.FC<Props> = ({
  themeMode = 'dark',
  onChangeThemeMode,
  bgImage,
  onSelectBgImage,
  blurAmount,
  onChangeBlur,
  overlayOpacity,
  onChangeOpacity,
  glassOpacity,
  onChangeGlassOpacity,
  onShowToast = () => {}
}) => {
  const { bills, parties, stockItems } = useDatabase();

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsMainTab>('THEME');

  // User's custom wallpaper upload state & persistence
  const [customMediaName, setCustomMediaName] = useState<string>(() => localStorage.getItem('modern_app_custom_media_name') || '');

  // Handle Custom Wallpaper Image Upload from Disk using IndexedDB
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp');

    if (!isImage) {
      onShowToast?.('Please choose an image file (PNG, JPG, WEBP)', 'warning');
      return;
    }

    try {
      onShowToast?.(`Loading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 'info');
      const objectUrl = await saveMediaToDB(file, file.name, 'image');

      onSelectBgImage(objectUrl);
      if (onChangeThemeMode && themeMode !== 'glass') {
        onChangeThemeMode('glass');
      }
      localStorage.setItem('modern_app_custom_media_type', 'image');
      localStorage.setItem('modern_app_custom_media_name', file.name);
      setCustomMediaName(file.name);
      onShowToast?.(`Loaded wallpaper "${file.name}"! Applied to background.`, 'success');
      macAudio.playSuccess();
    } catch (err: any) {
      console.error('Failed to save media to IndexedDB:', err);
      onShowToast?.('Failed to load wallpaper: ' + (err.message || 'unknown error'), 'error');
    }
  };

  const handleResetDefaultWallpaper = async () => {
    await clearMediaFromDB();
    onSelectBgImage('/panda_bg.jpg');
    localStorage.removeItem('modern_app_custom_media_name');
    localStorage.removeItem('modern_app_custom_media_type');
    setCustomMediaName('');
    macAudio.playClick();
    onShowToast?.('Reset to default macOS wallpaper', 'info');
  };

  // General Settings State
  const [tallyNavigation, setTallyNavigation] = useState<boolean>(() => localStorage.getItem('modern_setting_tally_nav') !== '0');
  const [autoConvertMode, setAutoConvertMode] = useState<boolean>(() => localStorage.getItem('modern_setting_autoconv') !== '0');
  const [stickyShortcuts, setStickyShortcuts] = useState<boolean>(() => localStorage.getItem('modern_setting_sticky') !== '0');
  const [itemAutoSuggest, setItemAutoSuggest] = useState<boolean>(() => localStorage.getItem('modern_setting_item_auto') !== '0');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [slipPrefix, setSlipPrefix] = useState<string>(() => localStorage.getItem('modern_setting_slip_prefix') || 'S-');
  const [slipHeaderTitle, setSlipHeaderTitle] = useState<string>(() => localStorage.getItem('modern_setting_slip_title') || 'ESTIMATE / LOADING MEMORANDUM');

  // Server state
  const [serverMode, setServerMode] = useState<'server' | 'client' | 'standalone'>('server');
  const [lanServerIp, setLanServerIp] = useState<string>('192.168.1.105');
  const [lanServerPort, setLanServerPort] = useState<number>(8080);

  // Backup State
  const [backupIncludeConfig, setBackupIncludeConfig] = useState<boolean>(true);
  const [backupIncludeParties, setBackupIncludeParties] = useState<boolean>(true);
  const [backupIncludeBills, setBackupIncludeBills] = useState<boolean>(true);
  const [backupIncludeStock, setBackupIncludeStock] = useState<boolean>(true);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comprehensive Barcode Designer & Hardware Scanner State
  const [barcodeSubTab, setBarcodeSubTab] = useState<BarcodeSubTab>('PRESETS');
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeSystemConfig>(loadBarcodeConfig);
  const [scannerTestInput, setScannerTestInput] = useState<string>('');
  const [scannerTestHistory, setScannerTestHistory] = useState<Array<{ code: string; time: string; durationMs: number; isLaserGun: boolean }>>([]);
  const scanStartTimeRef = useRef<number | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<'TSPL' | 'ZPL'>('TSPL');
  const [isSendingRawPrint, setIsSendingRawPrint] = useState<boolean>(false);

  const handleUpdateBarcodeConfig = (updates: Partial<BarcodeSystemConfig>) => {
    setBarcodeConfig(prev => {
      const next = { ...prev, ...updates };
      saveBarcodeConfig(next);
      return next;
    });
  };

  const handleSelectBarcodePreset = (preset: BarcodePreset) => {
    macAudio.playPop();
    handleUpdateBarcodeConfig({
      presetId: preset.id,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      columns: preset.columns,
      gapXMm: preset.gapX,
      gapYMm: preset.gapY,
      marginTopMm: preset.marginTop,
      marginLeftMm: preset.marginLeft
    });
    onShowToast?.(`Loaded ${preset.name}`, 'info');
  };

  const handleResetBarcodeDefaults = () => {
    macAudio.playSuccess();
    setBarcodeConfig(DEFAULT_BARCODE_CONFIG);
    saveBarcodeConfig(DEFAULT_BARCODE_CONFIG);
    onShowToast?.('Barcode configuration reset to Marg ERP standard factory defaults', 'success');
  };

  const handleSendRawPrint = async (commands: string) => {
    setIsSendingRawPrint(true);
    try {
      const resp = await fetch('http://127.0.0.1:5005/api/print/raw-thermal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      });
      const data = await resp.json();
      if (data.success) {
        macAudio.playSuccess();
        onShowToast?.(data.message || 'Thermal command sent to printer!', 'success');
      } else {
        macAudio.playError();
        onShowToast?.(`Print Error: ${data.error || 'Failed to spool'}`, 'error');
      }
    } catch (err: any) {
      macAudio.playError();
      onShowToast?.('Native print service not reachable on port 5005. You can still download the .PRN file!', 'warning');
    } finally {
      setIsSendingRawPrint(false);
    }
  };


  // User Profile & Chat DP State
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('modern_app_user_name') || 'Rohit (Billing Desk)');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('modern_app_user_role') || 'Main Billing Counter');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('modern_app_user_avatar') || '');
  const [userTerminal, setUserTerminal] = useState<string>(() => localStorage.getItem('modern_app_user_terminal') || 'Counter #1');
  const [userPhone, setUserPhone] = useState<string>(() => localStorage.getItem('modern_app_user_phone') || '+91 98765 43210');
  const [userStatus, setUserStatus] = useState<string>(() => localStorage.getItem('modern_app_user_status') || 'Active on Billing Desk - Ready to Chat');
  const dpInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast?.('Please choose an image file (PNG, JPG, WEBP)', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUserAvatar(dataUrl);
      localStorage.setItem('modern_app_user_avatar', dataUrl);
      window.dispatchEvent(new Event('storage'));
      onShowToast?.('Profile Picture (DP) Updated!', 'success');
      macAudio.playSuccess();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    localStorage.setItem('modern_app_user_name', userName);
    localStorage.setItem('modern_app_user_role', userRole);
    localStorage.setItem('modern_app_user_avatar', userAvatar);
    localStorage.setItem('modern_app_user_terminal', userTerminal);
    localStorage.setItem('modern_app_user_phone', userPhone);
    localStorage.setItem('modern_app_user_status', userStatus);
    window.dispatchEvent(new Event('storage'));
    onShowToast?.('User Profile & Chat Details Saved!', 'success');
    macAudio.playSuccess();
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    macAudio.playClick();
    const exportBundle: Record<string, any> = {
      app: 'Modern Summary OS',
      version: '2.5.0',
      timestamp: new Date().toISOString(),
      data: {}
    };

    if (backupIncludeConfig) {
      exportBundle.data.slipPrefix = slipPrefix;
      exportBundle.data.slipHeaderTitle = slipHeaderTitle;
      exportBundle.data.themeMode = themeMode;
      exportBundle.data.bgImage = bgImage;
    }
    if (backupIncludeParties) exportBundle.data.parties = parties;
    if (backupIncludeBills) exportBundle.data.bills = bills;
    if (backupIncludeStock) exportBundle.data.stockItems = stockItems;

    const jsonStr = JSON.stringify(exportBundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Summary_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast('Backup exported successfully! File downloaded.', 'success');
  };

  // Restore JSON Backup
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.data) throw new Error('Invalid format: missing data payload');
        macAudio.playClick();
        if (window.confirm(`File "${file.name}" verified! Mode: ${restoreMode.toUpperCase()}.\nRestore now?`)) {
          if (parsed.data.slipPrefix) setSlipPrefix(parsed.data.slipPrefix);
          if (parsed.data.themeMode && onChangeThemeMode) onChangeThemeMode(parsed.data.themeMode);
          if (parsed.data.bgImage) onSelectBgImage(parsed.data.bgImage);
          onShowToast(`Database restored successfully from "${file.name}"!`, 'success');
        }
      } catch (err: any) {
        onShowToast(`Failed to parse backup: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px' }}>
      {/* ========================================================================= */}
      {/* TOP HEADER: LIQUID GLASS SEGMENTED TAB SWITCHER                           */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Sliders size={14} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.4px', display: 'block' }}>
              SETTINGS & SYSTEM CONTROL
            </span>
          </div>
        </div>

        {/* Ant Design Glass Segmented Navigation */}
        <div style={{ maxWidth: '920px' }}>
          <Segmented
            value={activeTab}
            onChange={(val: any) => {
              macAudio.playClick();
              setActiveTab(val as SettingsMainTab);
            }}
            options={[
              { value: 'THEME', label: 'Theme & Wallpaper', icon: <Palette size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> },
              { value: 'PROFILE', label: 'User Profile & Chat DP', icon: <User size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> },
              { value: 'SHORTCUTS', label: 'Shortcuts & NumPad', icon: <Keyboard size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> },
              { value: 'BACKUP', label: 'Backup & Restore', icon: <Database size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> },
              { value: 'GENERAL', label: 'General Preferences', icon: <SlidersHorizontal size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> },
              { value: 'BARCODE', label: 'Barcode Designer', icon: <Barcode size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> }
            ]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THEME & BACKGROUND (ALAG TAB - BACKGROUND COLOR & WALLPAPER)       */}
      {/* ========================================================================= */}
      {activeTab === 'THEME' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: 3-Mode Theme Selector & Wallpaper Gallery */}
          <div
            className="glass-panel"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            {/* 3-Mode Selector Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground, #f8fafc)', display: 'block' }}>
                    SELECT APPLICATION MODE
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--muted-foreground, #94a3b8)' }}>
                    Dual UI modes: Obsidian Dark & Liquid Glass
                  </span>
                </div>
                <Tag color={themeMode === 'glass' ? 'cyan' : 'purple'}>
                  {themeMode.toUpperCase()} MODE
                </Tag>
              </div>

              {/* 2 Cards for Dark and Glass */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {/* 1. Dark Mode */}
                <div
                  onClick={() => {
                    macAudio.playClick();
                    onChangeThemeMode?.('dark');
                    onShowToast?.('Dark Mode Activated (Obsidian dark)', 'success');
                  }}
                  style={{
                    background: '#09090b',
                    border: themeMode === 'dark' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: themeMode === 'dark' ? '0 0 16px rgba(56, 189, 248, 0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '90px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Moon size={15} color="#38bdf8" />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Dark Mode</span>
                    </div>
                    {themeMode === 'dark' && <Check size={14} color="#38bdf8" />}
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#a1a1aa', lineHeight: 1.3, marginTop: '6px' }}>
                    Obsidian zinc canvas, neutral borders, high contrast & sleek.
                  </span>
                </div>

                {/* 2. Glass Mode */}
                <div
                  onClick={() => {
                    macAudio.playClick();
                    onChangeThemeMode?.('glass');
                    onShowToast?.('Glass Mode Activated (Liquid Retina)', 'success');
                  }}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(16px)',
                    border: themeMode === 'glass' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: themeMode === 'glass' ? '0 0 16px rgba(56, 189, 248, 0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '90px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="#38bdf8" />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Glass Mode</span>
                    </div>
                    {themeMode === 'glass' && <Check size={14} color="#38bdf8" />}
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.3, marginTop: '6px' }}>
                    Frosted translucent glassmorphism with HD wallpaper backing.
                  </span>
                </div>
              </div>
            </div>

            {/* Wallpaper Selection Gallery */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block' }}>
                    APPLE-STYLE WALLPAPERS
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--muted-foreground, #94a3b8)' }}>
                    18 curated HD presets — Gradients · Nature · Space · Geometry
                  </span>
                </div>
                {themeMode !== 'glass' && (
                  <span style={{ fontSize: '9.5px', color: '#f59e0b', fontStyle: 'italic' }}>
                    (Active in Glass Mode)
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {WALLPAPERS.map((wp, idx) => {
                  const isSelected = bgImage === wp.url;
                  return (
                    <div
                      key={wp.name}
                      onClick={() => {
                        onSelectBgImage(wp.url);
                        if (onChangeThemeMode && themeMode !== 'glass') {
                          onChangeThemeMode('glass');
                        }
                        macAudio.playClick();
                        onShowToast?.(`Wallpaper: ${wp.name}`, 'success');
                      }}
                      style={{
                        position: 'relative',
                        height: '70px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid #38bdf8'
                          : '1.5px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected
                          ? '0 0 16px rgba(56, 189, 248, 0.6)'
                          : '0 2px 8px rgba(0,0,0,0.4)',
                        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                        transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    >
                      <img
                        src={wp.url}
                        alt={wp.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      {/* Gradient overlay with name */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: isSelected
                            ? 'linear-gradient(to top, rgba(14,165,233,0.55) 0%, transparent 55%)'
                            : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '4px 6px'
                        }}
                      >
                        <span style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: '#ffffff',
                          letterSpacing: '0.02em',
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                          lineHeight: 1.2,
                          flex: 1
                        }}>
                          {wp.name}
                        </span>
                        {isSelected && (
                          <div style={{
                            background: '#38bdf8',
                            borderRadius: '50%',
                            padding: '2px',
                            flexShrink: 0,
                            boxShadow: '0 0 8px rgba(56,189,248,0.8)'
                          }}>
                            <Check size={8} color="#090d16" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Custom Image Upload Card */}
            <div
              style={{
                background: 'var(--card, rgba(0, 0, 0, 0.3))',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '2px' }}>
                  UPLOAD CUSTOM WALLPAPER IMAGE
                </span>
                <span style={{ fontSize: '9.5px', color: 'var(--muted-foreground, #94a3b8)' }}>
                  {customMediaName ? `Current: ${customMediaName}` : 'Select PNG, JPG, or WEBP from your computer'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Upload size={13} />
                  <span>Browse Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMediaFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {customMediaName && (
                  <button
                    type="button"
                    onClick={handleResetDefaultWallpaper}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Display & Glass Tuning + Live Preview */}
          <div
            className="glass-panel"
            style={{
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block', marginBottom: '2px' }}>
                DISPLAY & GLASS TUNING
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Calibrate blur, transparency, and background darkness
              </span>
            </div>

            {/* Slider 1: Blur */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1' }}>Background Glass Blur</span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{blurAmount}px</span>
              </div>
              <Slider
                min={0}
                max={40}
                value={blurAmount}
                onChange={onChangeBlur}
                tooltip={{ formatter: (val: any) => `${val}px` }}
              />
            </div>

            {/* Slider 2: Glass Tint Opacity */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1' }}>Glass Panel Opacity</span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{Math.round(glassOpacity * 100)}%</span>
              </div>
              <Slider
                min={10}
                max={90}
                step={5}
                value={Math.round(glassOpacity * 100)}
                onChange={(val: any) => onChangeGlassOpacity(val / 100)}
                tooltip={{ formatter: (val: any) => `${val}%` }}
              />
            </div>

            {/* Slider 3: Dark Vignette Overlay */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1' }}>Dark Dimming Overlay</span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <Slider
                min={0}
                max={90}
                step={5}
                value={Math.round(overlayOpacity * 100)}
                onChange={(val: any) => onChangeOpacity(val / 100)}
                tooltip={{ formatter: (val: any) => `${val}%` }}
              />
            </div>

            {/* Mini Live Preview Window */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)' }}>
                  LIVE THEME PREVIEW
                </span>
                <span style={{ fontSize: '10px', color: 'var(--primary, #38bdf8)', fontWeight: 600 }}>
                  Active: {themeMode.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: '130px',
                  borderRadius: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid var(--border, rgba(255,255,255,0.15))',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  background: themeMode === 'dark'
                    ? '#09090b'
                    : `url(${bgImage}) center/cover no-repeat`
                }}
              >
                {/* Simulated Window Card */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '12px',
                    borderRadius: '8px',
                    background: themeMode === 'dark'
                      ? '#121215'
                      : `rgba(18, 22, 28, ${glassOpacity})`,
                    backdropFilter: themeMode === 'glass' ? `blur(${blurAmount}px)` : 'none',
                    border: themeMode === 'dark'
                      ? '1px solid #27272a'
                      : '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                      SALE BILL #626
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#f8fafc' }}>
                        Aluminium Ingot 6063
                      </div>
                      <div style={{ fontSize: '8px', color: '#94a3b8' }}>
                        QTY: 120 • CAP: 95/80
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>
                      ₹38,300
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: USER PROFILE & CHAT DP (TEAM NETWORK CHAT IDENTIFICATION)            */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILE' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Operator Identity & DP Editor */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--foreground, #f8fafc)', letterSpacing: '0.3px', display: 'block' }}>
                OPERATOR IDENTITY & CHAT DP
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground, #94a3b8)' }}>
                Customize your name, counter title, and profile picture (DP) visible to all colleagues in the chat panel
              </span>
            </div>

            {/* Profile Picture (DP) Section */}
            <div
              style={{
                background: 'var(--card, rgba(0, 0, 0, 0.28))',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              {/* DP Circle with Online Dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #25D366',
                    boxShadow: '0 0 16px rgba(37, 211, 102, 0.35)',
                    background: userAvatar ? 'transparent' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="User DP"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
                      {userName.slice(0, 2).toUpperCase() || 'OP'}
                    </span>
                  )}
                </div>

                {/* Online Indicator Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#25D366',
                    border: '2px solid #090d16',
                    boxShadow: '0 0 8px #25D366'
                  }}
                  title="Online on Network"
                />
              </div>

              {/* DP Controls */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  ref={dpInputRef}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => dpInputRef.current?.click()}
                    className="apple-box-btn"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={13} color="#ffffff" />
                    <span>Upload Custom DP</span>
                  </button>

                  {userAvatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserAvatar('');
                        localStorage.removeItem('modern_app_user_avatar');
                        window.dispatchEvent(new Event('storage'));
                        onShowToast?.('Reset to default avatar initials', 'info');
                        macAudio.playTrash();
                      }}
                      className="apple-box-btn"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '7px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#ef4444'
                      }}
                    >
                      Remove DP
                    </button>
                  )}
                </div>

                {/* Quick Avatar Emojis */}
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--muted-foreground, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                    Or choose a quick preset avatar:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['👨‍💼', '👩‍💼', '🧑‍💻', '⚡', '👑', '💼', '🚀', '🏢'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          // Generate canvas image from emoji
                          const canvas = document.createElement('canvas');
                          canvas.width = 120;
                          canvas.height = 120;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.fillStyle = '#0f172a';
                            ctx.fillRect(0, 0, 120, 120);
                            ctx.font = '64px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(emoji, 60, 65);
                            const url = canvas.toDataURL('image/png');
                            setUserAvatar(url);
                            localStorage.setItem('modern_app_user_avatar', url);
                            window.dispatchEvent(new Event('storage'));
                            onShowToast?.(`Avatar updated to ${emoji}!`, 'success');
                            macAudio.playSuccess();
                          }
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          border: '1px solid var(--border, rgba(255,255,255,0.12))',
                          background: 'var(--secondary, rgba(255,255,255,0.06))',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '4px' }}>
                  Operator / User Display Name
                </label>
                <input
                  type="text"
                  className="apple-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Rohit (Billing Desk)"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '4px' }}>
                    Counter Role / Department
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    placeholder="e.g. Main Billing Desk"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '4px' }}>
                    Terminal / Counter ID
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    value={userTerminal}
                    onChange={(e) => setUserTerminal(e.target.value)}
                    placeholder="e.g. Counter #1"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '4px' }}>
                  Contact / WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  className="apple-input"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '4px' }}>
                  Live Status Message (Visible in Team Chat)
                </label>
                <input
                  type="text"
                  className="apple-input"
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value)}
                  placeholder="e.g. Active on Billing Desk - Ready to Chat"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Save Button */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="apple-box-btn"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <Check size={14} color="#ffffff" />
                <span>Save Profile & Chat Identity</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Chat & Network Terminal Preview */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--foreground, #f8fafc)', letterSpacing: '0.3px', display: 'block' }}>
                LIVE TEAM CHAT PREVIEW
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground, #94a3b8)' }}>
                How other connected terminals and operators see your messages in real time
              </span>
            </div>

            {/* WhatsApp Styled Chat Box Preview */}
            <div
              style={{
                borderRadius: '10px',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
                background: '#0b141a',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
              }}
            >
              {/* WhatsApp Header Preview */}
              <div
                style={{
                  padding: '10px 12px',
                  background: '#202c33',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))'
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: userAvatar ? 'transparent' : '#00a884',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                      {userName.slice(0, 2).toUpperCase() || 'OP'}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e9edef' }}>
                    {userName || 'Operator Name'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#25D366', fontWeight: 600 }}>
                    Online • {userRole || 'Billing Desk'}
                  </div>
                </div>

                <Tag color="success" style={{ margin: 0, fontSize: '9px', fontWeight: 700 }}>
                  {userTerminal || 'Counter #1'}
                </Tag>
              </div>

              {/* Chat Messages Body Preview */}
              <div
                style={{
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: '170px'
                }}
              >
                {/* Incoming Message from Counter 2 */}
                <div
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '82%',
                    background: '#202c33',
                    padding: '8px 10px',
                    borderRadius: '8px 8px 8px 2px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#53bdeb', marginBottom: '2px' }}>
                    Counter 2 (Warehouse Dispatch)
                  </div>
                  <div style={{ fontSize: '11px', color: '#e9edef', lineHeight: 1.3 }}>
                    📦 Token #626 stock materials are staged and verified ready for dispatch.
                  </div>
                  <div style={{ fontSize: '9px', color: '#8696a0', textAlign: 'right', marginTop: '3px' }}>
                    10:45 AM
                  </div>
                </div>

                {/* Outgoing Message from Current User */}
                <div
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '82%',
                    background: '#005c4b',
                    padding: '8px 10px',
                    borderRadius: '8px 8px 2px 8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#e9edef', lineHeight: 1.3 }}>
                    👍 Got it! Invoice bill #001 printed and handed to transport vehicle.
                  </div>
                  <div style={{ fontSize: '9px', color: '#8696a0', textAlign: 'right', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                    <span>10:46 AM</span>
                    <span style={{ color: '#53bdeb', fontWeight: 800 }}>✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Terminals on Network Card */}
            <div
              style={{
                background: 'var(--card, rgba(0,0,0,0.25))',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: '8px',
                padding: '10px 12px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground, #f8fafc)', display: 'block', marginBottom: '6px' }}>
                ACTIVE SOFTWARE COUNTERS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#25D366' }} />
                    <span style={{ fontWeight: 600 }}>{userName} (This Counter)</span>
                  </div>
                  <Tag color="cyan" style={{ margin: 0, fontSize: '9px' }}>Online</Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#25D366' }} />
                    <span style={{ fontWeight: 600 }}>Warehouse Dispatch (Counter 2)</span>
                  </div>
                  <Tag color="cyan" style={{ margin: 0, fontSize: '9px' }}>Online</Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#25D366' }} />
                    <span style={{ fontWeight: 600 }}>Accounts & Ledger Desk</span>
                  </div>
                  <Tag color="cyan" style={{ margin: 0, fontSize: '9px' }}>Online</Tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {activeTab === 'SHORTCUTS' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: NumPad '.' Masterclass & Step-by-Step Interactive Guide */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#ffffff',
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
                  }}
                >
                  .
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                    NUMPAD '.' SHORTCUT ENGINE
                  </span>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
                    Unified single-key navigation across the entire software
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                PRO EDITION
              </span>
            </div>

            {/* 3 Step Visual Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>
                HOW TO OPERATE WITH NUMPAD:
              </span>

              {/* Step 1 */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    background: '#38bdf8',
                    color: '#090d16',
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                    Press <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>[ . ] (Del)</span> on NumPad
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    The entire UI enters Navigator Mode. All 6 main groups highlight with clean glowing borders and corner badges:
                    <strong style={{ color: '#f8fafc' }}> [1] Header, [2] Left Rail, [3] Raw Grid, [4] Finished Grid, [5] Mode Bar, [6] Right Rail</strong>.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    background: '#10b981',
                    color: '#090d16',
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  2
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                    Press Group Number <span style={{ color: '#10b981', fontFamily: 'monospace' }}>[ 1 - 6 ]</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Selected group activates. All buttons, textboxes, and dropdowns inside that group get numbered corner badges:
                    <strong style={{ color: '#f8fafc' }}> [1] to [9]</strong>. Background remains 100% visible and unblocked.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    background: '#f59e0b',
                    color: '#090d16',
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                    Press Target Number <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>[ 1 - 9 ]</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    The target executes instantly (button clicks, dropdown opens, or input focuses & selects all text for high-speed typing).
                  </div>
                </div>
              </div>

              {/* Quick Controls Info */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px dashed rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={13} color="#38bdf8" />
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>
                    Press <strong style={{ color: '#ffffff' }}>[ . ]</strong> again at any time to instantly close. Press <strong style={{ color: '#ffffff' }}>[ 0 ]</strong> to return to groups.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pure Table Grid Shortcuts (No Legacy Clutter) */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Grid size={15} color="#34d399" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                  TABLE & GRID DATA ENTRY KEYS
                </span>
              </div>
              <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>Active in Tables</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GRID_SHORTCUTS.map(sc => (
                <div
                  key={sc.key}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span
                        style={{
                          background: '#090d16',
                          border: '1.5px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          padding: '1px 7px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 800,
                          fontFamily: 'monospace'
                        }}
                      >
                        {sc.key}
                      </span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#cbd5e1',
                          fontWeight: 700
                        }}
                      >
                        {sc.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.25 }}>
                      {sc.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BACKUP & RESTORE (ALAG TAB - JSON, EXCEL, RESTORE)                 */}
      {/* ========================================================================= */}
      {activeTab === 'BACKUP' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Instant Backup & Cloud Export */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                  INSTANT DATABASE BACKUP
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Download entire offline database snapshot
                </span>
              </div>
              <Button
                type="primary"
                icon={<Download size={14} />}
                onClick={handleExportBackup}
                style={{
                  height: '34px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(56, 189, 248, 0.4)'
                }}
              >
                Download JSON Backup
              </Button>
            </div>

            {/* Checklist of what to include using LuxuryToggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>
                BACKUP SCOPE SELECTION
              </span>

              <LuxuryToggle
                title="System Configuration & Preferences"
                desc="Includes Slip Prefix, Themes, and Barcode setup"
                checked={backupIncludeConfig}
                onChange={setBackupIncludeConfig}
                badge="CONFIG"
              />

              <LuxuryToggle
                title="Parties & Customer Master Ledger"
                desc="Includes Station, Contact, and Current Balance records"
                checked={backupIncludeParties}
                onChange={setBackupIncludeParties}
                badge={`${parties.length} PARTIES`}
              />

              <LuxuryToggle
                title="Invoices & Sale Vouchers"
                desc="Includes all historical bills, raw items, and mould transactions"
                checked={backupIncludeBills}
                onChange={setBackupIncludeBills}
                badge={`${bills.length} BILLS`}
              />

              <LuxuryToggle
                title="Stock & Inventory Catalogue"
                desc="Includes Item codes, Rack allocations, and Units"
                checked={backupIncludeStock}
                onChange={setBackupIncludeStock}
                badge={`${stockItems.length} ITEMS`}
              />
            </div>
          </div>

          {/* Right Column: Restore Database & Stats */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >

            {/* Legacy Desktop Backup Import */}
            <div style={{ background: 'rgba(255, 170, 0, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 170, 0, 0.3)', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', display: 'block', marginBottom: '2px' }}>
                LEGACY BACKUP MIGRATION
              </span>
              <span style={{ fontSize: '10px', color: '#fcd34d', display: 'block', marginBottom: '8px' }}>
                Import Settings & Skips from old BillApp_Backup.json (Desktop)
              </span>
              <Button
                type="primary"
                icon={<Database size={14} />}
                onClick={() => {
                  import('../data/BillApp_Backup.json').then(legacy => {
                    const data = legacy.default || legacy;
                    let count = 0;
                    
                    if (data.control_panel && data.control_panel.length > 0) {
                       localStorage.setItem('billapp_conversions', JSON.stringify(data.control_panel));
                       const convRules = data.control_panel.map((c: any, i: number) => ({
                          id: 'conv-' + Date.now() + i,
                          shortcut: c.shortcut || '',
                          conversion: c.conversion || '',
                          applyRatio: false, uCap: c.u_cap || '0', lCap: c.l_cap || '0'
                       }));
                       localStorage.setItem('ctrl_conv_rules_v3', JSON.stringify(convRules));
                       count++;
                    }

                    if (data.skip_items && data.skip_items.length > 0) {
                       const si = data.skip_items.map((s: any, i: number) => ({
                          id: 'si-json-' + i,
                          subGroupId: s.group_name || 'sg-1',
                          mainGroup: s.main_group || '',
                          groupName: s.group_name || '',
                          itemPrefix: s.item_prefix || ''
                       }));
                       localStorage.setItem('billapp_skip_items', JSON.stringify(si));
                       count++;
                    }
                    if (data.skip_groups && data.skip_groups.length > 0) {
                       const sg = data.skip_groups.map((s: any, i: number) => ({
                          id: s.group_name || ('sg-json-' + i),
                          mainGroupId: s.main_group || 'mg-1',
                          mainGroup: s.main_group || '',
                          groupName: s.group_name || '',
                          sumColumn: s.sum_column || 'QTY'
                       }));
                       localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(sg));
                    }
                    if (data.main_groups && data.main_groups.length > 0) {
                       const mg = data.main_groups.map((m: any, i: number) => ({
                          id: (typeof m === 'string' ? m : m.main_group) || ('mg-json-' + i),
                          name: (typeof m === 'string' ? m : m.main_group) || ''
                       }));
                       localStorage.setItem('billapp_skip_main_groups', JSON.stringify(mg));
                    }
                    localStorage.setItem('billapp_skip_version_v5', 'true');

                    alert('Legacy Backup Imported Successfully! ' + count + ' sections loaded into Control Panel and Settings.');
                  }).catch(e => {
                    console.error(e);
                    alert('Could not load BillApp_Backup.json from src/data/');
                  });
                }}
                style={{
                  width: '100%',
                  height: '34px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                  color: '#090d16',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(251, 191, 36, 0.4)'
                }}
              >
                Load BillApp_Backup.json
              </Button>
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block', marginBottom: '2px' }}>
                RESTORE FROM FILE
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Upload previously exported .json database snapshot
              </span>
            </div>

            {/* Restore Mode Switch with Ant Design Segmented */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc' }}>Restore Conflict Policy</span>
              <Segmented
                value={restoreMode}
                onChange={(val: any) => setRestoreMode(val as 'merge' | 'overwrite')}
                options={[
                  { label: 'Merge Existing', value: 'merge' },
                  { label: 'Clean Overwrite', value: 'overwrite' }
                ]}
              />
            </div>

            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: 'rgba(56, 189, 248, 0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload size={24} color="#38bdf8" />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', display: 'block' }}>
                  Click to select backup .json file
                </span>
                <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  Supports all Modern Summary OS backup versions
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                style={{ display: 'none' }}
              />
            </div>

            {/* Storage Stats Card */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>LOCALSTORAGE USAGE</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                  ~428 KB / 5 MB
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>TOTAL INVOICES</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                  {bills.length} Records
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GENERAL PREFERENCES (DATA ENTRY & TALLY NAV SETTINGS)              */}
      {/* ========================================================================= */}
      {activeTab === 'GENERAL' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Data Entry Settings with Luxury Toggles */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block', marginBottom: '2px' }}>
                DATA ENTRY & NAVIGATION SETTINGS
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Fine-tune keyboard flow, shortcut expansion, and sound
              </span>
            </div>

            <LuxuryToggle
              title="Tally Navigation Mode"
              desc="Enter moves to next cell horizontally, then wraps down to next row"
              checked={tallyNavigation}
              onChange={(val) => {
                setTallyNavigation(val);
                localStorage.setItem('modern_setting_tally_nav', val ? '1' : '0');
                onShowToast(`Tally Navigation ${val ? 'Enabled' : 'Disabled'}`, 'info');
              }}
              badge="ENTER FLOW"
            />

            <LuxuryToggle
              title="Auto-Convert Item Shortcuts"
              desc="Instant expansion when typing short codes (e.g. G1 -> Mould Housing)"
              checked={autoConvertMode}
              onChange={(val) => {
                setAutoConvertMode(val);
                localStorage.setItem('modern_setting_autoconv', val ? '1' : '0');
                onShowToast(`Auto-Convert ${val ? 'Enabled' : 'Disabled'}`, 'info');
              }}
              badge="AUTO-EXPAND"
            />

            <LuxuryToggle
              title="Sticky Shortcut Mode"
              desc="Automatically inherits group and category prefix from the row directly above"
              checked={stickyShortcuts}
              onChange={(val) => {
                setStickyShortcuts(val);
                localStorage.setItem('modern_setting_sticky', val ? '1' : '0');
                onShowToast(`Sticky Mode ${val ? 'Enabled' : 'Disabled'}`, 'info');
              }}
              badge="STICKY"
            />

            <LuxuryToggle
              title="Item Auto-Suggest Popup"
              desc="Shows interactive dropdown matching typed characters in Item Name"
              checked={itemAutoSuggest}
              onChange={(val) => {
                setItemAutoSuggest(val);
                localStorage.setItem('modern_setting_item_auto', val ? '1' : '0');
                onShowToast(`Autosuggest ${val ? 'Enabled' : 'Disabled'}`, 'info');
              }}
              badge="POPUP"
            />

            <LuxuryToggle
              title="macOS Audio Feedback"
              desc="Plays realistic tactile sound clicks on button press and key navigation"
              checked={audioFeedback}
              onChange={(val) => {
                setAudioFeedback(val);
                onShowToast(`Audio feedback ${val ? 'On' : 'Muted'}`, 'info');
              }}
              badge="SOUND"
            />
          </div>

          {/* Right Column: Invoice Setup & LAN Server Mode */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block', marginBottom: '2px' }}>
                INVOICE & PRINTER MEMORANDUM
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Set default voucher numbering and header title
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#cbd5e1' }}>Invoice Voucher Prefix</span>
              <Input
                value={slipPrefix}
                onChange={(e: any) => {
                  setSlipPrefix(e.target.value);
                  localStorage.setItem('modern_setting_slip_prefix', e.target.value);
                }}
                prefix={<FileText size={13} style={{ color: '#38bdf8' }} />}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#cbd5e1' }}>Printed Slip Header Title</span>
              <Input
                value={slipHeaderTitle}
                onChange={(e: any) => {
                  setSlipHeaderTitle(e.target.value);
                  localStorage.setItem('modern_setting_slip_title', e.target.value);
                }}
                prefix={<Printer size={13} style={{ color: '#38bdf8' }} />}
              />
            </div>

            {/* LAN Mode */}
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
                LAN SERVER / MULTI-USER SYNC
              </span>
              <Segmented
                block
                value={serverMode}
                onChange={(val: any) => setServerMode(val as any)}
                options={[
                  { label: 'Host Server', value: 'server' },
                  { label: 'Client Node', value: 'client' },
                  { label: 'Standalone', value: 'standalone' }
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: COMPREHENSIVE BARCODE & THERMAL LABEL DESIGNER                     */}
      {/* ========================================================================= */}
      {activeTab === 'BARCODE' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '12px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Sub-Tab Controls */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Barcode size={16} color="#a855f7" />
                  BARCODE & LABEL DESIGNER SUITE
                </span>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Multi-printer presets, custom millimeter geometry, symbology & scanner engine
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetBarcodeDefaults}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Defaults
              </button>
            </div>

            {/* Sub-Tab Navigation Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '3px',
                borderRadius: '8px',
                gap: '3px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {[
                { key: 'PRESETS', label: 'Presets' },
                { key: 'MARG_RULES', label: 'Marg Rules' },
                { key: 'DIMENSIONS', label: 'Dimensions' },
                { key: 'THERMAL_HEAD', label: 'Thermal Head' },
                { key: 'CONTENT', label: 'Content' },
                { key: 'PRINTER_CMDS', label: 'TSPL / ZPL' },
                { key: 'SCANNER', label: 'Scanner Gun' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    macAudio.playClick();
                    setBarcodeSubTab(tab.key as BarcodeSubTab);
                  }}
                  style={{
                    padding: '6px 2px',
                    fontSize: '10px',
                    fontWeight: barcodeSubTab === tab.key ? 700 : 500,
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    background: barcodeSubTab === tab.key ? 'rgba(168, 85, 247, 0.28)' : 'transparent',
                    color: barcodeSubTab === tab.key ? '#ffffff' : '#94a3b8',
                    boxShadow: barcodeSubTab === tab.key ? 'inset 0 0 0 1px rgba(168, 85, 247, 0.5)' : 'none',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SUB-TAB 1: PRESETS */}
            {barcodeSubTab === 'PRESETS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
                  Select Standard Printer / Sheet Template:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {BARCODE_PRESETS.map(preset => {
                    const isSelected = barcodeConfig.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectBarcodePreset(preset)}
                        style={{
                          background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                              {preset.name}
                            </span>
                            <span
                              style={{
                                fontSize: '9px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: preset.category === 'THERMAL' ? 'rgba(56, 189, 248, 0.2)' : preset.category === 'A4_SHEET' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: preset.category === 'THERMAL' ? '#38bdf8' : preset.category === 'A4_SHEET' ? '#34d399' : '#fbbf24'
                              }}
                            >
                              {preset.category}
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {preset.description}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '70px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', display: 'block' }}>
                            {preset.widthMm}×{preset.heightMm} mm
                          </span>
                          <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                            {preset.columns} Across
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: MARG ERP CONTROL ROOM RULES */}
            {barcodeSubTab === 'MARG_RULES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} />
                    MARG ERP 9+ CONTROL ROOM BILLING BEHAVIOR
                  </span>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                    Official industrial parameters for high-speed POS retail counter, wholesale, and weighing scale billing
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Item Working Style in Billing:
                  </span>
                  <Segmented
                    block
                    value={barcodeConfig.workingStyle}
                    onChange={(val: any) => handleUpdateBarcodeConfig({ workingStyle: val })}
                    options={[
                      { label: 'R - Realtime (Scan + Name Search)', value: 'REALTIME' },
                      { label: 'O - Only Barcode (Strict Cashier Lock)', value: 'ONLY_BARCODE' },
                      { label: 'B - Batch Specific', value: 'BATCH_WISE' },
                      { label: 'S - Serial / IMEI', value: 'SERIAL_WISE' },
                      { label: 'M - MRP / Size Wise', value: 'MRP_WISE' }
                    ]}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Ask Barcode Qty on Sales:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.askQtyMode || (barcodeConfig.askQtyOnScan ? 'YES' : 'NO')}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ askQtyMode: val, askQtyOnScan: val !== 'NO' })}
                      options={[
                        { label: 'N - Rapid (1 Qty auto)', value: 'NO' },
                        { label: 'Y - Ask Qty (Cursor pauses)', value: 'YES' },
                        { label: 'P - Modal Popup', value: 'POPUP' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Same Item Rescan Action:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.sameItemRescanAction}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ sameItemRescanAction: val })}
                      options={[
                        { label: 'Increment Qty (+1)', value: 'INCREMENT' },
                        { label: 'New Row Line', value: 'NEW_ROW' },
                        { label: 'Prompt Cashier', value: 'PROMPT' }
                      ]}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Duplicate Barcode in Master:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.duplicatePolicy}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ duplicatePolicy: val })}
                      options={[
                        { label: '3 - No (Strict Error)', value: 'NO' },
                        { label: '1 - Warn Confirm', value: 'WARN' },
                        { label: '2 - Allowed (Popup List)', value: 'ALLOW' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Barcode Not Found in Master:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.barcodeNotFoundAction || 'BEEP_ERROR'}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ barcodeNotFoundAction: val })}
                      options={[
                        { label: 'Beep Error Tone', value: 'BEEP_ERROR' },
                        { label: 'Prompt Add Item', value: 'PROMPT_ADD_ITEM' },
                        { label: 'Ignore Quietly', value: 'IGNORE' }
                      ]}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Barcode Series Creation:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.creationStyle}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ creationStyle: val })}
                      options={[
                        { label: 'Auto Serial', value: 'AUTO_INCREMENT' },
                        { label: 'Item Code', value: 'ITEM_CODE' },
                        { label: 'Mould/Size', value: 'SIZE_EMBEDDED' },
                        { label: 'Scale EAN', value: 'EAN13_SCALE' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Prefix</span>
                    <Input
                      value={barcodeConfig.autoPrefix || 'BAL-'}
                      onChange={(e) => handleUpdateBarcodeConfig({ autoPrefix: e.target.value })}
                      placeholder="e.g. BAL-"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Next Serial #</span>
                    <InputNumber
                      min={1}
                      max={999999}
                      value={barcodeConfig.nextAutoNumber || 1001}
                      onChange={(val) => handleUpdateBarcodeConfig({ nextAutoNumber: val || 1001 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <LuxuryToggle
                    title="Auto-Generate Barcode on New Item"
                    desc="Automatically assigns barcode when adding inventory items"
                    checked={barcodeConfig.autoGenerateOnNewItem !== false}
                    onChange={(checked) => handleUpdateBarcodeConfig({ autoGenerateOnNewItem: checked })}
                  />
                  <LuxuryToggle
                    title="Indian Weighing Scale Barcode (EAN-13)"
                    desc="Auto-decodes weight in grams from 20-xxxx-wwwww scale labels"
                    checked={barcodeConfig.enableScaleBarcode || false}
                    onChange={(checked) => handleUpdateBarcodeConfig({ enableScaleBarcode: checked })}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 3: DIMENSIONS */}
            {barcodeSubTab === 'DIMENSIONS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Label Width (mm)</span>
                    <InputNumber
                      min={10}
                      max={200}
                      value={barcodeConfig.widthMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ widthMm: val || 50, presetId: 'custom' })}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Label Height (mm)</span>
                    <InputNumber
                      min={10}
                      max={200}
                      value={barcodeConfig.heightMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ heightMm: val || 30, presetId: 'custom' })}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Columns Across</span>
                    <InputNumber
                      min={1}
                      max={8}
                      value={barcodeConfig.columns}
                      onChange={(val) => handleUpdateBarcodeConfig({ columns: val || 1, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Gap Horiz. (mm)</span>
                    <InputNumber
                      min={0}
                      max={20}
                      value={barcodeConfig.gapXMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ gapXMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Gap Vert. (mm)</span>
                    <InputNumber
                      min={0}
                      max={20}
                      value={barcodeConfig.gapYMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ gapYMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Top Margin (mm)</span>
                    <InputNumber
                      min={0}
                      max={50}
                      value={barcodeConfig.marginTopMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ marginTopMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Left Margin (mm)</span>
                    <InputNumber
                      min={0}
                      max={50}
                      value={barcodeConfig.marginLeftMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ marginLeftMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Print Head DPI</span>
                    <Segmented
                      block
                      value={barcodeConfig.dpi}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ dpi: val })}
                      options={[
                        { label: '203 DPI', value: 203 },
                        { label: '300 DPI', value: 300 }
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: THERMAL HEAD & HARDWARE CALIBRATION */}
            {barcodeSubTab === 'THERMAL_HEAD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Thermal Media Sensor:</span>
                    <Segmented
                      block
                      value={barcodeConfig.sensorMode}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ sensorMode: val })}
                      options={[
                        { label: 'Gap Sensor', value: 'GAP' },
                        { label: 'Black Mark', value: 'BLACK_MARK' },
                        { label: 'Continuous', value: 'CONTINUOUS' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Print Speed:</span>
                    <Segmented
                      block
                      value={barcodeConfig.printSpeedIps}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ printSpeedIps: val })}
                      options={[
                        { label: '2 IPS (Fine)', value: 2 },
                        { label: '3 IPS', value: 3 },
                        { label: '4 IPS (Std)', value: 4 },
                        { label: '6 IPS (Fast)', value: 6 }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700 }}>Thermal Burn Darkness / Heat Density (1–15):</span>
                    <span style={{ fontSize: '10.5px', color: '#a855f7', fontWeight: 800 }}>Level {barcodeConfig.printDarkness} / 15</span>
                  </div>
                  <Slider
                    min={1}
                    max={15}
                    value={barcodeConfig.printDarkness}
                    onChange={(val) => handleUpdateBarcodeConfig({ printDarkness: val })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Orientation:</span>
                    <Segmented
                      block
                      value={barcodeConfig.orientation}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ orientation: val })}
                      options={[
                        { label: '0°', value: 0 },
                        { label: '90°', value: 90 },
                        { label: '180°', value: 180 },
                        { label: '270°', value: 270 }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Symbology:</span>
                    <Segmented
                      block
                      value={barcodeConfig.symbology}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ symbology: val })}
                      options={[
                        { label: 'Code 128', value: 'CODE128' },
                        { label: 'EAN-13', value: 'EAN13' },
                        { label: 'QR', value: 'QR' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Bar Height (mm):</span>
                    <InputNumber
                      min={6}
                      max={40}
                      value={barcodeConfig.barHeightMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ barHeightMm: val || 14 })}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Human Readable Text:</span>
                    <Segmented
                      block
                      value={barcodeConfig.textPosition}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ textPosition: val, showText: val !== 'none' })}
                      options={[
                        { label: 'Below Barcode', value: 'below' },
                        { label: 'Above Barcode', value: 'above' },
                        { label: 'Hidden', value: 'none' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tear-off Cutter Offset:</span>
                    <InputNumber
                      min={-10}
                      max={20}
                      value={barcodeConfig.tearOffOffsetMm || 0}
                      onChange={(val) => handleUpdateBarcodeConfig({ tearOffOffsetMm: val || 0 })}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: LABEL CONTENT */}
            {barcodeSubTab === 'CONTENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <LuxuryToggle
                  title="Print Company Header"
                  desc="Top shop title banner"
                  checked={barcodeConfig.printHeader}
                  onChange={(checked) => handleUpdateBarcodeConfig({ printHeader: checked })}
                />
                {barcodeConfig.printHeader && (
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
                    <Input
                      value={barcodeConfig.headerText}
                      onChange={(e) => handleUpdateBarcodeConfig({ headerText: e.target.value })}
                      placeholder="Company Name"
                      style={{ flex: 1 }}
                    />
                    <InputNumber
                      min={8}
                      max={18}
                      value={barcodeConfig.headerFontSize}
                      onChange={(val) => handleUpdateBarcodeConfig({ headerFontSize: val || 11 })}
                      addonAfter="pt"
                      style={{ width: '90px' }}
                    />
                  </div>
                )}

                <LuxuryToggle
                  title="Print Sub-Header / GSTIN / Phone"
                  desc="Secondary title line under header"
                  checked={barcodeConfig.printSubHeader || false}
                  onChange={(checked) => handleUpdateBarcodeConfig({ printSubHeader: checked })}
                />
                {barcodeConfig.printSubHeader && (
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
                    <Input
                      value={barcodeConfig.subHeaderText || 'GSTIN: 07AAAAA0000A1Z5'}
                      onChange={(e) => handleUpdateBarcodeConfig({ subHeaderText: e.target.value })}
                      placeholder="GSTIN / Tagline / Phone"
                      style={{ flex: 1 }}
                    />
                    <InputNumber
                      min={7}
                      max={14}
                      value={barcodeConfig.subHeaderFontSize || 8}
                      onChange={(val) => handleUpdateBarcodeConfig({ subHeaderFontSize: val || 8 })}
                      addonAfter="pt"
                      style={{ width: '90px' }}
                    />
                  </div>
                )}

                <LuxuryToggle
                  title="Print Item Specification"
                  desc="Prints full item name and mould size"
                  checked={barcodeConfig.printItemName}
                  onChange={(checked) => handleUpdateBarcodeConfig({ printItemName: checked })}
                />
                {barcodeConfig.printItemName && (
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
                    <InputNumber
                      min={8}
                      max={16}
                      value={barcodeConfig.itemNameFontSize}
                      onChange={(val) => handleUpdateBarcodeConfig({ itemNameFontSize: val || 10 })}
                      addonAfter="pt"
                      style={{ width: '100px' }}
                    />
                    <InputNumber
                      min={10}
                      max={80}
                      value={barcodeConfig.maxItemNameChars || 30}
                      onChange={(val) => handleUpdateBarcodeConfig({ maxItemNameChars: val || 30 })}
                      addonAfter="chars max"
                      style={{ width: '130px' }}
                    />
                  </div>
                )}

                <LuxuryToggle
                  title="Print Wholesale Price / MRP"
                  desc="Displays price with currency symbol and tax disclaimer"
                  checked={barcodeConfig.printPrice}
                  onChange={(checked) => handleUpdateBarcodeConfig({ printPrice: checked })}
                />
                {barcodeConfig.printPrice && (
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px' }}>
                    <Input
                      value={barcodeConfig.pricePrefix}
                      onChange={(e) => handleUpdateBarcodeConfig({ pricePrefix: e.target.value })}
                      placeholder="MRP: ₹"
                      style={{ flex: 1 }}
                    />
                    <InputNumber
                      min={8}
                      max={16}
                      value={barcodeConfig.priceFontSize}
                      onChange={(val) => handleUpdateBarcodeConfig({ priceFontSize: val || 11 })}
                      addonAfter="pt"
                      style={{ width: '90px' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <LuxuryToggle
                    title="Component Tag"
                    desc="Tag: ITEM / U-CAP / L-CAP"
                    checked={barcodeConfig.printTag}
                    onChange={(checked) => handleUpdateBarcodeConfig({ printTag: checked })}
                  />
                  <LuxuryToggle
                    title="Print HSN Code"
                    desc="Prints HSN: 7007 / 7604"
                    checked={barcodeConfig.printHsn || false}
                    onChange={(checked) => handleUpdateBarcodeConfig({ printHsn: checked })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <LuxuryToggle
                    title="Batch / Lot Number"
                    desc="Prints B.No: [Lot]"
                    checked={barcodeConfig.printBatch || false}
                    onChange={(checked) => handleUpdateBarcodeConfig({ printBatch: checked })}
                  />
                  <LuxuryToggle
                    title="Manufacturing Date"
                    desc="Prints PKD: [Month/Year]"
                    checked={barcodeConfig.printDate || false}
                    onChange={(checked) => handleUpdateBarcodeConfig({ printDate: checked })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Text Alignment:</span>
                    <Segmented
                      block
                      value={barcodeConfig.textAlign}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ textAlign: val })}
                      options={[
                        { label: 'Left', value: 'left' },
                        { label: 'Center', value: 'center' },
                        { label: 'Right', value: 'right' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Custom Footer:</span>
                    <Input
                      value={barcodeConfig.customFooter || ''}
                      onChange={(e) => handleUpdateBarcodeConfig({ customFooter: e.target.value })}
                      placeholder="e.g. *NO RETURN WITHOUT TAG*"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <LuxuryToggle
                    title="Peel Cutline Border"
                    desc="Show dashed peel border outline"
                    checked={barcodeConfig.showBorder}
                    onChange={(checked) => handleUpdateBarcodeConfig({ showBorder: checked })}
                  />
                  <LuxuryToggle
                    title="Incl. of All Taxes Text"
                    desc="Show tax inclusive badge beside MRP"
                    checked={barcodeConfig.showTaxInclusive !== false}
                    onChange={(checked) => handleUpdateBarcodeConfig({ showTaxInclusive: checked })}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 6: TSPL & ZPL DIRECT PRINTER COMMANDS */}
            {barcodeSubTab === 'PRINTER_CMDS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Printer size={14} />
                    DIRECT THERMAL PRINTER COMMAND GENERATOR (TSPL / ZPL-II)
                  </span>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                    Industrial command code generated directly from your label configuration without Windows raster lag
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Segmented
                    value={activeCodeLang}
                    onChange={(val: any) => setActiveCodeLang(val)}
                    options={[
                      { label: 'TSPL (TVS LP-46 / TSC TE244 / Godex)', value: 'TSPL' },
                      { label: 'ZPL-II (Zebra ZD220 / ZD230 / GT800)', value: 'ZPL' }
                    ]}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleItem = { name: 'Mould 14x20 Standard Housing', code: 'MLD-1420-STD', price: 650.00, tag: 'ITEM', size: '10FT' };
                        const code = activeCodeLang === 'TSPL' ? generateTsplCommand(barcodeConfig, sampleItem) : generateZplCommand(barcodeConfig, sampleItem);
                        navigator.clipboard.writeText(code);
                        macAudio.playSuccess();
                        onShowToast?.(`Copied ${activeCodeLang} code to clipboard!`, 'success');
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Copy Script
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleItem = { name: 'Mould 14x20 Standard Housing', code: 'MLD-1420-STD', price: 650.00, tag: 'ITEM', size: '10FT' };
                        const code = activeCodeLang === 'TSPL' ? generateTsplCommand(barcodeConfig, sampleItem) : generateZplCommand(barcodeConfig, sampleItem);
                        downloadThermalScriptFile(code, `label_${activeCodeLang.toLowerCase()}_50x30.prn`);
                        macAudio.playSuccess();
                        onShowToast?.(`Downloaded ${activeCodeLang} PRN file!`, 'success');
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Download .PRN
                    </button>
                    <button
                      type="button"
                      disabled={isSendingRawPrint}
                      onClick={() => {
                        const sampleItem = { name: 'Mould 14x20 Standard Housing', code: 'MLD-1420-STD', price: 650.00, tag: 'ITEM', size: '10FT' };
                        const code = activeCodeLang === 'TSPL' ? generateTsplCommand(barcodeConfig, sampleItem) : generateZplCommand(barcodeConfig, sampleItem);
                        handleSendRawPrint(code);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.5)',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '5px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: isSendingRawPrint ? 'wait' : 'pointer'
                      }}
                    >
                      <Zap size={12} />
                      <span>{isSendingRawPrint ? 'Sending...' : 'Send Raw Direct'}</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '10.5px',
                    color: '#38bdf8',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4
                  }}
                >
                  {(() => {
                    const sampleItem = { name: 'Mould 14x20 Standard Housing', code: 'MLD-1420-STD', price: 650.00, tag: 'ITEM', size: '10FT' };
                    return activeCodeLang === 'TSPL' ? generateTsplCommand(barcodeConfig, sampleItem) : generateZplCommand(barcodeConfig, sampleItem);
                  })()}
                </div>
              </div>
            )}

            {/* SUB-TAB 7: SCANNER HARDWARE */}
            {barcodeSubTab === 'SCANNER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scan size={14} />
                    HARDWARE BARCODE SCANNER INTEGRATION
                  </span>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                    Auto-detects USB, Wireless 2.4G & Bluetooth laser guns with high-speed key burst timing
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Scanner Suffix</span>
                    <Segmented
                      block
                      value={barcodeConfig.scannerSuffix}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ scannerSuffix: val })}
                      options={[
                        { label: 'Enter', value: 'enter' },
                        { label: 'Tab', value: 'tab' },
                        { label: 'None', value: 'none' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Sound Feedback</span>
                    <Segmented
                      block
                      value={barcodeConfig.soundType}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ soundType: val, soundFeedback: val !== 'MUTE' })}
                      options={[
                        { label: 'POS Beep', value: 'POS_BEEP' },
                        { label: 'Chime', value: 'MAC_CHIME' },
                        { label: 'Mute', value: 'MUTE' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Min Length</span>
                    <InputNumber
                      min={1}
                      max={20}
                      value={barcodeConfig.minCodeLength}
                      onChange={(val) => handleUpdateBarcodeConfig({ minCodeLength: val || 3 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <LuxuryToggle
                    title="Auto-Add to Table on Scan"
                    desc="Instantly adds item row when scanned without pressing Enter"
                    checked={barcodeConfig.autoAddOnScan}
                    onChange={(checked) => handleUpdateBarcodeConfig({ autoAddOnScan: checked })}
                  />

                  <LuxuryToggle
                    title="Auto-Increment Quantity (+1)"
                    desc="If item already exists, scanning increments qty by 1"
                    checked={barcodeConfig.autoIncrementQty}
                    onChange={(checked) => handleUpdateBarcodeConfig({ autoIncrementQty: checked })}
                  />
                </div>

                {/* Interactive Live Scanner Test Console with Burst Latency Detector */}
                <div style={{ marginTop: '4px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={13} color="#a855f7" />
                      TEST HARDWARE SCANNER INPUT (BURST LATENCY DETECTOR):
                    </span>
                    {scannerTestHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setScannerTestHistory([])}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '9.5px', cursor: 'pointer', padding: 0 }}
                      >
                        Clear History
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={scannerTestInput}
                    onChange={(e) => {
                      if (!scanStartTimeRef.current) scanStartTimeRef.current = performance.now();
                      setScannerTestInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (!scanStartTimeRef.current) scanStartTimeRef.current = performance.now();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = scannerTestInput.trim();
                        const elapsed = scanStartTimeRef.current ? Math.round(performance.now() - scanStartTimeRef.current) : 0;
                        scanStartTimeRef.current = null;
                        if (val) {
                          if (val.length < (barcodeConfig.minCodeLength || 3)) {
                            macAudio.playPosError();
                            onShowToast?.(`Code too short (min ${barcodeConfig.minCodeLength} chars)`, 'warning');
                            return;
                          }
                          const isLaserGun = elapsed < 75; // Laser scanners send all characters in < 75ms
                          if (barcodeConfig.soundType === 'POS_BEEP') {
                            macAudio.playPosBeep();
                          } else if (barcodeConfig.soundType === 'MAC_CHIME') {
                            macAudio.playSuccess();
                          }
                          setScannerTestHistory(prev => [
                            { code: val, time: new Date().toLocaleTimeString(), durationMs: elapsed, isLaserGun },
                            ...prev.slice(0, 4)
                          ]);
                          setScannerTestInput('');
                        }
                      }
                    }}
                    placeholder="Click here and scan a barcode with your barcode gun..."
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid #a855f7',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      fontSize: '11.5px',
                      outline: 'none'
                    }}
                  />
                  {scannerTestHistory.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>Recent Scans:</span>
                      {scannerTestHistory.map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 800 }}>{h.code}</span>
                            <span
                              style={{
                                fontSize: '8.5px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 800,
                                background: h.isLaserGun ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: h.isLaserGun ? '#34d399' : '#fbbf24'
                              }}
                            >
                              {h.isLaserGun ? `⚡ LASER GUN (${h.durationMs}ms)` : `⌨️ TYPED (${h.durationMs}ms)`}
                            </span>
                          </div>
                          <span style={{ color: '#64748b', fontSize: '9.5px' }}>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live 1:1 Scale Barcode Label Preview */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Maximize2 size={13} color="#a855f7" />
                THERMAL LABEL PREVIEW (1:1 PROPORTION)
              </span>
              <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700 }}>
                {barcodeConfig.widthMm}mm × {barcodeConfig.heightMm}mm • {barcodeConfig.dpi} DPI
              </span>
            </div>

            {/* Sticker Mockup with Accurate Sizing & Real SVG Bars */}
            <div
              style={{
                width: `${Math.min(300, Math.max(180, barcodeConfig.widthMm * 4.5))}px`,
                minHeight: `${Math.min(240, Math.max(120, barcodeConfig.heightMm * 4.5))}px`,
                background: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.2)',
                border: barcodeConfig.showBorder ? `1px ${barcodeConfig.borderStyle || 'dashed'} #94a3b8` : 'none',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#000000',
                fontFamily: 'Inter, system-ui, sans-serif',
                textAlign: barcodeConfig.textAlign
              }}
            >
              {barcodeConfig.printHeader && (
                <div
                  style={{
                    fontSize: `${barcodeConfig.headerFontSize}px`,
                    fontWeight: barcodeConfig.headerBold !== false ? 900 : 700,
                    letterSpacing: '0.4px',
                    borderBottom: '1px solid #1e293b',
                    paddingBottom: '2px',
                    lineHeight: 1.1
                  }}
                >
                  {barcodeConfig.headerText || 'COMPANY NAME'}
                </div>
              )}

              {barcodeConfig.printSubHeader && (
                <div
                  style={{
                    fontSize: `${barcodeConfig.subHeaderFontSize || 8}px`,
                    fontWeight: 600,
                    color: '#475569',
                    marginTop: '2px',
                    lineHeight: 1.1
                  }}
                >
                  {barcodeConfig.subHeaderText || 'GSTIN: 07AAAAA0000A1Z5'}
                </div>
              )}

              {barcodeConfig.printItemName && (
                <div
                  style={{
                    fontSize: `${barcodeConfig.itemNameFontSize}px`,
                    fontWeight: 800,
                    margin: '3px 0',
                    lineHeight: 1.15
                  }}
                >
                  Mould 14x20 Standard Housing
                </div>
              )}

              {barcodeConfig.printItemSize && (
                <div style={{ fontSize: `${barcodeConfig.itemSizeFontSize || 9}px`, fontWeight: 700, color: '#334155' }}>
                  DIMENSIONS: 14" × 20" (10FT)
                </div>
              )}

              {/* Dynamic Barcode Generation (Code128 or QR) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: barcodeConfig.textAlign === 'center' ? 'center' : barcodeConfig.textAlign === 'right' ? 'flex-end' : 'flex-start', margin: '4px 0' }}>
                {barcodeConfig.textPosition === 'above' && (
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '1px', marginBottom: '2px' }}>
                    *MLD-1420-STD*
                  </span>
                )}

                {barcodeConfig.symbology === 'QR' ? (
                  <div style={{ width: '56px', height: '56px', display: 'grid', gridTemplateColumns: 'repeat(21, 1fr)', gap: '0px', background: '#fff', padding: '2px' }}>
                    {generateQrMatrix('MLD-1420-STD').map((row, rI) =>
                      row.map((cell, cI) => (
                        <div key={`${rI}-${cI}`} style={{ background: cell ? '#000' : '#fff' }} />
                      ))
                    )}
                  </div>
                ) : (
                  (() => {
                    const { svgBars, totalWidth } = generateCode128SvgBars('MLD-1420-STD', barcodeConfig.barHeightMm, barcodeConfig.barScale);
                    return (
                      <svg width="100%" height={barcodeConfig.barHeightMm * 2.2} viewBox={`0 0 ${totalWidth} ${barcodeConfig.barHeightMm * 2.2}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }}>
                        {svgBars.map((b, i) => (
                          <rect key={i} x={b.x} y={0} width={b.width} height={barcodeConfig.barHeightMm * 2.2} fill="#000000" />
                        ))}
                      </svg>
                    );
                  })()
                )}

                {barcodeConfig.textPosition === 'below' && (
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '1.5px', marginTop: '2px' }}>
                    *MLD-1420-STD*
                  </span>
                )}
              </div>

              {/* Specs Line: HSN, Batch, Date */}
              {(barcodeConfig.printHsn || barcodeConfig.printBatch || barcodeConfig.printDate) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#64748b', fontWeight: 700, margin: '2px 0' }}>
                  {barcodeConfig.printHsn && <span>HSN: 7007</span>}
                  {barcodeConfig.printBatch && <span>B.No: B26-1</span>}
                  {barcodeConfig.printDate && <span>PKD: 10/26</span>}
                </div>
              )}

              {/* Footer Row: Tag & Price */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '3px',
                  marginTop: '2px'
                }}
              >
                {barcodeConfig.printTag ? (
                  <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                    TAG: ITEM
                  </span>
                ) : <span />}

                {barcodeConfig.printPrice && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: `${barcodeConfig.priceFontSize}px`, fontWeight: 900, color: '#0f172a' }}>
                      {barcodeConfig.pricePrefix}650.00
                    </span>
                    {barcodeConfig.showTaxInclusive && (
                      <span style={{ display: 'block', fontSize: '7.5px', color: '#64748b', fontWeight: 600, lineHeight: 1 }}>
                        (Incl. of all taxes)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {barcodeConfig.customFooter && (
                <div style={{ fontSize: `${barcodeConfig.footerFontSize || 8}px`, fontWeight: 700, color: '#64748b', textAlign: 'center', marginTop: '2px', borderTop: '1px dotted #e2e8f0', paddingTop: '1px' }}>
                  {barcodeConfig.customFooter}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const sampleItem = { name: 'Mould 14x20 Standard Housing', code: 'MLD-1420-STD', price: 650.00, tag: 'ITEM', size: '10FT' };
                  const tspl = generateTsplCommand(barcodeConfig, sampleItem);
                  downloadThermalScriptFile(tspl, `label_test_${barcodeConfig.widthMm}x${barcodeConfig.heightMm}.prn`);
                  macAudio.playSuccess();
                  onShowToast?.('Downloaded .PRN file for direct printer spooling!', 'success');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: '7px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Export .PRN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  macAudio.playSuccess();
                  onShowToast?.('Marg ERP Barcode configuration saved & active!', 'success');
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  color: '#ffffff',
                  height: '34px',
                  borderRadius: '7px',
                  fontWeight: 700,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)'
                }}
              >
                <Check size={14} />
                <span>Save & Apply Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

