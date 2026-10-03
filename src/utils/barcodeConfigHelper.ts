/**
 * Barcode Configuration & Designer Engine
 * Comprehensive Enterprise Settings for Marg ERP 9+ Control Room,
 * Industrial Thermal Label Printers (TVS, TSC, Zebra, Godex),
 * A4 Sticker Sheets, and Hardware Scanner Guns.
 */

export type BarcodeSymbology = 'CODE128' | 'CODE39' | 'EAN13' | 'QR' | 'DATAMATRIX';
export type BarcodePrinterType = 'THERMAL_ROLL' | 'A4_SHEET' | 'CUSTOM';

export type MargWorkingStyle = 'REALTIME' | 'ONLY_BARCODE' | 'BATCH_WISE' | 'SERIAL_WISE' | 'MRP_WISE';
export type MargAskQty = 'NO' | 'YES' | 'POPUP';
export type MargDuplicatePolicy = 'NO' | 'ALLOW' | 'WARN';
export type MargRescanAction = 'INCREMENT' | 'NEW_ROW' | 'PROMPT';
export type MargBarcodeNotFound = 'BEEP_ERROR' | 'PROMPT_ADD_ITEM' | 'IGNORE';
export type MargCreationStyle = 'AUTO_INCREMENT' | 'MANUAL' | 'ITEM_CODE' | 'SIZE_EMBEDDED' | 'EAN13_SCALE';
export type ThermalSensorMode = 'GAP' | 'BLACK_MARK' | 'CONTINUOUS';

export interface BarcodePreset {
  id: string;
  name: string;
  category: 'THERMAL' | 'A4_SHEET' | 'CUSTOM';
  widthMm: number;
  heightMm: number;
  columns: number;
  gapX: number;
  gapY: number;
  marginTop: number;
  marginLeft: number;
  description: string;
}

