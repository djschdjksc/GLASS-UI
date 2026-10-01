// Ultra-High-Speed Canvas Painter matching F:\SUMMARY\BillApp\main.py BillPainter 1:1
// Reproduces exact pixel-perfect layout of native Qt QPainter

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
  /** Skip group lookup — passed to Python native print server for inline group labels */
  skipGroupEntries?: Array<{ prefix: string; group: string }>;
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
  const rowsPerPage = isLoadingSlip ? 27 : 20;
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

  // 2. Info Block (y = 130)
  ctx.font = 'normal 35px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  let y = 130;

  const billLabel = isLoadingSlip ? `${pfx}SLIP NO:` : (pfx ? `${pfx}NO:` : 'BILL NO:');
  const editIdTag = data.editId ? ` [${data.editId}]` : '';
  ctx.fillText(`${billLabel} ${data.billNo || 'N/A'}${editIdTag}`, margin, y);

  ctx.textAlign = 'right';
  ctx.fillText(`DATE: ${formatDisplayDate(data.date)}`, W - 400, y);

  y += 50;
  ctx.textAlign = 'left';
  ctx.fillText(`PARTY: ${data.partyName || 'N/A'}`, margin, y);

  if (data.vehicleNo && data.vehicleNo.trim()) {
    ctx.textAlign = 'right';
    ctx.fillText(`VEHICLE: ${data.vehicleNo.trim()}`, W - 400, y);
  }

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

    itemsToDraw.forEach((it, idx) => {
      const uVal = parseFloat(String(it.uCap)) || 0;
      const lVal = parseFloat(String(it.lCap)) || 0;
      colSums['uCap'] += uVal;
      colSums['lCap'] += lVal;

      const rawDesc = String(it.name || '');
      const cleanDesc = rawDesc.replace(/\./g, '').replace(/-/g, ' ');

      const rowData: string[] = [String(startIdx + idx + 1), cleanDesc];
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

    // Loading Slip Footer (Pure Numbers under Columns matching main.py)
    if (isLoadingSlip && !isEstimate) {
      curY += 25;
      ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let xFooter = margin;
      cols.forEach((col, i) => {
        if (col.field && colSums[col.field] !== undefined) {
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
      ctx.fillText(`${isSub ? '(-)' : '(+)'} ${adj.desc || 'Adjustment'}`, xLabel, curY + 25);

      ctx.textAlign = 'right';
      ctx.fillText(formatIndianCurrency(v), xValue + valW, curY + 25);
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
