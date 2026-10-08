import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Activity,
  HardDrive,
  Laptop,
  Key,
  Clock,
  Monitor
} from 'lucide-react';
import {
  Button,
  Button as ShadcnButton,
  Input,
  Input as ShadcnInput,
  InputNumber,
  Slider,
  Segmented,
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
  CardFooter as ShadcnCardFooter,
  Tabs as ShadcnTabs,
  TabsList as ShadcnTabsList,
  TabsTrigger as ShadcnTabsTrigger,
  TabsContent as ShadcnTabsContent,
  Switch,
  Switch as ShadcnSwitch,
  Badge,
  Badge as ShadcnBadge,
  Label as ShadcnLabel,
  Avatar as ShadcnAvatar,
  AvatarImage as ShadcnAvatarImage,
  AvatarFallback as ShadcnAvatarFallback,
  Progress as ShadcnProgress,
  Tooltip,
  Select as ShadcnSelect,
  toast
} from './ui/shadcn';
import { getUserProfile, setUserProfile, getUserPrefix } from '../services/supabaseClient';
import { getAvatarUrl, getAllAvatarIds, getDeterministicAvatarId } from '../utils/avatarUtils';
import { supabaseSyncService } from '../services/supabaseSync';
import { saveMediaToDB, clearMediaFromDB } from '../services/mediaStorage';
import {
  BARCODE_PRESETS,
  DEFAULT_BARCODE_CONFIG,
  loadBarcodeConfig,
  saveBarcodeConfig,
  generateCode128SvgBars,
  generateQrMatrix,
  generateDataMatrixSvgMatrix,
  GLASS_ERP_SAMPLE_BATCH,
  generateTsplCommand,
  generateZplCommand,
  downloadThermalScriptFile,
  parseWeighingScaleBarcode
} from '../utils/barcodeConfigHelper';
import type {
  BarcodePreset,
  BarcodeSymbology,
  BarcodeSystemConfig,
  GlassErpBatchItem,
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
export type BarcodeSubTab = 'PRESETS' | 'GLASS_ERP' | 'MARG_RULES' | 'DIMENSIONS' | 'THERMAL_HEAD' | 'CONTENT' | 'PRINTER_CMDS' | 'SCANNER';
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
      background: 'rgba(24, 24, 27, 0.45)',
      border: '1px solid #27272a',
      borderRadius: '8px',
      transition: 'all 0.15s ease',
      cursor: 'pointer'
    }}
    onClick={() => {
      onChange(!checked);
      macAudio.playClick();
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f3f46')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272a')}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, paddingRight: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#f4f4f5', letterSpacing: '-0.01em' }}>{title}</span>
        {badge && (
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '4px',
              border: '1px solid #27272a',
              background: '#18181b',
              color: '#a1a1aa',
              fontFamily: 'monospace'
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {desc && <span style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.3 }}>{desc}</span>}
    </div>
    <div onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={checked}
        onCheckedChange={(val: boolean) => {
          onChange(val);
          macAudio.playClick();
        }}
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
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(0);
  const [previewZoom, setPreviewZoom] = useState<number>(1);

  const handleUpdateBarcodeConfig = (updates: Partial<BarcodeSystemConfig>) => {
    setBarcodeConfig(prev => {
      const next = { ...prev, ...updates };
      saveBarcodeConfig(next);
      return next;
    });
  };

  const handleSelectBarcodePreset = (preset: BarcodePreset) => {
    macAudio.playPop();
    const pAny = preset as any;
    const extraUpdates: Partial<BarcodeSystemConfig> = {};
    if (pAny.symbology) extraUpdates.symbology = pAny.symbology;
    if (pAny.printGlassErpTags !== undefined) extraUpdates.printGlassErpTags = pAny.printGlassErpTags;
    if (pAny.category === 'GLASS_LITE' || pAny.category === 'GLASS_CRATE') {
      extraUpdates.printGlassErpTags = true;
    }
    handleUpdateBarcodeConfig({
      presetId: preset.id,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      columns: preset.columns,
      gapXMm: preset.gapX,
      gapYMm: preset.gapY,
      marginTopMm: preset.marginTop,
      marginLeftMm: preset.marginLeft,
      ...extraUpdates
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


  // User Profile & Multi-Device Sync State (2026 Linear/Supabase/Vercel Industrial Architecture)
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('modern_app_user_name') || 'Rohit Kumar');
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('modern_app_user_role') || 'Plant Supervisor');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('modern_app_user_avatar') || '');
  const [userAvatarId, setUserAvatarId] = useState<number>(() => {
    const saved = localStorage.getItem('modern_app_user_avatar_id');
    if (saved) return parseInt(saved, 10);
    return getDeterministicAvatarId(localStorage.getItem('modern_app_user_name') || 'Rohit');
  });
  const [userTerminal, setUserTerminal] = useState<string>(() => localStorage.getItem('modern_app_user_terminal') || 'Station 01 (Bottero CNC)');
  const [userPhone, setUserPhone] = useState<string>(() => localStorage.getItem('modern_app_user_phone') || '+91 98765 43210');
  const [userStatus, setUserStatus] = useState<string>(() => localStorage.getItem('modern_app_user_status') || 'Active on Bottero CNC Cutting Line 1');
  const [userPrefix, setUserPrefix] = useState<string>(() => localStorage.getItem('modern_app_user_prefix') || getUserPrefix(localStorage.getItem('modern_app_user_name') || 'ROHIT'));
  const [isPrefixCustomized, setIsPrefixCustomized] = useState<boolean>(() => Boolean(localStorage.getItem('modern_app_user_prefix')));
  const [autoCloudSync, setAutoCloudSync] = useState<boolean>(() => localStorage.getItem('modern_app_auto_sync') !== '0');
  const [soundOnSync, setSoundOnSync] = useState<boolean>(() => localStorage.getItem('modern_app_sync_sound') !== '0');
  const [deviceOnlineStatus, setDeviceOnlineStatus] = useState<boolean>(true);
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(100);
  const [lastSyncTime, setLastSyncTime] = useState<string>('14s ago');
  const dpInputRef = useRef<HTMLInputElement>(null);

  // Glass Factory Floor Specific State
  const [operatorPunchId, setOperatorPunchId] = useState<string>(() => localStorage.getItem('modern_app_operator_punch_id') || 'GLS-9021');
  const [assignedLine, setAssignedLine] = useState<string>(() => localStorage.getItem('modern_app_assigned_line') || 'Cutting Line 1 - Bottero CNC');
  const [operatorShift, setOperatorShift] = useState<string>(() => localStorage.getItem('modern_app_operator_shift') || 'Shift A (08:00 AM - 04:00 PM)');
  const [kioskPin, setKioskPin] = useState<string>(() => localStorage.getItem('modern_app_kiosk_pin') || '4082');
  const [pinInputTest, setPinInputTest] = useState<string>('');
  const [pinUnlockStatus, setPinUnlockStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [profileSubTab, setProfileSubTab] = useState<'IDENTITY' | 'SYNC' | 'DEVICES' | 'PIN' | 'AUDIT'>('IDENTITY');

  // Granular Factory Sync Switches
  const [syncProductionOrders, setSyncProductionOrders] = useState<boolean>(() => localStorage.getItem('sync_prod_orders') !== '0');
  const [syncTemplates, setSyncTemplates] = useState<boolean>(() => localStorage.getItem('sync_templates') !== '0');
  const [syncMachineRules, setSyncMachineRules] = useState<boolean>(() => localStorage.getItem('sync_machine_rules') !== '0');
  const [syncOfflineCache, setSyncOfflineCache] = useState<boolean>(() => localStorage.getItem('sync_offline_cache') !== '0');

  // Connected Factory Devices
  const [pairedDevices, setPairedDevices] = useState<Array<{ id: string; name: string; station: string; type: string; lastSeen: string; isCurrent: boolean; ip: string; pingMs?: number }>>([
    { id: 'dev-1', name: 'Bottero CNC Cutting Line 1', station: 'Station 01', type: 'CNC Terminal', lastSeen: 'This Device • Active Now', isCurrent: true, ip: '192.168.1.120', pingMs: 1 },
    { id: 'dev-2', name: 'Dispatch QC Tablet (iPad Pro)', station: 'Station 04', type: 'Mobile QC', lastSeen: '8m ago', isCurrent: false, ip: '192.168.1.144', pingMs: 4 },
    { id: 'dev-3', name: 'Central Accounts & Billing PC', station: 'Desk 01', type: 'Office PC', lastSeen: '24m ago', isCurrent: false, ip: '192.168.1.105', pingMs: 2 },
    { id: 'dev-4', name: 'Thermal Barcode Station (TSC TE244)', station: 'Station 02', type: 'Thermal Print Server', lastSeen: '1m ago', isCurrent: false, ip: '192.168.1.132', pingMs: 2 }
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; event: string; tag: string; op: string }>>([
    { id: 'log-1', time: '12:10:45', event: 'Cloud Delta Sync Completed (48 glass items verified)', tag: 'SYNC', op: 'GLS-9021' },
    { id: 'log-2', time: '12:08:12', event: 'Thermal Barcode TSPL Generated for ORD-9842 (Lite L-04/12)', tag: 'PRINT', op: 'GLS-9021' },
    { id: 'log-3', time: '11:54:20', event: 'Operator Handover: Shift A verified by Quick PIN', tag: 'SECURITY', op: 'GLS-9021' },
    { id: 'log-4', time: '11:32:00', event: 'Bottero CNC Cutting Line 1 connected to Plant Mesh', tag: 'NETWORK', op: 'SYSTEM' },
    { id: 'log-5', time: '10:15:30', event: 'Stock Material Intake: 40 sheets 12mm Clear Float Glass logged', tag: 'STOCK', op: 'EMP-1022' }
  ]);

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
      terminal: userTerminal,
      avatarId: userAvatarId
    });
    localStorage.setItem('modern_app_user_name', trimmed);
    localStorage.setItem('modern_app_user_prefix', cleanPrefix);
    localStorage.setItem('modern_app_user_role', userRole);
    localStorage.setItem('modern_app_user_avatar', userAvatar);
    localStorage.setItem('modern_app_user_avatar_id', String(userAvatarId));
    localStorage.setItem('modern_app_user_terminal', userTerminal);
    localStorage.setItem('modern_app_user_phone', userPhone);
    localStorage.setItem('modern_app_user_status', userStatus);
    localStorage.setItem('modern_app_operator_punch_id', operatorPunchId);
    localStorage.setItem('modern_app_assigned_line', assignedLine);
    localStorage.setItem('modern_app_operator_shift', operatorShift);
    localStorage.setItem('modern_app_kiosk_pin', kioskPin);
    localStorage.setItem('modern_app_auto_sync', autoCloudSync ? '1' : '0');
    localStorage.setItem('modern_app_sync_sound', soundOnSync ? '1' : '0');
    localStorage.setItem('sync_prod_orders', syncProductionOrders ? '1' : '0');
    localStorage.setItem('sync_templates', syncTemplates ? '1' : '0');
    localStorage.setItem('sync_machine_rules', syncMachineRules ? '1' : '0');
    localStorage.setItem('sync_offline_cache', syncOfflineCache ? '1' : '0');
    window.dispatchEvent(new Event('storage'));
    onShowToast?.('Operator Profile & Factory Sync Settings Saved!', 'success');
    macAudio.playSuccess();
    setAuditLogs(prev => [
      { id: `log-${Date.now()}`, time: new Date().toLocaleTimeString(), event: 'Profile credentials & production line settings updated', tag: 'PROFILE', op: operatorPunchId },
      ...prev.slice(0, 15)
    ]);
  };

  const handleForceResync = async () => {
    setIsSyncingNow(true);
    setSyncProgress(25);
    macAudio.playClick();
    onShowToast?.('Synchronizing data with Cloud and plant counters...', 'info');
    setTimeout(() => setSyncProgress(70), 300);
    try {
      await supabaseSyncService.pullAllCloudBills();
      setSyncProgress(100);
      setLastSyncTime('Just now');
      macAudio.playSuccess();
      onShowToast?.('All Glass Templates & Production Orders Synced!', 'success');
      setAuditLogs(prev => [
        { id: `log-${Date.now()}`, time: new Date().toLocaleTimeString(), event: 'All glass templates & production orders synced to cloud', tag: 'SYNC', op: operatorPunchId },
        ...prev.slice(0, 15)
      ]);
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      setSyncProgress(100);
      onShowToast?.('Sync notice: ' + (err.message || 'Offline mode active'), 'info');
    } finally {
      setTimeout(() => setIsSyncingNow(false), 500);
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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <ShadcnSelect
                      value={defaultPrinter || systemDefaultPrinter || ''}
                      onChange={(e: any) => {
                        const selected = e.target.value;
                        setDefaultPrinter(selected);
                        macAudio.playClick();
                        onShowToast?.(`Default printer set to: ${selected}`, 'success');
                      }}
                      style={{ width: '100%', height: '36px' }}
                    >
                      {availablePrinters.length > 0 ? (
                        availablePrinters.map((p) => (
                          <option key={p} value={p} data-category="Available Printers">
                            {p} {p === systemDefaultPrinter ? '★ (Windows Default)' : ''}
                          </option>
                        ))
                      ) : (
                        <option value={defaultPrinter || 'Default Printer'} data-category="System Printer">
                          {defaultPrinter || 'Default System Printer'}
                        </option>
                      )}
                    </ShadcnSelect>
                  </div>

                  <Tooltip title="Refresh Windows Printers List" side="bottom">
                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchPrintersList}
                      disabled={isPrinterChecking}
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
                  </Tooltip>
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
                <Tooltip title="Dispatch High-Resolution Calibration Test Page" side="bottom">
                  <ShadcnButton
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleTestPrint}
                    disabled={isTestPrinting || printerEngineStatus === 'offline'}
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
                    <span>{isTestPrinting ? 'Printing...' : 'Print Test Page'}</span>
                  </ShadcnButton>
                </Tooltip>
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
                  <ShadcnSelect
                    value={printPaperSize}
                    onChange={(e: any) => {
                      setPrintPaperSize(e.target.value);
                      localStorage.setItem('modern_app_paper_size', e.target.value);
                    }}
                    style={{ width: '100%', height: '32px' }}
                  >
                    <option value="A4" data-category="Cut Sheet Paper">A4 (Portrait 210 x 297 mm)</option>
                    <option value="A4_LANDSCAPE" data-category="Cut Sheet Paper">A4 (Landscape)</option>
                    <option value="THERMAL_3INCH" data-category="Thermal Roll">3-Inch Thermal Roll (80mm)</option>
                    <option value="THERMAL_4INCH" data-category="Shipping Label">4-Inch Shipping Label (100mm)</option>
                  </ShadcnSelect>
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
                <Badge variant="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {themeMode.toUpperCase()} MODE
                </Badge>
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
      {/* TAB 2: USER PROFILE & MULTI-DEVICE SYNC (2026 INDUSTRIAL SHADCN/UI)        */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILE' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflowY: 'auto', padding: '4px 8px' }}>
          
          {/* 1. Header Profile Banner (Linear / Vercel Ultra-Modern Card) */}
          <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            <ShadcnCardContent style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                
                {/* Left: Avatar with Live Pulse Status & Credentials */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <ShadcnAvatar size="xl" style={{ border: '2px solid #3f3f46', background: '#18181b', width: '64px', height: '64px' }}>
                      <ShadcnAvatarImage src={userAvatar || getAvatarUrl(userAvatarId, userName)} alt={userName} />
                      <ShadcnAvatarFallback style={{ fontSize: '20px', fontWeight: 700, color: '#f4f4f5', background: '#27272a' }}>
                        {userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'OP'}
                      </ShadcnAvatarFallback>
                    </ShadcnAvatar>
                    {/* Live Presence Pulse Indicator */}
                    <span
                      title="Operator Active & Connected"
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid #09090b',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.4px', color: '#f4f4f5', margin: 0 }}>
                        {userName || 'Rohit Kumar'}
                      </h2>
                      <ShadcnBadge variant="default" style={{ fontSize: '10.5px', fontWeight: 600, background: '#f4f4f5', color: '#09090b' }}>
                        {userRole}
                      </ShadcnBadge>
                      <ShadcnBadge variant="outline" style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#38bdf8', borderColor: '#27272a' }}>
                        {operatorShift.split(' ')[0]} {operatorShift.split(' ')[1] || ''}
                      </ShadcnBadge>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontFamily: 'monospace',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid #27272a',
                          background: '#18181b',
                          color: '#a1a1aa'
                        }}
                      >
                        PUNCH: {operatorPunchId}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '5px', fontSize: '12px', color: '#71717a' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Layers size={13} style={{ color: '#a1a1aa' }} />
                        <strong style={{ color: '#f4f4f5', fontWeight: 500 }}>{assignedLine}</strong>
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Monitor size={13} style={{ color: '#a1a1aa' }} />
                        <span>{userTerminal}</span>
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wifi size={13} style={{ color: '#10b981' }} />
                        <span style={{ color: '#10b981', fontFamily: 'monospace' }}>LAN 192.168.1.120 (1ms)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShadcnButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      macAudio.playClick();
                      setProfileSubTab('PIN');
                    }}
                    style={{ background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5' }}
                  >
                    <Key size={13} style={{ color: '#a1a1aa' }} />
                    <span>Quick Kiosk PIN</span>
                  </ShadcnButton>

                  <ShadcnButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleForceResync}
                    disabled={isSyncingNow}
                    style={{ background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5' }}
                  >
                    <RefreshCw size={13} className={isSyncingNow ? 'animate-spin' : ''} style={{ color: '#a1a1aa' }} />
                    <span>{isSyncingNow ? 'Syncing...' : 'Sync Cloud'}</span>
                  </ShadcnButton>

                  <ShadcnButton
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSaveProfile}
                    style={{ background: '#f4f4f5', color: '#09090b', fontWeight: 600 }}
                  >
                    <Check size={14} />
                    <span>Save Changes</span>
                  </ShadcnButton>
                </div>
              </div>

              {/* Quick Industrial Status Metric Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid #27272a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#18181b', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '8px' }}>
                  <Activity size={16} style={{ color: '#10b981' }} />
                  <div>
                    <span style={{ fontSize: '10px', color: '#71717a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Output</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace' }}>48 Glass Lites Cut</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#18181b', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '8px' }}>
                  <Zap size={16} style={{ color: '#38bdf8' }} />
                  <div>
                    <span style={{ fontSize: '10px', color: '#71717a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch Yield</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace' }}>98.4% Kerf Optimization</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#18181b', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '8px' }}>
                  <Cloud size={16} style={{ color: '#a855f7' }} />
                  <div>
                    <span style={{ fontSize: '10px', color: '#71717a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cloud Replication</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace' }}>Realtime • {lastSyncTime}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#18181b', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '8px' }}>
                  <HardDrive size={16} style={{ color: '#fbbf24' }} />
                  <div>
                    <span style={{ fontSize: '10px', color: '#71717a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Local Resilience</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace' }}>0 Pending • 7d Cache</span>
                  </div>
                </div>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* 2. Sub-Navigation TabsList (Linear / Supabase Style) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#18181b',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #27272a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { key: 'IDENTITY', label: 'Operator & Shift', icon: <User size={13} /> },
                { key: 'SYNC', label: 'Cloud & Local Sync', icon: <Cloud size={13} /> },
                { key: 'DEVICES', label: 'Workstations & Devices', icon: <Laptop size={13} /> },
                { key: 'PIN', label: 'Security & Quick PIN', icon: <Key size={13} /> },
                { key: 'AUDIT', label: 'Shift Audit Log', icon: <Clock size={13} /> }
              ].map(tab => {
                const isActive = profileSubTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      setProfileSubTab(tab.key as any);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: '6px',
                      border: isActive ? '1px solid #3f3f46' : '1px solid transparent',
                      cursor: 'pointer',
                      background: isActive ? '#27272a' : 'transparent',
                      color: isActive ? '#f4f4f5' : '#71717a',
                      boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#a1a1aa';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#71717a';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ paddingRight: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                Cluster Node: <strong>GLS-NODE-01</strong>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUBTAB 1: OPERATOR & PRODUCTION SHIFT IDENTITY                            */}
          {/* ========================================================================= */}
          {profileSubTab === 'IDENTITY' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              
              {/* Card 1: Factory Operator Credentials */}
              <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                  <ShadcnCardTitle style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} style={{ color: '#a1a1aa' }} />
                    Operator Credentials & Production Line
                  </ShadcnCardTitle>
                  <ShadcnCardDescription style={{ fontSize: '12px' }}>
                    Shift roster assignment, punch ID code, and factory floor machine station.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* 3D Avatar Picker Studio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', borderRadius: '10px', background: '#18181b', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} style={{ color: '#38bdf8' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5' }}>
                          Choose 3D Profile Avatar (DP)
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>
                        Active DP: #{userAvatarId}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Active Big Avatar Preview */}
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: '#09090b',
                          border: '2px solid #007AFF',
                          boxShadow: '0 0 14px rgba(0, 122, 255, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={userAvatar || getAvatarUrl(userAvatarId, userName)}
                          alt="DP"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Controls: Upload Custom / Remove */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                            style={{ height: '28px', fontSize: '11px', background: '#27272a', color: '#f4f4f5' }}
                          >
                            <Upload size={12} style={{ marginRight: '4px' }} />
                            Upload Custom Photo
                          </ShadcnButton>
                          {userAvatar && (
                            <ShadcnButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              style={{ height: '28px', fontSize: '11px', color: '#ef4444' }}
                              onClick={() => {
                                setUserAvatar('');
                                localStorage.removeItem('modern_app_user_avatar');
                                window.dispatchEvent(new Event('storage'));
                                macAudio.playTrash();
                              }}
                            >
                              Reset to 3D Avatar
                            </ShadcnButton>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#71717a' }}>
                          Neeche diye 3D avatars me se koi bhi select karein (DP har jagah sync hogi).
                        </span>
                      </div>
                    </div>

                    {/* 3D Avatars Grid Shelf */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                        gap: '8px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        padding: '8px',
                        background: '#09090b',
                        borderRadius: '8px',
                        border: '1px solid #27272a',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#3f3f46 transparent'
                      }}
                    >
                      {getAllAvatarIds().map((id) => {
                        const isSelected = userAvatarId === id && (!userAvatar || userAvatar === `/avatars/${id}.webp`);
                        return (
                          <button
                            key={id}
                            type="button"
                            title={`3D Avatar #${id}`}
                            onClick={() => {
                              setUserAvatarId(id);
                              setUserAvatar(`/avatars/${id}.webp`);
                              localStorage.setItem('modern_app_user_avatar_id', String(id));
                              localStorage.setItem('modern_app_user_avatar', `/avatars/${id}.webp`);
                              setUserProfile({ avatarId: id });
                              window.dispatchEvent(new Event('storage'));
                              macAudio.playPop();
                              onShowToast?.(`Avatar #${id} Selected!`, 'success');
                            }}
                            style={{
                              position: 'relative',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              border: isSelected ? '2px solid #007AFF' : '1px solid #27272a',
                              background: isSelected ? 'rgba(0, 122, 255, 0.25)' : '#18181b',
                              cursor: 'pointer',
                              padding: 0,
                              overflow: 'hidden',
                              transition: 'all 0.15s ease',
                              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                              boxShadow: isSelected ? '0 0 10px rgba(0, 122, 255, 0.6)' : 'none'
                            }}
                          >
                            <img
                              src={`/avatars/${id}.webp`}
                              alt={`#${id}`}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operator Name & Punch Code */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Operator Display Name</ShadcnLabel>
                      <ShadcnInput
                        type="text"
                        value={userName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Rohit Kumar"
                        style={{ height: '34px', fontSize: '12px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Operator Code / Punch ID</ShadcnLabel>
                      <ShadcnInput
                        type="text"
                        value={operatorPunchId}
                        onChange={(e) => setOperatorPunchId(e.target.value.toUpperCase())}
                        placeholder="e.g. GLS-9021"
                        style={{ height: '34px', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  {/* Assigned Production Line */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Assigned Production Line</ShadcnLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                      {[
                        'Cutting Line 1 - Bottero CNC',
                        'Cutting Line 2 - Bystronic',
                        'Furnace 1 - Landglass Toughening',
                        'DGU Insulating Unit - Lisec',
                        'Lamination Autoclave Line',
                        'Dispatch & Final QC Deck'
                      ].map((line) => {
                        const isSelected = assignedLine === line;
                        return (
                          <button
                            key={line}
                            type="button"
                            onClick={() => {
                              setAssignedLine(line);
                              macAudio.playClick();
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #38bdf8' : '1px solid #27272a',
                              background: isSelected ? '#18181b' : '#09090b',
                              color: isSelected ? '#f4f4f5' : '#a1a1aa',
                              fontSize: '11px',
                              fontWeight: isSelected ? 600 : 400,
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {line}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operator Shift Timing */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Factory Shift Roster</ShadcnLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                      {[
                        { key: 'Shift A (06:00 AM - 02:00 PM)', label: 'Shift A (06:00 AM – 02:00 PM)' },
                        { key: 'Shift B (02:00 PM - 10:00 PM)', label: 'Shift B (02:00 PM – 10:00 PM)' },
                        { key: 'Shift C (10:00 PM - 06:00 AM)', label: 'Shift C (10:00 PM – 06:00 AM)' },
                        { key: 'General (09:00 AM - 06:00 PM)', label: 'General (09:00 AM – 06:00 PM)' }
                      ].map((s) => {
                        const isSelected = operatorShift.includes(s.key.split(' ')[0]);
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setOperatorShift(s.key);
                              macAudio.playClick();
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #f4f4f5' : '1px solid #27272a',
                              background: isSelected ? '#27272a' : '#09090b',
                              color: isSelected ? '#ffffff' : '#71717a',
                              fontSize: '11px',
                              fontWeight: isSelected ? 600 : 400,
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </ShadcnCardContent>
              </ShadcnCard>

              {/* Card 2: Role, Multi-Device Bill Clash Guard & Station */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Department & Machine Role */}
                <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                  <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Counter Role & Department</ShadcnCardTitle>
                    <ShadcnCardDescription style={{ fontSize: '12px' }}>
                      Authorization level for cutting lists, price override, and dispatch tokens.
                    </ShadcnCardDescription>
                  </ShadcnCardHeader>

                  <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                      {['Plant Supervisor', 'CNC Cutting Operator', 'Quality Control Lead', 'Accounts & Dispatch Admin'].map((r) => {
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
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #f4f4f5' : '1px solid #27272a',
                              background: isSelected ? '#27272a' : '#18181b',
                              color: isSelected ? '#ffffff' : '#a1a1aa',
                              fontSize: '11.5px',
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

                    {/* Machine Terminal Identifier */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Machine Terminal</ShadcnLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                        {['Station 01 (Bottero CNC)', 'Station 02 (Furnace Desk)', 'Station 03 (Godown PC)', 'Station 04 (QC iPad)'].map((t) => {
                          const isSelected = userTerminal.includes(t.split(' ')[1] || t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setUserTerminal(t);
                                macAudio.playClick();
                              }}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: isSelected ? '1px solid #38bdf8' : '1px solid #27272a',
                                background: isSelected ? '#18181b' : '#09090b',
                                color: isSelected ? '#f4f4f5' : '#71717a',
                                fontSize: '11px',
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

                    {/* Phone & Live Broadcast Presence */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Contact Phone</ShadcnLabel>
                        <ShadcnInput
                          type="text"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          style={{ height: '32px', fontSize: '11.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Live Presence Status</ShadcnLabel>
                        <ShadcnInput
                          type="text"
                          value={userStatus}
                          onChange={(e) => setUserStatus(e.target.value)}
                          placeholder="Active on Cutting Line 1"
                          style={{ height: '32px', fontSize: '11.5px' }}
                        />
                      </div>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>

                {/* Multi-Device Bill Clash Guard */}
                <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                  <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Unique Bill Token Prefix</ShadcnCardTitle>
                    <ShadcnCardDescription style={{ fontSize: '12px' }}>
                      Guarantees no duplicate invoice numbers when multiple cutting desks bill simultaneously.
                    </ShadcnCardDescription>
                  </ShadcnCardHeader>

                  <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <ShadcnInput
                      type="text"
                      value={userPrefix}
                      onChange={(e) => {
                        setUserPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                        setIsPrefixCustomized(true);
                      }}
                      placeholder="e.g. ROHIT, LINE1, WH1"
                      style={{
                        height: '34px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        letterSpacing: '1px'
                      }}
                    />

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
                      <span style={{ fontSize: '11px', color: '#71717a' }}>Sequence Preview:</span>
                      <ShadcnBadge variant="outline" style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '11px' }}>
                        {userPrefix ? `${userPrefix}-1, ${userPrefix}-2, ${userPrefix}-3...` : 'BILL-1, BILL-2...'}
                      </ShadcnBadge>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBTAB 2: CLOUD & LOCAL REALTIME SYNC ENGINE                               */}
          {/* ========================================================================= */}
          {profileSubTab === 'SYNC' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              
              {/* Left: Real-Time Replication Status & Granular Switches */}
              <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cloud size={16} style={{ color: '#a1a1aa' }} />
                      <ShadcnCardTitle style={{ fontSize: '14px' }}>Real-Time Cloud & Plant Sync</ShadcnCardTitle>
                    </div>
                    <ShadcnBadge
                      variant="secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '11px'
                      }}
                    >
                      <CheckCircle2 size={12} />
                      Live Replicating
                    </ShadcnBadge>
                  </div>
                  <ShadcnCardDescription style={{ fontSize: '12px' }}>
                    Replicates cutting lists, glass order updates, and inventory between cutting floor and central cloud ERP.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Sync Status Banner */}
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HardDrive size={14} style={{ color: '#71717a' }} />
                        Local Offline Queue: <strong style={{ color: '#f4f4f5' }}>0 Pending Jobs</strong>
                      </span>
                      <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                        Last Sync: {lastSyncTime}
                      </span>
                    </div>

                    {/* Progress Bar when syncing */}
                    {isSyncingNow && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#38bdf8', marginBottom: '4px' }}>
                          <span>Replicating production batches...</span>
                          <span style={{ fontFamily: 'monospace' }}>{syncProgress}%</span>
                        </div>
                        <ShadcnProgress value={syncProgress} indicatorColor="#38bdf8" />
                      </div>
                    )}
                  </div>

                  {/* Granular Auto-Sync Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #27272a' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#f4f4f5' }}>
                          Auto-Sync Cutting Orders & Batches
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>
                          Automatically pull incoming glass jobs from ERP every 2 minutes.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={syncProductionOrders}
                        onCheckedChange={(val: boolean) => {
                          setSyncProductionOrders(val);
                          localStorage.setItem('sync_prod_orders', val ? '1' : '0');
                          macAudio.playClick();
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #27272a' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#f4f4f5' }}>
                          Barcode & Thermal Label Templates Backup
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>
                          Synchronize custom 50x30 / 100x50 mm templates across all line printers.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={syncTemplates}
                        onCheckedChange={(val: boolean) => {
                          setSyncTemplates(val);
                          localStorage.setItem('sync_templates', val ? '1' : '0');
                          macAudio.playClick();
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #27272a' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#f4f4f5' }}>
                          Machine Configurations & CNC Rules
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>
                          Propagate glass margin, kerf cutting width & tolerance settings.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={syncMachineRules}
                        onCheckedChange={(val: boolean) => {
                          setSyncMachineRules(val);
                          localStorage.setItem('sync_machine_rules', val ? '1' : '0');
                          macAudio.playClick();
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#f4f4f5' }}>
                          Offline Resilience Local Cache
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>
                          Retain last 7 days cutting jobs on device if factory Wi-Fi cuts out.
                        </div>
                      </div>
                      <ShadcnSwitch
                        checked={syncOfflineCache}
                        onCheckedChange={(val: boolean) => {
                          setSyncOfflineCache(val);
                          localStorage.setItem('sync_offline_cache', val ? '1' : '0');
                          macAudio.playClick();
                        }}
                      />
                    </div>
                  </div>
                </ShadcnCardContent>

                <ShadcnCardFooter style={{ borderTop: '1px solid #27272a', background: '#121215', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Wifi size={13} style={{ color: '#10b981' }} /> Plant LAN: 192.168.1.120 (1ms latency)
                  </span>
                  <ShadcnButton
                    type="button"
                    size="sm"
                    onClick={handleForceResync}
                    disabled={isSyncingNow}
                    style={{ background: '#f4f4f5', color: '#09090b', fontWeight: 600, height: '32px' }}
                  >
                    <RefreshCw size={13} className={isSyncingNow ? 'animate-spin' : ''} />
                    <span>{isSyncingNow ? 'Syncing...' : 'Sync Now'}</span>
                  </ShadcnButton>
                </ShadcnCardFooter>
              </ShadcnCard>

              {/* Right: Network Latency, Storage & Bandwidth Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Network & Latency Health */}
                <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                  <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Plant Network Diagnostics</ShadcnCardTitle>
                    <ShadcnCardDescription style={{ fontSize: '12px' }}>
                      Latency to central Supabase cloud and local cutting table LAN.
                    </ShadcnCardDescription>
                  </ShadcnCardHeader>

                  <ShadcnCardContent style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontSize: '12px', color: '#f4f4f5', fontWeight: 500 }}>Central Cloud Server</span>
                      </div>
                      <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8' }}>18ms (Fast)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontSize: '12px', color: '#f4f4f5', fontWeight: 500 }}>Bottero CNC Cutting LAN</span>
                      </div>
                      <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#10b981' }}>1.2ms (Zero Lag)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                        <span style={{ fontSize: '12px', color: '#f4f4f5', fontWeight: 500 }}>Thermal Label Server</span>
                      </div>
                      <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#a1a1aa' }}>2.0ms</span>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>

                {/* Storage Health */}
                <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                  <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Storage & Replication Health</ShadcnCardTitle>
                    <ShadcnCardDescription style={{ fontSize: '12px' }}>
                      IndexedDB & LocalStorage footprint on this terminal.
                    </ShadcnCardDescription>
                  </ShadcnCardHeader>

                  <ShadcnCardContent style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa', marginBottom: '4px' }}>
                        <span>Local Cache Utilization</span>
                        <span style={{ fontFamily: 'monospace', color: '#f4f4f5' }}>2.4 MB / 50 MB (4.8%)</span>
                      </div>
                      <ShadcnProgress value={4.8} indicatorColor="#10b981" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a', fontSize: '11.5px' }}>
                      <span style={{ color: '#71717a' }}>Synchronized Invoices</span>
                      <span style={{ color: '#f4f4f5', fontFamily: 'monospace', fontWeight: 600 }}>{bills.length} Records</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a', fontSize: '11.5px' }}>
                      <span style={{ color: '#71717a' }}>Thermal Presets</span>
                      <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>{BARCODE_PRESETS.length} Templates Active</span>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBTAB 3: CONNECTED WORKSTATIONS & FACTORY DEVICES                         */}
          {/* ========================================================================= */}
          {profileSubTab === 'DEVICES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
              
              {/* Paired Devices List */}
              <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Laptop size={16} style={{ color: '#a1a1aa' }} />
                      <ShadcnCardTitle style={{ fontSize: '14px' }}>Active Factory Floor Terminals</ShadcnCardTitle>
                    </div>
                    <ShadcnBadge variant="outline" style={{ fontSize: '10.5px', fontFamily: 'monospace' }}>
                      {pairedDevices.length} Connected
                    </ShadcnBadge>
                  </div>
                  <ShadcnCardDescription style={{ fontSize: '12px' }}>
                    CNC cutting stations, mobile QC inspection tablets, and office billing computers paired with your profile.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pairedDevices.map((device) => (
                    <div
                      key={device.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: device.isCurrent ? '#18181b' : '#0f0f12',
                        border: device.isCurrent ? '1px solid #3f3f46' : '1px solid #27272a',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#09090b',
                            border: '1px solid #27272a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {device.type.includes('CNC') ? (
                            <Monitor size={18} style={{ color: '#38bdf8' }} />
                          ) : device.type.includes('QC') ? (
                            <Smartphone size={18} style={{ color: '#10b981' }} />
                          ) : device.type.includes('Print') ? (
                            <Printer size={18} style={{ color: '#fbbf24' }} />
                          ) : (
                            <Laptop size={18} style={{ color: '#a855f7' }} />
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                              {device.name}
                            </span>
                            {device.isCurrent && (
                              <span style={{ fontSize: '9.5px', background: '#27272a', color: '#f4f4f5', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                THIS DEVICE
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '2px' }}>
                            {device.type} • {device.station} • IP: <code style={{ color: '#a1a1aa' }}>{device.ip}</code>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: device.isCurrent ? '#10b981' : '#71717a', fontFamily: 'monospace' }}>
                          {device.lastSeen}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            macAudio.playPop();
                            onShowToast?.(`Ping to ${device.name} (${device.ip}): ${device.pingMs || 1.4}ms OK`, 'success');
                          }}
                          style={{
                            background: '#18181b',
                            border: '1px solid #27272a',
                            color: '#a1a1aa',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Wifi size={11} />
                          Ping
                        </button>

                        {!device.isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              macAudio.playTrash();
                              setPairedDevices(prev => prev.filter(d => d.id !== device.id));
                              onShowToast?.(`Unlinked workstation ${device.name}`, 'info');
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid #27272a',
                              color: '#ef4444',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              cursor: 'pointer'
                            }}
                          >
                            Unlink
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </ShadcnCardContent>
              </ShadcnCard>

              {/* Pair New Machine Terminal Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                  <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Pair New Machine Station</ShadcnCardTitle>
                    <ShadcnCardDescription style={{ fontSize: '12px' }}>
                      Enter this one-time 6-digit PIN on any tablet or cutting table terminal to pair immediately.
                    </ShadcnCardDescription>
                  </ShadcnCardHeader>

                  <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '14px 24px',
                        borderRadius: '8px',
                        background: '#18181b',
                        border: '1px dashed #38bdf8',
                        textAlign: 'center',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
                        ONE-TIME PAIRING CODE
                      </span>
                      <span style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '4px' }}>
                        749-218
                      </span>
                      <span style={{ fontSize: '10px', color: '#a1a1aa', display: 'block', marginTop: '2px' }}>
                        Expires in 09:42 minutes • Plant Wi-Fi Only
                      </span>
                    </div>

                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        macAudio.playClick();
                        onShowToast?.('New terminal pairing code generated: 832-504', 'success');
                      }}
                      style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5' }}
                    >
                      <RefreshCw size={13} />
                      Generate Fresh Code
                    </ShadcnButton>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBTAB 4: SECURITY & QUICK KIOSK PIN                                      */}
          {/* ========================================================================= */}
          {profileSubTab === 'PIN' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              
              {/* Quick PIN Configuration */}
              <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={16} style={{ color: '#a1a1aa' }} />
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Factory Kiosk Quick-Switch PIN</ShadcnCardTitle>
                  </div>
                  <ShadcnCardDescription style={{ fontSize: '12px' }}>
                    On the factory floor, operators change shifts without re-typing long master passwords. A 4-digit PIN enables 1-second machine handover.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      Current 4-Digit Handover PIN:
                    </ShadcnLabel>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '44px',
                            height: '48px',
                            borderRadius: '8px',
                            border: '1px solid #3f3f46',
                            background: '#18181b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: '#f4f4f5'
                          }}
                        >
                          {kioskPin[idx] || '•'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Change Kiosk PIN (4 Digits)</ShadcnLabel>
                    <ShadcnInput
                      type="password"
                      maxLength={4}
                      value={kioskPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setKioskPin(val);
                      }}
                      placeholder="e.g. 4082"
                      style={{ height: '36px', fontSize: '16px', letterSpacing: '4px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <ShadcnLabel style={{ fontSize: '11px', color: '#a1a1aa' }}>Station Auto-Lock Timer</ShadcnLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {['Never (Kiosk)', '15 Minutes', '30 Minutes', 'Shift End (8h)'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: t.includes('Never') ? '1px solid #38bdf8' : '1px solid #27272a',
                            background: t.includes('Never') ? '#18181b' : '#09090b',
                            color: t.includes('Never') ? '#f4f4f5' : '#71717a',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </ShadcnCardContent>
              </ShadcnCard>

              {/* Interactive PIN Verification Test Sandbox */}
              <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
                <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                  <ShadcnCardTitle style={{ fontSize: '14px' }}>Test Kiosk Switch Simulation</ShadcnCardTitle>
                  <ShadcnCardDescription style={{ fontSize: '12px' }}>
                    Verify that your 4-digit PIN works seamlessly during operator handover.
                  </ShadcnCardDescription>
                </ShadcnCardHeader>

                <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: 500 }}>
                      Enter Kiosk PIN to Handover Station:
                    </span>

                    <input
                      type="password"
                      maxLength={4}
                      value={pinInputTest}
                      onChange={(e) => setPinInputTest(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="••••"
                      style={{
                        width: '140px',
                        height: '42px',
                        background: '#09090b',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        color: '#f4f4f5',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontFamily: 'monospace',
                        letterSpacing: '8px',
                        outline: 'none'
                      }}
                    />

                    <ShadcnButton
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (pinInputTest === kioskPin) {
                          macAudio.playSuccess();
                          setPinUnlockStatus('SUCCESS');
                          onShowToast?.(`Station Handover Verified: Operator ${operatorPunchId} Active!`, 'success');
                          setTimeout(() => setPinUnlockStatus('IDLE'), 3000);
                        } else {
                          macAudio.playPosError();
                          setPinUnlockStatus('ERROR');
                          onShowToast?.('Incorrect Kiosk PIN. Access denied.', 'warning');
                        }
                      }}
                      style={{
                        background: pinUnlockStatus === 'SUCCESS' ? '#10b981' : pinUnlockStatus === 'ERROR' ? '#ef4444' : '#f4f4f5',
                        color: pinUnlockStatus === 'SUCCESS' || pinUnlockStatus === 'ERROR' ? '#ffffff' : '#09090b',
                        fontWeight: 600,
                        width: '100%',
                        height: '34px'
                      }}
                    >
                      {pinUnlockStatus === 'SUCCESS' ? (
                        <>
                          <Check size={14} />
                          <span>Handover Verified (1s)</span>
                        </>
                      ) : pinUnlockStatus === 'ERROR' ? (
                        <>
                          <Shield size={14} />
                          <span>PIN Mismatch</span>
                        </>
                      ) : (
                        <span>Simulate Station Switch</span>
                      )}
                    </ShadcnButton>
                  </div>
                </ShadcnCardContent>
              </ShadcnCard>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBTAB 5: SHIFT AUDIT & OPERATOR ACTIVITY LOG                             */}
          {/* ========================================================================= */}
          {profileSubTab === 'AUDIT' && (
            <ShadcnCard style={{ background: '#09090b', border: '1px solid #27272a' }}>
              <ShadcnCardHeader style={{ padding: '16px 20px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: '#a1a1aa' }} />
                    <ShadcnCardTitle style={{ fontSize: '14px' }}>Shift Activity & Industrial Event Audit</ShadcnCardTitle>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent = 'data:text/csv;charset=utf-8,' +
                          'Time,Event,Tag,Operator\n' +
                          auditLogs.map(l => `"${l.time}","${l.event}","${l.tag}","${l.op}"`).join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', `factory_audit_shift_${operatorPunchId}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        macAudio.playSuccess();
                        onShowToast?.('Exported Shift Audit (.CSV)!', 'success');
                      }}
                      style={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        color: '#f4f4f5',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Download size={12} />
                      Export .CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuditLogs([]);
                        macAudio.playTrash();
                        onShowToast?.('Shift audit log cleared', 'info');
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid #27272a',
                        color: '#71717a',
                        padding: '4px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <ShadcnCardDescription style={{ fontSize: '12px' }}>
                  Immutable chronological log of production batches, barcode labels generated, and peer sync operations.
                </ShadcnCardDescription>
              </ShadcnCardHeader>

              <ShadcnCardContent style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {auditLogs.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '12px' }}>
                    No audit records logged yet in this shift.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', minWidth: '55px' }}>
                          {log.time}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontFamily: 'monospace',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            border: '1px solid #27272a',
                            background: '#09090b',
                            color: log.tag === 'SYNC' ? '#10b981' : log.tag === 'PRINT' ? '#38bdf8' : log.tag === 'SECURITY' ? '#a855f7' : '#a1a1aa'
                          }}
                        >
                          {log.tag}
                        </span>
                        <span style={{ color: '#f4f4f5' }}>{log.event}</span>
                      </div>

                      <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#71717a' }}>
                        OP: {log.op}
                      </span>
                    </div>
                  ))
                )}
              </ShadcnCardContent>
            </ShadcnCard>
          )}

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
                onClick={handleExportBackup}
                style={{
                  height: '34px',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 2px 10px rgba(56, 189, 248, 0.4)'
                }}
              >
                <Download size={14} />
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

                    toast.success('Backup Imported', `Legacy Backup Imported Successfully! ${count} sections loaded.`);
                  }).catch(e => {
                    console.error(e);
                    toast.error('Import Failed', 'Could not load BillApp_Backup.json from src/data/');
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
                <Database size={14} />
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
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Shadcn Configuration Panel */}
          <div
            style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header: Clean Typography & Subtle Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #27272a' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Barcode size={15} style={{ color: '#a1a1aa' }} />
                    Barcode & Label Studio
                  </span>
                  <span style={{ fontSize: '9.5px', fontWeight: 500, border: '1px solid #27272a', background: '#18181b', color: '#a1a1aa', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    v3.2 • ECC-200
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#71717a', marginTop: '2px', display: 'block' }}>
                  Industrial thermal print layout, millimeter geometry & CNC glass cutting tags
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetBarcodeDefaults}
                style={{
                  background: 'transparent',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f4f4f5';
                  e.currentTarget.style.background = '#18181b';
                  e.currentTarget.style.borderColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#a1a1aa';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#27272a';
                }}
              >
                Reset Defaults
              </button>
            </div>

            {/* Sub-Tab Navigation Bar (Shadcn TabsList) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                background: '#18181b',
                padding: '3px',
                borderRadius: '8px',
                gap: '2px',
                border: '1px solid #27272a'
              }}
            >
              {[
                { key: 'PRESETS', label: 'Presets' },
                { key: 'GLASS_ERP', label: 'Glass ERP' },
                { key: 'MARG_RULES', label: 'Marg Rules' },
                { key: 'DIMENSIONS', label: 'Dimensions' },
                { key: 'THERMAL_HEAD', label: 'Thermal Head' },
                { key: 'CONTENT', label: 'Content' },
                { key: 'PRINTER_CMDS', label: 'TSPL / ZPL' },
                { key: 'SCANNER', label: 'Scanner Gun' }
              ].map(tab => {
                const isActive = barcodeSubTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      setBarcodeSubTab(tab.key as BarcodeSubTab);
                    }}
                    style={{
                      padding: '6px 2px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: '6px',
                      border: isActive ? '1px solid #3f3f46' : '1px solid transparent',
                      cursor: 'pointer',
                      background: isActive ? '#27272a' : 'transparent',
                      color: isActive ? '#f4f4f5' : '#71717a',
                      boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#a1a1aa';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#71717a';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB 1: PRESETS */}
            {barcodeSubTab === 'PRESETS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Standard Templates & Printer Presets
                  </span>
                  <span style={{ fontSize: '10px', color: '#71717a' }}>{BARCODE_PRESETS.length} Profiles Available</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {BARCODE_PRESETS.map(preset => {
                    const isSelected = barcodeConfig.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectBarcodePreset(preset)}
                        style={{
                          background: isSelected ? '#18181b' : '#09090b',
                          border: isSelected ? '1px solid #f4f4f5' : '1px solid #27272a',
                          boxShadow: isSelected ? '0 0 0 1px #f4f4f5' : 'none',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#3f3f46';
                            e.currentTarget.style.background = '#121215';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#27272a';
                            e.currentTarget.style.background = '#09090b';
                          }
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#f4f4f5' : '#e4e4e7' }}>
                              {preset.name}
                            </span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontFamily: 'monospace',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                border: '1px solid #27272a',
                                background: '#18181b',
                                color: '#a1a1aa'
                              }}
                            >
                              {preset.category}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#71717a' }}>
                            {preset.description}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '75px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f4f4f5', display: 'block', fontFamily: 'monospace' }}>
                            {preset.widthMm}×{preset.heightMm} mm
                          </span>
                          <span style={{ fontSize: '10px', color: '#71717a' }}>
                            {preset.columns} Across
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB: MARG ERP CONTROL ROOM RULES */}
            {barcodeSubTab === 'MARG_RULES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={15} style={{ color: '#a1a1aa' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                      Marg ERP 9+ Control Room Behavior
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '3px' }}>
                    Official industrial parameters for high-speed POS retail counter, wholesale, and weighing scale billing
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                    Item Working Style in Billing:
                  </span>
                  <Segmented
                    block
                    value={barcodeConfig.workingStyle}
                    onChange={(val: any) => handleUpdateBarcodeConfig({ workingStyle: val })}
                    options={[
                      { label: 'R - Realtime (Scan + Name)', value: 'REALTIME' },
                      { label: 'O - Only Barcode', value: 'ONLY_BARCODE' },
                      { label: 'B - Batch Specific', value: 'BATCH_WISE' },
                      { label: 'S - Serial / IMEI', value: 'SERIAL_WISE' },
                      { label: 'M - MRP / Size Wise', value: 'MRP_WISE' }
                    ]}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Ask Barcode Qty on Sales:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.askQtyMode || (barcodeConfig.askQtyOnScan ? 'YES' : 'NO')}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ askQtyMode: val, askQtyOnScan: val !== 'NO' })}
                      options={[
                        { label: 'N - Rapid (1 Qty auto)', value: 'NO' },
                        { label: 'Y - Ask Qty (Pause)', value: 'YES' },
                        { label: 'P - Modal Popup', value: 'POPUP' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Duplicate Barcode in Master:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.duplicatePolicy}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ duplicatePolicy: val })}
                      options={[
                        { label: '3 - Strict Error', value: 'NO' },
                        { label: '1 - Warn Confirm', value: 'WARN' },
                        { label: '2 - Allowed (List)', value: 'ALLOW' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Prefix</span>
                    <Input
                      value={barcodeConfig.autoPrefix || 'BAL-'}
                      onChange={(e) => handleUpdateBarcodeConfig({ autoPrefix: e.target.value })}
                      placeholder="e.g. BAL-"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Next Serial #</span>
                    <InputNumber
                      min={1}
                      max={999999}
                      value={barcodeConfig.nextAutoNumber || 1001}
                      onChange={(val) => handleUpdateBarcodeConfig({ nextAutoNumber: val || 1001 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
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

            {/* SUB-TAB: GLASS ERP & CNC CUTTING */}
            {barcodeSubTab === 'GLASS_ERP' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={15} style={{ color: '#a1a1aa' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                        Glass ERP & CNC Cutting Engine
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontFamily: 'monospace',
                        padding: '1px 6px',
                        border: '1px solid #27272a',
                        background: '#09090b',
                        color: '#a1a1aa',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}
                    >
                      Lisec / Bottero / Bystronic
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '3px' }}>
                    Dynamic lite metadata, edge/flow orientation arrows, furnace tempered corner stamps, rack slot positioning, and 2D DataMatrix (ECC-200) table compatibility.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <LuxuryToggle
                    title="Enable Glass ERP Mode"
                    desc="Prints Lite ID, glass size (W×H mm), thickness, route & rack on label"
                    checked={barcodeConfig.printGlassErpTags ?? true}
                    onChange={(checked) => handleUpdateBarcodeConfig({ printGlassErpTags: checked })}
                  />
                  <LuxuryToggle
                    title="Auto-Fit Dynamic Font"
                    desc="Auto-shrinks font when company or glass job string is long"
                    checked={barcodeConfig.autoFitFontSize ?? true}
                    onChange={(checked) => handleUpdateBarcodeConfig({ autoFitFontSize: checked })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <LuxuryToggle
                    title="Strict 1-Bit Monochrome"
                    desc="Guarantees pure #000000 on #ffffff for thermal heads"
                    checked={barcodeConfig.colorMode === '1BIT_MONOCHROME'}
                    onChange={(checked) => handleUpdateBarcodeConfig({ colorMode: (checked ? '1BIT_MONOCHROME' : 'GRAYSCALE') as any })}
                  />
                  <LuxuryToggle
                    title="Strict Boundary Overflow Guard"
                    desc="Highlights label edge red if content exceeds physical millimeter height"
                    checked={barcodeConfig.strictBoundingBox ?? true}
                    onChange={(checked) => handleUpdateBarcodeConfig({ strictBoundingBox: checked })}
                  />
                </div>

                {/* Glass Lite Specifications Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Order # (Job ID)
                    </span>
                    <Input
                      value={barcodeConfig.orderNo || 'ORD-9842'}
                      onChange={(e) => handleUpdateBarcodeConfig({ orderNo: e.target.value })}
                      placeholder="e.g. ORD-9842"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Lite / Piece ID
                    </span>
                    <Input
                      value={barcodeConfig.liteId || 'L-04/12'}
                      onChange={(e) => handleUpdateBarcodeConfig({ liteId: e.target.value })}
                      placeholder="e.g. L-04/12"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Thickness
                    </span>
                    <Input
                      value={barcodeConfig.thicknessMm || '12mm'}
                      onChange={(e) => handleUpdateBarcodeConfig({ thicknessMm: e.target.value })}
                      placeholder="e.g. 12mm / 24mm DGU"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Cut Width (mm)
                    </span>
                    <InputNumber
                      min={50}
                      max={5000}
                      value={barcodeConfig.widthMmGlass || 1450}
                      onChange={(val) => handleUpdateBarcodeConfig({ widthMmGlass: val || 1450 })}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Cut Height (mm)
                    </span>
                    <InputNumber
                      min={50}
                      max={5000}
                      value={barcodeConfig.heightMmGlass || 820}
                      onChange={(val) => handleUpdateBarcodeConfig({ heightMmGlass: val || 820 })}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Glass Composition / Type
                    </span>
                    <Input
                      value={barcodeConfig.glassType || 'Clear Toughened'}
                      onChange={(e) => handleUpdateBarcodeConfig({ glassType: e.target.value })}
                      placeholder="e.g. Clear Toughened / Low-E DGU"
                    />
                  </div>
                </div>

                {/* Logistics, Rack & Route */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Delivery Rack No
                    </span>
                    <Input
                      value={barcodeConfig.rackNo || 'A-14'}
                      onChange={(e) => handleUpdateBarcodeConfig({ rackNo: e.target.value })}
                      placeholder="e.g. A-14"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Rack Slot
                    </span>
                    <Input
                      value={barcodeConfig.slotNo || '08'}
                      onChange={(e) => handleUpdateBarcodeConfig({ slotNo: e.target.value })}
                      placeholder="e.g. 08"
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Process Route Sequence
                    </span>
                    <Input
                      value={barcodeConfig.processRoute || 'CUT ➔ EDGE ➔ TEMPER ➔ DGU'}
                      onChange={(e) => handleUpdateBarcodeConfig({ processRoute: e.target.value })}
                      placeholder="e.g. CUT ➔ EDGE ➔ TEMPER"
                    />
                  </div>
                </div>

                {/* Coating Side & Physical Orientation Markers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Coating Surface Side:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.coatingSide || 'NONE'}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ coatingSide: val })}
                      options={[
                        { label: 'None', value: 'NONE' },
                        { label: 'Tin', value: 'TIN_SIDE' },
                        { label: 'Air', value: 'AIR_SIDE' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Edge / Flow Arrow:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.edgeArrow || 'UP'}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ edgeArrow: val })}
                      options={[
                        { label: 'None', value: 'NONE' },
                        { label: '↑ Up', value: 'UP' },
                        { label: '→ Right', value: 'RIGHT' },
                        { label: '↓ Down', value: 'DOWN' },
                        { label: '← Left', value: 'LEFT' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      Tempered Stamp Corner:
                    </span>
                    <Segmented
                      block
                      value={barcodeConfig.stampCorner || 'BOTTOM_RIGHT'}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ stampCorner: val })}
                      options={[
                        { label: 'None', value: 'NONE' },
                        { label: 'TL', value: 'TOP_LEFT' },
                        { label: 'TR', value: 'TOP_RIGHT' },
                        { label: 'BL', value: 'BOTTOM_LEFT' },
                        { label: 'BR', value: 'BOTTOM_RIGHT' }
                      ]}
                    />
                  </div>
                </div>

                {/* Clickable Quick Tags Insertion Helper */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                    Quick Tags — Click to insert into footer / header template:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { tag: '{ORDER_NO}', label: 'Order #' },
                      { tag: '{LITE_ID}', label: 'Lite ID' },
                      { tag: '{WIDTH_MM}', label: 'Width' },
                      { tag: '{HEIGHT_MM}', label: 'Height' },
                      { tag: '{GLASS_TYPE}', label: 'Glass Type' },
                      { tag: '{THICKNESS}', label: 'Thickness' },
                      { tag: '{RACK_NO}', label: 'Rack' },
                      { tag: '{SLOT_NO}', label: 'Slot' },
                      { tag: '{PROCESS_ROUTE}', label: 'Route' }
                    ].map(t => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => {
                          macAudio.playPop();
                          const currentFooter = barcodeConfig.customFooter || '';
                          handleUpdateBarcodeConfig({
                            customFooter: currentFooter ? `${currentFooter} ${t.tag}` : t.tag
                          });
                          onShowToast?.(`Inserted ${t.tag} into footer`, 'info');
                        }}
                        style={{
                          background: '#09090b',
                          border: '1px solid #27272a',
                          color: '#e4e4e7',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3f3f46';
                          e.currentTarget.style.color = '#f4f4f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#27272a';
                          e.currentTarget.style.color = '#e4e4e7';
                        }}
                      >
                        <code style={{ fontFamily: 'monospace', color: '#a1a1aa' }}>{t.tag}</code>
                        <span style={{ fontSize: '9.5px', color: '#71717a' }}>({t.label})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: DIMENSIONS */}
            {barcodeSubTab === 'DIMENSIONS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Label Width (mm)</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Label Height (mm)</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Columns Across</span>
                    <InputNumber
                      min={1}
                      max={8}
                      value={barcodeConfig.columns}
                      onChange={(val) => handleUpdateBarcodeConfig({ columns: val || 1, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Gap Horiz. (mm)</span>
                    <InputNumber
                      min={0}
                      max={20}
                      value={barcodeConfig.gapXMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ gapXMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Gap Vert. (mm)</span>
                    <InputNumber
                      min={0}
                      max={20}
                      value={barcodeConfig.gapYMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ gapYMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Top Margin (mm)</span>
                    <InputNumber
                      min={0}
                      max={50}
                      value={barcodeConfig.marginTopMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ marginTopMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Left Margin (mm)</span>
                    <InputNumber
                      min={0}
                      max={50}
                      value={barcodeConfig.marginLeftMm}
                      onChange={(val) => handleUpdateBarcodeConfig({ marginLeftMm: val || 0, presetId: 'custom' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Print Head DPI</span>
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

            {/* SUB-TAB: THERMAL HEAD & HARDWARE CALIBRATION */}
            {barcodeSubTab === 'THERMAL_HEAD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Thermal Media Sensor:</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Print Speed:</span>
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

                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500 }}>Thermal Burn Darkness / Heat Density:</span>
                    <span style={{ fontSize: '11px', color: '#f4f4f5', fontWeight: 600, fontFamily: 'monospace' }}>Level {barcodeConfig.printDarkness} / 15</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Orientation:</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Symbology:</span>
                    <Segmented
                      block
                      value={barcodeConfig.symbology}
                      onChange={(val: any) => handleUpdateBarcodeConfig({ symbology: val })}
                      options={[
                        { label: 'Code 128', value: 'CODE128' },
                        { label: 'EAN-13', value: 'EAN13' },
                        { label: 'QR', value: 'QR' },
                        { label: 'DataMatrix (CNC)', value: 'DATAMATRIX' }
                      ]}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Bar Height (mm):</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #27272a', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Human Readable Text:</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Tear-off Cutter Offset:</span>
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

            {/* SUB-TAB: LABEL CONTENT */}
            {barcodeSubTab === 'CONTENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Text Alignment:</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Custom Footer:</span>
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

            {/* SUB-TAB: TSPL & ZPL DIRECT PRINTER COMMANDS */}
            {barcodeSubTab === 'PRINTER_CMDS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Printer size={15} style={{ color: '#a1a1aa' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                      Direct Thermal Printer Command Generator (TSPL / ZPL-II)
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '3px' }}>
                    Industrial command code generated directly from your label configuration without Windows raster lag
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <Segmented
                    value={activeCodeLang}
                    onChange={(val: any) => setActiveCodeLang(val)}
                    options={[
                      { label: 'TSPL (TVS LP-46 / TSC TE244)', value: 'TSPL' },
                      { label: 'ZPL-II (Zebra ZD220 / ZD230)', value: 'ZPL' }
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
                        background: '#18181b',
                        border: '1px solid #27272a',
                        color: '#f4f4f5',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3f3f46';
                        e.currentTarget.style.background = '#27272a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#27272a';
                        e.currentTarget.style.background = '#18181b';
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
                        background: '#18181b',
                        border: '1px solid #27272a',
                        color: '#f4f4f5',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3f3f46';
                        e.currentTarget.style.background = '#27272a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#27272a';
                        e.currentTarget.style.background = '#18181b';
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
                        background: '#f4f4f5',
                        border: '1px solid #f4f4f5',
                        color: '#09090b',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: isSendingRawPrint ? 'wait' : 'pointer',
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      <Zap size={13} />
                      <span>{isSendingRawPrint ? 'Sending...' : 'Send Raw Direct'}</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#a1a1aa',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.45
                  }}
                >
                  {(() => {
                    const sampleItem = { name: 'Mould 14x20 Standard Housing', code: 'MLD-1420-STD', price: 650.00, tag: 'ITEM', size: '10FT' };
                    return activeCodeLang === 'TSPL' ? generateTsplCommand(barcodeConfig, sampleItem) : generateZplCommand(barcodeConfig, sampleItem);
                  })()}
                </div>
              </div>
            )}

            {/* SUB-TAB: SCANNER HARDWARE */}
            {barcodeSubTab === 'SCANNER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scan size={15} style={{ color: '#a1a1aa' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                      Hardware Barcode Scanner Integration
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '3px' }}>
                    Auto-detects USB, Wireless 2.4G & Bluetooth laser guns with high-speed key burst timing
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Scanner Suffix</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Sound Feedback</span>
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
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Min Length</span>
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
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} style={{ color: '#a1a1aa' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f4f4f5' }}>
                        Test Hardware Scanner (Burst Latency Detector)
                      </span>
                    </div>
                    {scannerTestHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setScannerTestHistory([])}
                        style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '10px', cursor: 'pointer', padding: 0 }}
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
                      background: '#09090b',
                      border: '1px solid #27272a',
                      color: '#f4f4f5',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      fontSize: '12px',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#52525b';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#27272a';
                    }}
                  />
                  {scannerTestHistory.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 500 }}>Recent Scans:</span>
                      {scannerTestHistory.map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', background: '#09090b', border: '1px solid #27272a', padding: '4px 8px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#f4f4f5', fontFamily: 'monospace', fontWeight: 600 }}>{h.code}</span>
                            <span
                              style={{
                                fontSize: '9px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                                fontFamily: 'monospace',
                                border: '1px solid #27272a',
                                background: '#18181b',
                                color: h.isLaserGun ? '#f4f4f5' : '#a1a1aa'
                              }}
                            >
                              {h.isLaserGun ? `⚡ LASER (${h.durationMs}ms)` : `⌨️ KEYBOARD (${h.durationMs}ms)`}
                            </span>
                          </div>
                          <span style={{ color: '#71717a', fontSize: '10px', fontFamily: 'monospace' }}>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live 1:1 Scale Barcode Label Preview with Glass ERP Batch Engine */}
          {(() => {
            const currentBatchItem = GLASS_ERP_SAMPLE_BATCH[selectedBatchIndex % GLASS_ERP_SAMPLE_BATCH.length];
            const resolveDynamicTags = (template: string) => {
              if (!template) return '';
              return template
                .replace(/\{ORDER_NO\}/g, barcodeConfig.orderNo || currentBatchItem.orderNo)
                .replace(/\{LITE_ID\}/g, barcodeConfig.liteId || currentBatchItem.liteId)
                .replace(/\{WIDTH_MM\}/g, String(barcodeConfig.widthMmGlass || currentBatchItem.widthMm))
                .replace(/\{HEIGHT_MM\}/g, String(barcodeConfig.heightMmGlass || currentBatchItem.heightMm))
                .replace(/\{GLASS_TYPE\}/g, barcodeConfig.glassType || currentBatchItem.glassType)
                .replace(/\{THICKNESS\}/g, barcodeConfig.thicknessMm || currentBatchItem.thickness)
                .replace(/\{RACK_NO\}/g, barcodeConfig.rackNo || currentBatchItem.rackNo)
                .replace(/\{SLOT_NO\}/g, barcodeConfig.slotNo || currentBatchItem.slotNo)
                .replace(/\{PROCESS_ROUTE\}/g, barcodeConfig.processRoute || currentBatchItem.processRoute)
                .replace(/\{COATING_SIDE\}/g, barcodeConfig.coatingSide || currentBatchItem.coatingSide)
                .replace(/\{CUSTOMER_NAME\}/g, currentBatchItem.customerName);
            };

            const previewWidthPx = Math.round(Math.min(320, Math.max(180, barcodeConfig.widthMm * 3.8)) * previewZoom);
            const previewMinHeightPx = Math.round(Math.min(280, Math.max(120, barcodeConfig.heightMm * 3.8)) * previewZoom);

            return (
              <div
                style={{
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  overflowY: 'auto'
                }}
              >
                {/* Header with Dimension Specs & Zoom Controls */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #27272a' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Maximize2 size={14} style={{ color: '#a1a1aa' }} />
                      Monochrome Thermal Preview
                    </span>
                    <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                      {barcodeConfig.widthMm}×{barcodeConfig.heightMm}mm • {barcodeConfig.dpi} DPI • 203 DPI Head
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9.5px', color: '#71717a', fontWeight: 600 }}>ZOOM:</span>
                    {[
                      { label: '100%', val: 1 },
                      { label: '125%', val: 1.25 },
                      { label: '150%', val: 1.5 }
                    ].map(z => (
                      <button
                        key={z.label}
                        type="button"
                        onClick={() => {
                          macAudio.playPop();
                          setPreviewZoom(z.val);
                        }}
                        style={{
                          background: previewZoom === z.val ? '#27272a' : 'transparent',
                          border: previewZoom === z.val ? '1px solid #3f3f46' : '1px solid transparent',
                          color: previewZoom === z.val ? '#f4f4f5' : '#71717a',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Piece Navigation Slider (Real Glass Sample Items) */}
                <div
                  style={{
                    width: '100%',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      setSelectedBatchIndex(prev => (prev > 0 ? prev - 1 : GLASS_ERP_SAMPLE_BATCH.length - 1));
                    }}
                    style={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      color: '#f4f4f5',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3f3f46';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#27272a';
                    }}
                  >
                    ◀ Prev
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f4f4f5' }}>
                        Piece {selectedBatchIndex + 1} of {GLASS_ERP_SAMPLE_BATCH.length}:
                      </span>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', background: '#09090b', border: '1px solid #27272a', padding: '1px 6px', borderRadius: '4px', color: '#a1a1aa' }}>
                        {currentBatchItem.liteId}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#71717a', display: 'block', marginTop: '1px' }}>
                      {currentBatchItem.glassType} • {currentBatchItem.widthMm}×{currentBatchItem.heightMm}mm ({currentBatchItem.thickness})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      setSelectedBatchIndex(prev => (prev + 1) % GLASS_ERP_SAMPLE_BATCH.length);
                    }}
                    style={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      color: '#f4f4f5',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3f3f46';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#27272a';
                    }}
                  >
                    Next ▶
                  </button>
                </div>

                {/* Studio Canvas Mat Workspace (Subtle Dot Grid) */}
                <div
                  style={{
                    width: '100%',
                    background: 'radial-gradient(circle, #27272a 1px, transparent 1px) 0 0 / 14px 14px, #050506',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '340px'
                  }}
                >
                  {/* Top Horizontal Millimeter Ruler */}
                  <div
                    style={{
                      width: `${previewWidthPx}px`,
                      height: '14px',
                      borderBottom: '1px solid #27272a',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '7.5px',
                      color: '#71717a',
                      fontFamily: 'monospace',
                      padding: '0 2px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span>0mm</span>
                    <span>{Math.round(barcodeConfig.widthMm / 2)}mm</span>
                    <span>{barcodeConfig.widthMm}mm</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {/* Left Vertical Millimeter Ruler */}
                    <div
                      style={{
                        width: '18px',
                        height: `${previewMinHeightPx}px`,
                        borderRight: '1px solid #27272a',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        fontSize: '7px',
                        color: '#71717a',
                        fontFamily: 'monospace',
                        paddingRight: '2px',
                        textAlign: 'right',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>0</span>
                      <span>{Math.round(barcodeConfig.heightMm / 2)}</span>
                      <span>{barcodeConfig.heightMm}</span>
                    </div>

                    {/* Strict 1-Bit Monochrome Thermal Label Canvas */}
                    <div
                      style={{
                        width: `${previewWidthPx}px`,
                        minHeight: `${previewMinHeightPx}px`,
                        background: '#ffffff',
                        borderRadius: '3px',
                        boxShadow: '0 10px 28px rgba(0,0,0,0.9), 0 0 0 1px #000000',
                        border: barcodeConfig.strictBoundingBox
                          ? '1px dashed #000000'
                          : barcodeConfig.showBorder
                          ? `1px ${barcodeConfig.borderStyle || 'solid'} #000000`
                          : 'none',
                        padding: `${Math.round(8 * previewZoom)}px ${Math.round(10 * previewZoom)}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        color: '#000000',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        textAlign: barcodeConfig.textAlign,
                        position: 'relative',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Physical Corner Stamp Badge */}
                      {barcodeConfig.stampCorner && barcodeConfig.stampCorner !== 'NONE' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: barcodeConfig.stampCorner.includes('TOP') ? '4px' : 'auto',
                            bottom: barcodeConfig.stampCorner.includes('BOTTOM') ? '4px' : 'auto',
                            left: barcodeConfig.stampCorner.includes('LEFT') ? '4px' : 'auto',
                            right: barcodeConfig.stampCorner.includes('RIGHT') ? '4px' : 'auto',
                            border: '1.5px solid #000000',
                            borderRadius: '3px',
                            padding: '1px 3px',
                            fontSize: '6.5px',
                            fontWeight: 900,
                            lineHeight: 1,
                            background: '#ffffff',
                            color: '#000000',
                            letterSpacing: '0.2px'
                          }}
                        >
                          ⬡ STAMP: {barcodeConfig.stampCorner === 'BOTTOM_RIGHT' ? 'BR' : barcodeConfig.stampCorner === 'TOP_LEFT' ? 'TL' : barcodeConfig.stampCorner === 'TOP_RIGHT' ? 'TR' : 'BL'}
                        </div>
                      )}

                      {/* Top Header & Orientation Flow Indicator */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                          {barcodeConfig.printHeader && (
                            <div
                              style={{
                                fontSize: `${Math.round((barcodeConfig.autoFitFontSize ? Math.min(barcodeConfig.headerFontSize, 12) : barcodeConfig.headerFontSize) * previewZoom)}px`,
                                fontWeight: 900,
                                letterSpacing: '0.3px',
                                borderBottom: '1px solid #000000',
                                paddingBottom: '2px',
                                lineHeight: 1.1,
                                flex: 1,
                                color: '#000000'
                              }}
                            >
                              {barcodeConfig.headerText || 'EXCEL GLASS INDUSTRIES'}
                            </div>
                          )}

                          {barcodeConfig.edgeArrow && barcodeConfig.edgeArrow !== 'NONE' && (
                            <span
                              style={{
                                fontSize: '7.5px',
                                fontWeight: 900,
                                background: '#000000',
                                color: '#ffffff',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {barcodeConfig.edgeArrow === 'UP' && '↑ FLOW'}
                              {barcodeConfig.edgeArrow === 'RIGHT' && '→ FLOW'}
                              {barcodeConfig.edgeArrow === 'DOWN' && '↓ FLOW'}
                              {barcodeConfig.edgeArrow === 'LEFT' && '← FLOW'}
                            </span>
                          )}
                        </div>

                        {barcodeConfig.printSubHeader && (
                          <div
                            style={{
                              fontSize: `${Math.round((barcodeConfig.subHeaderFontSize || 8) * previewZoom)}px`,
                              fontWeight: 700,
                              color: '#000000',
                              marginTop: '2px',
                              lineHeight: 1.1
                            }}
                          >
                            {barcodeConfig.subHeaderText || 'CNC CUTTING & TEMPERING UNIT'}
                          </div>
                        )}
                      </div>

                      {/* Glass Manufacturing Lite Information Block */}
                      {(barcodeConfig.printGlassErpTags ?? true) && (
                        <div
                          style={{
                            margin: '3px 0',
                            padding: '3px 0',
                            borderTop: '1px solid #000000',
                            borderBottom: '1px solid #000000',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5px',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: `${Math.round(9 * previewZoom)}px`, fontWeight: 900, color: '#000000' }}>
                              JOB: {barcodeConfig.orderNo || currentBatchItem.orderNo} • {barcodeConfig.liteId || currentBatchItem.liteId}
                            </span>
                            <span style={{ fontSize: `${Math.round(8 * previewZoom)}px`, fontWeight: 800, color: '#000000' }}>
                              {barcodeConfig.thicknessMm || currentBatchItem.thickness}
                            </span>
                          </div>

                          <div style={{ fontSize: `${Math.round(10 * previewZoom)}px`, fontWeight: 900, color: '#000000', letterSpacing: '0.2px' }}>
                            CUT: {barcodeConfig.widthMmGlass || currentBatchItem.widthMm} × {barcodeConfig.heightMmGlass || currentBatchItem.heightMm} mm
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${Math.round(7.5 * previewZoom)}px`, fontWeight: 800, color: '#000000' }}>
                            <span>TYPE: {barcodeConfig.glassType || currentBatchItem.glassType}</span>
                            <span>RACK: {barcodeConfig.rackNo || currentBatchItem.rackNo} / {barcodeConfig.slotNo || currentBatchItem.slotNo}</span>
                          </div>

                          <div style={{ fontSize: `${Math.round(7 * previewZoom)}px`, fontWeight: 700, color: '#000000' }}>
                            ROUTE: {barcodeConfig.processRoute || currentBatchItem.processRoute}
                            {barcodeConfig.coatingSide && barcodeConfig.coatingSide !== 'NONE' ? ` • [${barcodeConfig.coatingSide}]` : ''}
                          </div>
                        </div>
                      )}

                      {/* Symbology: DataMatrix (ECC-200), QR, or Code 128 */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: barcodeConfig.textAlign === 'center' ? 'center' : barcodeConfig.textAlign === 'right' ? 'flex-end' : 'flex-start',
                          margin: '3px 0'
                        }}
                      >
                        {barcodeConfig.textPosition === 'above' && (
                          <span style={{ fontSize: `${Math.round(8 * previewZoom)}px`, fontFamily: 'monospace', fontWeight: 900, letterSpacing: '1px', marginBottom: '1px', color: '#000000' }}>
                            *{currentBatchItem.orderNo}-{currentBatchItem.liteId}*
                          </span>
                        )}

                        {barcodeConfig.symbology === 'DATAMATRIX' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: `${Math.round(44 * previewZoom)}px`,
                                height: `${Math.round(44 * previewZoom)}px`,
                                display: 'grid',
                                gridTemplateColumns: 'repeat(16, 1fr)',
                                gap: 0,
                                background: '#000000',
                                padding: '1.5px',
                                border: '1px solid #000000'
                              }}
                            >
                              {((generateDataMatrixSvgMatrix(`${currentBatchItem.orderNo}/${currentBatchItem.liteId}`) as any).cells || []).map((row: any, rI: number) =>
                                row.map((cell: any, cI: number) => (
                                  <div key={`${rI}-${cI}`} style={{ background: cell ? '#000000' : '#ffffff' }} />
                                ))
                              )}
                            </div>
                            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                              <span style={{ display: 'block', fontSize: `${Math.round(7.5 * previewZoom)}px`, fontWeight: 900, color: '#000000', fontFamily: 'monospace' }}>
                                ECC-200 CNC
                              </span>
                              <span style={{ display: 'block', fontSize: `${Math.round(6.5 * previewZoom)}px`, color: '#000000', fontWeight: 700 }}>
                                TABLE READY
                              </span>
                            </div>
                          </div>
                        ) : barcodeConfig.symbology === 'QR' ? (
                          <div
                            style={{
                              width: `${Math.round(52 * previewZoom)}px`,
                              height: `${Math.round(52 * previewZoom)}px`,
                              display: 'grid',
                              gridTemplateColumns: 'repeat(21, 1fr)',
                              gap: 0,
                              background: '#ffffff',
                              padding: '2px',
                              border: '1px solid #000000'
                            }}
                          >
                            {generateQrMatrix(`${currentBatchItem.orderNo}-${currentBatchItem.liteId}`).map((row, rI) =>
                              row.map((cell, cI) => (
                                <div key={`${rI}-${cI}`} style={{ background: cell ? '#000000' : '#ffffff' }} />
                              ))
                            )}
                          </div>
                        ) : (
                          (() => {
                            const { svgBars, totalWidth } = generateCode128SvgBars(`${currentBatchItem.orderNo}-${currentBatchItem.liteId}`, barcodeConfig.barHeightMm, barcodeConfig.barScale);
                            return (
                              <svg
                                width="100%"
                                height={Math.round(barcodeConfig.barHeightMm * 1.8 * previewZoom)}
                                viewBox={`0 0 ${totalWidth} ${barcodeConfig.barHeightMm * 1.8}`}
                                preserveAspectRatio="xMidYMid meet"
                                style={{ display: 'block', maxWidth: '100%' }}
                              >
                                {svgBars.map((b, i) => (
                                  <rect key={i} x={b.x} y={0} width={b.width} height={barcodeConfig.barHeightMm * 1.8} fill="#000000" />
                                ))}
                              </svg>
                            );
                          })()
                        )}

                        {barcodeConfig.textPosition === 'below' && (
                          <span style={{ fontSize: `${Math.round(8 * previewZoom)}px`, fontFamily: 'monospace', fontWeight: 900, letterSpacing: '1px', marginTop: '1px', color: '#000000' }}>
                            *{currentBatchItem.orderNo}-{currentBatchItem.liteId}*
                          </span>
                        )}
                      </div>

                      {/* Specs Line: HSN, Batch, Date */}
                      {(barcodeConfig.printHsn || barcodeConfig.printBatch || barcodeConfig.printDate) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${Math.round(7 * previewZoom)}px`, color: '#000000', fontWeight: 800, margin: '1px 0' }}>
                          {barcodeConfig.printHsn && <span>HSN: 7007</span>}
                          {barcodeConfig.printBatch && <span>LOT: {currentBatchItem.orderNo.slice(-3)}</span>}
                          {barcodeConfig.printDate && <span>DATE: 10/26</span>}
                        </div>
                      )}

                      {/* Footer Row: Tag & Price / Customer */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          borderTop: '1px solid #000000',
                          paddingTop: '2px',
                          marginTop: '2px'
                        }}
                      >
                        <span style={{ fontSize: `${Math.round(7.5 * previewZoom)}px`, fontWeight: 800, color: '#000000' }}>
                          {currentBatchItem.customerName ? currentBatchItem.customerName.slice(0, 18) : 'TAG: GLASS LITE'}
                        </span>

                        {barcodeConfig.printPrice && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: `${Math.round(barcodeConfig.priceFontSize * previewZoom)}px`, fontWeight: 900, color: '#000000' }}>
                              {barcodeConfig.pricePrefix}1,450.00
                            </span>
                            {barcodeConfig.showTaxInclusive && (
                              <span style={{ display: 'block', fontSize: `${Math.round(6.5 * previewZoom)}px`, color: '#000000', fontWeight: 700, lineHeight: 1 }}>
                                (Incl. all taxes)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {barcodeConfig.customFooter && (
                        <div
                          style={{
                            fontSize: `${Math.round((barcodeConfig.footerFontSize || 8) * previewZoom)}px`,
                            fontWeight: 800,
                            color: '#000000',
                            textAlign: 'center',
                            marginTop: '2px',
                            borderTop: '1px dotted #000000',
                            paddingTop: '1px'
                          }}
                        >
                          {resolveDynamicTags(barcodeConfig.customFooter)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: PRN Script Export & Save Settings */}
                <div style={{ width: '100%', display: 'flex', gap: '8px', paddingTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const activeItem = {
                        name: `${currentBatchItem.glassType} (${currentBatchItem.widthMm}x${currentBatchItem.heightMm}mm)`,
                        code: `${currentBatchItem.orderNo}-${currentBatchItem.liteId}`,
                        price: 1450.00,
                        tag: 'LITE',
                        size: `${currentBatchItem.widthMm}x${currentBatchItem.heightMm}`
                      };
                      const tspl = generateTsplCommand(barcodeConfig, activeItem);
                      downloadThermalScriptFile(tspl, `glass_label_${currentBatchItem.liteId.replace(/[^A-Za-z0-9]/g, '_')}.prn`);
                      macAudio.playSuccess();
                      onShowToast?.(`Exported .PRN with ECC-200 DataMatrix for ${currentBatchItem.liteId}!`, 'success');
                    }}
                    style={{
                      background: '#18181b',
                      border: '1px solid #27272a',
                      color: '#f4f4f5',
                      height: '36px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3f3f46';
                      e.currentTarget.style.background = '#27272a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#27272a';
                      e.currentTarget.style.background = '#18181b';
                    }}
                  >
                    <Download size={13} style={{ color: '#a1a1aa' }} />
                    <span>Export .PRN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      macAudio.playSuccess();
                      onShowToast?.('Glass ERP & Barcode configuration saved & active!', 'success');
                    }}
                    style={{
                      flex: 1,
                      background: '#f4f4f5',
                      border: '1px solid #f4f4f5',
                      color: '#09090b',
                      height: '36px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <Check size={14} />
                    <span>Save & Apply Settings</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