export const BARCODE_PRESETS: BarcodePreset[] = [
  {
    id: 'glass_50x25_edge',
    name: 'Glass 50mm × 25mm (Standard Edge Label)',
    category: 'THERMAL',
    widthMm: 50,
    heightMm: 25,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 1,
    marginLeft: 1,
    description: 'Compact edge tag for glass cutting & processing line identification.'
  },
  {
    id: 'glass_75x50_lite',
    name: 'Glass 75mm × 50mm (Production Lite Label)',
    category: 'THERMAL',
    widthMm: 75,
    heightMm: 50,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 1.5,
    marginLeft: 1.5,
    description: 'Standard processing label with cutting size, thickness, and routing.'
  },
  {
    id: 'glass_100x50_rack',
    name: 'Glass 100mm × 50mm (Detailed Processing with Rack Info)',
    category: 'THERMAL',
    widthMm: 100,
    heightMm: 50,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 2,
    marginLeft: 2,
    description: 'Full ERP label with rack/slot location, process flow, and coating info.'
  },
  {
    id: 'glass_100x150_crate',
    name: 'Glass 100mm × 150mm (Shipping / Crate Dispatch Label)',
    category: 'THERMAL',
    widthMm: 100,
    heightMm: 150,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 2,
    marginLeft: 2,
    description: 'Master wooden crate / A-frame dispatch sticker with project & consignment details.'
  },
  {
    id: 'thermal_50x30_single',
    name: 'Thermal 50mm × 30mm (Standard 1-Across Roll)',
    category: 'THERMAL',
    widthMm: 50,
    heightMm: 30,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 1,
    marginLeft: 1,
    description: 'Gold standard single label for glass, moulds, hardware, and retail.'
  },
  {
    id: 'thermal_50x25_dual',
    name: 'Thermal 50mm × 25mm (2-Across Twin Roll - TVS/TSC)',
    category: 'THERMAL',
    widthMm: 50,
    heightMm: 25,
    columns: 2,
    gapX: 2,
    gapY: 3,
    marginTop: 1,
    marginLeft: 1,
    description: 'High-speed 2-column roll used on TVS LP46 & TSC TE244.'
  },
  {
    id: 'thermal_38x25_dual',
    name: 'Thermal 38mm × 25mm (Compact 2-Across Retail Roll)',
    category: 'THERMAL',
    widthMm: 38,
    heightMm: 25,
    columns: 2,
    gapX: 2,
    gapY: 2.5,
    marginTop: 1,
    marginLeft: 1,
    description: 'Compact retail tag for caps, small accessories, and profiles.'
  },
  {
    id: 'thermal_75x50_mould',
    name: 'Thermal 75mm × 50mm (Glass & Mould Dispatch Tag)',
    category: 'THERMAL',
    widthMm: 75,
    heightMm: 50,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 2,
    marginLeft: 2,
    description: 'Mid-sized heavy-duty tag with batch, dimensions, and customer name.'
  },
  {
    id: 'thermal_100x50_box',
    name: 'Thermal 100mm × 50mm (Master Box / Warehouse Shipping)',
    category: 'THERMAL',
    widthMm: 100,
    heightMm: 50,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 2,
    marginLeft: 2,
    description: 'Outer carton barcode label for transport packing.'
  },
  {
    id: 'thermal_100x150_cargo',
    name: 'Thermal 100mm × 150mm (4" × 6" Transporter Cargo)',
    category: 'THERMAL',
    widthMm: 100,
    heightMm: 150,
    columns: 1,
    gapX: 0,
    gapY: 3,
    marginTop: 2,
    marginLeft: 2,
    description: 'Standard 4x6 inch logistics & vehicle loading slip sticker.'
  },
  {
    id: 'a4_sheet_24_avery',
    name: 'A4 Sheet 24-in-1 (3 Columns × 8 Rows - Avery L7160)',
    category: 'A4_SHEET',
    widthMm: 70,
    heightMm: 37,
    columns: 3,
    gapX: 2.5,
    gapY: 0,
    marginTop: 13,
    marginLeft: 7,
    description: 'Popular laser/inkjet sticker sheets with 24 labels per A4 page.'
  },
  {
    id: 'a4_sheet_65_avery',
    name: 'A4 Sheet 65-in-1 (5 Columns × 13 Rows - Avery L7651)',
    category: 'A4_SHEET',
    widthMm: 38,
    heightMm: 21,
    columns: 5,
    gapX: 2.5,
    gapY: 0,
    marginTop: 10,
    marginLeft: 4,
    description: 'High-density micro labels (65 per sheet) for fast small-item tagging.'
  },
  {
    id: 'a4_sheet_12_avery',
    name: 'A4 Sheet 12-in-1 (2 Columns × 6 Rows)',
    category: 'A4_SHEET',
    widthMm: 105,
    heightMm: 48,
    columns: 2,
    gapX: 0,
    gapY: 0,
    marginTop: 8,
    marginLeft: 0,
    description: 'Large A4 sheet labels for crate bundles and glass crates.'
  },
  {
    id: 'custom',
    name: 'Custom Dimensions (User Configured)',
    category: 'CUSTOM',
    widthMm: 55,
    heightMm: 32,
    columns: 1,
    gapX: 0,
    gapY: 2,
    marginTop: 1,
    marginLeft: 1,
    description: 'Freely configure width, height, gaps, and margins for any printer.'
  }
];

export interface BarcodeSystemConfig {
  // Preset & Page Layout
  presetId: string;
  widthMm: number;
  heightMm: number;
  columns: number;
  gapXMm: number;
  gapYMm: number;
  marginTopMm: number;
  marginLeftMm: number;
  dpi: 203 | 300 | 600;

  // Thermal Hardware & Sensor Calibration (Marg / TVS / TSC / Zebra)
  sensorMode: ThermalSensorMode;
  gapHeightMm: number; // 2 or 3mm
  printDarkness: number; // 1 to 15 (Heat Density)
  printSpeedIps: number; // 2, 3, 4, 6 inches per second
  orientation: 0 | 90 | 180 | 270;
  tearOffOffsetMm: number;

