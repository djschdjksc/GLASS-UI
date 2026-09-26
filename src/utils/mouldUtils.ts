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
  const trimmed = (mouldName || '').trim();
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
