import { SQLITE_SHORTCUTS } from '../data/sqliteData';

export interface ShortcutRule {
  shortcut?: string;
  conversion?: string;
  uCap?: number | string;
  u_cap?: number | string;
  lCap?: number | string;
  l_cap?: number | string;
  size?: number | string;
  [key: string]: any;
}

export interface ItemResolveResult {
  finalName: string;
  autoUCap?: number;
  autoLCap?: number;
  matchedRule?: ShortcutRule | null;
  insertedSize?: number | null;
}

/**
 * Retrieve active shortcuts from localStorage (synced with Manage Conversions / SQLite)
 */
export function getActiveShortcuts(): ShortcutRule[] {
  try {
    const customRules = localStorage.getItem('billapp_conversions') || localStorage.getItem('ctrl_conv_rules_v3');
    if (customRules) {
      const parsed = JSON.parse(customRules);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return (SQLITE_SHORTCUTS as ShortcutRule[]) || [];
}

/**
 * Unified item name resolution algorithm used globally across:
 * - LeftGrid (Billing Raw Items)
 * - StockInventoryView (Stock Voucher Items)
 * - Any other item input field
 */
export function resolveItemNameWithMode({
  rawVal,
  rowIndex,
  prevItemName,
  autoConvert,
  autoItem,
  simpleMode,
  activeShortcuts = getActiveShortcuts()
}: {
  rawVal: string;
  rowIndex: number;
  prevItemName?: string;
  autoConvert: boolean;
  autoItem: boolean;
  simpleMode: boolean;
  activeShortcuts?: ShortcutRule[];
}): ItemResolveResult {
  if (simpleMode || !rawVal || !rawVal.trim()) {
    return { finalName: (rawVal || '').trim() };
  }

  let finalName = rawVal.trim();
  const valLower = finalName.toLowerCase();
  let autoUCap: number | undefined;
  let autoLCap: number | undefined;
  let matchedRule: ShortcutRule | null = null;
  let insertedSize: number | null = null;

  // Check if already fully expanded conversion name
  let isFullConversion = false;
  for (const sc of activeShortcuts) {
    const conv = (sc.conversion || '').toLowerCase().trim();
    if (conv && (valLower === conv || valLower.startsWith(conv + ' '))) {
      isFullConversion = true;
      matchedRule = sc;
      break;
    }
  }

  // 1. Auto-Convert Mode: match shortcut prefix/exact
  if (!isFullConversion && autoConvert && finalName) {
    const sortedShortcuts = [...activeShortcuts].sort(
      (a, b) => ((b.shortcut || '').length - (a.shortcut || '').length)
    );
    for (const sc of sortedShortcuts) {
      const scCode = (sc.shortcut || '').toLowerCase().trim();
      if (
        scCode &&
        (valLower === scCode ||
          valLower.startsWith(scCode + ' ') ||
          (valLower.startsWith(scCode) && rawVal.length > scCode.length))
      ) {
        const remaining = rawVal.trim().slice(scCode.length).trim();
        finalName = remaining ? `${sc.conversion} ${remaining}` : (sc.conversion || finalName);
        const uVal = sc.uCap ?? sc.u_cap;
        const lVal = sc.lCap ?? sc.l_cap;
        if (uVal !== undefined && uVal !== null && !isNaN(Number(uVal))) autoUCap = Number(uVal);
        if (lVal !== undefined && lVal !== null && !isNaN(Number(lVal))) autoLCap = Number(lVal);
        matchedRule = sc;
        break;
      }
    }
  }

  // 2. Auto-Item Mode: Sticky previous item prefix when typing numbers or <= 3 char size
  if (!isFullConversion && autoItem && rowIndex > 0 && (/^\d+$/.test(rawVal.trim()) || rawVal.trim().length <= 3)) {
    if (prevItemName && prevItemName.trim()) {
      const parts = prevItemName.trim().split(' ');
      if (parts.length > 1) {
        const prefix = parts.slice(0, -1).join(' ');
        finalName = `${prefix} ${rawVal.trim()}`;
      } else {
        finalName = `${prevItemName.trim()} ${rawVal.trim()}`;
      }
    }
  }

  // If still not matchedRule, look up by finalName
  if (!matchedRule) {
    const finalLower = finalName.toLowerCase().trim();
    for (const sc of activeShortcuts) {
      const conv = (sc.conversion || '').toLowerCase().trim();
      const code = (sc.shortcut || '').toLowerCase().trim();
      if (conv && (finalLower === conv || finalLower.startsWith(conv + ' ') || finalLower.startsWith(conv + '-'))) {
        matchedRule = sc;
        break;
      }
      if (code && (finalLower === code || finalLower.startsWith(code + ' '))) {
        matchedRule = sc;
        break;
      }
    }
  }

  if (matchedRule) {
    const uVal = matchedRule.uCap ?? matchedRule.u_cap;
    const lVal = matchedRule.lCap ?? matchedRule.l_cap;
    if (autoUCap === undefined && uVal !== undefined && uVal !== null && !isNaN(Number(uVal))) {
      autoUCap = Number(uVal);
    }
    if (autoLCap === undefined && lVal !== undefined && lVal !== null && !isNaN(Number(lVal))) {
      autoLCap = Number(lVal);
    }

    if (matchedRule.size !== undefined && matchedRule.size !== null && String(matchedRule.size).trim() !== '') {
      const parsedSize = parseFloat(String(matchedRule.size).replace(/[^\d.]/g, ''));
      if (!isNaN(parsedSize) && parsedSize > 0 && parsedSize !== 10) {
        insertedSize = parsedSize;
      }
    }
  }

  return {
    finalName,
    autoUCap,
    autoLCap,
    matchedRule,
    insertedSize
  };
}
