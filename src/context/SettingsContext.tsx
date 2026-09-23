import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { preferencesStorage, DEFAULT_PREFERENCES } from '../services/settings/preferencesStorage';
import type { AppPreferences } from '../services/db/schema';

interface SettingsContextType {
  preferences: AppPreferences;
  rowHeightPx: number;
  updatePreferences: (updates: Partial<AppPreferences>) => void;
  setTableRowHeight: (mode: 'compact' | 'normal' | 'spacious', customPx?: number) => void;
  setColumnWidth: (colKey: string, widthPx: number) => void;
  resetPreferences: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AppPreferences>(() => preferencesStorage.getPreferences());

  const updatePreferences = useCallback((updates: Partial<AppPreferences>) => {
    const updated = preferencesStorage.savePreferences(updates);
    setPreferences({ ...updated });
  }, []);

  const setTableRowHeight = useCallback((mode: 'compact' | 'normal' | 'spacious', customPx?: number) => {
    const px = customPx !== undefined ? customPx : (mode === 'compact' ? 26 : mode === 'spacious' ? 42 : 32);
    updatePreferences({
      tableRowHeight: mode,
      customRowHeightPx: px
    });
  }, [updatePreferences]);

  const setColumnWidth = useCallback((colKey: string, widthPx: number) => {
    setPreferences(prev => {
      const updatedColWidths = { ...prev.columnWidths, [colKey]: widthPx };
      const next = preferencesStorage.savePreferences({ columnWidths: updatedColWidths });
      return { ...next };
    });
  }, []);

  const resetPreferences = useCallback(() => {
    const reset = preferencesStorage.savePreferences(DEFAULT_PREFERENCES);
    setPreferences({ ...reset });
  }, []);

  const rowHeightPx = preferences.tableRowHeight === 'compact' ? 26 : preferences.tableRowHeight === 'spacious' ? 42 : (preferences.customRowHeightPx || 32);

  return (
    <SettingsContext.Provider
      value={{
        preferences,
        rowHeightPx,
        updatePreferences,
        setTableRowHeight,
        setColumnWidth,
        resetPreferences
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};
