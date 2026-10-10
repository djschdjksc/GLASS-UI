import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { macAudio } from '../utils/macAudio';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';
import { localDb } from '../services/db/localDb';
import type { BillRecord, PartyRecord, StockItemRecord } from '../services/db/schema';
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
  Monitor,
  Users,
  Package,
  X,
  CheckSquare,
  Square
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
      else if (idx === 3) { macAudio.playClick(); setActiveTab('SHORTCUTS'); }
      else if (idx === 4) { macAudio.playClick(); setActiveTab('BARCODE'); }
      else if (idx === 5 || idx === 6) { macAudio.playClick(); setActiveTab('GENERAL'); }
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

  // Granular Restore Inspection & Selection State
  interface PendingRestoreData {
    file: File;
    parsed: any;
    fileName: string;
    fileDate: string;
    hasConfig: boolean;
    billsCount: number;
    partiesCount: number;
    stockCount: number;
    restoreConfig: boolean;
    restoreBills: boolean;
    restoreParties: boolean;
    restoreStock: boolean;
    restoreMode: 'merge' | 'overwrite';
  }
  const [pendingRestore, setPendingRestore] = useState<PendingRestoreData | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [showAllAvatarsModal, setShowAllAvatarsModal] = useState<boolean>(false);

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

  // Sync profile live whenever changed anywhere in app
  useEffect(() => {
    const handleStorageUpdate = () => {
      const p = getUserProfile();
      setUserName(p.name);
      setUserRole(p.role);
      setUserTerminal(p.terminal);
      setUserPrefix(p.prefix);
      setUserAvatarId(p.avatarId || 1);
      setUserAvatar(p.avatar || `/avatars/${p.avatarId || 1}.webp`);
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

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
      avatarId: userAvatarId,
      avatar: userAvatar || getAvatarUrl(userAvatarId, trimmed)
    });
    localStorage.setItem('modern_app_user_name', trimmed);
    localStorage.setItem('modern_app_user_prefix', cleanPrefix);
    localStorage.setItem('modern_app_user_role', userRole);
    localStorage.setItem('modern_app_user_avatar', userAvatar || getAvatarUrl(userAvatarId, trimmed));
    localStorage.setItem('modern_app_user_avatar_id', String(userAvatarId));
    localStorage.setItem('modern_app_user_terminal', userTerminal);
    localStorage.setItem('modern_app_auto_sync', autoCloudSync ? '1' : '0');
    localStorage.setItem('modern_app_sync_sound', soundOnSync ? '1' : '0');
    window.dispatchEvent(new Event('storage'));
    onShowToast?.('Operator Profile & 2-Way Sync Settings Saved!', 'success');
    macAudio.playSuccess();
  };

  const handleForceResync = async () => {
    setIsSyncingNow(true);
    macAudio.playClick();
    onShowToast?.('Synchronizing data with Cloud and other users...', 'info');
    try {
      await supabaseSyncService.pullAllCloudBills();
      setLastSyncTime('Just now');
      macAudio.playSuccess();
      onShowToast?.('Data Synchronized! All users in sync.', 'success');
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      onShowToast?.('Sync notice: ' + (err.message || 'Offline mode active'), 'info');
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Helper to capture Control Panel & Master Settings Snapshot
  const getControlPanelSnapshot = useCallback(() => {
    let printSettings = {};
    let rawColsConfig = {};
    let mouldList = [];
    try { printSettings = JSON.parse(localStorage.getItem('modern_print_settings') || '{}'); } catch {}
    try { rawColsConfig = JSON.parse(localStorage.getItem('modern_raw_cols_config') || '{}'); } catch {}
    try { mouldList = JSON.parse(localStorage.getItem('modern_mould_list') || '[]'); } catch {}

    return {
      slipPrefix,
      slipHeaderTitle,
      billPrefix,
      tallyNavigation,
      autoConvertMode,
      stickyShortcuts,
      itemAutoSuggest,
      themeMode,
      bgImage,
      barcodeConfig,
      printSettings,
      rawColsConfig,
      mouldList,
      userProfile: {
        userName,
        userPrefix,
        userRole,
        userTerminal,
        userAvatarId,
        userAvatar
      }
    };
  }, [slipPrefix, slipHeaderTitle, billPrefix, tallyNavigation, autoConvertMode, stickyShortcuts, itemAutoSuggest, themeMode, bgImage, barcodeConfig, userName, userPrefix, userRole, userTerminal, userAvatarId, userAvatar]);

  // Export JSON Backup with Granular Scope Selection
  const handleExportBackup = () => {
    macAudio.playClick();
    if (!backupIncludeConfig && !backupIncludeBills && !backupIncludeParties && !backupIncludeStock) {
      onShowToast?.('Please select at least one module (Control Panel, Bills, Parties, or Stock) to export!', 'warning');
      return;
    }

    const exportBundle: Record<string, any> = {
      app: 'Modern Summary OS',
      version: '2.5.0',
      timestamp: new Date().toISOString(),
      scope: {
        controlPanel: backupIncludeConfig,
        bills: backupIncludeBills,
        parties: backupIncludeParties,
        stock: backupIncludeStock
      },
      counts: {
        bills: backupIncludeBills ? bills.length : 0,
        parties: backupIncludeParties ? parties.length : 0,
        stock: backupIncludeStock ? stockItems.length : 0
      },
      data: {}
    };

    if (backupIncludeConfig) {
      exportBundle.data.controlPanel = getControlPanelSnapshot();
      // Legacy backward-compatible keys
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
    const scopes: string[] = [];
    if (backupIncludeConfig) scopes.push('Config');
    if (backupIncludeBills) scopes.push('Bills');
    if (backupIncludeParties) scopes.push('Parties');
    if (backupIncludeStock) scopes.push('Stock');
    const scopeLabel = scopes.length === 4 ? 'Full' : scopes.join('_');

    a.href = url;
    a.download = `Summary_Backup_${scopeLabel}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast?.(`Backup exported successfully (${scopeLabel})! File downloaded.`, 'success');
  };

  // Inspect Selected Backup File & Open Granular Restore Modal
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // Reset input to allow selecting same file again
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rawJson = JSON.parse(ev.target?.result as string);
        const data = rawJson.data || rawJson;

        const fileBills = Array.isArray(data.bills) ? data.bills : (Array.isArray(rawJson.bills) ? rawJson.bills : []);
        const fileParties = Array.isArray(data.parties) ? data.parties : (Array.isArray(rawJson.parties) ? rawJson.parties : []);
        const fileStock = Array.isArray(data.stockItems) ? data.stockItems : (Array.isArray(rawJson.stockItems) ? rawJson.stockItems : []);
        const hasCfg = Boolean(data.controlPanel || data.slipPrefix || data.themeMode || data.bgImage || data.barcodeConfig || data.printSettings);

        if (!hasCfg && fileBills.length === 0 && fileParties.length === 0 && fileStock.length === 0) {
          throw new Error('This file does not contain recognized Control Panel settings, Bills, Parties, or Stock data.');
        }

        macAudio.playPop();
        setPendingRestore({
          file,
          parsed: data,
          fileName: file.name,
          fileDate: rawJson.timestamp || rawJson.exportDate || (file.lastModified ? new Date(file.lastModified).toLocaleDateString('en-IN') : 'Unknown Date'),
          hasConfig: hasCfg,
          billsCount: fileBills.length,
          partiesCount: fileParties.length,
          stockCount: fileStock.length,
          restoreConfig: hasCfg,
          restoreBills: fileBills.length > 0,
          restoreParties: fileParties.length > 0,
          restoreStock: fileStock.length > 0,
          restoreMode: restoreMode
        });
      } catch (err: any) {
        macAudio.playError();
        onShowToast?.(`Failed to parse backup: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Execute Selective Restore with Merge or Overwrite
  const handleExecuteRestore = async () => {
    if (!pendingRestore) return;
    const { parsed, restoreConfig, restoreBills, restoreParties, restoreStock, restoreMode: mode } = pendingRestore;

    if (!restoreConfig && !restoreBills && !restoreParties && !restoreStock) {
      onShowToast?.('Please select at least one module to restore!', 'warning');
      return;
    }

    setIsRestoring(true);
    try {
      let bCount = 0;
      let pCount = 0;
      let sCount = 0;
      let cDone = false;

      // 1. Control Panel
      if (restoreConfig) {
        const cp = parsed.controlPanel || parsed;
        if (cp.slipPrefix) {
          localStorage.setItem('modern_setting_slip_prefix', cp.slipPrefix);
          setSlipPrefix(cp.slipPrefix);
        }
        if (cp.slipHeaderTitle) {
          localStorage.setItem('modern_setting_slip_title', cp.slipHeaderTitle);
          setSlipHeaderTitle(cp.slipHeaderTitle);
        }
        if (cp.billPrefix) {
          localStorage.setItem('modern_setting_bill_prefix', cp.billPrefix);
          setBillPrefix(cp.billPrefix);
        }
        if (cp.tallyNavigation !== undefined) {
          localStorage.setItem('modern_setting_tally_nav', cp.tallyNavigation ? '1' : '0');
          setTallyNavigation(Boolean(cp.tallyNavigation));
        }
        if (cp.autoConvertMode !== undefined) {
          localStorage.setItem('modern_setting_autoconv', cp.autoConvertMode ? '1' : '0');
          setAutoConvertMode(Boolean(cp.autoConvertMode));
        }
        if (cp.stickyShortcuts !== undefined) {
          localStorage.setItem('modern_setting_sticky', cp.stickyShortcuts ? '1' : '0');
          setStickyShortcuts(Boolean(cp.stickyShortcuts));
        }
        if (cp.itemAutoSuggest !== undefined) {
          localStorage.setItem('modern_setting_item_auto', cp.itemAutoSuggest ? '1' : '0');
          setItemAutoSuggest(Boolean(cp.itemAutoSuggest));
        }
        if (cp.themeMode && onChangeThemeMode) {
          onChangeThemeMode(cp.themeMode);
        }
        if (cp.bgImage && onSelectBgImage) {
          onSelectBgImage(cp.bgImage);
        }
        if (cp.barcodeConfig) {
          saveBarcodeConfig(cp.barcodeConfig);
          setBarcodeConfig(cp.barcodeConfig);
        }
        if (cp.printSettings) {
          localStorage.setItem('modern_print_settings', JSON.stringify(cp.printSettings));
        }
        if (cp.rawColsConfig) {
          localStorage.setItem('modern_raw_cols_config', JSON.stringify(cp.rawColsConfig));
        }
        if (cp.mouldList) {
          localStorage.setItem('modern_mould_list', JSON.stringify(cp.mouldList));
        }
        if (cp.userProfile) {
          if (cp.userProfile.userName) {
            localStorage.setItem('modern_app_user_name', cp.userProfile.userName);
            setUserName(cp.userProfile.userName);
          }
          if (cp.userProfile.userAvatarId) {
            localStorage.setItem('modern_app_user_avatar_id', String(cp.userProfile.userAvatarId));
            setUserAvatarId(Number(cp.userProfile.userAvatarId));
          }
          if (cp.userProfile.userAvatar) {
            localStorage.setItem('modern_app_user_avatar', cp.userProfile.userAvatar);
            setUserAvatar(cp.userProfile.userAvatar);
          }
        }
        cDone = true;
      }

      // 2. Bills
      if (restoreBills) {
        const incomingBills: BillRecord[] = Array.isArray(parsed.bills) ? parsed.bills : [];
        if (incomingBills.length > 0) {
          if (mode === 'overwrite') {
            localStorage.setItem('modern_saved_custom_bills', '[]');
            localStorage.setItem('modern_deleted_bill_ids', '[]');
          }
          for (const b of incomingBills) {
            if (b && (b.id || b.token)) {
              await localDb.saveBill(b, true);
              bCount++;
            }
          }
        }
      }

      // 3. Parties
      if (restoreParties) {
        const incomingParties: PartyRecord[] = Array.isArray(parsed.parties) ? parsed.parties : [];
        if (incomingParties.length > 0) {
          if (mode === 'overwrite') {
            localStorage.setItem('modern_saved_custom_parties', '[]');
            localStorage.setItem('modern_deleted_party_ids', '[]');
          }
          for (const p of incomingParties) {
            if (p && (p.id || p.name)) {
              await localDb.saveParty(p, true);
              pCount++;
            }
          }
        }
      }

      // 4. Stock
      if (restoreStock) {
        const incomingStock: StockItemRecord[] = Array.isArray(parsed.stockItems) ? parsed.stockItems : [];
        if (incomingStock.length > 0) {
          for (const s of incomingStock) {
            if (s && s.id) {
              await localDb.saveStockItem(s, true);
              sCount++;
            }
          }
        }
      }

      window.dispatchEvent(new Event('storage'));
      macAudio.playSuccess();
      setPendingRestore(null);

      const summaryParts: string[] = [];
      if (cDone) summaryParts.push('Control Panel');
      if (bCount > 0) summaryParts.push(`${bCount} Bills`);
      if (pCount > 0) summaryParts.push(`${pCount} Parties`);
      if (sCount > 0) summaryParts.push(`${sCount} Stock Items`);

      onShowToast?.(`Restore complete! ${summaryParts.join(', ')} loaded.`, 'success');
    } catch (err: any) {
      macAudio.playError();
      onShowToast?.(`Restore error: ${err.message}`, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
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
              <ShadcnTabsTrigger value="SHORTCUTS">
                <Keyboard size={13} style={{ marginRight: 6 }} />
                <span>Shortcuts & NumPad</span>
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
      {/* TAB 0: UNIFIED GENERAL SETTINGS (SHADCN/UI INDUSTRIAL CARDS)              */}
      {/* ========================================================================= */}
      {(activeTab === 'GENERAL' || activeTab === 'PROFILE' || activeTab === 'BACKUP') && (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '16px',
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px 12px'
          }}
        >
          {/* CARD 1: USER PROFILE & 2-WAY MULTI-USER LIVE SYNC */}
          <ShadcnCard style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <ShadcnCardHeader style={{ padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ShadcnCardTitle style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
                  <User size={16} style={{ color: '#38bdf8' }} />
                  <span>User Profile & 2-Way Sync</span>
                </ShadcnCardTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    Live Sync Active
                  </span>
                  <Tooltip title="Force 2-Way Sync Now (Multi-User Data Exchange)" side="bottom">
                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleForceResync}
                      disabled={isSyncingNow}
                      style={{ height: '32px', width: '32px', padding: 0, background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', borderRadius: '6px' }}
                    >
                      <RefreshCw size={13} className={isSyncingNow ? 'animate-spin' : ''} />
                    </ShadcnButton>
                  </Tooltip>
                  <Tooltip title="Save Profile & Prefix Changes" side="bottom">
                    <ShadcnButton
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleSaveProfile}
                      style={{ height: '32px', width: '32px', padding: 0, background: '#0284c7', color: '#ffffff', borderRadius: '6px' }}
                    >
                      <Check size={14} />
                    </ShadcnButton>
                  </Tooltip>
                </div>
              </div>
            </ShadcnCardHeader>

            <ShadcnCardContent style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Avatar Studio with all 34 3D Avatars and Expandable Grid */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(24, 24, 27, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ShadcnAvatar size="lg" style={{ width: '48px', height: '48px', border: '2px solid #38bdf8', background: '#18181b', boxShadow: '0 0 14px rgba(56, 189, 248, 0.35)' }}>
                    <ShadcnAvatarImage src={userAvatar || getAvatarUrl(userAvatarId, userName)} alt={userName} />
                    <ShadcnAvatarFallback style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>
                      {userName.slice(0, 2).toUpperCase() || 'OP'}
                    </ShadcnAvatarFallback>
                  </ShadcnAvatar>
                  <Tooltip title="Upload Custom Profile Photo" side="bottom">
                    <button
                      type="button"
                      onClick={() => dpInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        border: '1.5px solid #09090b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#09090b',
                        padding: 0
                      }}
                    >
                      <Camera size={10} />
                    </button>
                  </Tooltip>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>Operator Avatar</span>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.1)', padding: '1px 7px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                        Avatar #{userAvatarId}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        macAudio.playPop();
                        setShowAllAvatarsModal(true);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Sparkles size={11} />
                      <span>View All 34</span>
                    </button>
                  </div>

                  {/* Horizontal Scroll Strip with All 34 Avatars */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                      overflowX: 'auto',
                      padding: '3px 2px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent'
                    }}
                  >
                    {getAllAvatarIds().map((avId) => {
                      const isSel = userAvatarId === avId;
                      return (
                        <button
                          key={avId}
                          type="button"
                          onClick={() => {
                            macAudio.playPop();
                            setUserAvatarId(avId);
                            const url = getAvatarUrl(avId, userName);
                            setUserAvatar(url);
                            localStorage.setItem('modern_app_user_avatar_id', String(avId));
                            localStorage.setItem('modern_app_user_avatar', url);
                            window.dispatchEvent(new Event('storage'));
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            border: isSel ? '2px solid #38bdf8' : '1px solid #3f3f46',
                            background: isSel ? 'rgba(56, 189, 248, 0.2)' : '#18181b',
                            padding: 0,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transform: isSel ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: isSel ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Avatar #${avId}`}
                        >
                          <img
                            src={getAvatarUrl(avId, userName)}
                            alt={`Avatar ${avId}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* User Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>User / Operator Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <Tooltip title="User Prefix for non-conflicting multi-user bills (e.g. R-, V-)" side="top">
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>User Prefix</label>
                      <input
                        type="text"
                        value={userPrefix}
                        onChange={(e) => {
                          const clean = e.target.value.toUpperCase();
                          setUserPrefix(clean);
                          setIsPrefixCustomized(true);
                        }}
                        style={{
                          width: '100%',
                          height: '36px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '6px',
                          padding: '0 12px',
                          color: '#38bdf8',
                          fontWeight: 700,
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </Tooltip>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Station / Desk</label>
                  <input
                    type="text"
                    value={userTerminal}
                    onChange={(e) => setUserTerminal(e.target.value)}
                    placeholder="e.g. Counter 01"
                    style={{
                      width: '100%',
                      height: '36px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Sync Options Strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(24, 24, 27, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <Tooltip title="Automatic real-time sync with other users on the network" side="top">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f4f4f5', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoCloudSync}
                        onChange={(e) => setAutoCloudSync(e.target.checked)}
                        style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                      <span>Auto 2-Way Sync</span>
                    </label>
                  </Tooltip>
                  <Tooltip title="Play audio chime when data syncs from other users" side="top">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f4f4f5', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={soundOnSync}
                        onChange={(e) => setSoundOnSync(e.target.checked)}
                        style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                      <span>Sync Audio</span>
                    </label>
                  </Tooltip>
                </div>
                <span style={{ fontSize: '11px', color: '#71717a' }}>
                  Last Synced: {lastSyncTime}
                </span>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* CARD 2: DEFAULT PRINTER & HARDWARE ROUTING */}
          <ShadcnCard style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <ShadcnCardHeader style={{ padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ShadcnCardTitle style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
                  <Printer size={16} style={{ color: '#38bdf8' }} />
                  <span>Default Printer & Hardware</span>
                </ShadcnCardTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: printerEngineStatus === 'online' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: printerEngineStatus === 'online' ? '#4ade80' : '#f87171',
                      border: `1px solid ${printerEngineStatus === 'online' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: printerEngineStatus === 'online' ? '#22c55e' : '#ef4444' }} />
                    {printerEngineStatus === 'online' ? 'Spooler Online (:5005)' : 'Spooler Offline'}
                  </span>
                  <Tooltip title="Refresh Windows Printers List" side="bottom">
                    <ShadcnButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchPrintersList}
                      disabled={isPrinterChecking}
                      style={{ height: '32px', width: '32px', padding: 0, background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', borderRadius: '6px' }}
                    >
                      <RefreshCw size={13} className={isPrinterChecking ? 'animate-spin' : ''} />
                    </ShadcnButton>
                  </Tooltip>
                  <Tooltip title="Print Calibration Test Page" side="bottom">
                    <ShadcnButton
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleTestPrint}
                      disabled={isTestPrinting || printerEngineStatus === 'offline'}
                      style={{ height: '32px', width: '32px', padding: 0, background: '#0284c7', color: '#ffffff', borderRadius: '6px' }}
                    >
                      <Printer size={14} />
                    </ShadcnButton>
                  </Tooltip>
                </div>
              </div>
            </ShadcnCardHeader>

            <ShadcnCardContent style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Select Windows Printer</label>
                <ShadcnSelect
                  value={defaultPrinter || systemDefaultPrinter || ''}
                  onChange={(e: any) => {
                    const selected = e.target.value;
                    setDefaultPrinter(selected);
                    macAudio.playClick();
                    onShowToast?.(`Default printer set to: ${selected}`, 'success');
                  }}
                  style={{ width: '100%', height: '36px', fontSize: '13px' }}
                >
                  {availablePrinters.length > 0 ? (
                    availablePrinters.map((p) => (
                      <option key={p} value={p}>
                        {p} {p === systemDefaultPrinter ? '★ (Windows Default)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value={defaultPrinter || 'Default Printer'}>
                      {defaultPrinter || 'Default System Printer'}
                    </option>
                  )}
                </ShadcnSelect>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Counter / Station Name</label>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => {
                      setStationName(e.target.value);
                      localStorage.setItem('modern_app_station_name', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Standard Paper Size</label>
                  <ShadcnSelect
                    value={printPaperSize}
                    onChange={(e: any) => {
                      setPrintPaperSize(e.target.value);
                      localStorage.setItem('modern_app_paper_size', e.target.value);
                    }}
                    style={{ width: '100%', height: '36px', fontSize: '13px' }}
                  >
                    <option value="A4">A4 (Portrait 210 x 297 mm)</option>
                    <option value="A4_LANDSCAPE">A4 (Landscape)</option>
                    <option value="THERMAL_3INCH">3-Inch Thermal Roll (80mm)</option>
                    <option value="THERMAL_4INCH">4-Inch Shipping Label (100mm)</option>
                  </ShadcnSelect>
                </div>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* CARD 3: DOCUMENT NUMBERING & PREFIXES */}
          <ShadcnCard style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <ShadcnCardHeader style={{ padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ShadcnCardTitle style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
                  <FileText size={16} style={{ color: '#38bdf8' }} />
                  <span>Document Numbering & Prefixes</span>
                </ShadcnCardTitle>
                <Tooltip title="Apply Bill Prefix to All Historical Bills in Database" side="bottom">
                  <ShadcnButton
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingBills}
                    onClick={() => handleApplyBillPrefix()}
                    style={{ height: '32px', width: '32px', padding: 0, background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', borderRadius: '6px' }}
                  >
                    <RefreshCw size={13} className={isUpdatingBills ? 'animate-spin' : ''} />
                  </ShadcnButton>
                </Tooltip>
              </div>
            </ShadcnCardHeader>

            <ShadcnCardContent style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Bill Number Prefix (History)</label>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                    Preview: #{formatBillNumber('1', billPrefix)}
                  </span>
                </div>
                <input
                  type="text"
                  value={billPrefix}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBillPrefix(v);
                    localStorage.setItem('modern_setting_bill_prefix', v);
                  }}
                  placeholder="e.g. REAL-, INV-, BILL-"
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#f4f4f5',
                    fontSize: '13px',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Slip Prefix</label>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                      #{slipPrefix}001
                    </span>
                  </div>
                  <input
                    type="text"
                    value={slipPrefix}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSlipPrefix(v);
                      localStorage.setItem('modern_setting_slip_prefix', v);
                    }}
                    placeholder="e.g. S-"
                    style={{
                      width: '100%',
                      height: '36px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Default Slip Header Title</label>
                  <input
                    type="text"
                    value={slipHeaderTitle}
                    onChange={(e) => {
                      setSlipHeaderTitle(e.target.value);
                      localStorage.setItem('modern_setting_slip_title', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      height: '36px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* CARD 4: DATABASE BACKUP & RESTORE */}
          <ShadcnCard style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <ShadcnCardHeader style={{ padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ShadcnCardTitle style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
                  <Database size={16} style={{ color: '#38bdf8' }} />
                  <span>Database Backup & Restore</span>
                </ShadcnCardTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      fontWeight: 500
                    }}
                  >
                    {parties.length} Parties • {bills.length} Bills • {stockItems.length} Stock
                  </span>
                </div>
              </div>
            </ShadcnCardHeader>

            <ShadcnCardContent style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Scope Selection Box */}
              <div style={{ background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272a', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>
                    Select Backup / Export Scope:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      macAudio.playPop();
                      const allSelected = backupIncludeConfig && backupIncludeBills && backupIncludeParties && backupIncludeStock;
                      setBackupIncludeConfig(!allSelected);
                      setBackupIncludeBills(!allSelected);
                      setBackupIncludeParties(!allSelected);
                      setBackupIncludeStock(!allSelected);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    {(backupIncludeConfig && backupIncludeBills && backupIncludeParties && backupIncludeStock) ? 'Deselect All' : 'Select All (Full Backup)'}
                  </button>
                </div>

                {/* 4 Interactive Category Tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Scope 1: Control Panel */}
                  <div
                    onClick={() => { macAudio.playClick(); setBackupIncludeConfig(!backupIncludeConfig); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: backupIncludeConfig ? 'rgba(167, 139, 250, 0.12)' : '#18181b',
                      border: backupIncludeConfig ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {backupIncludeConfig ? <CheckSquare size={15} color="#a78bfa" /> : <Square size={15} color="#52525b" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: backupIncludeConfig ? '#f4f4f5' : '#a1a1aa' }}>
                        Control Panel
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#71717a' }}>
                        Prefixes, Moulds, Print & Display
                      </div>
                    </div>
                  </div>

                  {/* Scope 2: Bills */}
                  <div
                    onClick={() => { macAudio.playClick(); setBackupIncludeBills(!backupIncludeBills); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: backupIncludeBills ? 'rgba(56, 189, 248, 0.12)' : '#18181b',
                      border: backupIncludeBills ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {backupIncludeBills ? <CheckSquare size={15} color="#38bdf8" /> : <Square size={15} color="#52525b" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: backupIncludeBills ? '#f4f4f5' : '#a1a1aa' }}>
                        Bills & Invoices
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#71717a' }}>
                        {bills.length} Bill Vouchers recorded
                      </div>
                    </div>
                  </div>

                  {/* Scope 3: Parties */}
                  <div
                    onClick={() => { macAudio.playClick(); setBackupIncludeParties(!backupIncludeParties); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: backupIncludeParties ? 'rgba(52, 211, 153, 0.12)' : '#18181b',
                      border: backupIncludeParties ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {backupIncludeParties ? <CheckSquare size={15} color="#34d399" /> : <Square size={15} color="#52525b" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: backupIncludeParties ? '#f4f4f5' : '#a1a1aa' }}>
                        Party Directory
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#71717a' }}>
                        {parties.length} Party Accounts & Balances
                      </div>
                    </div>
                  </div>

                  {/* Scope 4: Stock */}
                  <div
                    onClick={() => { macAudio.playClick(); setBackupIncludeStock(!backupIncludeStock); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: backupIncludeStock ? 'rgba(251, 191, 36, 0.12)' : '#18181b',
                      border: backupIncludeStock ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {backupIncludeStock ? <CheckSquare size={15} color="#fbbf24" /> : <Square size={15} color="#52525b" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: backupIncludeStock ? '#f4f4f5' : '#a1a1aa' }}>
                        Stock & Inventory
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#71717a' }}>
                        {stockItems.length} Stock & Mould Items
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <Tooltip title="Export selected modules as a JSON backup file" side="top">
                  <ShadcnButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportBackup}
                    style={{
                      height: '40px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      color: '#38bdf8',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '8px'
                    }}
                  >
                    <Download size={15} />
                    <span>
                      Export Backup JSON ({[backupIncludeConfig, backupIncludeBills, backupIncludeParties, backupIncludeStock].filter(Boolean).length} / 4)
                    </span>
                  </ShadcnButton>
                </Tooltip>

                <Tooltip title="Inspect and selectively restore from any backup JSON file" side="top">
                  <ShadcnButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      height: '40px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      color: '#34d399',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '8px'
                    }}
                  >
                    <Upload size={15} />
                    <span>Restore / Import File...</span>
                  </ShadcnButton>
                </Tooltip>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(24, 24, 27, 0.6)', padding: '8px 12px', borderRadius: '8px', border: '1px solid #27272a' }}>
                <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Default Restore Policy:</span>
                <Segmented
                  value={restoreMode}
                  onChange={(val: any) => setRestoreMode(val as 'merge' | 'overwrite')}
                  options={[
                    { label: 'Merge Existing', value: 'merge' },
                    { label: 'Clean Overwrite', value: 'overwrite' }
                  ]}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                style={{ display: 'none' }}
              />
            </ShadcnCardContent>
          </ShadcnCard>

          {/* CARD 5: APP SECURITY & LOGIN PASSWORD */}
          <ShadcnCard style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <ShadcnCardHeader style={{ padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ShadcnCardTitle style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
                  {authConfig.enabled ? <Lock size={16} style={{ color: '#4ade80' }} /> : <Unlock size={16} style={{ color: '#facc15' }} />}
                  <span>App Security & Login Lock</span>
                </ShadcnCardTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: authConfig.enabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                      color: authConfig.enabled ? '#4ade80' : '#facc15',
                      border: `1px solid ${authConfig.enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: authConfig.enabled ? '#22c55e' : '#eab308' }} />
                    {authConfig.enabled ? 'Password Active' : 'No Password'}
                  </span>
                  <Tooltip title="Save Login ID & Password" side="bottom">
                    <ShadcnButton
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleSaveSecurityCredentials}
                      style={{ height: '32px', width: '32px', padding: 0, background: '#10b981', color: '#ffffff', borderRadius: '6px' }}
                    >
                      <Check size={14} />
                    </ShadcnButton>
                  </Tooltip>
                  {authConfig.password && (
                    <Tooltip title="Remove Password (Opens directly without login panel)" side="bottom">
                      <ShadcnButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePassword}
                        style={{ height: '32px', width: '32px', padding: 0, background: '#18181b', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', borderRadius: '6px' }}
                      >
                        <Unlock size={13} />
                      </ShadcnButton>
                    </Tooltip>
                  )}
                </div>
              </div>
            </ShadcnCardHeader>

            <ShadcnCardContent style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>User ID / Login ID</label>
                  <input
                    type="text"
                    value={authLoginIdInput}
                    onChange={(e) => setAuthLoginIdInput(e.target.value)}
                    placeholder="e.g. BillTrack.org"
                    style={{
                      width: '100%',
                      height: '36px',
                      background: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Password</label>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>(Blank = Auto-open)</span>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showAuthPassword ? 'text' : 'password'}
                      value={authPasswordInput}
                      onChange={(e) => setAuthPasswordInput(e.target.value)}
                      placeholder="Enter password"
                      style={{
                        width: '100%',
                        height: '36px',
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        padding: '0 36px 0 12px',
                        color: '#f4f4f5',
                        fontSize: '13px',
                        fontWeight: 500,
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
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showAuthPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAuthPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>
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
      {/* TAB 3: KEYBOARD SHORTCUTS & NUMPAD ENGINE (ACETERNITY STYLE VISUALIZER)   */}
      {/* ========================================================================= */}
      {activeTab === 'SHORTCUTS' && (
        <KeyboardShortcutsVisualizer />
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

      {/* ─── SELECTIVE RESTORE INSPECTOR MODAL ─── */}
      {pendingRestore && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRestoring) {
              setPendingRestore(null);
            }
          }}
        >
          <div
            style={{
              width: '540px',
              maxWidth: '95vw',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={16} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f4f4f5' }}>
                    Restore / Import Backup
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#a1a1aa' }}>
                    Inspecting file: <strong style={{ color: '#38bdf8' }}>{pendingRestore.fileName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setPendingRestore(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* File Details Chip */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#a1a1aa' }}>
              <span>Backup Date: <strong style={{ color: '#f4f4f5' }}>{pendingRestore.fileDate}</strong></span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Verified JSON Format</span>
            </div>

            {/* Scope Selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>
                  Choose Modules to Restore:
                </label>
                <span style={{ fontSize: '11px', color: '#71717a' }}>Select individual or all</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Module 1: Control Panel */}
                <div
                  onClick={() => {
                    if (pendingRestore.hasConfig && !isRestoring) {
                      macAudio.playClick();
                      setPendingRestore(prev => prev ? { ...prev, restoreConfig: !prev.restoreConfig } : null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: pendingRestore.restoreConfig ? 'rgba(167, 139, 250, 0.12)' : '#18181b',
                    border: pendingRestore.restoreConfig ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid #27272a',
                    cursor: pendingRestore.hasConfig ? 'pointer' : 'not-allowed',
                    opacity: pendingRestore.hasConfig ? 1 : 0.5,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {pendingRestore.restoreConfig ? <CheckSquare size={16} color="#a78bfa" /> : <Square size={16} color="#52525b" />}
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5' }}>Control Panel & Master Config</div>
                      <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>App Prefixes, Moulds, Print & Display Defaults</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: pendingRestore.hasConfig ? '#a78bfa' : '#71717a' }}>
                    {pendingRestore.hasConfig ? 'Ready' : 'Not in file'}
                  </span>
                </div>

                {/* Module 2: Bills */}
                <div
                  onClick={() => {
                    if (pendingRestore.billsCount > 0 && !isRestoring) {
                      macAudio.playClick();
                      setPendingRestore(prev => prev ? { ...prev, restoreBills: !prev.restoreBills } : null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: pendingRestore.restoreBills ? 'rgba(56, 189, 248, 0.12)' : '#18181b',
                    border: pendingRestore.restoreBills ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #27272a',
                    cursor: pendingRestore.billsCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: pendingRestore.billsCount > 0 ? 1 : 0.5,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {pendingRestore.restoreBills ? <CheckSquare size={16} color="#38bdf8" /> : <Square size={16} color="#52525b" />}
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5' }}>Bills & Invoices</div>
                      <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>Vouchers, Items, Quantities, and Adjustments</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: pendingRestore.billsCount > 0 ? '#38bdf8' : '#71717a' }}>
                    {pendingRestore.billsCount > 0 ? `${pendingRestore.billsCount} Bills` : 'Not in file'}
                  </span>
                </div>

                {/* Module 3: Parties */}
                <div
                  onClick={() => {
                    if (pendingRestore.partiesCount > 0 && !isRestoring) {
                      macAudio.playClick();
                      setPendingRestore(prev => prev ? { ...prev, restoreParties: !prev.restoreParties } : null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: pendingRestore.restoreParties ? 'rgba(52, 211, 153, 0.12)' : '#18181b',
                    border: pendingRestore.restoreParties ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid #27272a',
                    cursor: pendingRestore.partiesCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: pendingRestore.partiesCount > 0 ? 1 : 0.5,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {pendingRestore.restoreParties ? <CheckSquare size={16} color="#34d399" /> : <Square size={16} color="#52525b" />}
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5' }}>Party Directory</div>
                      <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>Party Names, Stations, Phones, and Ledger Balances</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: pendingRestore.partiesCount > 0 ? '#34d399' : '#71717a' }}>
                    {pendingRestore.partiesCount > 0 ? `${pendingRestore.partiesCount} Parties` : 'Not in file'}
                  </span>
                </div>

                {/* Module 4: Stock */}
                <div
                  onClick={() => {
                    if (pendingRestore.stockCount > 0 && !isRestoring) {
                      macAudio.playClick();
                      setPendingRestore(prev => prev ? { ...prev, restoreStock: !prev.restoreStock } : null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: pendingRestore.restoreStock ? 'rgba(251, 191, 36, 0.12)' : '#18181b',
                    border: pendingRestore.restoreStock ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid #27272a',
                    cursor: pendingRestore.stockCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: pendingRestore.stockCount > 0 ? 1 : 0.5,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {pendingRestore.restoreStock ? <CheckSquare size={16} color="#fbbf24" /> : <Square size={16} color="#52525b" />}
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f4f4f5' }}>Stock & Inventory</div>
                      <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>Stock Items, UOM, and Warehouse Racks</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: pendingRestore.stockCount > 0 ? '#fbbf24' : '#71717a' }}>
                    {pendingRestore.stockCount > 0 ? `${pendingRestore.stockCount} Items` : 'Not in file'}
                  </span>
                </div>
              </div>
            </div>

            {/* Restore Policy */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18181b', padding: '8px 12px', borderRadius: '8px', border: '1px solid #27272a' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#f4f4f5', fontWeight: 600, display: 'block' }}>Restore Policy:</span>
                <span style={{ fontSize: '10.5px', color: '#71717a' }}>
                  {pendingRestore.restoreMode === 'merge' ? 'Merge with existing records without data loss' : 'Clean overwrite will replace current records'}
                </span>
              </div>
              <Segmented
                value={pendingRestore.restoreMode}
                onChange={(val: any) => setPendingRestore(prev => prev ? { ...prev, restoreMode: val as 'merge' | 'overwrite' } : null)}
                options={[
                  { label: 'Merge Existing', value: 'merge' },
                  { label: 'Clean Overwrite', value: 'overwrite' }
                ]}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <ShadcnButton
                type="button"
                variant="outline"
                size="sm"
                disabled={isRestoring}
                onClick={() => setPendingRestore(null)}
                style={{ height: '36px', padding: '0 16px', background: '#18181b', border: '1px solid #3f3f46', color: '#a1a1aa' }}
              >
                Cancel
              </ShadcnButton>

              <ShadcnButton
                type="button"
                variant="default"
                size="sm"
                disabled={isRestoring || (!pendingRestore.restoreConfig && !pendingRestore.restoreBills && !pendingRestore.restoreParties && !pendingRestore.restoreStock)}
                onClick={handleExecuteRestore}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{isRestoring ? 'Restoring Database...' : 'Confirm & Restore Selected'}</span>
              </ShadcnButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL 34 3D OPERATOR AVATARS MODAL ─── */}
      {showAllAvatarsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllAvatarsModal(false);
            }
          }}
        >
          <div
            style={{
              width: '560px',
              maxWidth: '95vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '14px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f4f4f5' }}>
                    Operator Avatar Studio (All 34 3D Avatars)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#a1a1aa' }}>
                    Choose any 3D avatar for your operator profile & counter. Current: <strong style={{ color: '#38bdf8' }}>Avatar #{userAvatarId}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllAvatarsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid of All 34 Avatars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
                gap: '10px',
                padding: '4px',
                maxHeight: '420px',
                overflowY: 'auto'
              }}
            >
              {getAllAvatarIds().map((avId) => {
                const isSel = userAvatarId === avId;
                return (
                  <button
                    key={avId}
                    type="button"
                    onClick={() => {
                      macAudio.playPop();
                      setUserAvatarId(avId);
                      const url = getAvatarUrl(avId, userName);
                      setUserAvatar(url);
                      localStorage.setItem('modern_app_user_avatar_id', String(avId));
                      localStorage.setItem('modern_app_user_avatar', url);
                      window.dispatchEvent(new Event('storage'));
                      onShowToast?.(`Avatar #${avId} selected for ${userName}!`, 'success');
                      setShowAllAvatarsModal(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px',
                      borderRadius: '10px',
                      background: isSel ? 'rgba(56, 189, 248, 0.15)' : '#18181b',
                      border: isSel ? '2px solid #38bdf8' : '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSel ? '0 0 14px rgba(56, 189, 248, 0.4)' : 'none'
                    }}
                    title={`Select Avatar #${avId}`}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#121215'
                      }}
                    >
                      <img
                        src={getAvatarUrl(avId, userName)}
                        alt={`Avatar ${avId}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: isSel ? 700 : 500,
                        color: isSel ? '#38bdf8' : '#a1a1aa'
                      }}
                    >
                      #{avId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

