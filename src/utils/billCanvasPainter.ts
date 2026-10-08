// Ultra-High-Speed Canvas Painter matching F:\SUMMARY\BillApp\main.py BillPainter 1:1
// Reproduces exact pixel-perfect layout of native Qt QPainter

import { formatBillNumber } from './billDocTypes';

export interface PrintAdjustment {
  id: string;
  type: 'receive' | 'pay' | 'add' | 'sub';
  desc: string;
  val: number;
}

export function isAdjustmentReceive(adj: { type?: string; desc?: string }): boolean {
  const t = String(adj.type || '').toLowerCase();
  const d = String(adj.desc || '').toLowerCase();
  if (t === 'receive' || t === 'recv' || t === 'sub_receive') return true;
  if (t === 'pay' || t === 'add_pay') return false;
  if (d.includes('pay') || d.includes('debit') || d.includes('freight') || d.includes('bhada') || d.includes('lene wala') || d.includes('bakaya')) {
    return false;
  }
  if (d.includes('receive') || d.includes('jama') || d.includes('recv') || d.includes('return') || d.includes('dene wala') || d.includes('advance') || d.includes('discount')) {
    return true;
  }
  if (t === 'add') return true; // In modern UI '+' was Receive
  if (t === 'sub') return false; // In modern UI '-' was Pay
  return true;
}

export interface BillPrintPayload {
  docType: string;
  billNo: string | number;
  date: string;
  partyName: string;
  vehicleNo?: string;
  vehicleType?: string;
  showPartyCode?: boolean;
  dynamicCols?: Array<{ field: string; label: string }>;
  editId?: string;
  mode: 'estimate' | 'summary_only' | 'loading_slip';
  items: Array<{
    name: string;
    partyCode?: string;
    qty: number | string;
    uCap?: number | string;
    lCap?: number | string;
    [key: string]: any;
  }>;
  groups: Array<{
    mould: string;
    qty: number | string;
    price: number | string;
    total: number | string;
  }>;
  adjustments: PrintAdjustment[];
  balanceLabel: string;
  subTotal: number;
  finalBalance: number;
  pageNum?: number;
  rowsPerPage?: number;
  combineAllPages?: boolean;
  /** Skip group lookup — passed to Python native print server for inline group labels */
  skipGroupEntries?: Array<{ prefix: string; group: string }>;
  isColorful?: boolean;
}

