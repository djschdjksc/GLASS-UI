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
  const W = 1200;
  const margin = 40;
  const contentW = W - 2 * margin;

  const isEstimate = data.mode === 'estimate';
  const isSummaryOnly = data.mode === 'summary_only';
  const isLoadingSlip = data.mode === 'loading_slip';

  const validItems = (data.items || []).filter(it => (it.name || '').trim() || Number(it.qty) > 0);
  const validGroups = (data.groups || []).filter(g => (g.mould || '').trim() || Number(g.qty) > 0 || Number(g.total) > 0);

  // Dynamic Height calculation
  let h = 30; // top padding
  h += 140; // Header & Bill Info block

  const rowH = 46;
  if (!isSummaryOnly) {
    h += rowH; // Raw Items table header
    h += Math.max(validItems.length, 1) * rowH; // Raw Items rows
    if (isLoadingSlip) {
      h += rowH + 20; // Column totals footer
    }
  }

  if (isEstimate || isSummaryOnly) {
    if (validGroups.length > 0) {
      h += 60; // Group Summary title
      h += rowH; // Group table header
      h += validGroups.length * rowH; // Group rows
    }
    h += 50; // Subtotal gap
    h += (data.adjustments || []).length * 44; // Adjustments
    h += 90; // Final Balance
  }

  h += 60; // bottom margin

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const scale = Math.max(dpr, 2); // 2x for sharp rendering and crisp copy to clipboard

  canvas.width = W * scale;
  canvas.height = h * scale;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Pure White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, h);

  let curY = 35;

  // Title
  let title = 'ESTIMATE';
  const docUpper = (data.docType || 'Bill').toUpperCase();
  if (isLoadingSlip) {
    title = docUpper.includes('ORDER') ? 'ORDER LOADING SLIP' : docUpper.includes('RETURN') ? 'RETURN LOADING SLIP' : 'LOADING SLIP';
  } else if (isEstimate || isSummaryOnly) {
    title = docUpper.includes('ORDER') ? 'ORDER ESTIMATE' : docUpper.includes('RETURN') ? 'RETURN ESTIMATE' : 'ESTIMATE';
  }

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, W / 2, curY + 20);

  curY += 60;

  // Bill Info Line
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  const slipPrefix = isLoadingSlip ? 'SLIP NO:' : 'BILL NO:';
  ctx.fillText(`${slipPrefix} ${data.billNo || '0001'}`, margin, curY);

  ctx.textAlign = 'right';
  ctx.fillText(`DATE: ${formatDisplayDate(data.date)}`, W - margin, curY);

  curY += 32;

  // Party Name Line
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.fillText(`PARTY: ${data.partyName || 'CASH SALE'}`, margin, curY);

  if (data.vehicleNo && data.vehicleNo.trim()) {
    ctx.textAlign = 'right';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText(`VEHICLE: ${data.vehicleNo}`, W - margin, curY);
  }

  curY += 28;

  // Horizontal divider line
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, curY);
  ctx.lineTo(W - margin, curY);
  ctx.stroke();

  curY += 15;

  // Helper for drawing cell borders
  const drawCell = (x: number, y: number, w: number, hVal: number, bg?: string) => {
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, hVal);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, hVal);
  };

  // 2. RAW ITEMS TABLE (Omitted if Summary Only)
  if (!isSummaryOnly) {
    const showPCode = Boolean(data.showPartyCode);
    let cols: Array<{ title: string; w: number; align: 'left' | 'center' | 'right' }>;

    if (showPCode) {
      cols = [
        { title: 'SR.', w: 70, align: 'center' },
        { title: 'ITEM NAME', w: 410, align: 'left' },
        { title: 'PARTY CODE', w: 240, align: 'center' },
        { title: 'QTY', w: 130, align: 'center' },
        { title: 'U CAP', w: 135, align: 'center' },
        { title: 'L CAP', w: 135, align: 'center' }
      ];
    } else {
      cols = [
        { title: 'SR.', w: 70, align: 'center' },
        { title: 'ITEM NAME', w: 570, align: 'left' },
        { title: 'QTY', w: 160, align: 'center' },
        { title: 'U CAP', w: 160, align: 'center' },
        { title: 'L CAP', w: 160, align: 'center' }
      ];
    }

    // Draw Header
    let colX = margin;
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
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

    const itemsToDraw = validItems.length > 0 ? validItems : [{ name: 'NO ITEMS', qty: '', uCap: '', lCap: '' }];

    itemsToDraw.forEach((item, idx) => {
      const qNum = Number(item.qty) || 0;
      const uNum = Number(item.uCap) || 0;
      const lNum = Number(item.lCap) || 0;
      totalQty += qNum;
      totalUCap += uNum;
      totalLCap += lNum;

      colX = margin;
      const rowValues = showPCode
        ? [
            String(idx + 1),
            String(item.name || '').replace(/\./g, '').replace(/-/g, ' '),
            String(item.partyCode || ''),
            qNum > 0 ? String(qNum) : '',
            uNum > 0 ? String(uNum) : '',
            lNum > 0 ? String(lNum) : ''
          ]
        : [
            String(idx + 1),
            String(item.name || '').replace(/\./g, '').replace(/-/g, ' '),
            qNum > 0 ? String(qNum) : '',
            uNum > 0 ? String(uNum) : '',
            lNum > 0 ? String(lNum) : ''
          ];

      // Zebra / pure white
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      rowValues.forEach((val, i) => {
        const col = cols[i];
        drawCell(colX, curY, col.w, rowH, rowBg);

        ctx.fillStyle = '#000000';
        ctx.font = i === 1 ? '600 15px "Segoe UI", sans-serif' : 'bold 15px "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';

        if (col.align === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(val, colX + 14, curY + rowH / 2);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(val, colX + col.w - 14, curY + rowH / 2);
        } else {
          ctx.textAlign = 'center';
          ctx.fillText(val, colX + col.w / 2, curY + rowH / 2);
        }

        colX += col.w;
      });

      curY += rowH;
    });

    // If Loading Slip: Draw Column Totals under QTY, U CAP, L CAP
    if (isLoadingSlip) {
      curY += 8;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#000000';

      let sumX = margin;
      const srW = cols[0].w;
      const nameW = cols[1].w;
      const pCodeW = showPCode ? cols[2].w : 0;
      const qtyW = showPCode ? cols[3].w : cols[2].w;
      const uCapW = showPCode ? cols[4].w : cols[3].w;
      const lCapW = showPCode ? cols[5].w : cols[4].w;

      sumX += srW + nameW + pCodeW;

      ctx.textAlign = 'center';
      ctx.fillText(String(totalQty), sumX + qtyW / 2, curY + 20);
      ctx.fillText(String(totalUCap), sumX + qtyW + uCapW / 2, curY + 20);
      ctx.fillText(String(totalLCap), sumX + qtyW + uCapW + lCapW / 2, curY + 20);

      curY += 40;
    }
  }

  // 3. GROUP SUMMARY / ESTIMATE TOTALS (Estimate & Summary Only)
  if ((isEstimate || isSummaryOnly) && validGroups.length > 0) {
    curY += 20;

    // Header Label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GROUP SUMMARY / ESTIMATE TOTALS', margin, curY + 10);

    curY += 30;

    const groupCols: Array<{ title: string; w: number; align: 'left' | 'center' | 'right' }> = [
      { title: 'MOULD NAME', w: 500, align: 'left' },
      { title: 'QTY', w: 180, align: 'center' },
      { title: 'PRICE', w: 200, align: 'right' },
      { title: 'TOTAL', w: 240, align: 'right' }
    ];

    // Table Header
    let colX = margin;
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    groupCols.forEach(col => {
      drawCell(colX, curY, col.w, rowH, '#000000');
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.title, colX + col.w / 2, curY + rowH / 2);
      colX += col.w;
    });

    curY += rowH;

    // Group Data Rows
    validGroups.forEach((g, idx) => {
      colX = margin;
      const qVal = Number(g.qty) || 0;
      const pVal = Number(g.price) || 0;
      const tVal = Number(g.total) || qVal * pVal;

      const rowVals = [
        String(g.mould || '').replace(/\./g, '').replace(/-/g, ' '),
        qVal > 0 ? String(qVal) : '',
        pVal > 0 ? `₹ ${pVal.toFixed(2)}` : '₹ 0.00',
        `₹ ${tVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];

      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      rowVals.forEach((val, i) => {
        const col = groupCols[i];
        drawCell(colX, curY, col.w, rowH, rowBg);

        ctx.fillStyle = '#000000';
        ctx.font = i === 0 ? '600 15px "Segoe UI", sans-serif' : 'bold 15px "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';

        if (col.align === 'left') {
          ctx.textAlign = 'left';
          ctx.fillText(val, colX + 14, curY + rowH / 2);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(val, colX + col.w - 14, curY + rowH / 2);
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
    curY += 24;

    const blockW = 600;
    const xLabel = W - margin - blockW;
    const xVal = W - margin;

    // Sub-Total
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUB-TOTAL', xLabel, curY + 10);

    ctx.textAlign = 'right';
    ctx.fillText(formatIndianCurrency(data.subTotal), xVal, curY + 10);

    curY += 34;

    // Dynamic Adjustments (+/-)
    const adjs = data.adjustments || [];
    adjs.forEach(adj => {
      const prefix = adj.type === 'sub' ? '(-) ' : '(+) ';
      ctx.font = 'italic 17px "Segoe UI", sans-serif';
      ctx.fillStyle = adj.type === 'sub' ? '#B91C1C' : '#047857';

      ctx.textAlign = 'left';
      ctx.fillText(`${prefix}${adj.desc || 'Adjustment'}`, xLabel, curY + 8);

      ctx.textAlign = 'right';
      ctx.fillText(formatIndianCurrency(adj.val || 0), xVal, curY + 8);

      curY += 30;
    });

    curY += 15;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xLabel, curY);
    ctx.lineTo(xVal, curY);
    ctx.stroke();

    curY += 20;

    // Final Balance with Custom Label
    const bLabel = (data.balanceLabel || 'BALANCE').toUpperCase();
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(bLabel, xLabel, curY + 15);

    ctx.textAlign = 'right';
    ctx.fillText(formatIndianCurrency(data.finalBalance), xVal, curY + 15);

    curY += 40;
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
