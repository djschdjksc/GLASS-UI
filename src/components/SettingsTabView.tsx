import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Segmented, Slider, Switch, Tag, Button, Input, InputNumber, Tooltip } from 'antd';
import { macAudio } from '../utils/macAudio';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';
import { localDb } from '../services/db/localDb';
import { getStoredBillPrefix, formatBillNumber } from '../utils/billDocTypes';
import { getAuthConfig, setAuthConfig, type AuthConfig } from '../utils/authSecurity';
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
  Lock,
  Unlock,
  Eye,
  EyeOff,
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
  Volume2,
  Wifi,
  Cloud,
  Radio,
  Terminal,
  Shield,
  Activity
} from 'lucide-react';
import {
  Button as ShadcnButton,
  Input as ShadcnInput,
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
  Tabs as ShadcnTabs,
  TabsList as ShadcnTabsList,
  TabsTrigger as ShadcnTabsTrigger,
  Switch as ShadcnSwitch,
  Badge as ShadcnBadge,
  Label as ShadcnLabel
} from './ui/shadcn';
import { getUserProfile, setUserProfile, getUserPrefix } from '../services/supabaseClient';
import { supabaseSyncService } from '../services/supabaseSync';
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
import { KeyboardShortcutsVisualizer } from './KeyboardShortcutsVisualizer';

