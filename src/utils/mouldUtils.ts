/**
 * Mould & Size Proportional Rate Utilities
 * Handles parsing product base names, size in feet, and calculating proportional prices.
 * e.g., if B.F.P (10) is 100/-, then B.F.P (12) is 120/- (10 per foot * 12 = 120)
 * All rates are round off to the nearest integer.
 */

export interface ParsedMouldInfo {
  baseProduct: string;
  size: number;
  hasSize: boolean;
  normalizedBase: string;
}

export const normalizeBaseProduct = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .replace(/\s*\([\d.]+(?:\s*(?:ft|feet|'))?\)/gi, '') // remove any brackets/size
    .replace(/[\.\s_-]+/g, '') // remove dots, spaces, dashes
    .trim();
};

export const parseProductAndSize = (mouldName: string): ParsedMouldInfo => {
  const clean = (mouldName || '').replace(/\s*\((?:lot|part)\s*\d+\)/gi, '').trim();
  const trimmed = clean;
  if (!trimmed) {
    return { baseProduct: '', size: 10, hasSize: false, normalizedBase: '' };
  }

  // Matches patterns like "B.F.P (10)", "B.F.P (12)", "B.F.P (9.5)", "C.M 161 (10 FT)", "T.G (12FT)"
  const match = trimmed.match(/^(.*?)\s*\(\s*([\d]+(?:\.[\d]+)?)(?:\s*(?:ft|feet|'))?\s*\)$/i);
  if (match) {
    const base = match[1].trim();
    const sizeNum = parseFloat(match[2]);
    const validBase = base || trimmed;
    return {
      baseProduct: validBase,
      size: !isNaN(sizeNum) && sizeNum > 0 ? sizeNum : 10,
      hasSize: true,
      normalizedBase: normalizeBaseProduct(validBase)
    };
  }

  // Also match unbracketed size suffix like "B.F.P 12 FT" or "C.M 12"
  const endSizeMatch = trimmed.match(/^(.*?)\s+([\d]+(?:\.[\d]+)?)\s*(?:ft|feet|')?$/i);
  if (endSizeMatch) {
    const base = endSizeMatch[1].trim();
    const sizeNum = parseFloat(endSizeMatch[2]);
    if (!isNaN(sizeNum) && sizeNum > 0) {
      return {
        baseProduct: base,
        size: sizeNum,
        hasSize: true,
        normalizedBase: normalizeBaseProduct(base)
      };
    }
  }

  return {
    baseProduct: trimmed,
    size: 10,
    hasSize: false,
    normalizedBase: normalizeBaseProduct(trimmed)
  };
};

export const formatMouldWithSize = (base: string, size: number | string): string => {
  const cleanBase = (base || '').replace(/\s*\([\d.]+(?:\s*(?:ft|feet|'))?\)/i, '').trim();
  const s = String(size);
  return `${cleanBase} (${s})`;
};

export const calculateProportionalPrice = (
  knownPrice: number,
  knownSize: number,
  targetSize: number
): number => {
  if (!knownPrice || knownPrice <= 0 || !knownSize || knownSize <= 0 || !targetSize || targetSize <= 0) {
    return 0;
  }
  const perFootRate = knownPrice / knownSize;
  const rawPrice = perFootRate * targetSize;
  // User Requirement: Round off value (nearest whole integer)
  return Math.round(rawPrice);
};

export const extractSizeFromColLabel = (labelOrField: string): number => {
  const normalized = (labelOrField || '').replace('_', '.');
  const match = normalized.match(/([\d]+(?:\.[\d]+)?)/);
  if (match) {
    const parsed = parseFloat(match[1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 10;
};

export interface RateValidationResult {
  isValid: boolean;
  isTooLow: boolean;
  isTooHigh: boolean;
  minRate: number;
  maxRate: number;
  enteredRate: number;
  mouldName: string;
  matchedRuleName?: string;
}

/**
 * Validates entered rate against mould min_rate and max_rate in conversions.
 * Handles exact matching, normalized base product matching, and proportional size scaling.
 */
export const validateMouldRate = (
  mouldName: string,
  enteredRate: number,
  conversions: any[] = []
): RateValidationResult => {
  const result: RateValidationResult = {
    isValid: true,
    isTooLow: false,
    isTooHigh: false,
    minRate: 0,
    maxRate: 0,
    enteredRate,
    mouldName: mouldName || ''
  };

  if (!mouldName || !mouldName.trim() || enteredRate <= 0 || !Array.isArray(conversions) || conversions.length === 0) {
    return result;
  }

  const cleanMould = mouldName.trim();
  const mouldLower = cleanMould.toLowerCase();
  const parsed = parseProductAndSize(cleanMould);
  const normBase = parsed.normalizedBase;

  // 1. Pass A: Exact match on conversion name
  let matchedRule = conversions.find(c => {
    const conv = String(c.conversion || '').trim().toLowerCase();
    return conv && conv === mouldLower;
  });

  // 2. Pass B: Exact match on shortcut
  if (!matchedRule) {
    matchedRule = conversions.find(c => {
      const code = String(c.shortcut || '').trim().toLowerCase();
      return code && !code.startsWith('__auto_') && code === mouldLower;
    });
  }

  // 3. Pass C: Match by base product name (removing size brackets/numbers)
  if (!matchedRule && normBase) {
    matchedRule = conversions.find(c => {
      const conv = String(c.conversion || '').trim();
      const cNorm = normalizeBaseProduct(conv);
      return cNorm && cNorm === normBase;
    });
  }

  // 4. Pass D: Match where mould starts with conversion name (longest first)
  if (!matchedRule) {
    const sorted = [...conversions].sort((a, b) => String(b.conversion || '').length - String(a.conversion || '').length);
    matchedRule = sorted.find(c => {
      const conv = String(c.conversion || '').trim().toLowerCase();
      return conv && mouldLower.startsWith(conv);
    });
  }

  if (!matchedRule) {
    return result;
  }

  const rawMin = Number(matchedRule.min_rate !== undefined ? matchedRule.min_rate : matchedRule.minRate) || 0;
  const rawMax = Number(matchedRule.max_rate !== undefined ? matchedRule.max_rate : matchedRule.maxRate) || 0;

  if (rawMin <= 0 && rawMax <= 0) {
    return result;
  }

  // Proportional size calculation if applicable
  const ruleSize = Number(matchedRule.size) || 10;
  const itemSize = parsed.hasSize && parsed.size > 0 ? parsed.size : ruleSize;

  let effectiveMin = rawMin;
  let effectiveMax = rawMax;

  if (parsed.hasSize && ruleSize > 0 && itemSize !== ruleSize) {
    if (rawMin > 0) effectiveMin = Math.round((rawMin / ruleSize) * itemSize);
    if (rawMax > 0) effectiveMax = Math.round((rawMax / ruleSize) * itemSize);
  }

  result.minRate = effectiveMin;
  result.maxRate = effectiveMax;
  result.matchedRuleName = matchedRule.conversion || matchedRule.shortcut;

  if (effectiveMin > 0 && enteredRate < effectiveMin) {
    result.isValid = false;
    result.isTooLow = true;
  } else if (effectiveMax > 0 && enteredRate > effectiveMax) {
    result.isValid = false;
    result.isTooHigh = true;
  }

  return result;
};