export function formatIndianCurrency(num: number): string {
  try {
    const val = Number(num) || 0;
    const s = Math.abs(val).toFixed(2);
    const parts = s.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    if (integerPart.length <= 3) {
      const res = `${integerPart}.${decimalPart}`;
      return val >= 0 ? `₹ ${res}` : `-₹ ${res}`;
    } else {
      const lastThree = integerPart.slice(-3);
      let remaining = integerPart.slice(0, -3);
      const groups: string[] = [];
      while (remaining.length > 0) {
        groups.push(remaining.slice(-2));
        remaining = remaining.slice(0, -2);
      }
      groups.reverse();
      const res = groups.join(',') + ',' + lastThree + '.' + decimalPart;
      return val >= 0 ? `₹ ${res}` : `-₹ ${res}`;
    }
  } catch {
    return '₹ 0.00';
  }
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function renderBillToCanvas(data: BillPrintPayload, targetCanvas?: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = targetCanvas || document.createElement('canvas');

  // Exact coordinates matching F:\SUMMARY\BillApp\main.py
  const W = 1414;
  const margin = 30;

  const isEstimate = data.mode === 'estimate';
  const isSummaryOnly = data.mode === 'summary_only';
  const isLoadingSlip = data.mode === 'loading_slip';

  const validItems = (data.items || []).filter(it => (it.name || '').trim() || Number(it.qty) > 0);
  const validGroups = (data.groups || []).filter(g => (g.mould || '').trim() || Number(g.qty) > 0 || Number(g.total) > 0);

  const pageNum = data.pageNum ?? 0;
  const isCombineAll = pageNum === -1 || Boolean(data.combineAllPages);
  const rowsPerPage = Number(data.rowsPerPage) || 27;
  const totalPages = isSummaryOnly ? 1 : Math.max(1, Math.ceil(validItems.length / rowsPerPage));
  const startIdx = isCombineAll ? 0 : pageNum * rowsPerPage;
  const itemsToDraw = isSummaryOnly ? [] : (isCombineAll ? validItems : validItems.slice(startIdx, startIdx + rowsPerPage));
  const isLastPage = isCombineAll || isSummaryOnly || (startIdx + rowsPerPage >= validItems.length) || (pageNum >= totalPages - 1);

  // Exact row height from main.py
  const rowH = 60;

  // Calculate dynamic canvas height (Tightly cropped to match data, exactly like F:\SUMMARY)
  let H = 2000;
  if (isSummaryOnly) {
    const grpCount = validGroups.length;
    const adjCount = (data.adjustments || []).length;
    H = 450 + (grpCount * 60) + 200 + (grpCount > 0 ? 250 + (adjCount * 50) + 150 : 0);
  } else if (isEstimate) {
    const itemCount = itemsToDraw.length;
    const grpCount = validGroups.length;
    const adjCount = (data.adjustments || []).length;
    const hasSummarySection = isLastPage && grpCount > 0;
    H = 420 + (itemCount * 60) + 140 + (hasSummarySection ? 200 + (grpCount * 60) + 250 + (adjCount * 50) + 180 : 0);
  } else if (isLoadingSlip) {
    H = 380 + (itemsToDraw.length * 60) + 140;
  }
  H = Math.min(Math.max(H, 450), 30000);

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const scale = Math.max(dpr, 1);

  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.scale(scale, scale);

  // Pure White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 1. Header (Centered Bold Title, font size 60px)
  let title = 'ESTIMATE';
  const docUpper = (data.docType || 'Bill').toUpperCase();
  const pfx = docUpper.includes('ORDER') ? 'ORDER ' : docUpper.includes('RETURN') ? 'RETURN ' : '';
  if (isLoadingSlip) {
    title = `${pfx}LOADING SLIP`;
  } else if (isEstimate || isSummaryOnly) {
    title = `${pfx}ESTIMATE`;
  }

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, W / 2, 20); // Shifted 10px up as requested (was 30)

// ============================================================================
// Official Lucide Vector SVG Paths (100% Vector, Ultra-Crisp, Scaled from 24x24)
// ============================================================================

function renderLucideShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  strokeColor: string,
  drawCmds: (ctx: CanvasRenderingContext2D) => void,
  badgeFill?: string
) {
  ctx.save();
  ctx.translate(x, y);

  if (badgeFill) {
    ctx.fillStyle = badgeFill;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-3, -3, size + 6, size + 6, 6);
    } else {
      ctx.rect(-3, -3, size + 6, size + 6);
    }
    ctx.fill();
  }

  const scale = size / 24;
  ctx.scale(scale, scale);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  drawCmds(ctx);
  ctx.stroke();

  ctx.restore();
}

// 1. Slip / Bill No: Lucide FileText
function drawSlipIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 34, isColorful = true) {
  const strokeCol = isColorful ? '#2563eb' : '#000000';
  const badgeFill = isColorful ? '#eff6ff' : undefined;

  renderLucideShape(ctx, x, y, size, strokeCol, (c) => {
    // Sheet: M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z
    c.moveTo(14, 2);
    c.lineTo(6, 2);
    c.arcTo(4, 2, 4, 4, 2);
    c.lineTo(4, 20);
    c.arcTo(4, 22, 6, 22, 2);
    c.lineTo(18, 22);
    c.arcTo(20, 22, 20, 20, 2);
    c.lineTo(20, 8);
    c.closePath();

    // Corner fold flap: M14 2v6h6
    c.moveTo(14, 2);
    c.lineTo(14, 8);
    c.lineTo(20, 8);

    // Text lines: M16 13H8, M16 17H8, M10 9H8
    c.moveTo(8, 9);
    c.lineTo(10, 9);
    c.moveTo(8, 13);
    c.lineTo(16, 13);
    c.moveTo(8, 17);
    c.lineTo(16, 17);
  }, badgeFill);
}