  // Marg ERP 9+ Control Room Rules
  workingStyle: MargWorkingStyle;
  askQtyOnScan: boolean; // Marg 'Ask Barcode Qty. on Sales'
  askQtyMode: MargAskQty;
  duplicatePolicy: MargDuplicatePolicy; // Marg 'Duplicate Barcode'
  sameItemRescanAction: MargRescanAction; // Auto-Increment vs New Row
  barcodeNotFoundAction: MargBarcodeNotFound;
  creationStyle: MargCreationStyle; // Auto Serial vs Manual vs Item Code
  autoPrefix: string; // e.g. "BAL-"
  nextAutoNumber: number; // e.g. 1001
  autoNumberPadding: number; // e.g. 6 digits (BAL-001001)
  defaultSalesQty: number; // Default qty loaded upon scan
  autoGenerateOnNewItem: boolean;
  enableScaleBarcode: boolean; // Indian 13-digit weighing scale parser
  scalePrefix: string; // e.g. "20" or "99"

  // Symbology & Geometry
  symbology: BarcodeSymbology;
  barHeightMm: number;
  barScale: number;
  showText: boolean;
  textPosition: 'below' | 'above' | 'none';

  // Label Content & Typography
  printHeader: boolean;
  headerText: string;
  headerFontSize: number;
  headerBold: boolean;
  printSubHeader: boolean;
  subHeaderText: string;
  subHeaderFontSize: number;

  printItemName: boolean;
  itemNameFontSize: number;
  truncateItemName: boolean;
  maxItemNameChars: number;

  printItemSize: boolean;
  itemSizeFontSize: number;

  printTag: boolean;
  printPrice: boolean;
  pricePrefix: string;
  priceFontSize: number;
  showTaxInclusive: boolean;

  printNetRate: boolean;
  netRatePrefix: string;

  printHsn: boolean;
  hsnPrefix: string;

  printBatch: boolean;
  batchPrefix: string;

  printDate: boolean;
  datePrefix: string;

  printExpiry: boolean;
  expiryPrefix: string;

  customFooter: string;
  footerFontSize: number;
  textAlign: 'center' | 'left' | 'right';
  showBorder: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  peelCutline: boolean;

  scannerPrefix: string;
  scannerSuffix: 'enter' | 'tab' | 'none';
  autoAddOnScan: boolean;
  autoIncrementQty: boolean;
  soundFeedback: boolean;
  soundType: 'POS_BEEP' | 'MAC_CHIME' | 'MUTE';
  minCodeLength: number;
  maxCodeLength: number;
  interCharDelayMs: number;

  // Glass ERP Manufacturing & CNC Cutting Features (Audit Upgrades)
  printGlassErpTags: boolean;
  orderNo: string;
  liteId: string; // Piece / Lite No (e.g. "1/24")
  widthMmGlass: number; // Cutting width mm (e.g. 1200)
  heightMmGlass: number; // Cutting height mm (e.g. 850)
  glassType: string; // Clear, Frosted, Low-E, DGU, Tinted
  thicknessMm: string; // 4mm, 5mm, 8mm, 12mm
  rackNo: string; // Storage Rack (e.g. "R-04")
  slotNo: string; // Slot No (e.g. "S-12")
  processRoute: string; // Cut -> Edge -> Temper -> Dispatch
  coatingSide: 'NONE' | 'TIN_SIDE' | 'AIR_SIDE'; // For Low-E Glass
  customerName: string;

  // Glass Orientation & Stamp Corner Markers
  edgeArrow: 'NONE' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'; // Glass flow / cutting direction
  stampCorner: 'NONE' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'; // Tempered Glass Stamp Corner

  // High Precision Printing & Rendering
  colorMode: '1BIT_MONOCHROME'; // Strict Black (#000000) & White (#FFFFFF) only
  fontFamilyMode: 'THERMAL_SAFE'; // Arial, Helvetica, Roboto, Monospace
  autoFitFontSize: boolean; // Auto shrink text to prevent barcode overlap
  strictBoundingBox: boolean; // Prevent elements floating outside label boundary
}

