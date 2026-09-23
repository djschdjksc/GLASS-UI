import type { AppPreferences } from '../db/schema';

const PREF_STORAGE_KEY = 'modern_accounting_app_preferences';

export const DEFAULT_PREFERENCES: AppPreferences = {
  tableRowHeight: 'normal',
  customRowHeightPx: 32,
  fontSize: 'medium',
  soundEnabled: true,
  soundVolume: 0.8,
  bgType: 'image',
  bgImage: '/panda_bg.jpg',
  bgColor: 'linear-gradient(135deg, #070b14 0%, #0d1a30 50%, #080f1e 100%)',
  blurAmount: 20,
  overlayOpacity: 0.65,
  glassOpacity: 0.75,
  autoSyncIntervalMs: 8000,
  serverEndpointUrl: 'http://localhost:8080/api/v1/sync',
  columnWidths: {
    leftTable_name: 200,
    leftTable_qty: 65,
    leftTable_uCap: 65,
    leftTable_lCap: 65,
    rightTable_mould: 220,
    rightTable_qty: 60,
    rightTable_price: 75,
    rightTable_total: 90
  }
};

class PreferencesStorage {
  private prefs: AppPreferences;

  constructor() {
    this.prefs = this.loadFromStorage();
  }

  private loadFromStorage(): AppPreferences {
    try {
      const raw = localStorage.getItem(PREF_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load preferences from localStorage', e);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  public getPreferences(): AppPreferences {
    return { ...this.prefs };
  }

  public savePreferences(updated: Partial<AppPreferences>): AppPreferences {
    this.prefs = { ...this.prefs, ...updated };
    try {
      localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(this.prefs));
    } catch (e) {
      console.error('Failed to write preferences to localStorage', e);
    }
    return { ...this.prefs };
  }

  public getRowHeightPx(): number {
    switch (this.prefs.tableRowHeight) {
      case 'compact': return 26;
      case 'spacious': return 42;
      case 'normal':
      default: return this.prefs.customRowHeightPx || 32;
    }
  }
}

export const preferencesStorage = new PreferencesStorage();
