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
  FileText
} from 'lucide-react';
import { saveMediaToDB, clearMediaFromDB } from '../services/mediaStorage';

export type SettingsMainTab = 'THEME' | 'SHORTCUTS' | 'BACKUP' | 'GENERAL' | 'BARCODE';
export type BarcodeSubTab = 'PAGE_SETUP' | 'LABEL_LAYOUT' | 'CONTENT_FIELDS' | 'ELEMENT_PLACEMENTS';

interface Props {
  bgType: 'image' | 'color' | 'video';
  onChangeBgType: (type: 'image' | 'color' | 'video') => void;
  bgImage: string;
  onSelectBgImage: (url: string) => void;
  bgVideo: string;
  onSelectBgVideo: (url: string) => void;
  bgColor: string;
  onChangeBgColor: (color: string) => void;
  blurAmount: number;
  onChangeBlur: (blur: number) => void;
  overlayOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  glassOpacity: number;
  onChangeGlassOpacity: (opacity: number) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// Curated Luxury Color Palettes
const LUXURY_BG_COLORS = [
  { name: 'Midnight Slate', val: '#0f172a', desc: 'Deep macOS Slate' },
  { name: 'Obsidian Jet', val: '#090d16', desc: 'Pure Dark Glass' },
  { name: 'Royal Dark Velvet', val: '#2e1065', desc: 'Plum & Indigo Violet' },
  { name: 'Oceanic Abyss', val: '#0c4a6e', desc: 'Deep Marine Blue' },
  { name: 'Emerald Forest', val: '#064e3b', desc: 'Dark Nordic Pine' },
  { name: 'Crimson Wine', val: '#450a0a', desc: 'Luxury Bordeaux' },
  { name: 'Warm Charcoal', val: '#1c1917', desc: 'Titanium Dark' },
  { name: 'Pure Carbon', val: '#000000', desc: 'OLED Zero Black' }
];

// Curated macOS Wallpapers
const WALLPAPERS = [
  { name: 'Sonoma Horizon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Ventura Wave', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Cyber Obsidian', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Neon Flow', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Mojave Night', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Dark Crystal Glass', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' }
];

// Curated Luxury Looping Motion Videos
const MOTION_VIDEOS = [
  {
    name: 'Your Video (165790)',
    url: '/custom_video.mp4',
    desc: '165790-833532137_medium.mp4'
  },
  {
    name: 'Cyber Network Waves',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-dark-cyber-network-animation-43118-large.mp4',
    desc: 'Deep Blue Cyber Nodes'
  },
  {
    name: 'Liquid Neon Aurora',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-wavy-lines-of-light-with-blue-and-purple-tones-42617-large.mp4',
    desc: 'Purple & Violet Waves'
  },
  {
    name: 'Deep Oceanic Flow',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-underwater-surface-of-the-ocean-4156-large.mp4',
    desc: 'Ambient Fluid Water'
  },
  {
    name: 'Liquid Metal Chrome',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-of-metal-liquid-43403-large.mp4',
    desc: 'Silver Titanium Ripples'
  }
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
        onChange={(val) => {
          onChange(val);
          macAudio.playClick();
        }}
      />
    </div>
  </div>
);

export const SettingsTabView: React.FC<Props> = ({
  bgType,
  onChangeBgType,
  bgImage,
  onSelectBgImage,
  bgVideo,
  onSelectBgVideo,
  bgColor,
  onChangeBgColor,
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

  // Custom Color Input State
  const [customHex, setCustomHex] = useState<string>(bgColor);
  useEffect(() => {
    setCustomHex(bgColor);
  }, [bgColor]);

  // User's custom file upload state & persistence (Supports Image & Video)
  const [customMediaName, setCustomMediaName] = useState<string>(() => localStorage.getItem('modern_app_custom_media_name') || '');
  const [customMediaType, setCustomMediaType] = useState<'image' | 'video' | ''>(() => (localStorage.getItem('modern_app_custom_media_type') as any) || '');
  const [manualVideoPath, setManualVideoPath] = useState<string>('/custom_video.mp4');

  // Handle Custom Image or Video Upload from Disk using IndexedDB (bypasses 5MB localStorage limits)
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov');
    const isImage = file.type.startsWith('image/') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp');

    if (!isVideo && !isImage) {
      onShowToast?.('Please choose an image (PNG, JPG, WEBP) or video (MP4, WEBM, MOV)', 'warning');
      return;
    }

    try {
      onShowToast?.(`Loading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 'info');
      const objectUrl = await saveMediaToDB(file, file.name, isVideo ? 'video' : 'image');

      if (isVideo) {
        onSelectBgVideo(objectUrl);
        onChangeBgType('video');
        localStorage.setItem('modern_app_custom_media_type', 'video');
        setCustomMediaType('video');
        onShowToast?.(`Loaded video "${file.name}"! Playing in background.`, 'success');
      } else {
        onSelectBgImage(objectUrl);
        onChangeBgType('image');
        localStorage.setItem('modern_app_custom_media_type', 'image');
        setCustomMediaType('image');
        onShowToast?.(`Loaded image "${file.name}"! Playing in background.`, 'success');
      }
      localStorage.setItem('modern_app_custom_media_name', file.name);
      setCustomMediaName(file.name);
      macAudio.playSuccess();
    } catch (err: any) {
      console.error('Failed to save media to IndexedDB:', err);
      onShowToast?.('Failed to load media: ' + (err.message || 'unknown error'), 'error');
    }
  };

  const handleResetDefaultWallpaper = async () => {
    await clearMediaFromDB();
    onSelectBgImage('/panda_bg.jpg');
    onChangeBgType('image');
    localStorage.removeItem('modern_app_custom_media_name');
    localStorage.removeItem('modern_app_custom_media_type');
    setCustomMediaName('');
    setCustomMediaType('');
    macAudio.playClick();
    onShowToast?.('Reset to default wallpaper & saved to localhost', 'info');
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

  // Barcode Designer State
  const [barcodeSubTab, setBarcodeSubTab] = useState<BarcodeSubTab>('PAGE_SETUP');
  const [labelWidthMm, setLabelWidthMm] = useState<number>(60);
  const [labelHeightMm, setLabelHeightMm] = useState<number>(35);
  const [columnsPerRow, setColumnsPerRow] = useState<number>(3);
  const [barcodeSymbology, setBarcodeSymbology] = useState<string>('CODE128');
  const [barcodeHeaderText, setBarcodeHeaderText] = useState<string>('SHREE BALAJI TRADERS');
  const [printHeader, setPrintHeader] = useState<boolean>(true);
  const [printItemName, setPrintItemName] = useState<boolean>(true);
  const [printPrice, setPrintPrice] = useState<boolean>(true);

  // Handle Custom Hex Submission
  const handleApplyHex = (val: string) => {
    let clean = val.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean) || /^#[0-9A-Fa-f]{3}$/.test(clean)) {
      setCustomHex(clean);
      onChangeBgColor(clean);
      onChangeBgType('color');
      onShowToast(`Applied custom background color ${clean}`, 'success');
      macAudio.playClick();
    } else {
      setCustomHex(val);
    }
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
      exportBundle.data.bgColor = bgColor;
      exportBundle.data.bgType = bgType;
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
          if (parsed.data.bgColor) onChangeBgColor(parsed.data.bgColor);
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
        <div style={{ maxWidth: '850px' }}>
          <Segmented
            value={activeTab}
            onChange={(val) => {
              macAudio.playClick();
              setActiveTab(val as SettingsMainTab);
            }}
            options={[
              { value: 'THEME', label: 'Theme & Background', icon: <Palette size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} /> },
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
          {/* Left Column: Background Color & Wallpaper Selectors */}
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
            {/* Background Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                  BACKGROUND RENDERING MODE
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Choose between Solid Luxury Color or High-Res Wallpaper
                </span>
              </div>

              <Segmented
                value={bgType}
                onChange={(val) => {
                  onChangeBgType(val as 'color' | 'image' | 'video');
                  macAudio.playClick();
                  onShowToast?.(`Active: ${val.toUpperCase()} Mode`, 'info');
                }}
                options={[
                  { label: 'Solid Color', value: 'color' },
                  { label: 'Wallpaper', value: 'image' },
                  { label: 'Motion Video 🎬', value: 'video' }
                ]}
              />
            </div>

            {/* Solid Background Color Palettes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                  CURATED LUXURY COLOR PALETTES
                </span>
                <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                  CURRENT: {bgColor.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {LUXURY_BG_COLORS.map(col => {
                  const isSelected = bgType === 'color' && bgColor.toLowerCase() === col.val.toLowerCase();
                  return (
                    <div
                      key={col.val}
                      onClick={() => {
                        onChangeBgColor(col.val);
                        onChangeBgType('color');
                        macAudio.playClick();
                        onShowToast(`Applied ${col.name}`, 'success');
                      }}
                      style={{
                        background: col.val,
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '52px',
                        transition: 'all 0.18s cubic-bezier(0.22, 1, 0.36, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          {col.name}
                        </span>
                        {isSelected && <Check size={12} color="#38bdf8" />}
                      </div>
                      <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                        {col.val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Color Picker Input */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    onChangeBgColor(e.target.value);
                    onChangeBgType('color');
                    setCustomHex(e.target.value);
                  }}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                  title="Pick Any Custom Color"
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#f8fafc', display: 'block' }}>
                    Custom Color Picker
                  </span>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                    Click color box to open native gradient & hex palette
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyHex(customHex)}
                    style={{
                      width: '80px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '11px',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyHex(customHex)}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                      color: '#090d16',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Wallpaper Selection Gallery */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                  OFFICIAL MACOS WALLPAPERS
                </span>
                <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  Liquid Retina HD
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {WALLPAPERS.map(wp => {
                  const isSelected = bgType === 'image' && bgImage === wp.url;
                  return (
                    <div
                      key={wp.name}
                      onClick={() => {
                        onSelectBgImage(wp.url);
                        onChangeBgType('image');
                        macAudio.playClick();
                        onShowToast(`Wallpaper set: ${wp.name}`, 'success');
                      }}
                      style={{
                        position: 'relative',
                        height: '64px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <img
                        src={wp.url}
                        alt={wp.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '5px 8px'
                        }}
                      >
                        <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#ffffff' }}>
                          {wp.name}
                        </span>
                        {isSelected && (
                          <div style={{ marginLeft: 'auto', background: '#38bdf8', borderRadius: '50%', padding: '2px' }}>
                            <Check size={10} color="#090d16" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Curated Luxury Motion Videos Gallery */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                  CURATED MOTION VIDEOS (LOOPING CINEMATIC)
                </span>
                <span style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 600 }}>
                  High-FPS Ambient
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {MOTION_VIDEOS.map(vid => {
                  const isSelected = bgType === 'video' && bgVideo === vid.url;
                  return (
                    <div
                      key={vid.name}
                      onClick={() => {
                        onSelectBgVideo(vid.url);
                        onChangeBgType('video');
                        macAudio.playClick();
                        onShowToast?.(`Motion video set: ${vid.name}`, 'success');
                      }}
                      style={{
                        position: 'relative',
                        height: '66px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
                        transition: 'all 0.18s ease',
                        background: '#090d16'
                      }}
                    >
                      <video
                        src={vid.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '5px 8px',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#ffffff' }}>
                            {vid.name}
                          </div>
                          <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>
                            {vid.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ background: '#38bdf8', borderRadius: '50%', padding: '2px' }}>
                            <Check size={10} color="#090d16" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3D Animated Custom Image / Video Upload Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.3px' }}>
                  UPLOAD CUSTOM IMAGE OR VIDEO (STORED IN LOCALHOST)
                </span>
                {customMediaName ? (
                  <span style={{ fontSize: '9.5px', color: '#34d399', fontWeight: 800, fontFamily: 'monospace' }}>
                    Active: {customMediaType === 'video' ? '🎬' : '🖼️'} {customMediaName}
                  </span>
                ) : (
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                    Browse Image or Video from PC
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', alignItems: 'center' }}>
                {/* 3D Animated Folder Box from User's Spec */}
                <div className="folder-upload-container">
                  <div className="folder">
                    <div className="front-side">
                      <div className="tip" />
                      <div className="cover" />
                    </div>
                    <div className="back-side cover" />
                  </div>
                  <label className="custom-file-upload">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaFileUpload}
                    />
                    <span>Choose Image/Video</span>
                  </label>
                </div>

                {/* Information, Status & Reset */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '110px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <Sparkles size={12} color="#38bdf8" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                        Localhost Storage Persistence
                      </span>
                    </div>
                    <p style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                      Aapki upload ki gayi image ya video browser ke persistent storage me save ho jati hai. App reload ya restart karne par bhi background me chalegi.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    <span style={{ fontSize: '8.5px', color: '#64748b' }}>
                      Supports: MP4, WebM, MOV, PNG, JPG, WEBP
                    </span>

                    {customMediaName && (
                      <button
                        type="button"
                        onClick={handleResetDefaultWallpaper}
                        style={{
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Local Video / URL Player */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#e2e8f0' }}>
                    Or enter Direct Video File / URL:
                  </span>
                  <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'monospace' }}>
                    Available: /custom_video.mp4
                  </span>
                </div>
                <div>
                  <Input.Search
                    value={manualVideoPath}
                    onChange={(e) => setManualVideoPath(e.target.value)}
                    placeholder="/custom_video.mp4 or video web URL"
                    enterButton="Play Video 🎬"
                    onSearch={(val) => {
                      if (val.trim()) {
                        onSelectBgVideo(val.trim());
                        onChangeBgType('video');
                        macAudio.playSuccess();
                        onShowToast?.(`Playing video from "${val}"`, 'success');
                      }
                    }}
                  />
                </div>
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
                tooltip={{ formatter: val => `${val}px` }}
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
                onChange={(val) => onChangeGlassOpacity(val / 100)}
                tooltip={{ formatter: val => `${val}%` }}
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
                onChange={(val) => onChangeOpacity(val / 100)}
                tooltip={{ formatter: val => `${val}%` }}
              />
            </div>

            {/* Mini Live Preview Window */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                LIVE THEME PREVIEW
              </span>
              <div
                style={{
                  flex: 1,
                  minHeight: '130px',
                  borderRadius: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  background: bgType === 'color' ? bgColor : (bgType === 'image' ? `url(${bgImage}) center/cover no-repeat` : '#070b14')
                }}
              >
                {bgType === 'video' && bgVideo && (
                  <video
                    src={bgVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 0
                    }}
                  />
                )}
                {/* Simulated Glass Window */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '12px',
                    borderRadius: '8px',
                    background: `rgba(18, 22, 28, ${glassOpacity})`,
                    backdropFilter: `blur(${blurAmount}px)`,
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
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
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>
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
      {/* TAB 2: SHORTCUTS & NUMPAD GUIDE (GRID KEYS ONLY + FULL NUMPAD '.' ENGINE) */}
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
                onChange={(val) => setRestoreMode(val as 'merge' | 'overwrite')}
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
                onChange={(e) => {
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
                onChange={(e) => {
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
                onChange={(val) => setServerMode(val as any)}
                options={[
                  { id: 'server', label: 'Host Server', value: 'server' },
                  { id: 'client', label: 'Client Node', value: 'client' },
                  { id: 'standalone', label: 'Standalone', value: 'standalone' }
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BARCODE DESIGNER (LABEL LAYOUT & LIVE PREVIEW)                     */}
      {/* ========================================================================= */}
      {activeTab === 'BARCODE' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
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
                BARCODE & THERMAL LABEL DESIGNER
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Configure roll dimensions, symbology, and printed elements
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Label Width (mm)</span>
                <InputNumber
                  min={10}
                  max={200}
                  value={labelWidthMm}
                  onChange={(val) => setLabelWidthMm(val || 50)}
                  addonAfter="mm"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Label Height (mm)</span>
                <InputNumber
                  min={10}
                  max={200}
                  value={labelHeightMm}
                  onChange={(val) => setLabelHeightMm(val || 30)}
                  addonAfter="mm"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <LuxuryToggle
              title="Print Company Header"
              desc="Adds company title on top edge of the barcode sticker"
              checked={printHeader}
              onChange={setPrintHeader}
            />

            <LuxuryToggle
              title="Print Item Specification"
              desc="Prints full item name and alloy/core grade"
              checked={printItemName}
              onChange={setPrintItemName}
            />

            <LuxuryToggle
              title="Print Wholesale Price"
              desc="Displays price in INR with currency symbol"
              checked={printPrice}
              onChange={setPrintPrice}
            />
          </div>

          {/* Right Column: Live Barcode Label Preview */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1' }}>
              THERMAL LABEL PREVIEW (1:1 SCALE)
            </span>

            {/* Sticker Mockup */}
            <div
              style={{
                width: '240px',
                height: '140px',
                background: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#000000',
                fontFamily: 'sans-serif'
              }}
            >
              {printHeader && (
                <div style={{ fontSize: '11px', fontWeight: 900, textAlign: 'center', letterSpacing: '0.4px', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                  {barcodeHeaderText}
                </div>
              )}

              {printItemName && (
                <div style={{ fontSize: '10px', fontWeight: 800, textAlign: 'center' }}>
                  Mould 14x20 Standard Housing
                </div>
              )}

              {/* Barcode lines */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2px', height: '36px', alignItems: 'flex-end' }}>
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4].map((w, i) => (
                    <div key={i} style={{ width: `${w}px`, height: '100%', background: '#000' }} />
                  ))}
                </div>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px' }}>
                  *MLD-1420-STD*
                </span>
              </div>

              {printPrice && (
                <div style={{ fontSize: '11px', fontWeight: 900, textAlign: 'right', borderTop: '1px solid #ddd', paddingTop: '2px' }}>
                  MRP: ₹650.00
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