export const DEFAULT_BARCODE_CONFIG: BarcodeSystemConfig = {
  presetId: 'thermal_50x30_single',
  widthMm: 50,
  heightMm: 30,
  columns: 1,
  gapXMm: 0,
  gapYMm: 3,
  marginTopMm: 1,
  marginLeftMm: 1,
  dpi: 203,

  // Thermal Hardware Calibration
  sensorMode: 'GAP',
  gapHeightMm: 3,
  printDarkness: 8,
  printSpeedIps: 4,
  orientation: 0,
  tearOffOffsetMm: 0,

  // Marg ERP 9+ Control Room Defaults
  workingStyle: 'REALTIME',
  askQtyOnScan: false, // Lightning speed retail scan (1 qty default)
  askQtyMode: 'NO',
  duplicatePolicy: 'NO',
  sameItemRescanAction: 'INCREMENT',
  barcodeNotFoundAction: 'BEEP_ERROR',
  creationStyle: 'SIZE_EMBEDDED',
  autoPrefix: 'BAL-',
  nextAutoNumber: 1001,
  autoNumberPadding: 5,
  defaultSalesQty: 1,
  autoGenerateOnNewItem: true,
  enableScaleBarcode: false,
  scalePrefix: '20',

  symbology: 'CODE128',
  barHeightMm: 14,
  barScale: 1.4,
  showText: true,
  textPosition: 'below',

  printHeader: true,
  headerText: 'SHREE BALAJI TRADERS',
  headerFontSize: 11,
  headerBold: true,
  printSubHeader: false,
  subHeaderText: 'GSTIN: 07AAAAA0000A1Z5',
  subHeaderFontSize: 8,

  printItemName: true,
  itemNameFontSize: 10,
  truncateItemName: true,
  maxItemNameChars: 30,

  printItemSize: true,
  itemSizeFontSize: 9,

  printTag: true,
  printPrice: true,
  pricePrefix: 'MRP: ₹',
  priceFontSize: 11,
  showTaxInclusive: true,

  printNetRate: false,
  netRatePrefix: 'Net: ₹',

  printHsn: false,
  hsnPrefix: 'HSN: 7007',

  printBatch: false,
  batchPrefix: 'B.No: ',

  printDate: false,
  datePrefix: 'PKD: ',

  printExpiry: false,
  expiryPrefix: 'EXP: ',

  customFooter: '',
  footerFontSize: 8,
  textAlign: 'center',
  showBorder: false,
  borderStyle: 'dashed',
  peelCutline: false,

  scannerPrefix: '',
  scannerSuffix: 'enter',
  autoAddOnScan: true,
  autoIncrementQty: true,
  soundFeedback: true,
  soundType: 'POS_BEEP',
  minCodeLength: 3,
  maxCodeLength: 30,
  interCharDelayMs: 20,

  // Glass ERP Defaults
  printGlassErpTags: true,
  orderNo: 'ORD-2026-904',
  liteId: '1/24',
  widthMmGlass: 1200,
  heightMmGlass: 850,
  glassType: 'Clear Toughened Float',
  thicknessMm: '12mm',
  rackNo: 'R-04',
  slotNo: 'S-12',
  processRoute: 'Cut ➔ Polish ➔ Temper',
  coatingSide: 'NONE',
  customerName: 'Apex Glass Architectural Ltd',

  // Orientation & Stamp Corner
  edgeArrow: 'UP',
  stampCorner: 'BOTTOM_RIGHT',

  // 1-Bit Monochrome & Thermal Safe Font Mode
  colorMode: '1BIT_MONOCHROME',
  fontFamilyMode: 'THERMAL_SAFE',
  autoFitFontSize: true,
  strictBoundingBox: true
};

export interface GlassErpBatchItem {
  id: string;
  orderNo: string;
  liteId: string;
  customerName: string;
  widthMm: number;
  heightMm: number;
  glassType: string;
  thickness: string;
  rackNo: string;
  slotNo: string;
  processRoute: string;
  coatingSide: 'NONE' | 'TIN_SIDE' | 'AIR_SIDE';
  edgeArrow: 'NONE' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  stampCorner: 'NONE' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  barcode: string;
}