// 2. Vehicle Type: Lucide Truck
function drawVehicleTypeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 34, isColorful = true) {
  const strokeCol = isColorful ? '#ea580c' : '#000000';
  const badgeFill = isColorful ? '#fff7ed' : undefined;

  renderLucideShape(ctx, x, y, size, strokeCol, (c) => {
    // Truck bed & roof: M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2
    c.moveTo(14, 18);
    c.lineTo(14, 6);
    c.arcTo(14, 4, 12, 4, 2);
    c.lineTo(4, 4);
    c.arcTo(2, 4, 2, 6, 2);
    c.lineTo(2, 17);
    c.arcTo(2, 18, 3, 18, 1);
    c.lineTo(5, 18);

    // Bottom center line: M15 18H9
    c.moveTo(9, 18);
    c.lineTo(15, 18);

    // Cabin front: M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14
    c.moveTo(19, 18);
    c.lineTo(21, 18);
    c.arcTo(22, 18, 22, 17, 1);
    c.lineTo(22, 13.35);
    c.lineTo(18.52, 9);
    c.lineTo(14, 9);

    // Wheels: circle cx="7" cy="18.5" r="2.5", circle cx="17" cy="18.5" r="2.5"
    c.moveTo(9.5, 18.5);
    c.arc(7, 18.5, 2.5, 0, Math.PI * 2);
    c.moveTo(19.5, 18.5);
    c.arc(17, 18.5, 2.5, 0, Math.PI * 2);
  }, badgeFill);
}

// 3. Vehicle No: Lucide Car
function drawVehicleNoIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 34, isColorful = true) {
  const strokeCol = isColorful ? '#0284c7' : '#000000';
  const badgeFill = isColorful ? '#f0f9ff' : undefined;

  renderLucideShape(ctx, x, y, size, strokeCol, (c) => {
    // Car body: M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2
    c.moveTo(19, 17);
    c.lineTo(21, 17);
    c.arcTo(22, 17, 22, 16, 1);
    c.lineTo(22, 13);
    c.arcTo(22, 11.5, 20.5, 11.1, 1.5);
    c.lineTo(16, 10);
    c.lineTo(13.8, 7.7);
    c.arcTo(13, 7, 12.2, 7, 1);
    c.lineTo(5, 7);
    c.arcTo(3.9, 7, 3.6, 7.9, 1);
    c.lineTo(2.2, 10.8);
    c.arcTo(2, 11.5, 2, 12, 1);
    c.lineTo(2, 16);
    c.arcTo(2, 17, 3, 17, 1);
    c.lineTo(5, 17);

    // Bottom center line: M9 17h6
    c.moveTo(9, 17);
    c.lineTo(15, 17);

    // Wheels: circle cx="7" cy="17" r="2", circle cx="17" cy="17" r="2"
    c.moveTo(9, 17);
    c.arc(7, 17, 2, 0, Math.PI * 2);
    c.moveTo(19, 17);
    c.arc(17, 17, 2, 0, Math.PI * 2);
  }, badgeFill);
}

// 4. Party Name: Lucide User
function drawPartyIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 34, isColorful = true) {
  const strokeCol = isColorful ? '#7c3aed' : '#000000';
  const badgeFill = isColorful ? '#ede9fe' : undefined;

  renderLucideShape(ctx, x, y, size, strokeCol, (c) => {
    // Shoulders: M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2
    c.moveTo(19, 21);
    c.lineTo(19, 19);
    c.arcTo(19, 15, 15, 15, 4);
    c.lineTo(9, 15);
    c.arcTo(5, 15, 5, 19, 4);
    c.lineTo(5, 21);

    // Head: circle cx="12" cy="7" r="4"
    c.moveTo(16, 7);
    c.arc(12, 7, 4, 0, Math.PI * 2);
  }, badgeFill);
}