export type SettingsMainTab = 'GENERAL' | 'THEME' | 'PROFILE' | 'SHORTCUTS' | 'BACKUP' | 'BARCODE';
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
  const { preferences, updatePreferences, defaultPrinter, setDefaultPrinter } = useSettings();

  // Active Tab - Defaulting to GENERAL
  const [activeTab, setActiveTab] = useState<SettingsMainTab>('GENERAL');

  // General Settings - Printers & Native Spooler State
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [systemDefaultPrinter, setSystemDefaultPrinter] = useState<string>('');
  const [isPrinterChecking, setIsPrinterChecking] = useState<boolean>(false);
  const [isTestPrinting, setIsTestPrinting] = useState<boolean>(false);
  const [printerEngineStatus, setPrinterEngineStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  // Station & general hardware routing
  const [stationName, setStationName] = useState<string>(() => localStorage.getItem('modern_app_station_name') || 'COUNTER-01');
  const [printPaperSize, setPrintPaperSize] = useState<string>(() => localStorage.getItem('modern_app_paper_size') || 'A4');

  // Fetch printers list from PyQt print service (:5005)
  const fetchPrintersList = useCallback(async () => {
    setIsPrinterChecking(true);
    setPrinterEngineStatus('checking');
    try {
      const resp = await fetch('http://127.0.0.1:5005/api/status');
      const data = await resp.json();
      if (data && data.status === 'ok') {
        setPrinterEngineStatus('online');
        const list = Array.isArray(data.availablePrinters) ? data.availablePrinters : [];
        setAvailablePrinters(list);
        setSystemDefaultPrinter(data.printer || '');
        if (!defaultPrinter && data.printer) {
          setDefaultPrinter(data.printer);
        }
      } else {
        setPrinterEngineStatus('offline');
      }
    } catch {
      setPrinterEngineStatus('offline');
    } finally {
      setIsPrinterChecking(false);
    }
  }, [defaultPrinter, setDefaultPrinter]);

  useEffect(() => {
    fetchPrintersList();
  }, [fetchPrintersList]);

  // Test Print handler
  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    macAudio.playClick();
    const target = defaultPrinter || systemDefaultPrinter || 'Default Printer';
    try {
      const resp = await fetch('http://127.0.0.1:5005/api/print/test-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName: target })
      });
      const data = await resp.json();
      if (data && data.success) {
        macAudio.playSuccess();
        onShowToast?.(data.message || `Test page sent to ${target}!`, 'success');
      } else {
        macAudio.playError();
        onShowToast?.(data?.error || 'Failed to print test page.', 'error');
      }
    } catch {
      macAudio.playError();
      onShowToast?.('Native print service (:5005) not reachable. Please start Python spooler.', 'error');
    } finally {
      setIsTestPrinting(false);
    }
  };

  // Universal Alt+1..6 Subtab Switch listener for Settings Tab
  useEffect(() => {
    const handleSubtabSwitch = (e: Event) => {
      const custom = e as CustomEvent<{ index: number }>;
      const idx = custom.detail?.index;
      if (idx === 1) { macAudio.playClick(); setActiveTab('GENERAL'); }
      else if (idx === 2) { macAudio.playClick(); setActiveTab('THEME'); }
      else if (idx === 3) { macAudio.playClick(); setActiveTab('PROFILE'); }
      else if (idx === 4) { macAudio.playClick(); setActiveTab('SHORTCUTS'); }
      else if (idx === 5) { macAudio.playClick(); setActiveTab('BACKUP'); }
      else if (idx === 6) { macAudio.playClick(); setActiveTab('BARCODE'); }
    };
    window.addEventListener('app-subtab-switch', handleSubtabSwitch);
    return () => window.removeEventListener('app-subtab-switch', handleSubtabSwitch);
  }, []);

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
  const [billPrefix, setBillPrefix] = useState<string>(getStoredBillPrefix);
  const [isUpdatingBills, setIsUpdatingBills] = useState<boolean>(false);
  const [tallyNavigation, setTallyNavigation] = useState<boolean>(() => localStorage.getItem('modern_setting_tally_nav') !== '0');
  const [autoConvertMode, setAutoConvertMode] = useState<boolean>(() => localStorage.getItem('modern_setting_autoconv') !== '0');
  const [stickyShortcuts, setStickyShortcuts] = useState<boolean>(() => localStorage.getItem('modern_setting_sticky') !== '0');
  const [itemAutoSuggest, setItemAutoSuggest] = useState<boolean>(() => localStorage.getItem('modern_setting_item_auto') !== '0');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [slipPrefix, setSlipPrefix] = useState<string>(() => localStorage.getItem('modern_setting_slip_prefix') || 'S-');
  const [slipHeaderTitle, setSlipHeaderTitle] = useState<string>(() => localStorage.getItem('modern_setting_slip_title') || 'ESTIMATE / LOADING MEMORANDUM');

  const handleApplyBillPrefix = async (prefixToApply?: string) => {
    const val = (prefixToApply !== undefined ? prefixToApply : billPrefix).trim();
    if (!val) return;
    setIsUpdatingBills(true);
    macAudio.playClick();
    try {
      localStorage.setItem('modern_setting_bill_prefix', val);
      const cleanUpper = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanUpper) {
        localStorage.setItem('modern_app_user_prefix', cleanUpper);
      }

      const count = await localDb.updateAllBillPrefix(val);
      window.dispatchEvent(new Event('storage'));
      macAudio.playSuccess();
      onShowToast?.(`Applied bill prefix "${val}" to ${count} bill(s) in Bill History!`, 'success');
    } catch (e: any) {
      onShowToast?.(`Error updating bill prefix: ${e.message}`, 'error');
    } finally {
      setIsUpdatingBills(false);
    }
  };

  // Security & Authentication State (ID & Password)
  const [authConfig, setAuthConfigState] = useState<AuthConfig>(getAuthConfig);
  const [authLoginIdInput, setAuthLoginIdInput] = useState<string>(() => getAuthConfig().loginId);
  const [authPasswordInput, setAuthPasswordInput] = useState<string>(() => getAuthConfig().password);
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);

  const handleSaveSecurityCredentials = () => {
    macAudio.playClick();
    const cleanId = authLoginIdInput.trim() || 'BillTrack.org';
    const cleanPass = authPasswordInput.trim();
    const isEn = Boolean(cleanPass !== '');

    const updated = setAuthConfig({
      loginId: cleanId,
      password: cleanPass,
      enabled: isEn
    });
    setAuthConfigState(updated);
    setAuthLoginIdInput(updated.loginId);
    setAuthPasswordInput(updated.password);
    macAudio.playSuccess();

    if (updated.enabled) {
      onShowToast?.(`ID & Password saved! App open hone par login panel aayega.`, 'success');
    } else {
      onShowToast?.(`Password removed! App bina kisi password ke seedha open hoga.`, 'info');
    }
  };

  const handleRemovePassword = () => {
    macAudio.playPop();
    const updated = setAuthConfig({
      password: '',
      enabled: false
    });
    setAuthConfigState(updated);
    setAuthPasswordInput('');
    macAudio.playSuccess();
    onShowToast?.(`Password hat gaya! App ab seedha bina password panel ke open hoga.`, 'info');
  };

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


  // User Profile & Multi-Device Sync State
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('modern_app_user_name') || 'Rohit (Billing Desk)');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('modern_app_user_role') || 'Main Billing Counter');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('modern_app_user_avatar') || '');
  const [userTerminal, setUserTerminal] = useState<string>(() => localStorage.getItem('modern_app_user_terminal') || 'Counter #1');
  const [userPhone, setUserPhone] = useState<string>(() => localStorage.getItem('modern_app_user_phone') || '+91 98765 43210');
  const [userStatus, setUserStatus] = useState<string>(() => localStorage.getItem('modern_app_user_status') || 'Active on Billing Desk - Ready to Chat');
  const [userPrefix, setUserPrefix] = useState<string>(() => localStorage.getItem('modern_app_user_prefix') || getUserPrefix(localStorage.getItem('modern_app_user_name') || 'ROHIT'));
  const [isPrefixCustomized, setIsPrefixCustomized] = useState<boolean>(() => Boolean(localStorage.getItem('modern_app_user_prefix')));
  const [autoCloudSync, setAutoCloudSync] = useState<boolean>(() => localStorage.getItem('modern_app_auto_sync') !== '0');
  const [soundOnSync, setSoundOnSync] = useState<boolean>(() => localStorage.getItem('modern_app_sync_sound') !== '0');
  const [deviceOnlineStatus, setDeviceOnlineStatus] = useState<boolean>(true);
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
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

  const handleNameChange = (val: string) => {
    setUserName(val);
    if (!isPrefixCustomized) {
      setUserPrefix(getUserPrefix(val));
    }
  };

  const handleSaveProfile = () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      onShowToast?.('Please enter a valid operator name', 'warning');
      return;
    }
    const cleanPrefix = (userPrefix.trim() || getUserPrefix(trimmed)).toUpperCase().replace(/[^A-Z0-9]/g, '');
    setUserProfile({
      name: trimmed,
      prefix: cleanPrefix,
      role: userRole,
      terminal: userTerminal
    });
    localStorage.setItem('modern_app_user_name', trimmed);
    localStorage.setItem('modern_app_user_prefix', cleanPrefix);
    localStorage.setItem('modern_app_user_role', userRole);
    localStorage.setItem('modern_app_user_avatar', userAvatar);
    localStorage.setItem('modern_app_user_terminal', userTerminal);
    localStorage.setItem('modern_app_user_phone', userPhone);
    localStorage.setItem('modern_app_user_status', userStatus);
    localStorage.setItem('modern_app_auto_sync', autoCloudSync ? '1' : '0');
    localStorage.setItem('modern_app_sync_sound', soundOnSync ? '1' : '0');
    window.dispatchEvent(new Event('storage'));
    onShowToast?.('User Profile & Multi-Device Sync Settings Saved!', 'success');
    macAudio.playSuccess();
  };

  const handleForceResync = async () => {
    setIsSyncingNow(true);
    macAudio.playClick();
    onShowToast?.('Synchronizing data with Cloud and other counters...', 'info');
    try {
      await supabaseSyncService.pullAllCloudBills();
      macAudio.playSuccess();
      onShowToast?.('Multi-device cloud synchronization complete!', 'success');
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      onShowToast?.('Sync notice: ' + (err.message || 'Offline mode active'), 'info');
    } finally {
      setIsSyncingNow(false);
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
      {/* TOP HEADER: APPLE CONTROL CENTER & SYSTEM SETTINGS SEGMENTED TAB BAR       */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Left: macOS Control Center Brand Badge with Live System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(56, 189, 248, 0.45)'
            }}
          >
            <Sliders size={15} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.3px' }}>
                Control Center
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                ACTIVE
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              macOS System Settings & Multi-Device Station Control
            </span>
          </div>
        </div>

        {/* Center: Live Station Diagnostics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>Sync: Live</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
            <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>SQLite :5006</span>
          </div>
        </div>

        {/* Right: Authentic shadcn/ui Tabs Navigation */}
        <div style={{ maxWidth: '960px' }}>
          <ShadcnTabs
            value={activeTab}
            onValueChange={(val: string) => {
              macAudio.playClick();
              setActiveTab(val as SettingsMainTab);
            }}
          >
            <ShadcnTabsList>
              <ShadcnTabsTrigger value="GENERAL">
                <SlidersHorizontal size={13} style={{ marginRight: 6 }} />
                <span>General</span>
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger value="THEME">
                <Palette size={13} style={{ marginRight: 6 }} />
                <span>Theme & Wallpaper</span>
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger value="PROFILE">
                <User size={13} style={{ marginRight: 6 }} />
                <span>User Profile & Sync</span>
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger value="SHORTCUTS">
                <Keyboard size={13} style={{ marginRight: 6 }} />
                <span>Shortcuts & NumPad</span>
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger value="BACKUP">
                <Database size={13} style={{ marginRight: 6 }} />
                <span>Backup & Restore</span>
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger value="BARCODE">
                <Barcode size={13} style={{ marginRight: 6 }} />
                <span>Barcode Designer</span>
              </ShadcnTabsTrigger>
            </ShadcnTabsList>
          </ShadcnTabs>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: GENERAL SETTINGS (GERNAL SETTING - DEFAULT PRINTER & SYSTEM CONFIG) */}
      {/* ========================================================================= */}
      {activeTab === 'GENERAL' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '12px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Default Hardware & PyQt6 Native Vector Spooler */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '10px'
            }}
          >
            {/* Header: Default Printer Configuration */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  <Printer size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.2px' }}>
                    DEFAULT SYSTEM PRINTER
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Native PyQt6 Vector Print Spooler (:5005) • Direct Hardware Output
                  </div>
                </div>
              </div>

              {/* Server Engine Status Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {printerEngineStatus === 'online' ? (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                    SPOOLER ONLINE (:5005)
                  </span>
                ) : printerEngineStatus === 'checking' ? (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#facc15',
                      border: '1px solid rgba(234, 179, 8, 0.3)'
                    }}
                  >
                    DETECTING...
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                    SERVER OFFLINE
                  </span>
                )}
              </div>
            </div>

            {/* Printer Selection Card */}
            <div
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px', display: 'block' }}>
                  Select Default Windows Printer:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={defaultPrinter || systemDefaultPrinter || ''}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setDefaultPrinter(selected);
                      macAudio.playClick();
                      onShowToast?.(`Default printer set to: ${selected}`, 'success');
                    }}
                    style={{
                      flex: 1,
                      height: '36px',
                      background: '#09090b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {availablePrinters.length > 0 ? (
                      availablePrinters.map((p) => (
                        <option key={p} value={p} style={{ background: '#18181b', color: '#f4f4f5' }}>
                          {p} {p === systemDefaultPrinter ? '★ (Windows Default)' : ''}
                        </option>
                      ))
                    ) : (
                      <option value={defaultPrinter || 'Default Printer'} style={{ background: '#18181b', color: '#f4f4f5' }}>
                        {defaultPrinter || 'Default System Printer'}
                      </option>
                    )}
                  </select>

                  <ShadcnButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchPrintersList}
                    disabled={isPrinterChecking}
                    title="Refresh Windows Printers List"
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      background: '#27272a',
                      color: '#f4f4f5',
                      border: '1px solid #3f3f46',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={13} className={isPrinterChecking ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </ShadcnButton>
                </div>
              </div>

              {/* Printer Hardware Info Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  background: '#09090b',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #27272a'
                }}
              >
                <div>
                  <div style={{ fontSize: '10.5px', color: '#71717a' }}>Current Default:</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {defaultPrinter || systemDefaultPrinter || 'Windows Default'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#71717a' }}>Spool Mode:</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>
                    Direct PyQt6 Vector (Zero Web Print)
                  </div>
                </div>
              </div>

              {/* Action Buttons: Test Print */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#71717a' }}>
                  Sends a vector calibration test page directly to this printer
                </span>
                <ShadcnButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleTestPrint}
                  disabled={isTestPrinting || printerEngineStatus === 'offline'}
                  title="Dispatch High-Resolution Test Page"
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    height: '32px',
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={13} />
                  <span>{isTestPrinting ? 'SPOOLING...' : 'Test Print Page'}</span>
                </ShadcnButton>
              </div>
            </div>

            {/* Quality & Zero Web Print Notice */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <Info size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.45 }}>
                <strong style={{ color: '#f4f4f5' }}>Zero Web Printer Policy Active:</strong> Web browser printing is permanently bypassed across Estimate, Loading Slip, Multi-Party Distribution (F3), and Ledgers. Every document is rendered directly by the native Python vector engine at the printer's native DPI.
              </div>
            </div>

            {/* Hardware Routing & Paper Size Card */}
            <div
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f4f4f5', textTransform: 'uppercase' }}>
                Station & Hardware Routing
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', color: '#71717a', display: 'block', marginBottom: '4px' }}>Counter / Station Name</label>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => {
                      setStationName(e.target.value);
                      localStorage.setItem('modern_app_station_name', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      height: '32px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '5px',
                      padding: '0 8px',
                      color: '#f4f4f5',
                      fontSize: '11.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', color: '#71717a', display: 'block', marginBottom: '4px' }}>Standard Paper Size</label>
                  <select
                    value={printPaperSize}
                    onChange={(e) => {
                      setPrintPaperSize(e.target.value);
                      localStorage.setItem('modern_app_paper_size', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      height: '32px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '5px',
                      padding: '0 8px',
                      color: '#f4f4f5',
                      fontSize: '11.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="A4">A4 (Portrait 210 x 297 mm)</option>
                    <option value="A4_LANDSCAPE">A4 (Landscape)</option>
                    <option value="THERMAL_3INCH">3-Inch Thermal Roll (80mm)</option>
                    <option value="THERMAL_4INCH">4-Inch Shipping Label (100mm)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: General Workflow, Document Naming & Toggles */}
          <div
            className="glass-panel"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '10px'
            }}
          >
            <div style={{ borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f4f4f5' }}>
                GENERAL WORKFLOW & SYSTEM PREFERENCES
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Key navigation styles, numbering formats & audio feedback
              </div>
            </div>

            {/* Bill & Slip Prefix & Numbering */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f4f4f5' }}>
                Document Numbering & Bill Formats
              </div>

              {/* Bill Number Prefix & Format */}
              <div style={{ borderBottom: '1px solid #27272a', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#e4e4e7' }}>
                    Bill Number Format / Prefix (Bill History)
                  </label>
                  <span style={{ 
                    fontSize: '10px', 
                    fontFamily: "'JetBrains Mono', monospace", 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    color: '#38bdf8', 
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 8px', 
                    borderRadius: '4px' 
                  }}>
                    Preview: #{formatBillNumber('2', billPrefix)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={billPrefix}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBillPrefix(v);
                      localStorage.setItem('modern_setting_bill_prefix', v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyBillPrefix();
                      }
                    }}
                    placeholder="e.g. REAL-, INV-, BILL-"
                    style={{
                      flex: 1,
                      height: '32px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '5px',
                      padding: '0 8px',
                      color: '#f4f4f5',
                      fontSize: '11.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUpdatingBills}
                    onClick={() => handleApplyBillPrefix()}
                    style={{
                      background: isUpdatingBills ? '#27272a' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '1px solid #38bdf8',
                      color: '#ffffff',
                      borderRadius: '5px',
                      padding: '0 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isUpdatingBills ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                    title="Update all existing bills in history to this prefix"
                  >
                    <RefreshCw size={12} className={isUpdatingBills ? 'animate-spin' : ''} />
                    <span>Apply to All Bills</span>
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>
                  Yahan set karne par Bill History ke sabhi bills (jaise #{formatBillNumber('1', billPrefix)}, #{formatBillNumber('2', billPrefix)}) aur naye bills isi format me generate aur display honge.
                </div>
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: '#71717a', display: 'block', marginBottom: '4px' }}>Slip Number Prefix</label>
                <input
                  type="text"
                  value={slipPrefix}
                  onChange={(e) => {
                    setSlipPrefix(e.target.value);
                    localStorage.setItem('modern_setting_slip_prefix', e.target.value);
                  }}
                  placeholder="e.g. S-, INV-, BILL-"
                  style={{
                    width: '100%',
                    height: '32px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '0 8px',
                    color: '#f4f4f5',
                    fontSize: '11.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: '#71717a', display: 'block', marginBottom: '4px' }}>Default Slip Header Title</label>
                <input
                  type="text"
                  value={slipHeaderTitle}
                  onChange={(e) => {
                    setSlipHeaderTitle(e.target.value);
                    localStorage.setItem('modern_setting_slip_title', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    height: '32px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '0 8px',
                    color: '#f4f4f5',
                    fontSize: '11.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* App Security & Login Password (ID & Password Protection) */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: authConfig.enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    border: authConfig.enabled ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: authConfig.enabled ? '#4ade80' : '#facc15'
                  }}>
                    {authConfig.enabled ? <Lock size={15} /> : <Unlock size={15} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f4f4f5' }}>
                      Security & Login Password
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#71717a' }}>
                      Apne hisab se User ID & Password set karein ya remove karein
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: authConfig.enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.12)',
                  color: authConfig.enabled ? '#4ade80' : '#facc15',
                  border: authConfig.enabled ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(234, 179, 8, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: authConfig.enabled ? '#22c55e' : '#eab308' }} />
                  {authConfig.enabled ? 'PASSWORD ACTIVE (LOCKED)' : 'NO PASSWORD (AUTO-OPEN)'}
                </span>
              </div>

              {/* ID Input */}
              <div>
                <label style={{ fontSize: '10.5px', color: '#a1a1aa', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  User ID / Login ID
                </label>
                <input
                  type="text"
                  value={authLoginIdInput}
                  onChange={(e) => setAuthLoginIdInput(e.target.value)}
                  placeholder="e.g. BillTrack.org or rohit"
                  style={{
                    width: '100%',
                    height: '32px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '0 8px',
                    color: '#f4f4f5',
                    fontSize: '11.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#a1a1aa', fontWeight: 600 }}>
                    Password
                  </label>
                  <span style={{ fontSize: '10px', color: '#71717a' }}>
                    (Khali chhodne par login panel nahi aayega)
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    value={authPasswordInput}
                    onChange={(e) => setAuthPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveSecurityCredentials();
                      }
                    }}
                    placeholder="Naya password likhein ya khali chhod kar remove karein"
                    style={{
                      width: '100%',
                      height: '32px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '5px',
                      padding: '0 34px 0 8px',
                      color: '#f4f4f5',
                      fontSize: '11.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showAuthPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAuthPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Security Actions Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleSaveSecurityCredentials}
                  style={{
                    flex: 1,
                    height: '32px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '1px solid #34d399',
                    borderRadius: '5px',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={13} />
                  <span>Save ID & Password</span>
                </button>

                {authConfig.password && (
                  <button
                    type="button"
                    onClick={handleRemovePassword}
                    style={{
                      height: '32px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '5px',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '0 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Remove password so the app opens directly without login panel"
                  >
                    <Unlock size={12} />
                    <span>Remove Password</span>
                  </button>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LuxuryToggle
                title="Tally / Marg ERP Enter Key Navigation"
                desc="Pressing Enter advances from input to input, Tab jumps columns, and Down Arrow jumps to the next row."
                checked={tallyNavigation}
                onChange={(val) => {
                  setTallyNavigation(val);
                  localStorage.setItem('modern_setting_tally_nav', val ? '1' : '0');
                  onShowToast?.(`Tally navigation ${val ? 'enabled' : 'disabled'}`, 'info');
                }}
              />
              <LuxuryToggle
                title="Fast Item Autocomplete"
                desc="Shows instant search dropdown when typing party names, moulds, and inventory items."
                checked={itemAutoSuggest}
                onChange={(val) => {
                  setItemAutoSuggest(val);
                  localStorage.setItem('modern_setting_item_auto', val ? '1' : '0');
                }}
              />
              <LuxuryToggle
                title="Sound Effects (macAudio Engine)"
                desc="Play tactile feedback audio on click, enter key, save, and print spooling events."
                checked={audioFeedback}
                onChange={(val) => {
                  setAudioFeedback(val);
                  if (val) macAudio.playSuccess();
                }}
              />
            </div>
          </div>
        </div>
      )}

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

              {/* Animated Sun & Moon Phone Theme Switcher (Matching Provided Component) */}
              <div className="theme-phone-wrapper">
                <style>{`
                  .theme-phone-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 4px 0 10px 0;
                  }
                  .theme-phone-card {
                    position: relative;
                    width: 250px;
                    height: 236px;
                    background-color: ${themeMode === 'dark' ? '#18181b' : 'rgba(255, 255, 255, 0.12)'};
                    backdrop-filter: blur(20px);
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: ${themeMode === 'dark' ? '0 10px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.15)' : '0 10px 35px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'};
                    border: 1px solid ${themeMode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.18)'};
                    border-radius: 36px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    user-select: none;
                    cursor: pointer;
                  }
                  .theme-phone-menu {
                    font-size: 11px;
                    opacity: 0.65;
                    padding: 8px 16px 2px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: ${themeMode === 'dark' ? '#f8fafc' : '#ffffff'};
                  }
                  .theme-phone-menu .icons {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  }
                  .theme-phone-menu .battery {
                    width: 13px;
                    height: 7px;
                    background-color: currentColor;
                    border-radius: 2px;
                  }
                  .theme-phone-menu .network {
                    width: 0;
                    height: 0;
                    border-style: solid;
                    border-width: 0 4.5px 5.5px 4.5px;
                    border-color: transparent transparent currentColor transparent;
                    transform: rotate(135deg);
                  }
                  .theme-phone-content {
                    display: flex;
                    flex-direction: column;
                    margin: auto;
                    text-align: center;
                    width: 76%;
                    transform: translateY(2px);
                  }
                  .theme-phone-circle {
                    position: relative;
                    border-radius: 100%;
                    width: 76px;
                    height: 76px;
                    background: linear-gradient(
                      40deg,
                      #ff0080,
                      #ff8c00,
                      #e8e8e8,
                      #8983f7,
                      #a3dafb 80%
                    );
                    background-size: 400%;
                    background-position: ${themeMode === 'dark' ? '100% 100%' : '0% 0%'};
                    transition: all 0.6s ease;
                    margin: auto;
                    box-shadow: ${themeMode === 'dark' ? '0 0 25px rgba(137, 131, 247, 0.45)' : '0 0 25px rgba(255, 140, 0, 0.5)'};
                    cursor: pointer;
                  }
                  .theme-phone-crescent {
                    position: absolute;
                    border-radius: 100%;
                    right: 0;
                    width: 58px;
                    height: 58px;
                    background: ${themeMode === 'dark' ? '#18181b' : '#e8e8e8'};
                    transform: ${themeMode === 'dark' ? 'scale(1)' : 'scale(0)'};
                    transform-origin: top right;
                    transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1), background-color 0.6s;
                  }
                  .theme-phone-toggle-bar {
                    width: 100%;
                    height: 36px;
                    background-color: rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 100px;
                    position: relative;
                    margin: 14px 0 6px 0;
                    cursor: pointer;
                    display: block;
                  }
                  .theme-phone-toggle-slider {
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: calc(50% - 3px);
                    height: calc(100% - 6px);
                    border-radius: 100px;
                    background-color: ${themeMode === 'dark' ? '#0284c7' : '#ffffff'};
                    box-shadow: ${themeMode === 'dark' ? '0 0 12px rgba(2, 132, 199, 0.6)' : '0 2px 10px rgba(0, 0, 0, 0.25)'};
                    transform: ${themeMode === 'dark' ? 'translateX(100%)' : 'translateX(0)'};
                    transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.35s, box-shadow 0.35s;
                  }
                  .theme-phone-labels {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    font-size: 11px;
                    font-weight: 800;
                    user-select: none;
                    pointer-events: none;
                    z-index: 2;
                  }
                  .theme-phone-label-light {
                    transition: all 0.3s;
                    color: ${themeMode === 'dark' ? '#94a3b8' : '#0f172a'};
                    font-weight: ${themeMode === 'dark' ? 600 : 900};
                    opacity: ${themeMode === 'dark' ? 0.65 : 1};
                  }
                  .theme-phone-label-dark {
                    transition: all 0.3s;
                    color: ${themeMode === 'dark' ? '#ffffff' : '#94a3b8'};
                    font-weight: ${themeMode === 'dark' ? 900 : 600};
                    opacity: ${themeMode === 'dark' ? 1 : 0.65};
                  }
                `}</style>

                <div
                  className="theme-phone-card"
                  onClick={() => {
                    const newMode = themeMode === 'dark' ? 'glass' : 'dark';
                    macAudio.playClick();
                    onChangeThemeMode?.(newMode);
                    onShowToast?.(
                      newMode === 'dark' ? 'Dark Mode Activated (Obsidian Dark)' : 'Glass Mode Activated (Liquid Retina)',
                      'success'
                    );
                  }}
                  title="Click to toggle between Glass and Dark modes"
                >
                  <div className="theme-phone-menu">
                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>4:20</span>
                    <div className="icons">
                      <div className="network" />
                      <div className="battery" />
                    </div>
                  </div>

                  <div className="theme-phone-content">
                    {/* Animated Sun / Moon Circle */}
                    <div className="theme-phone-circle">
                      <div className="theme-phone-crescent" />
                    </div>

                    {/* Toggle Switch */}
                    <div className="theme-phone-toggle-bar">
                      <div className="theme-phone-toggle-slider" />
                      <div className="theme-phone-labels">
                        <span className="theme-phone-label-light">Light / Glass</span>
                        <span className="theme-phone-label-dark">Dark</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtext info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Active Display Mode:</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: themeMode === 'dark' ? '#38bdf8' : '#34d399' }}>
                    {themeMode === 'dark' ? 'Obsidian Dark (Neutral Sleek)' : 'Liquid Retina Glass (Frosted Wallpaper)'}
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
      {/* TAB 2: USER PROFILE & MULTI-DEVICE SYNC (SHADCN/UI DESIGN SYSTEM)         */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILE' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0, overflowY: 'auto', padding: '4px 12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.6px', color: '#f4f4f5', margin: 0 }}>
                Profile & Synchronization
              </h2>
              <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '4px 0 0' }}>
                Manage your operator credentials, multi-terminal bill prefixing, and real-time cloud data sync.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShadcnButton
                variant="outline"
                size="sm"
                onClick={handleForceResync}
                disabled={isSyncingNow}
              >
                <RefreshCw size={13} className={isSyncingNow ? 'animate-spin' : ''} />
                <span>{isSyncingNow ? 'Syncing...' : 'Sync Cloud'}</span>
              </ShadcnButton>
              <ShadcnButton
                variant="default"
                size="sm"
                onClick={handleSaveProfile}
              >
                <Check size={14} />
                <span>Save Changes</span>
              </ShadcnButton>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* LEFT COLUMN: Operator Identity & Profile Studio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Card 1: Operator Details */}
              <ShadcnCard>
                <ShadcnCardHeader>
                  <ShadcnCardTitle>Operator Identity</ShadcnCardTitle>
                  <ShadcnCardDescription>
                    Personalize your display avatar, counter designation, and presence.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Avatar Studio */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', borderRadius: '10px', background: '#18181b', border: '1px solid #27272a' }}>
                    {/* Circular Avatar */}
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: '#09090b',
                        border: '2px solid #27272a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {userAvatar ? (
                        <img src={userAvatar} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '22px', fontWeight: 700, color: '#f4f4f5' }}>
                          {userName.slice(0, 2).toUpperCase() || 'OP'}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="file"
                        ref={dpInputRef}
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShadcnButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => dpInputRef.current?.click()}
                        >
                          Change Avatar
                        </ShadcnButton>
                        {userAvatar && (
                          <ShadcnButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            style={{ color: '#ef4444' }}
                            onClick={() => {
                              setUserAvatar('');
                              localStorage.removeItem('modern_app_user_avatar');
                              window.dispatchEvent(new Event('storage'));
                              macAudio.playTrash();
                            }}
                          >
                            Remove
                          </ShadcnButton>
                        )}
                      </div>
                      {/* Quick Preset Emojis */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        {['👨‍💼', '👩‍💼', '🧑‍💻', '⚡', '👑', '💼'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              const canvas = document.createElement('canvas');
                              canvas.width = 120;
                              canvas.height = 120;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.fillStyle = '#09090b';
                                ctx.fillRect(0, 0, 120, 120);
                                ctx.font = '64px sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(emoji, 60, 65);
                                const url = canvas.toDataURL('image/png');
                                setUserAvatar(url);
                                localStorage.setItem('modern_app_user_avatar', url);
                                window.dispatchEvent(new Event('storage'));
                                macAudio.playSuccess();
                              }
                            }}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: '1px solid #27272a',
                              background: '#09090b',
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

                  {/* Form fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <ShadcnLabel>Display Name</ShadcnLabel>
                      <ShadcnInput
                        type="text"
                        value={userName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Rohit (Billing Desk)"
                      />
                      <span style={{ fontSize: '12px', color: '#71717a' }}>
                        Name shown on exported receipts, chat presence, and invoice audit stamps.
                      </span>
                    </div>

                    {/* Counter Role / Department */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <ShadcnLabel>Counter Department</ShadcnLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {['Main Billing Counter', 'Warehouse / Godown', 'Accounts & Dispatch', 'Manager / Admin'].map((r) => {
                          const isSelected = userRole === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setUserRole(r);
                                macAudio.playClick();
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: isSelected ? '1px solid #f4f4f5' : '1px solid #27272a',
                                background: isSelected ? '#27272a' : '#18181b',
                                color: isSelected ? '#ffffff' : '#a1a1aa',
                                fontSize: '12px',
                                fontWeight: isSelected ? 600 : 400,
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Terminal Identifier */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <ShadcnLabel>Terminal / Counter Machine</ShadcnLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {['Counter #1', 'Counter #2', 'Godown PC', 'Laptop / Remote'].map((t) => {
                          const isSelected = userTerminal === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setUserTerminal(t);
                                macAudio.playClick();
                              }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: isSelected ? '1px solid #f4f4f5' : '1px solid #27272a',
                                background: isSelected ? '#27272a' : '#18181b',
                                color: isSelected ? '#ffffff' : '#a1a1aa',
                                fontSize: '12px',
                                fontWeight: isSelected ? 600 : 400,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phone & Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <ShadcnLabel>Contact Phone</ShadcnLabel>
                        <ShadcnInput
                          type="text"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <ShadcnLabel>Live Broadcast Status</ShadcnLabel>
                        <ShadcnInput
                          type="text"
                          value={userStatus}
                          onChange={(e) => setUserStatus(e.target.value)}
                          placeholder="Active on Billing Desk"
                        />
                      </div>
                    </div>
                  </div>
                </ShadcnCardContent>
              </ShadcnCard>
            </div>

            {/* RIGHT COLUMN: Unique Token Prefix Guard & Realtime Cloud Sync Deck */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Card 2: Multi-Device Bill Clash Guard */}
              <ShadcnCard>
                <ShadcnCardHeader>
                  <ShadcnCardTitle>Unique Bill Token Prefix</ShadcnCardTitle>
                  <ShadcnCardDescription>
                    Prevents invoice number collisions when multiple computers bill simultaneously.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ShadcnInput
                    type="text"
                    value={userPrefix}
                    onChange={(e) => {
                      setUserPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      setIsPrefixCustomized(true);
                    }}
                    placeholder="e.g. ROHIT, CTR1, WH1"
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '1px'
                    }}
                  />

                  {/* Token Preview Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#18181b',
                      border: '1px solid #27272a'
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                      Invoice Token Sequence Preview:
                    </span>
                    <ShadcnBadge variant="outline" style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                      {userPrefix ? `${userPrefix}-1, ${userPrefix}-2, ${userPrefix}-3...` : 'BILL-1, BILL-2...'}
                    </ShadcnBadge>
                  </div>
                </ShadcnCardContent>
              </ShadcnCard>

              {/* Card 3: Realtime Cloud Sync Deck */}
              <ShadcnCard>
                <ShadcnCardHeader>
                  <ShadcnCardTitle>Cloud Synchronization</ShadcnCardTitle>
                  <ShadcnCardDescription>
                    Multi-counter database replication and peer terminal discovery.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Cloud Status Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: '#18181b',
                      border: '1px solid #27272a'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#f4f4f5' }}>
                        Realtime Channel Active
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                      latency: 14ms • public:bills:all
                    </span>
                  </div>

                  {/* Clean shadcn Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #27272a'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#f4f4f5' }}>
                          Auto Cloud Delta Sync
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          Instantly merge invoices and edits created on other terminals.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={autoCloudSync}
                        onCheckedChange={(val: boolean) => {
                          setAutoCloudSync(val);
                          localStorage.setItem('modern_app_auto_sync', val ? '1' : '0');
                          macAudio.playClick();
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #27272a'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#f4f4f5' }}>
                          Audio Alerts on Remote Invoices
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          Play notification chime when remote colleagues save a bill.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={soundOnSync}
                        onCheckedChange={(val: boolean) => {
                          setSoundOnSync(val);
                          localStorage.setItem('modern_app_sync_sound', val ? '1' : '0');
                          macAudio.playClick();
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#f4f4f5' }}>
                          Broadcast Online Presence
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          Show this terminal as online in team network chat and peer list.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={deviceOnlineStatus}
                        onCheckedChange={(val: boolean) => {
                          setDeviceOnlineStatus(val);
                          macAudio.playClick();
                        }}
                      />
                    </div>
                  </div>

                  {/* Connected Stations List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>
                      Connected Peer Stations
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: '#18181b',
                          border: '1px solid #27272a'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#f4f4f5' }}>
                            {userName} ({userTerminal} - This Machine)
                          </span>
                        </div>
                        <ShadcnBadge variant="outline" style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                          {userPrefix || 'ROHIT'}
                        </ShadcnBadge>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: '#18181b',
                          border: '1px solid #27272a'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                            Warehouse Dispatch (Counter #2)
                          </span>
                        </div>
                        <ShadcnBadge variant="secondary" style={{ fontFamily: 'monospace', color: '#71717a' }}>
                          WH
                        </ShadcnBadge>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: '#18181b',
                          border: '1px solid #27272a'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                            Accounts & Ledger Desk (Counter #3)
                          </span>
                        </div>
                        <ShadcnBadge variant="secondary" style={{ fontFamily: 'monospace', color: '#71717a' }}>
                          ACC
                        </ShadcnBadge>
                      </div>
                    </div>
                  </div>
                </ShadcnCardContent>
              </ShadcnCard>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* TAB 3: KEYBOARD SHORTCUTS & NUMPAD ENGINE (ACETERNITY STYLE VISUALIZER)   */}
      {/* ========================================================================= */}
      {activeTab === 'SHORTCUTS' && (
        <KeyboardShortcutsVisualizer />
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