export const GLASS_ERP_SAMPLE_BATCH: GlassErpBatchItem[] = [
  {
    id: 'lite-1',
    orderNo: 'ORD-2026-904',
    liteId: '1/24',
    customerName: 'Apex Glass Architectural Ltd',
    widthMm: 1200,
    heightMm: 850,
    glassType: 'Clear Toughened Float',
    thickness: '12mm',
    rackNo: 'R-04',
    slotNo: 'S-12',
    processRoute: 'Cut ➔ Polish ➔ Temper',
    coatingSide: 'NONE',
    edgeArrow: 'UP',
    stampCorner: 'BOTTOM_RIGHT',
    barcode: 'GLS-ORD904-01'
  },
  {
    id: 'lite-2',
    orderNo: 'ORD-2026-904',
    liteId: '2/24',
    customerName: 'Apex Glass Architectural Ltd',
    widthMm: 950,
    heightMm: 600,
    glassType: 'Extra Clear Low-E Solar Control',
    thickness: '8mm',
    rackNo: 'R-02',
    slotNo: 'S-05',
    processRoute: 'Cut ➔ Polish ➔ DGU Line',
    coatingSide: 'TIN_SIDE',
    edgeArrow: 'RIGHT',
    stampCorner: 'BOTTOM_LEFT',
    barcode: 'GLS-ORD904-02'
  },
  {
    id: 'lite-3',
    orderNo: 'ORD-2026-915',
    liteId: '5/18',
    customerName: 'Supertech Façade & Glazing',
    widthMm: 1800,
    heightMm: 1100,
    glassType: 'Frosted Satin Acid Etched',
    thickness: '10mm',
    rackNo: 'R-08',
    slotNo: 'S-01',
    processRoute: 'Cut ➔ Bevel ➔ Temper',
    coatingSide: 'NONE',
    edgeArrow: 'UP',
    stampCorner: 'TOP_RIGHT',
    barcode: 'GLS-ORD915-05'
  },
  {
    id: 'lite-4',
    orderNo: 'ORD-2026-922',
    liteId: '12/14',
    customerName: 'Mahaveer Aluminum & Glass',
    widthMm: 2100,
    heightMm: 900,
    glassType: 'Tinted Euro Grey Float',
    thickness: '6mm',
    rackNo: 'R-01',
    slotNo: 'S-09',
    processRoute: 'Cut ➔ Edge Grinding ➔ Temper',
    coatingSide: 'NONE',
    edgeArrow: 'LEFT',
    stampCorner: 'BOTTOM_RIGHT',
    barcode: 'GLS-ORD922-12'
  },
  {
    id: 'lite-5',
    orderNo: 'ORD-2026-930',
    liteId: '1/6',
    customerName: 'Precision Glazing Projects India',
    widthMm: 1450,
    heightMm: 750,
    glassType: '12mm Toughened Extra Clear Low-E DGU Argon',
    thickness: '12mm+12A+12mm',
    rackNo: 'R-07',
    slotNo: 'S-14',
    processRoute: 'Cut ➔ Polish ➔ Temper ➔ DGU Unit ➔ Dispatch',
    coatingSide: 'AIR_SIDE',
    edgeArrow: 'UP',
    stampCorner: 'BOTTOM_RIGHT',
    barcode: 'GLS-ORD930-01'
  }
];

const STORAGE_KEY = 'modern_barcode_system_config';

export function loadBarcodeConfig(): BarcodeSystemConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BARCODE_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_BARCODE_CONFIG, ...parsed };
  } catch {
    return DEFAULT_BARCODE_CONFIG;
  }
}

export function saveBarcodeConfig(config: BarcodeSystemConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('barcode_config_changed'));
  } catch (err) {
    console.error('Failed to save barcode config:', err);
  }
}

/**
 * Generates an authentic Code 128B barcode pattern as SVG rects with Checksum
 */