// 5. Date: Lucide Calendar
function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 34, isColorful = true) {
  const strokeCol = isColorful ? '#dc2626' : '#000000';
  const badgeFill = isColorful ? '#fef2f2' : undefined;

  renderLucideShape(ctx, x, y, size, strokeCol, (c) => {
    // Binder pegs: M8 2v4, M16 2v4
    c.moveTo(8, 2);
    c.lineTo(8, 6);
    c.moveTo(16, 2);
    c.lineTo(16, 6);

    // Calendar body: rect x="3" y="4" width="18" height="18" rx="2"
    c.moveTo(5, 4);
    c.lineTo(19, 4);
    c.arcTo(21, 4, 21, 6, 2);
    c.lineTo(21, 20);
    c.arcTo(21, 22, 19, 22, 2);
    c.lineTo(5, 22);
    c.arcTo(3, 22, 3, 20, 2);
    c.lineTo(3, 6);
    c.arcTo(3, 4, 5, 4, 2);
    c.closePath();

    // Divider: M3 10h18
    c.moveTo(3, 10);
    c.lineTo(21, 10);
  }, badgeFill);
}

  const isColorful = data.isColorful !== false;

  // 2. Info Block (y = 130)
  ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
  ctx.textBaseline = 'middle'; // Center text baseline vertically with icon center
  let y = 130;
  const iconSize = 34;
  const iconGap = 12;
  const iconYOffset = Math.round(iconSize / 2); // 17: Exactly centers 34px icon with middle text baseline
  const rightX = margin + 1290; // Exactly matches right edge of 1290px table (1320)

  // Locked X position for right column: Upper Vehicle Icon & Lower Date Icon in exact same vertical line
  const rightIconX = rightX - 280;
  const rightTextX = rightIconX + iconSize + iconGap;
  const maxRightTextW = rightX - rightTextX;

  // ROW 1 (Upper 3: Slip No | Vehicle Type | Vehicle No)
  // 1. Slip No (Left)
  drawSlipIcon(ctx, margin, y - iconYOffset, iconSize, isColorful);
  ctx.textAlign = 'left';
  const formattedBillNo = formatBillNumber(data.billNo);
  ctx.fillText(formattedBillNo || '0001', margin + iconSize + iconGap, y);

  const rawVType = (data.vehicleType || '').trim();
  const vType = (rawVType.toUpperCase() === 'OWN VEHICLE') ? 'SELF' : rawVType;
  const vNo = (data.vehicleNo || '').trim();

  // 2 & 3. Vehicle Type & Vehicle No
  if (vType && vNo) {
    // Both present: Vehicle Type in center, Vehicle No locked on right
    const vTypeX = 520;
    drawVehicleTypeIcon(ctx, vTypeX, y - iconYOffset, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vType, vTypeX + iconSize + iconGap, y);

    drawVehicleNoIcon(ctx, rightIconX, y - iconYOffset, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vNo, rightTextX, y, maxRightTextW);
  } else if (vType) {
    drawVehicleTypeIcon(ctx, rightIconX, y - iconYOffset, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vType, rightTextX, y, maxRightTextW);
  } else if (vNo) {
    drawVehicleNoIcon(ctx, rightIconX, y - iconYOffset, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vNo, rightTextX, y, maxRightTextW);
  }

  // ROW 2 (Lower 2: Party Name | Date)
  y += 50;
  // 1. Party Name (Left)
  drawPartyIcon(ctx, margin, y - iconYOffset, iconSize, isColorful);
  ctx.textAlign = 'left';
  ctx.fillText(data.partyName || 'CASH SALE', margin + iconSize + iconGap, y, rightIconX - (margin + iconSize + iconGap) - 20);

  // 2. Date (Right - EXACT same column position as Upper Vehicle Icon)
  const dateStr = formatDisplayDate(data.date);
  drawCalendarIcon(ctx, rightIconX, y - iconYOffset, iconSize, isColorful);
  ctx.textAlign = 'left';
  ctx.fillText(dateStr, rightTextX, y, maxRightTextW);

  let curY = y + 70;

  // 3. Raw Items Table
  if (!isSummaryOnly) {
    const showPCode = Boolean(data.showPartyCode);
    const dynCols = Array.isArray(data.dynamicCols) ? data.dynamicCols : [];

    // Helper to parse feet size number for sorting
    const parseFeetSize = (labelOrField: string): number => {
      if (labelOrField === 'qty') return 10;
      const match = String(labelOrField).match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : 10;
    };

    // Unified size columns sorted descending (matching UI order: e.g. 12 FT -> 10 FT -> 9.5 FT)
    const sizeCols = [
      { field: 'qty', label: '(10 FT)', size: 10 },
      ...dynCols.map(dc => ({
        field: dc.field,
        label: dc.label || dc.field,
        size: parseFeetSize(dc.label || dc.field)
      }))
    ].sort((a, b) => b.size - a.size);

    // Calculate responsive column widths (Exactly match lower group table width = 1290px)
    const totalTableW = 1290;
    const srW = 70;
    const availW = totalTableW - srW;

    // Total numeric quantity columns = all size columns + uCap + lCap
    const numQtyCols = sizeCols.length + 2;

    let eachQtyW: number;
    let pCodeW: number;
    let nameW: number;

    if (showPCode) {
      // User rule: ITEM NAME and PARTY CODE must be EK BARABAR (equal)!
      // All other numeric columns must be EK BARABAR (eachQtyW)!
      // And ITEM NAME and PARTY CODE must be DOUBLE (2x) the size of each numeric column!
      const totalUnits = 4 + numQtyCols; // 2 (name) + 2 (party code) + numQtyCols
      eachQtyW = Math.floor(availW / totalUnits);
      pCodeW = eachQtyW * 2;
      nameW = availW - pCodeW - (numQtyCols * eachQtyW); // equals 2*eachQtyW + remainder
    } else {
      // When PARTY CODE is hidden:
      // ITEM NAME is 2 units, each numeric col is 1 unit (exact double 2x, NOT 4x!)
      const totalUnits = 2 + numQtyCols;
      eachQtyW = Math.floor(availW / totalUnits);
      pCodeW = 0;
      nameW = availW - (numQtyCols * eachQtyW); // equals 2*eachQtyW + remainder
    }

    const cols: Array<{ title: string; w: number; align: 'left' | 'center' | 'right'; field?: string }> = [
      { title: 'SR.', w: srW, align: 'center' },
      { title: 'ITEM NAME', w: nameW, align: 'left' }
    ];

    if (showPCode) {
      cols.push({ title: 'PARTY CODE', w: pCodeW, align: 'center', field: 'partyCode' });
    }

    sizeCols.forEach(sc => {
      cols.push({
        title: sc.label.toUpperCase(),
        w: eachQtyW,
        align: 'center',
        field: sc.field
      });
    });

    cols.push({ title: 'U CAP', w: eachQtyW, align: 'center', field: 'uCap' });
    cols.push({ title: 'L CAP', w: eachQtyW, align: 'center', field: 'lCap' });

    // Column Headers (Black Rect with White Centered Bold Text)
    let xHdr = margin;
    const hdrFontSize = (dynCols.length > 2 || showPCode) ? 24 : 30;
    ctx.font = `bold ${hdrFontSize}px "Segoe UI", Arial, sans-serif`;
    cols.forEach(col => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(xHdr, curY, col.w, rowH);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.title, xHdr + col.w / 2, curY + rowH / 2);
      xHdr += col.w;
    });
    curY += rowH;

    // Track column totals
    const colSums: Record<string, number> = { uCap: 0, lCap: 0 };
    sizeCols.forEach(sc => { colSums[sc.field] = 0; });

    // Build skip group lookup helper
    const skipEntries = data.skipGroupEntries || [];
    const getGroupLabel = (name: string): string | null => {
      if (!name || !skipEntries.length) return null;
      const lower = name.trim().toLowerCase();
      if (!lower) return null;
      const cleanLower = lower.replace(/[^a-z0-9]/g, '');
      for (const entry of skipEntries) {
        const pfx = (entry.prefix || '').trim().toLowerCase();
        const cleanPfx = pfx.replace(/[^a-z0-9]/g, '');
        if (pfx && (lower === pfx || lower.startsWith(pfx + ' ') || lower.startsWith(pfx + '-') || lower.startsWith(pfx + '/') || lower.startsWith(pfx) || (cleanPfx && cleanLower.startsWith(cleanPfx)))) {
          return entry.group;
        }
      }
      return null;
    };

    itemsToDraw.forEach((it, idx) => {
      const uVal = parseFloat(String(it.uCap)) || 0;
      const lVal = parseFloat(String(it.lCap)) || 0;
      colSums['uCap'] += uVal;
      colSums['lCap'] += lVal;

      const rawDesc = String(it.name || '');
      const cleanDesc = rawDesc.replace(/\./g, '').replace(/-/g, ' ');
      const grp = getGroupLabel(rawDesc) || getGroupLabel(cleanDesc);

      let descWithGroup = cleanDesc;
      if (grp && !cleanDesc.toLowerCase().includes(grp.toLowerCase())) {
        descWithGroup = `${cleanDesc} (${grp})`;
      }

      const rowData: string[] = [String(startIdx + idx + 1), descWithGroup];
      if (showPCode) {
        rowData.push(String(it.partyCode || ''));
      }

      sizeCols.forEach(sc => {
        const val = parseFloat(String((it as any)[sc.field])) || 0;
        colSums[sc.field] += val;
        rowData.push(val !== 0 ? String(val) : '');
      });

      rowData.push(uVal !== 0 ? String(uVal) : '');
      rowData.push(lVal !== 0 ? String(lVal) : '');

      let xRow = margin;
      const rowFullW = cols.reduce((acc, c) => acc + c.w, 0);
      if (isColorful) {
        ctx.fillStyle = '#96b6d7';
        ctx.fillRect(margin, curY, rowFullW, rowH);
      }
      rowData.forEach((val, i) => {
        const w = cols[i].w;

        // Draw 2px solid black border rect
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(xRow, curY, w, rowH);

        const align = i === 1 ? 'left' : 'center';
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';

        if (i === 1) {
          // Parse Note (e.g. "Fan Box (10 Ft)")
          const noteMatch = val.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
          if (noteMatch) {
            const baseText = noteMatch[1].trim();
            const noteText = `(${noteMatch[2].trim()})`;

            ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(baseText, xRow + 15, curY + rowH / 2);

            const baseW = ctx.measureText(baseText).width;
            ctx.font = 'italic 28px "Segoe UI", Arial, sans-serif';
            ctx.fillText(noteText, xRow + 15 + baseW + 8, curY + rowH / 2);
          } else {
            ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(val, xRow + 15, curY + rowH / 2);
          }
        } else {
          ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(val, xRow + w / 2, curY + rowH / 2);
        }

        xRow += w;
      });

      curY += rowH;
    });

    // Items Table Footer (Column Totals & Edit No under ITEM NAME column)
    if (!isSummaryOnly) {
      curY += 25;
      ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'middle';

      let xFooter = margin;
      cols.forEach((col, i) => {
        if (i === 0) {
          // 'TOTAL' text removed as requested
        } else if (i === 1) {
          if (data.editId) {
            ctx.textAlign = 'left';
            ctx.fillText(data.editId, xFooter + 15, curY + 20);
          }
        } else if (col.field && colSums[col.field] !== undefined) {
          ctx.textAlign = 'center';
          const sumVal = colSums[col.field];
          ctx.fillText(sumVal !== 0 ? String(sumVal) : '', xFooter + col.w / 2, curY + 20);
        }
        xFooter += col.w;
      });
      curY += 40;
    }
  }

  // 4. Group Summary / Estimate Totals (Estimate & Summary Only)
  if ((isEstimate || isSummaryOnly) && isLastPage && validGroups.length > 0) {
    curY += 30;

    // Header Label
    ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GROUP SUMMARY / ESTIMATE TOTALS', margin, curY);

    curY += 60;

    const groupCols = [
      { title: 'MOULD NAME', w: 520 },
      { title: 'QTY', w: 230 },
      { title: 'PRICE (₹)', w: 230 },
      { title: 'TOTAL (₹)', w: 310 }
    ];

    // Group Table Header (Black Rect, White Text)
    let xGHdr = margin;
    ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
    groupCols.forEach(col => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(xGHdr, curY, col.w, rowH);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.title, xGHdr + col.w / 2, curY + rowH / 2);
      xGHdr += col.w;
    });
    curY += rowH;

    // Group Rows
    validGroups.forEach(g => {
      let xGRow = margin;
      const groupFullW = groupCols.reduce((acc, c) => acc + c.w, 0);
      if (isColorful) {
        ctx.fillStyle = '#96b6d7';
        ctx.fillRect(margin, curY, groupFullW, rowH);
      }
      const qVal = parseFloat(String(g.qty)) || 0;
      const pVal = parseFloat(String(g.price)) || 0;
      const tVal = parseFloat(String(g.total)) || (qVal * pVal);
      const cleanMould = String(g.mould || '').replace(/\./g, '').replace(/-/g, ' ');

      const rowVals = [
        cleanMould,
        qVal > 0 ? String(qVal) : '',
        pVal > 0 ? `₹ ${pVal.toFixed(2)}` : '',
        tVal > 0 ? `₹ ${tVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''
      ];

      rowVals.forEach((val, i) => {
        const w = groupCols[i].w;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(xGRow, curY, w, rowH);

        ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';

        if (i === 0) {
          ctx.textAlign = 'left';
          ctx.fillText(val, xGRow + 20, curY + rowH / 2);
        } else if (i >= 2) {
          ctx.textAlign = 'right';
          ctx.fillText(val, xGRow + w - 20, curY + rowH / 2);
        } else {
          ctx.textAlign = 'center';
          ctx.fillText(val, xGRow + w / 2, curY + rowH / 2);
        }

        xGRow += w;
      });

      curY += rowH;
    });
  }

  // 5. Estimate & Summary Footer: SUB-TOTAL, Adjustments, BALANCE
  if ((isEstimate || isSummaryOnly) && isLastPage) {
    curY += 40;
    const tableRight = margin + 1290;
    const blockW = 700;
    const valW = 300;
    const xLabel = tableRight - blockW;
    const xValue = tableRight - valW;

    // Sub-Total
    ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUB-TOTAL', xLabel, curY + 30);

    ctx.textAlign = 'right';
    ctx.fillText(formatIndianCurrency(data.subTotal), xValue + valW, curY + 30);

    // Adjustments
    let runningTotal = data.subTotal;
    (data.adjustments || []).forEach(adj => {
      const v = Number(adj.val) || 0;
      const isRecv = isAdjustmentReceive(adj);
      if (isRecv) runningTotal -= v;
      else runningTotal += v;

      curY += 45;
      ctx.font = 'italic 30px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.fillText(`${isRecv ? '(-)' : '(+)'} ${adj.desc || 'Adjustment'}`, xLabel, curY + 25);

      ctx.textAlign = 'right';
      ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
      // Receive is Green (#16a34a), Pay is Red (#dc2626)
      ctx.fillStyle = isColorful ? (isRecv ? '#16a34a' : '#dc2626') : '#000000';
      ctx.fillText(formatIndianCurrency(v), xValue + valW, curY + 25);
      ctx.fillStyle = '#000000';
    });

    // Final Balance / Advance
    curY += 65;
    ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    const computedBal = data.finalBalance !== undefined ? data.finalBalance : runningTotal;
    const isAdvance = computedBal < 0;
    const rawLabel = (data.balanceLabel || '').trim();
    const bLabel = (rawLabel || (isAdvance ? 'ADVANCE' : 'BALANCE')).toUpperCase();
    ctx.fillText(bLabel, xLabel, curY + 40);

    ctx.textAlign = 'right';
    const displayAmt = isAdvance ? Math.abs(computedBal) : computedBal;
    ctx.fillText(formatIndianCurrency(displayAmt), xValue + valW, curY + 40);
  }

  ctx.restore();
  return canvas;
}

export async function copyBillCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve(true);
      } catch (err) {
        console.error('Clipboard write error:', err);
        resolve(false);
      }
    }, 'image/png');
  });
}

export function downloadBillCanvasAsImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
