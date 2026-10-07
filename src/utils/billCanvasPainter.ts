// Ultra-High-Speed Canvas Painter matching F:\SUMMARY\BillApp\main.py BillPainter 1:1
// Reproduces exact pixel-perfect layout of native Qt QPainter

import { formatBillNumber } from './billDocTypes';

export interface PrintAdjustment {
  id: string;
  type: 'add' | 'sub';
  desc: string;
  val: number;
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
  const rowsPerPage = Number(data.rowsPerPage) || 27;
  const totalPages = isSummaryOnly ? 1 : Math.max(1, Math.ceil(validItems.length / rowsPerPage));
  const startIdx = pageNum * rowsPerPage;
  const itemsToDraw = isSummaryOnly ? [] : validItems.slice(startIdx, startIdx + rowsPerPage);
  const isLastPage = isSummaryOnly || (startIdx + rowsPerPage >= validItems.length) || (pageNum >= totalPages - 1);

  // Exact row height from main.py
  const rowH = 60;

  // Calculate dynamic canvas height
  let H = 2000;
  if (isSummaryOnly) {
    H = 450 + (validGroups.length * 60) + 250 + ((data.adjustments || []).length * 50) + 200;
  } else if (isEstimate) {
    H = 450 + (itemsToDraw.length * 60) + 200 + (isLastPage ? (validGroups.length * 60) + 250 + ((data.adjustments || []).length * 50) + 200 : 0);
  } else if (isLoadingSlip) {
    H = Math.max(400 + (itemsToDraw.length * 60) + 200, 2000);
  }
  H = Math.min(Math.max(H, 1500), 30000);

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
  ctx.fillText(title, W / 2, 30);

// Crisp Canvas Vector Icon Helpers (Circle badge removed, 100% Vector, Colorful in Image Mode, Black in Direct Print)
function drawSlipIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 40, isColorful = true) {
  ctx.save();
  const strokeColor = isColorful ? '#2563eb' : '#000000';
  const fillColor = isColorful ? '#eff6ff' : '#ffffff';
  const foldColor = isColorful ? '#1d4ed8' : '#000000';
  const lineCol = isColorful ? '#3b82f6' : '#000000';

  const w = size * 0.72;
  const h = size * 0.88;
  const startX = x + (size - w) / 2;
  const startY = y + (size - h) / 2;
  const fold = 7;

  // Paper body
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + w - fold, startY);
  ctx.lineTo(startX + w, startY + fold);
  ctx.lineTo(startX + w, startY + h);
  ctx.lineTo(startX, startY + h);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Paper folded corner
  ctx.beginPath();
  ctx.moveTo(startX + w - fold, startY);
  ctx.lineTo(startX + w - fold, startY + fold);
  ctx.lineTo(startX + w, startY + fold);
  ctx.strokeStyle = foldColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Content lines
  ctx.strokeStyle = lineCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX + 5, startY + 12);
  ctx.lineTo(startX + w - 5, startY + 12);
  ctx.moveTo(startX + 5, startY + 19);
  ctx.lineTo(startX + w - 5, startY + 19);
  ctx.moveTo(startX + 5, startY + 26);
  ctx.lineTo(startX + w - 9, startY + 26);
  ctx.stroke();

  ctx.restore();
}

function drawVehicleTypeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 40, isColorful = true) {
  ctx.save();
  const truckColor = isColorful ? '#ea580c' : '#000000';
  const cabFill = isColorful ? '#fff7ed' : '#ffffff';
  const windowColor = isColorful ? '#0284c7' : '#000000';
  const wheelColor = isColorful ? '#1f2937' : '#000000';

  const w = size * 0.9;
  const startX = x + (size - w) / 2;
  const topY = y + 8;

  // Truck outline
  ctx.beginPath();
  ctx.moveTo(startX, topY);
  ctx.lineTo(startX + w * 0.62, topY);
  ctx.lineTo(startX + w * 0.85, topY + 7);
  ctx.lineTo(startX + w, topY + 7);
  ctx.lineTo(startX + w, topY + 19);
  ctx.lineTo(startX, topY + 19);
  ctx.closePath();
  ctx.fillStyle = cabFill;
  ctx.fill();
  ctx.strokeStyle = truckColor;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Window divider / window
  ctx.beginPath();
  ctx.moveTo(startX + w * 0.62, topY);
  ctx.lineTo(startX + w * 0.62, topY + 9);
  ctx.lineTo(startX + w * 0.82, topY + 9);
  ctx.strokeStyle = windowColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wheels
  ctx.fillStyle = wheelColor;
  ctx.beginPath();
  ctx.arc(startX + w * 0.25, topY + 20, 3.6, 0, Math.PI * 2);
  ctx.arc(startX + w * 0.75, topY + 20, 3.6, 0, Math.PI * 2);
  ctx.fill();

  if (isColorful) {
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(startX + w * 0.25, topY + 20, 1.2, 0, Math.PI * 2);
    ctx.arc(startX + w * 0.75, topY + 20, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawVehicleNoIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 40, isColorful = true) {
  ctx.save();
  const plateColor = isColorful ? '#0284c7' : '#000000';
  const plateFill = isColorful ? '#f0f9ff' : '#ffffff';
  const boltColor = isColorful ? '#0369a1' : '#000000';

  const w = size * 0.9;
  const h = size * 0.58;
  const startX = x + (size - w) / 2;
  const startY = y + (size - h) / 2;

  // Number plate border
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(startX, startY, w, h, 4);
  } else {
    ctx.rect(startX, startY, w, h);
  }
  ctx.fillStyle = plateFill;
  ctx.fill();
  ctx.strokeStyle = plateColor;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Corner bolts
  ctx.fillStyle = boltColor;
  ctx.beginPath();
  ctx.arc(startX + 4, startY + h / 2, 1.6, 0, Math.PI * 2);
  ctx.arc(startX + w - 4, startY + h / 2, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Plate center bar
  ctx.beginPath();
  ctx.moveTo(startX + 9, startY + h / 2);
  ctx.lineTo(startX + w - 9, startY + h / 2);
  ctx.strokeStyle = plateColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawPartyIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 40, isColorful = true) {
  ctx.save();
  const dpBorder = isColorful ? '#7c3aed' : '#000000';
  const dpBg = isColorful ? '#ede9fe' : '#ffffff';
  const silhouetteCol = isColorful ? '#7c3aed' : '#000000';

  const w = size * 0.88;
  const h = size * 0.88;
  const startX = x + (size - w) / 2;
  const startY = y + (size - h) / 2;
  const rad = 8;

  // 1. Draw DP Squircle Frame
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(startX, startY, w, h, rad);
  } else {
    ctx.rect(startX, startY, w, h);
  }
  ctx.fillStyle = dpBg;
  ctx.fill();
  ctx.strokeStyle = dpBorder;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 2. Clip inside DP to draw clean head & shoulders silhouette
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(startX, startY, w, h, rad);
  } else {
    ctx.rect(startX, startY, w, h);
  }
  ctx.clip();

  const cx = startX + w / 2;

  // Head Circle
  ctx.fillStyle = silhouetteCol;
  ctx.beginPath();
  ctx.arc(cx, startY + h * 0.38, w * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Torso / Shoulders
  ctx.beginPath();
  ctx.arc(cx, startY + h + 2, w * 0.44, Math.PI, 0, false);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 40, isColorful = true) {
  ctx.save();
  const mainColor = isColorful ? '#dc2626' : '#000000';
  const headerFill = isColorful ? '#dc2626' : '#000000';
  const bodyFill = isColorful ? '#fef2f2' : '#ffffff';
  const ringColor = isColorful ? '#991b1b' : '#000000';

  const w = size * 0.78;
  const h = size * 0.78;
  const startX = x + (size - w) / 2;
  const startY = y + (size - h) / 2 + 1;

  // Calendar body
  ctx.fillStyle = bodyFill;
  ctx.fillRect(startX, startY, w, h);
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(startX, startY, w, h);

  // Top header bar
  ctx.fillStyle = headerFill;
  ctx.fillRect(startX, startY, w, 7);

  // Binder rings
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX + 6, startY - 3);
  ctx.lineTo(startX + 6, startY + 3);
  ctx.moveTo(startX + w - 6, startY - 3);
  ctx.lineTo(startX + w - 6, startY + 3);
  ctx.stroke();

  // Calendar grid dots / marks
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(startX + w * 0.35, startY + 14, 1.8, 0, Math.PI * 2);
  ctx.arc(startX + w * 0.65, startY + 14, 1.8, 0, Math.PI * 2);
  ctx.arc(startX + w * 0.35, startY + 21, 1.8, 0, Math.PI * 2);
  ctx.arc(startX + w * 0.65, startY + 21, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

  const isColorful = data.isColorful !== false;

  // 2. Info Block (y = 130)
  ctx.font = 'bold 35px "Segoe UI", Arial, sans-serif';
  let y = 130;
  const iconSize = 40;
  const iconGap = 12;
  const rightX = margin + 1290; // Exactly matches right edge of 1290px table (1320)

  // Locked X position for right column: Upper Vehicle Icon & Lower Date Icon in exact same vertical line
  const rightIconX = rightX - 280;
  const rightTextX = rightIconX + iconSize + iconGap;
  const maxRightTextW = rightX - rightTextX;

  // ROW 1 (Upper 3: Slip No | Vehicle Type | Vehicle No)
  // 1. Slip No (Left)
  drawSlipIcon(ctx, margin, y - 2, iconSize, isColorful);
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
    drawVehicleTypeIcon(ctx, vTypeX, y - 2, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vType, vTypeX + iconSize + iconGap, y);

    drawVehicleNoIcon(ctx, rightIconX, y - 2, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vNo, rightTextX, y, maxRightTextW);
  } else if (vType) {
    drawVehicleTypeIcon(ctx, rightIconX, y - 2, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vType, rightTextX, y, maxRightTextW);
  } else if (vNo) {
    drawVehicleNoIcon(ctx, rightIconX, y - 2, iconSize, isColorful);
    ctx.textAlign = 'left';
    ctx.fillText(vNo, rightTextX, y, maxRightTextW);
  }

  // ROW 2 (Lower 2: Party Name | Date)
  y += 50;
  // 1. Party Name (Left)
  drawPartyIcon(ctx, margin, y - 2, iconSize, isColorful);
  ctx.textAlign = 'left';
  ctx.fillText(data.partyName || 'CASH SALE', margin + iconSize + iconGap, y, rightIconX - (margin + iconSize + iconGap) - 20);

  // 2. Date (Right - EXACT same column position as Upper Vehicle Icon)
  const dateStr = formatDisplayDate(data.date);
  drawCalendarIcon(ctx, rightIconX, y - 2, iconSize, isColorful);
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
      { title: 'PRICE', w: 230 },
      { title: 'TOTAL', w: 310 }
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
        pVal.toFixed(2),
        tVal.toFixed(2)
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
      const isSub = adj.type === 'sub';
      if (isSub) runningTotal -= v;
      else runningTotal += v;

      curY += 45;
      ctx.font = 'italic 30px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.fillText(`${isSub ? '(-)' : '(+)'} ${adj.desc || 'Adjustment'}`, xLabel, curY + 25);

      ctx.textAlign = 'right';
      ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = isColorful ? (isSub ? '#dc2626' : '#16a34a') : '#000000';
      ctx.fillText(formatIndianCurrency(v), xValue + valW, curY + 25);
      ctx.fillStyle = '#000000';
    });

    // Final Balance
    curY += 65;
    ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    const bLabel = (data.balanceLabel || 'BALANCE').toUpperCase();
    ctx.fillText(bLabel, xLabel, curY + 40);

    ctx.textAlign = 'right';
    ctx.fillText(formatIndianCurrency(data.finalBalance || runningTotal), xValue + valW, curY + 40);
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
