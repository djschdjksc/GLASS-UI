// Ultra-High-Speed Canvas Painter matching F:\SUMMARY\BillApp\main.py BillPainter
// Renders pixel-perfect Bill / Estimate / Loading Slip in 2-5ms!

export interface PrintAdjustment {
  id: string;
  type: 'add' | 'sub';
  desc: string;
  val: number;
}

export interface BillPrintPayload {
  docType: string; // "Bill", "Order", "Sale Return", "PURCHASE"
  billNo: string | number;
  date: string;
  partyName: string;
  vehicleNo?: string;
  vehicleType?: string;
  showPartyCode?: boolean;
  mode: 'estimate' | 'summary_only' | 'loading_slip';
  items: Array<{
    name: string;
    partyCode?: string;
    qty: number | string;
    uCap?: number | string;
    lCap?: number | string;
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
}

export function formatIndianCurrency(num: number): string {
  try {
    const isNegative = num < 0;
    const absVal = Math.abs(num);
    const parts = absVal.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    if (integerPart.length > 3) {
      const lastThree = integerPart.substring(integerPart.length - 3);
      const otherNumbers = integerPart.substring(0, integerPart.length - 3);
      integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    return (isNegative ? '-' : '') + '₹ ' + integerPart + '.' + decimalPart;
  } catch {
    return '₹ ' + num.toFixed(2);
  }
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function renderBillToCanvas(data: BillPrintPayload, targetCanvas?: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = targetCanvas || document.createElement('canvas');
  // Matching F:\SUMMARY\BillApp\main.py exact dimensions: self.W = 1414, self.margin = 30
  const W = 1414;
  const margin = 30;
  const contentW = W - 2 * margin;

  const isEstimate = data.mode === 'estimate';
  const isSummaryOnly = data.mode === 'summary_only';
  const isLoadingSlip = data.mode === 'loading_slip';

  const validItems = (data.items || []).filter(it => (it.name || '').trim() || Number(it.qty) > 0);
  const validGroups = (data.groups || []).filter(g => (g.mould || '').trim() || Number(g.qty) > 0 || Number(g.total) > 0);

  // Exactly 27 rows for Loading Slip (matching F:\SUMMARY\BillApp\main.py rows_per_page = 27)
  const FIXED_ROWS = 27;
  const itemsToDraw: Array<{ name: string; partyCode?: string; qty: number | string; uCap?: number | string; lCap?: number | string }> = [...validItems];
  if (isLoadingSlip && itemsToDraw.length < FIXED_ROWS) {
    while (itemsToDraw.length < FIXED_ROWS) {
      itemsToDraw.push({ name: '', qty: '', uCap: '', lCap: '', partyCode: '' });
    }
  }

  // Row height 56px matching desktop software
  const rowH = 56;

  // Dynamic Height calculation
  let h = 30; // top padding
  h += 170; // Header & Bill Info block

  if (!isSummaryOnly) {
    h += rowH; // Raw Items table header
    const rowsCount = isLoadingSlip ? FIXED_ROWS : Math.max(itemsToDraw.length, 1);
    h += rowsCount * rowH; // Raw Items rows
    if (isLoadingSlip) {
      h += rowH + 20; // Column totals row
    }
  }

  if (isEstimate || isSummaryOnly) {
    if (validGroups.length > 0) {
      h += 70; // Group Summary title
      h += rowH; // Group table header
      h += validGroups.length * rowH; // Group rows
    }
    h += 60; // Subtotal gap
    h += (data.adjustments || []).length * 52; // Adjustments
    h += 110; // Final Balance
  }

  h += 60; // bottom margin

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const scale = Math.max(dpr, 1.5);

  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(h * scale);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Pure White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, h);

  let curY = 30;

  // Title (Centered Bold 52px Segoe UI)
  let title = 'ESTIMATE';
  const docUpper = (data.docType || 'Bill').toUpperCase();
  if (isLoadingSlip) {
    title = docUpper.includes('ORDER') ? 'ORDER LOADING SLIP' : docUpper.includes('RETURN') ? 'RETURN LOADING SLIP' : 'LOADING SLIP';
  } else if (isEstimate || isSummaryOnly) {
    title = docUpper.includes('ORDER') ? 'ORDER ESTIMATE' : docUpper.includes('RETURN') ? 'RETURN ESTIMATE' : 'ESTIMATE';
  }

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, W / 2, curY + 25);

  curY += 75;

  // Bill Info Line (Slip No Left, Date Right, 32px Bold)
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  const slipPrefix = isLoadingSlip ? 'SLIP NO:' : 'BILL NO:';
  ctx.fillText(`${slipPrefix} ${data.billNo || '0001'}`, margin, curY);

  ctx.textAlign = 'right';
  ctx.fillText(`DATE: ${formatDisplayDate(data.date)}`, W - margin, curY);

  curY += 44;

  // Party Name Line (34px Bold)
  ctx.textAlign = 'left';
  ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`PARTY: ${data.partyName || 'CASH SALE'}`, margin, curY);

