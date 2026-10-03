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

  // 1. Auto-Item Mode: Sticky previous item prefix when typing numbers or size indicators
  // STRICTLY when autoItem is true (Auto Item Mode is ON). When autoItem is OFF, this NEVER runs!
  let stickyApplied = false;
  if (!isFullConversion && autoItem && rowIndex > 0 && prevItemName && prevItemName.trim()) {
    const trimmedVal = rawVal.trim();

    // Check if trimmedVal is an exact shortcut code from activeShortcuts (e.g. "g1", "b1", "cm")
    // If it's an exact shortcut, we let shortcut expand instead of sticky-prefixing
    const isExactShortcut = activeShortcuts.some(
      sc => (sc.shortcut || '').toLowerCase().trim() === trimmedVal.toLowerCase()
    );

    if (!isExactShortcut) {
      // Is it a candidate for sticky prefixing?
      // Matches pure numbers (e.g. "774", "195", "12"), sizes (e.g. "12FT", "12 FT", "10FT"),
      // or alphanumeric item numbers (e.g. "195-B", "154A", "770")
      const isStickyCandidate =
        /^\d+[\d.]*$/.test(trimmedVal) ||
        /^\d+[\d.]*\s*(?:FT|FEET|INCH)?$/i.test(trimmedVal) ||
        /^\d+[\d.]*-[A-Za-z0-9]+$/i.test(trimmedVal) ||
        /^\d+[A-Za-z]$/.test(trimmedVal);

      if (isStickyCandidate) {
        // Strip any existing size in parentheses from previous item, e.g. "B.F.P 154 (10FT)" -> "B.F.P 154"
        const cleanPrev = prevItemName.replace(/\s*\(+[\d.]+\s*(?:FT|FEET)?\s*\)*(?:FT)?\s*\)*/gi, '').trim();
        const parts = cleanPrev.split(' ');
        let prefix = '';
        if (parts.length > 1) {
          // Everything before the last token, e.g. "Coner.Bit 764" -> prefix "Coner.Bit", "B.F.P 154" -> prefix "B.F.P"
          prefix = parts.slice(0, -1).join(' ').trim();
        } else {
          // Single word previous item, e.g. "DOOR" -> prefix "DOOR"
          prefix = cleanPrev;
        }

        if (prefix) {
          finalName = `${prefix} ${trimmedVal}`;
          stickyApplied = true;
        }
      }
    }
  }

  // 2. Auto-Convert Mode OR fallback expansion in Auto-Item Mode (if sticky didn't apply)
  if (!isFullConversion && !stickyApplied && (autoConvert || autoItem) && finalName) {
    const sortedShortcuts = [...activeShortcuts].sort(
      (a, b) => ((b.shortcut || '').length - (a.shortcut || '').length)
    );
    for (const sc of sortedShortcuts) {
      const scCode = (sc.shortcut || '').toLowerCase().trim();
      if (!scCode) continue;

      // Exact match e.g. "g1", "c", "cm", "bfp"
      const isExact = valLower === scCode;
      // Match with space delimiter e.g. "c 10", "cm 12", "1 154", "g1 154"
      const isSpaceDelimited = valLower.startsWith(scCode + ' ');
      // Compound shortcut match e.g. "bfp154", "cm12", "sl14", "c10" (shortcut followed by numbers)
      const isCompoundMatch = valLower.startsWith(scCode) && /^\d+/.test(valLower.slice(scCode.length)) && rawVal.length > scCode.length;

      if (isExact || isSpaceDelimited || isCompoundMatch) {
        const remaining = isSpaceDelimited
          ? rawVal.trim().slice(scCode.length).trim()
          : (isCompoundMatch ? rawVal.trim().slice(scCode.length).trim() : '');
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

  // 3. If still not matchedRule, look up by finalName (to populate caps and dynamic size column)
  if (!matchedRule) {
    const finalLower = finalName.toLowerCase().trim();
    // Also try stripping size tag from finalName for lookup
    const cleanFinalLower = finalName.replace(/\s*\(+[\d.]+\s*(?:FT|FEET)?\s*\)*(?:FT)?\s*\)*/gi, '').toLowerCase().trim();

    for (const sc of activeShortcuts) {
      const conv = (sc.conversion || '').toLowerCase().trim();
      const code = (sc.shortcut || '').toLowerCase().trim();
      if (
        conv &&
        (finalLower === conv ||
          finalLower.startsWith(conv + ' ') ||
          finalLower.startsWith(conv + '-') ||
          cleanFinalLower === conv ||
          cleanFinalLower.startsWith(conv + ' ') ||
          cleanFinalLower.startsWith(conv + '-'))
      ) {
        matchedRule = sc;
        break;
      }
      if (code && (finalLower === code || finalLower.startsWith(code + ' ') || cleanFinalLower === code)) {
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