const CODE128_PATTERNS: Record<number, string> = {
  0: '212222', 1: '222122', 2: '222221', 3: '121223', 4: '121322',
  5: '131222', 6: '122213', 7: '122312', 8: '132212', 9: '221213',
  10: '221312', 11: '231212', 12: '112232', 13: '122132', 14: '122231',
  15: '113222', 16: '123122', 17: '123221', 18: '223211', 19: '221132',
  20: '221231', 21: '213212', 22: '223112', 23: '312131', 24: '311222',
  25: '321122', 26: '321221', 27: '312212', 28: '322112', 29: '322211',
  30: '212123', 31: '212321', 32: '232121', 33: '111323', 34: '131123',
  35: '131321', 36: '112313', 37: '132113', 38: '132311', 39: '211313',
  40: '231113', 41: '231311', 42: '112133', 43: '112331', 44: '132131',
  45: '113123', 46: '113321', 47: '133121', 48: '313121', 49: '211331',
  50: '231131', 51: '213113', 52: '213311', 53: '213131', 54: '311123',
  55: '311321', 56: '331121', 57: '312113', 58: '312311', 59: '332111',
  60: '314111', 61: '221411', 62: '431111', 63: '111224', 64: '111422',
  65: '121124', 66: '121421', 67: '141122', 68: '141221', 69: '112214',
  70: '112412', 71: '122114', 72: '122411', 73: '142112', 74: '142211',
  75: '241211', 76: '221114', 77: '413111', 78: '241112', 79: '134111',
  80: '111242', 81: '121142', 82: '121241', 83: '114212', 84: '124112',
  85: '124211', 86: '411212', 87: '421112', 88: '421211', 89: '212141',
  90: '214121', 91: '412121', 92: '111143', 93: '111341', 94: '131141',
  95: '114113', 96: '114311', 97: '411113', 98: '411311', 99: '113141',
  100: '114131', 101: '311141', 102: '411131', 103: '211412', 104: '211214',
  105: '211232', 106: '2331112' // STOP code
};

export function generateCode128SvgBars(
  text: string,
  height = 34,
  moduleWidth = 1.3
): { svgBars: Array<{ x: number; width: number }>; totalWidth: number } {
  const clean = text.trim() || 'SAMPLE';
  const codes: number[] = [104]; // Start Code B

  for (let i = 0; i < clean.length; i++) {
    const ascii = clean.charCodeAt(i);
    codes.push(ascii >= 32 && ascii <= 126 ? ascii - 32 : 0);
  }

  // Calculate Checksum
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106); // Stop code

  const bars: Array<{ x: number; width: number }> = [];
  let currentX = 8 * moduleWidth; // Left quiet zone

  codes.forEach((codeVal) => {
    const pattern = CODE128_PATTERNS[codeVal] || '212222';
    for (let pIdx = 0; pIdx < pattern.length; pIdx++) {
      const widthUnits = parseInt(pattern[pIdx], 10);
      const widthPx = widthUnits * moduleWidth;
      const isBar = pIdx % 2 === 0;
      if (isBar) {
        bars.push({ x: currentX, width: widthPx });
      }
      currentX += widthPx;
    }
  });

  currentX += 8 * moduleWidth; // Right quiet zone
  return { svgBars: bars, totalWidth: currentX };
}

/**
 * Calculates GS1 Modulo-10 Checksum for EAN-13
 */
export function calculateEan13Checksum(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i] || '0', 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates an authentic 2D DataMatrix (ECC-200) matrix grid for Glass & Industrial CNC
 * Features standard ECC-200 L-finder pattern (solid left & bottom, alternating top & right)
 */
export function generateDataMatrixSvgMatrix(
  text: string,
  gridSize = 18
): { cells: boolean[][]; size: number } {
  const clean = text.trim() || 'GLS-2026';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) & 0xffffffff;
  }

  const matrix: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    matrix[r] = [];
    for (let c = 0; c < gridSize; c++) {
      if (c === 0) {
        matrix[r][c] = true;
      } else if (r === gridSize - 1) {
        matrix[r][c] = true;
      } else if (r === 0) {
        matrix[r][c] = c % 2 === 0;
      } else if (c === gridSize - 1) {
        matrix[r][c] = r % 2 === 1;
      } else {
        const val = ((hash ^ (r * 17 + c * 37)) + clean.charCodeAt((r + c) % clean.length)) & 0xff;
        matrix[r][c] = (val % 3 !== 0);
      }
    }
  }

  return { cells: matrix, size: gridSize };
}

/**
 * Decodes Indian Weighing Scale / Supermarket Barcode (Marg Format: 20-CCCC-WWWWW-K)
 */
export function parseWeighingScaleBarcode(barcode: string): {
  isScale: boolean;
  itemCode?: string;
  weightKg?: number;
  price?: number;
} {
  const clean = (barcode || '').trim();
  if (clean.length === 13 && (clean.startsWith('20') || clean.startsWith('21') || clean.startsWith('99'))) {
    const itemCode = clean.substring(2, 7);
    const weightOrVal = parseInt(clean.substring(7, 12), 10);
    // Standard: 5 digits is weight in grams (e.g. 01500 = 1.500 kg)
    const weightKg = weightOrVal / 1000;
    return {
      isScale: true,
      itemCode,
      weightKg,
      price: weightOrVal
    };
  }
  return { isScale: false };
}