  if (data.vehicleNo && data.vehicleNo.trim()) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`VEHICLE: ${data.vehicleNo}`, W - margin, curY);
  }

  curY += 36;

  // Horizontal divider line (2.5px solid black)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(margin, curY);
  ctx.lineTo(W - margin, curY);
  ctx.stroke();

  curY += 18;

  // Helper for drawing cell borders (solid 2.5px black)
  const drawCell = (x: number, y: number, w: number, hVal: number, bg?: string) => {
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, hVal);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, hVal);
  };

  // 2. RAW ITEMS TABLE (Omitted if Summary Only)
  if (!isSummaryOnly) {
    const showPCode = Boolean(data.showPartyCode);
    let cols: Array<{ title: string; w: number; align: 'left' | 'center' | 'right' }>;

    if (showPCode) {
      cols = [
        { title: 'SR.', w: 90, align: 'center' },
        { title: 'ITEM NAME', w: 464, align: 'left' },
        { title: 'PARTY CODE', w: 260, align: 'center' },
        { title: 'QTY', w: 180, align: 'center' },
        { title: 'U CAP', w: 180, align: 'center' },
        { title: 'L CAP', w: 180, align: 'center' }
      ];
    } else {
      cols = [
        { title: 'SR.', w: 94, align: 'center' },
        { title: 'ITEM NAME', w: 660, align: 'left' },
        { title: 'QTY', w: 200, align: 'center' },
        { title: 'U CAP', w: 200, align: 'center' },
        { title: 'L CAP', w: 200, align: 'center' }
      ];
    }

    // Draw Header (Solid Black BG / White Bold Text)
    let colX = margin;
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    cols.forEach(col => {
      drawCell(colX, curY, col.w, rowH, '#000000');
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.title, colX + col.w / 2, curY + rowH / 2);
      colX += col.w;
    });

    curY += rowH;

    // Draw Data Rows
    let totalQty = 0;
    let totalUCap = 0;
    let totalLCap = 0;

    itemsToDraw.forEach((item, idx) => {
      const isActual = idx < validItems.length;
      const qNum = isActual ? (Number(item.qty) || 0) : 0;
      const uNum = isActual ? (Number(item.uCap) || 0) : 0;
      const lNum = isActual ? (Number(item.lCap) || 0) : 0;
      if (isActual) {
        totalQty += qNum;
        totalUCap += uNum;
        totalLCap += lNum;
      }

      colX = margin;
      const rowValues = showPCode
        ? [
            isActual ? String(idx + 1) : '',
            isActual ? String(item.name || '').replace(/\./g, '').replace(/-/g, ' ') : '',
            isActual ? String(item.partyCode || '') : '',
            qNum > 0 ? String(qNum) : '',
            uNum > 0 ? String(uNum) : '',
            lNum > 0 ? String(lNum) : ''
          ]
        : [
            isActual ? String(idx + 1) : '',
            isActual ? String(item.name || '').replace(/\./g, '').replace(/-/g, ' ') : '',
            qNum > 0 ? String(qNum) : '',
            uNum > 0 ? String(uNum) : '',
            lNum > 0 ? String(lNum) : ''
          ];

      rowValues.forEach((val, i) => {
        const col = cols[i];
        drawCell(colX, curY, col.w, rowH, '#FFFFFF');

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.textBaseline = 'middle';

        if (col.align === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(val, colX + 16, curY + rowH / 2);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(val, colX + col.w - 16, curY + rowH / 2);
        } else {
          ctx.textAlign = 'center';
          ctx.fillText(val, colX + col.w / 2, curY + rowH / 2);
        }

        colX += col.w;
      });

      curY += rowH;
    });

    // If Loading Slip: Draw Column Totals directly under QTY, U CAP, L CAP (NO string labels!)
    if (isLoadingSlip) {
      let sumX = margin;
      const srW = cols[0].w;
      const nameW = cols[1].w;
      const pCodeW = showPCode ? cols[2].w : 0;
      const labelW = srW + nameW + pCodeW;
      const qtyW = showPCode ? cols[3].w : cols[2].w;
      const uCapW = showPCode ? cols[4].w : cols[3].w;
      const lCapW = showPCode ? cols[5].w : cols[4].w;

      // Label Cell "TOTAL"
      drawCell(sumX, curY, labelW, rowH, '#FFFFFF');
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOTAL', sumX + labelW - 20, curY + rowH / 2);
      sumX += labelW;

      // QTY Total Cell (Pure number)
      drawCell(sumX, curY, qtyW, rowH, '#FFFFFF');
      ctx.fillStyle = '#1D4ED8';
      ctx.textAlign = 'center';
      ctx.fillText(totalQty > 0 ? String(totalQty) : '', sumX + qtyW / 2, curY + rowH / 2);
      sumX += qtyW;

      // U CAP Total Cell (Pure number)
      drawCell(sumX, curY, uCapW, rowH, '#FFFFFF');
      ctx.fillStyle = '#1D4ED8';
      ctx.textAlign = 'center';
      ctx.fillText(totalUCap > 0 ? String(totalUCap) : '', sumX + uCapW / 2, curY + rowH / 2);
      sumX += uCapW;

      // L CAP Total Cell (Pure number)
      drawCell(sumX, curY, lCapW, rowH, '#FFFFFF');
      ctx.fillStyle = '#1D4ED8';
      ctx.textAlign = 'center';
      ctx.fillText(totalLCap > 0 ? String(totalLCap) : '', sumX + lCapW / 2, curY + rowH / 2);

      curY += rowH + 20;
    }
  }

  // 3. GROUP SUMMARY / ESTIMATE TOTALS (Estimate & Summary Only)
  if ((isEstimate || isSummaryOnly) && validGroups.length > 0) {
    curY += 20;

    // Header Label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GROUP SUMMARY / ESTIMATE TOTALS', margin, curY + 15);

    curY += 45;

    const groupCols: Array<{ title: string; w: number; align: 'left' | 'center' | 'right' }> = [
      { title: 'MOULD NAME', w: 614, align: 'left' },
      { title: 'QTY', w: 220, align: 'center' },
      { title: 'PRICE', w: 240, align: 'right' },
      { title: 'TOTAL', w: 280, align: 'right' }
    ];

    // Table Header
    let colX = margin;
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    groupCols.forEach(col => {
      drawCell(colX, curY, col.w, rowH, '#000000');
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.title, colX + col.w / 2, curY + rowH / 2);
      colX += col.w;
    });

    curY += rowH;

    // Data Rows
    validGroups.forEach((g) => {
      colX = margin;
      const qNum = Number(g.qty) || 0;
      const pNum = Number(g.price) || 0;
      const tNum = Number(g.total) || qNum * pNum;
      const cleanMould = String(g.mould || '').replace(/\./g, '').replace(/-/g, ' ');

      const rowVals = [
        cleanMould,
        qNum > 0 ? String(qNum) : '',
        `₹ ${pNum.toFixed(2)}`,
        `₹ ${tNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];

      rowVals.forEach((val, i) => {
        const col = groupCols[i];
        drawCell(colX, curY, col.w, rowH, '#FFFFFF');

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.textBaseline = 'middle';

        if (col.align === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(val, colX + 16, curY + rowH / 2);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(val, colX + col.w - 16, curY + rowH / 2);
        } else {
          ctx.textAlign = 'center';
          ctx.fillText(val, colX + col.w / 2, curY + rowH / 2);
        }

        colX += col.w;
      });

      curY += rowH;
    });
  }

  // 4. FOOTER: SUB-TOTAL, ADJUSTMENTS & FINAL BALANCE
  if (isEstimate || isSummaryOnly) {
    curY += 30;

    const blockW = 700;
    const xLabel = W - margin - blockW;
    const xVal = W - margin;

    // Sub-Total
    ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUB-TOTAL', xLabel, curY + 15);

    ctx.textAlign = 'right';
    ctx.fillText(formatIndianCurrency(data.subTotal), xVal, curY + 15);

    curY += 45;

    // Dynamic Adjustments (+/-)
    const adjs = data.adjustments || [];
    adjs.forEach(adj => {
      const prefix = adj.type === 'sub' ? '(-) ' : '(+) ';
      ctx.font = 'italic bold 26px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = adj.type === 'sub' ? '#B91C1C' : '#047857';

      ctx.textAlign = 'left';
      ctx.fillText(`${prefix}${adj.desc || 'Adjustment'}`, xLabel, curY + 12);

      ctx.textAlign = 'right';
      ctx.fillText(formatIndianCurrency(adj.val || 0), xVal, curY + 12);

      curY += 42;
    });

    curY += 15;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xLabel, curY);
    ctx.lineTo(xVal, curY);
    ctx.stroke();

    curY += 25;

    // Final Balance with Custom Label
    const bLabel = (data.balanceLabel || 'BALANCE').toUpperCase();
    ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(bLabel, xLabel, curY + 20);

    ctx.textAlign = 'right';
    ctx.fillText(formatIndianCurrency(data.finalBalance), xVal, curY + 20);

    curY += 50;
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