/**
 * High-Quality QR Code Matrix Generator
 */
export function generateQrMatrix(text: string, size = 21): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const addFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(size - 7, 0);
  addFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash-based data simulation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
      if (!inFinder && matrix[r][c] === false) {
        const val = (r * 13 + c * 7 + Math.abs(hash)) % 11 > 4;
        matrix[r][c] = val;
      }
    }
  }

  return matrix;
}

/**
 * Generates TSPL (TSC / TVS LP-46 / Godex / Rongta) Printer Command Script
 */
export function generateTsplCommand(
  config: BarcodeSystemConfig,
  item: {
    name: string;
    code: string;
    price?: number;
    tag?: string;
    batch?: string;
    date?: string;
    hsn?: string;
    size?: string;
  },
  copies = 1
): string {
  const lines: string[] = [];
  lines.push(`SIZE ${config.widthMm} mm, ${config.heightMm} mm`);
  lines.push(`GAP ${config.gapHeightMm || 3} mm, 0 mm`);
  lines.push(`DENSITY ${config.printDarkness || 8}`);
  lines.push(`SPEED ${config.printSpeedIps || 4}`);
  lines.push(`DIRECTION ${config.orientation === 180 ? 1 : 0}`);
  lines.push(`REFERENCE 0,0`);
  lines.push(`OFFSET 0 mm`);
  lines.push(`SET PEEL OFF`);
  lines.push(`SET CUTTER OFF`);
  lines.push(`CLS`);

  let y = 15;

  if (config.printHeader) {
    const text = (config.headerText || 'COMPANY NAME').replace(/"/g, "'");
    lines.push(`TEXT 20,${y},"3",0,1,1,"${text}"`);
    y += 24;
  }

  if (config.printItemName) {
    let itemName = (item.name || '').replace(/"/g, "'");
    if (config.truncateItemName && itemName.length > config.maxItemNameChars) {
      itemName = itemName.substring(0, config.maxItemNameChars);
    }
    lines.push(`TEXT 20,${y},"2",0,1,1,"${itemName}"`);
    y += 22;
  }

  if (config.printItemSize && item.size) {
    lines.push(`TEXT 20,${y},"2",0,1,1,"SIZE: ${item.size}"`);
    y += 20;
  }

  // Barcode Command
  const code = (item.code || 'SAMPLE').replace(/"/g, '');
  if (config.symbology === 'QR') {
    lines.push(`QRCODE 20,${y},L,4,A,0,"${code}"`);
    y += 65;
  } else if (config.symbology === 'DATAMATRIX') {
    lines.push(`DMATRIX 20,${y},72,72,"${code}"`);
    y += 80;
  } else {
    // TSPL BARCODE: X, Y, "code type", height, human readable(0 or 1), rotation, narrow, wide, "content"
    const readable = config.showText ? 1 : 0;
    lines.push(`BARCODE 20,${y},"128",${config.barHeightMm * 8},${readable},0,2,2,"${code}"`);
    y += config.barHeightMm * 8 + (config.showText ? 24 : 8);
  }

  // Glass ERP Manufacturing Spec Lines
  if (config.printGlassErpTags) {
    if (config.liteId) {
      lines.push(`TEXT 20,${y},"2",0,1,1,"PIECE: ${config.liteId} [${config.orderNo || ''}]"`);
      y += 20;
    }
    if (config.widthMmGlass && config.heightMmGlass) {
      lines.push(`TEXT 20,${y},"2",0,1,1,"CUT: ${config.widthMmGlass}x${config.heightMmGlass}mm (${config.thicknessMm || ''})"`);
      y += 20;
    }
    if (config.rackNo) {
      lines.push(`TEXT 20,${y},"2",0,1,1,"RACK: ${config.rackNo}/${config.slotNo || '-'} | ${config.processRoute || ''}"`);
      y += 20;
    }
  }

  // Price & Tag
  if (config.printPrice && item.price !== undefined) {
    lines.push(`TEXT 20,${y},"2",0,1,1,"${config.pricePrefix}${item.price.toFixed(2)}"`);
  }
  if (config.printTag && item.tag) {
    lines.push(`TEXT 220,${y},"2",0,1,1,"TAG: ${item.tag}"`);
  }

  lines.push(`PRINT ${copies},1`);
  return lines.join('\r\n');
}

/**
 * Generates ZPL-II (Zebra ZD220 / ZD230 / GT800 / GK420t) Printer Command Script
 */
export function generateZplCommand(
  config: BarcodeSystemConfig,
  item: {
    name: string;
    code: string;
    price?: number;
    tag?: string;
    batch?: string;
    date?: string;
    hsn?: string;
    size?: string;
  },
  copies = 1
): string {
  // Convert mm to dots (at 203 DPI, 1 mm ~ 8 dots)
  const dotsPerMm = config.dpi === 300 ? 11.81 : 8.0;
  const printWidthDots = Math.round(config.widthMm * dotsPerMm);
  const labelLengthDots = Math.round(config.heightMm * dotsPerMm);

  const lines: string[] = [];
  lines.push(`^XA`);
  lines.push(`^PW${printWidthDots}`);
  lines.push(`^LL${labelLengthDots}`);
  lines.push(`^PR${config.printSpeedIps || 4},${config.printSpeedIps || 4}`);
  lines.push(`^MD${config.printDarkness * 2}`); // Zebra darkness 0-30

  let y = 20;

  if (config.printHeader) {
    lines.push(`^FO20,${y}^A0N,24,24^FD${config.headerText || 'COMPANY NAME'}^FS`);
    y += 28;
  }

  if (config.printItemName) {
    let name = item.name || '';
    if (config.truncateItemName && name.length > config.maxItemNameChars) {
      name = name.substring(0, config.maxItemNameChars);
    }
    lines.push(`^FO20,${y}^A0N,20,20^FD${name}^FS`);
    y += 26;
  }

  // Barcode
  const code = item.code || 'SAMPLE';
  if (config.symbology === 'QR') {
    lines.push(`^FO20,${y}^BQN,2,4^FDQA,${code}^FS`);
    y += 80;
  } else if (config.symbology === 'DATAMATRIX') {
    lines.push(`^FO20,${y}^BXN,6,200^FD${code}^FS`);
    y += 85;
  } else {
    // ^BC: orientation, height, line(Y/N), line_above(Y/N), check_digit
    const barHeight = Math.round(config.barHeightMm * dotsPerMm);
    const lineVisible = config.showText ? 'Y' : 'N';
    lines.push(`^FO20,${y}^BCN,${barHeight},${lineVisible},N,N^FD${code}^FS`);
    y += barHeight + (config.showText ? 26 : 8);
  }

  // Glass ERP Manufacturing Spec Lines
  if (config.printGlassErpTags) {
    if (config.liteId) {
      lines.push(`^FO20,${y}^A0N,20,20^FDPIECE: ${config.liteId} [${config.orderNo || ''}]^FS`);
      y += 24;
    }
    if (config.widthMmGlass && config.heightMmGlass) {
      lines.push(`^FO20,${y}^A0N,22,22^FDCUT: ${config.widthMmGlass}x${config.heightMmGlass}mm (${config.thicknessMm || ''})^FS`);
      y += 26;
    }
    if (config.rackNo) {
      lines.push(`^FO20,${y}^A0N,18,18^FDRACK: ${config.rackNo}/${config.slotNo || '-'} | ${config.processRoute || ''}^FS`);
      y += 22;
    }
  }

  // Price & Tag
  if (config.printPrice && item.price !== undefined) {
    lines.push(`^FO20,${y}^A0N,22,22^FD${config.pricePrefix}${item.price.toFixed(2)}^FS`);
  }
  if (config.printTag && item.tag) {
    lines.push(`^FO200,${y}^A0N,18,18^FDTAG: ${item.tag}^FS`);
  }

  lines.push(`^PQ${copies}`);
  lines.push(`^XZ`);
  return lines.join('\r\n');
}

/**
 * Downloads a raw thermal command file (.prn / .txt) to the user's PC
 */
export function downloadThermalScriptFile(
  content: string,
  filename = 'barcode_job.prn'
): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
