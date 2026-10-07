import type { BillPrintPayload } from './billCanvasPainter';
import { formatIndianCurrency, formatDisplayDate } from './billCanvasPainter';
import { getCachedSkipItems } from '../services/db/sqliteDb';
import { formatBillNumber } from './billDocTypes';

// Build itemPrefix → mainGroup map from SQLite cache (same logic as LeftGrid)
function buildPrintSkipMap(): Map<string, string> {
  try {
    const raw: any[] = getCachedSkipItems();
    const map = new Map<string, string>();
    raw.forEach((it: any) => {
      const pfx = (it.itemPrefix || it.item_prefix || '').trim().toLowerCase();
      const mg = (it.mainGroup || it.main_group || '').trim();
      if (pfx && mg) {
        map.set(pfx, mg);
      }
    });
    return map;
  } catch {
    return new Map();
  }
}

function getPrintGroupLabel(name: string, map: Map<string, string>): string | null {
  if (!name || map.size === 0) return null;
  const lower = name.trim().toLowerCase();
  if (!lower) return null;
  if (map.has(lower)) return map.get(lower)!;
  const cleanLower = lower.replace(/[^a-z0-9]/g, '');
  let bestMatch: string | null = null;
  let bestLen = 0;
  map.forEach((group, prefix) => {
    const p = prefix.trim().toLowerCase();
    const cleanP = p.replace(/[^a-z0-9]/g, '');
    if ((lower === p || lower.startsWith(p + ' ') || lower.startsWith(p + '-') || lower.startsWith(p + '/') || lower.startsWith(p) || (cleanP && cleanLower.startsWith(cleanP))) && p.length > bestLen) {
      bestLen = p.length;
      bestMatch = group;
    }
  });
  return bestMatch;
}

export function directPrintBill(data: BillPrintPayload): void {
  const isEstimate = data.mode === 'estimate';
  const isSummaryOnly = data.mode === 'summary_only';
  const isLoadingSlip = data.mode === 'loading_slip';

  const validItems = (data.items || []).filter(it => (it.name || '').trim() || Number(it.qty) > 0);
  const validGroups = (data.groups || []).filter(g => (g.mould || '').trim() || Number(g.qty) > 0 || Number(g.total) > 0);

  const docUpper = (data.docType || 'Bill').toUpperCase();
  let title = 'ESTIMATE';
  if (isLoadingSlip) {
    title = docUpper.includes('ORDER') ? 'ORDER LOADING SLIP' : docUpper.includes('RETURN') ? 'RETURN LOADING SLIP' : 'LOADING SLIP';
  } else if (isEstimate || isSummaryOnly) {
    title = docUpper.includes('ORDER') ? 'ORDER ESTIMATE' : docUpper.includes('RETURN') ? 'RETURN ESTIMATE' : 'ESTIMATE';
  }

  const showPCode = Boolean(data.showPartyCode);
  const slipPrefix = isLoadingSlip ? 'SLIP NO:' : 'BILL NO:';

  const dynCols = Array.isArray(data.dynamicCols) ? data.dynamicCols : [];
  const parseFeetSize = (labelOrField: string): number => {
    if (labelOrField === 'qty') return 10;
    const match = String(labelOrField).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 10;
  };

  const sizeCols = [
    { field: 'qty', label: '(10 FT)', size: 10 },
    ...dynCols.map(dc => ({
      field: dc.field,
      label: dc.label || dc.field,
      size: parseFeetSize(dc.label || dc.field)
    }))
  ].sort((a, b) => b.size - a.size);

  const colSums: Record<string, number> = { uCap: 0, lCap: 0 };
  sizeCols.forEach(sc => { colSums[sc.field] = 0; });

  validItems.forEach(it => {
    colSums.uCap += Number(it.uCap) || 0;
    colSums.lCap += Number(it.lCap) || 0;
    sizeCols.forEach(sc => {
      colSums[sc.field] += Number((it as any)[sc.field]) || 0;
    });
  });

  // Build skip group map for print badges
  const skipMap = buildPrintSkipMap();

  // Exactly 27 rows per page for Loading Slip (matching F:\SUMMARY\BillApp\main.py rows_per_page = 27)
  const FIXED_ROWS = 27;
  const itemsToRender = [...validItems];
  if (isLoadingSlip && itemsToRender.length < FIXED_ROWS) {
    while (itemsToRender.length < FIXED_ROWS) {
      itemsToRender.push({ name: '', qty: '', uCap: '', lCap: '', partyCode: '' });
    }
  }

  const rawRowsHtml = itemsToRender.map((it, idx) => {
    const isActual = idx < validItems.length;
    const u = isActual ? (Number(it.uCap) || 0) : 0;
    const l = isActual ? (Number(it.lCap) || 0) : 0;
    const cleanName = isActual ? (it.name || '').replace(/\./g, '').replace(/-/g, ' ') : '';
    const pCode = isActual ? (it.partyCode || '') : '';
    const groupLabel = isActual ? (getPrintGroupLabel(it.name, skipMap) || getPrintGroupLabel(cleanName, skipMap)) : null;

    // Group badge HTML for print — simple inline pill, print-safe solid colors
    const groupBadgeHtml = groupLabel
      ? `<span style="
          display:inline-block;
          vertical-align:middle;
          margin-left:7px;
          font-size:10px;
          font-weight:600;
          font-family:system-ui,-apple-system,sans-serif;
          color:#1a5fa8;
          background:#ddeeff;
          border:1px solid #99c2ee;
          border-radius:4px;
          padding:1px 6px;
          line-height:1.4;
          letter-spacing:0;
          white-space:nowrap;
        ">${groupLabel}</span>`
      : '';

    return `
      <tr style="height: 31px;">
        <td style="text-align: center; font-weight: 700; width: 50px;">${isActual ? idx + 1 : ''}</td>
        <td style="text-align: left; font-weight: 700; padding-left: 10px; font-size: 14.5px;">${cleanName}${groupBadgeHtml}</td>
        ${showPCode ? `<td style="text-align: center; font-weight: 700; width: 130px;">${pCode}</td>` : ''}
        ${sizeCols.map(sc => {
          const val = isActual ? (Number((it as any)[sc.field]) || 0) : 0;
          return `<td style="text-align: center; font-weight: 800; font-size: 15px; width: 80px;">${val > 0 ? val : ''}</td>`;
        }).join('')}
        <td style="text-align: center; font-weight: 800; font-size: 15px; width: 80px;">${u > 0 ? u : ''}</td>
        <td style="text-align: center; font-weight: 800; font-size: 15px; width: 80px;">${l > 0 ? l : ''}</td>
      </tr>
    `;
  }).join('');


  const groupRowsHtml = validGroups.map(g => {
    const q = Number(g.qty) || 0;
    const p = Number(g.price) || 0;
    const t = Number(g.total) || q * p;
    const cleanMould = (g.mould || '').replace(/\./g, '').replace(/-/g, ' ');
    return `
      <tr style="height: 34px;">
        <td style="text-align: left; font-weight: 700; padding-left: 10px; font-size: 14.5px;">${cleanMould}</td>
        <td style="text-align: center; font-weight: 800; font-size: 15px;">${q > 0 ? q : ''}</td>
        <td style="text-align: right; font-weight: 700; font-size: 14.5px; padding-right: 10px;">₹ ${p.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 800; font-size: 15px; padding-right: 10px;">₹ ${t.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const adjustmentsHtml = (data.adjustments || []).map(adj => {
    const prefix = adj.type === 'sub' ? '(-) ' : '(+) ';
    const valColor = adj.type === 'sub' ? '#dc2626' : '#16a34a';
    return `
      <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 4px;">
        <span style="color: #000000; font-style: italic; font-weight: 600;">${prefix}${adj.desc || 'Adjustment'}</span>
        <span style="color: ${valColor}; font-weight: 800; font-size: 16px;">${formatIndianCurrency(adj.val || 0)}</span>
      </div>
    `;
  }).join('');

  const formattedBillNo = formatBillNumber(data.billNo);
  const rawVType = (data.vehicleType || '').trim();
  const vType = (rawVType.toUpperCase() === 'OWN VEHICLE') ? 'SELF' : rawVType;
  const vNo = (data.vehicleNo || '').trim();
  let vehicleStr = '';
  if (vType && vNo) {
    if (vType.toLowerCase().includes(vNo.toLowerCase())) {
      vehicleStr = vType;
    } else if (vNo.toLowerCase().includes(vType.toLowerCase())) {
      vehicleStr = vNo;
    } else {
      vehicleStr = `${vType} - ${vNo}`;
    }
  } else if (vType) {
    vehicleStr = vType;
  } else if (vNo) {
    vehicleStr = vNo;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>&nbsp;</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
            color: #000000;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.25;
            padding: 8mm 12mm;
            -webkit-font-smoothing: antialiased;
          }
          .title-header {
            text-align: center;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 0.8px;
            margin-bottom: 12px;
            text-transform: uppercase;
            color: #000000;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            font-size: 15px;
            font-weight: 800;
            margin-bottom: 6px;
            color: #000000;
          }
          .meta-item-left {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex: 1 1 auto;
            min-width: 0;
            word-break: break-word;
          }
          .meta-item-center {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex: 0 0 auto;
            margin: 0 auto;
            white-space: nowrap;
          }
          .meta-item-right {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex: 0 0 auto;
            margin-left: auto;
            white-space: nowrap;
            text-align: right;
          }
          .meta-icon-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            border: 1.5px solid #000000;
            background: #eaf3fc;
            flex-shrink: 0;
            margin-right: 6px;
          }
          .meta-icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            stroke: #000000;
            display: inline-block;
          }
          .divider {
            border-bottom: 2.5px solid #000000;
            margin: 6px 0 10px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th {
            background-color: #000000 !important;
            color: #ffffff !important;
            font-weight: 800;
            font-size: 14.5px;
            padding: 7px 6px;
            text-align: center;
            border: 2px solid #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          td {
            padding: 4px 6px;
            border: 2px solid #000000 !important;
            font-size: 14px;
            color: #000000;
          }
          .total-row td {
            border: 2px solid #000000 !important;
            background: #ffffff !important;
            font-weight: 900 !important;
          }
          .footer-box {
            margin-left: auto;
            width: 420px;
            margin-top: 14px;
          }
          .subtotal-row {
            display: flex;
            justify-content: space-between;
            font-size: 17px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          .balance-line {
            border-top: 2.5px solid #000000;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 22px;
            font-weight: 900;
          }
        </style>
      </head>
      <body>
        <div class="title-header">${title}</div>

        <div class="meta-row">
          <div class="meta-item-left">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </span>
            <span>${formattedBillNo || '0001'}</span>
          </div>

          ${vType && vNo ? `
          <div class="meta-item-center">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </span>
            <span>${vType}</span>
          </div>
          <div class="meta-item-right">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <circle cx="5" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </span>
            <span>${vNo}</span>
          </div>
          ` : vType ? `
          <div class="meta-item-right">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </span>
            <span>${vType}</span>
          </div>
          ` : vNo ? `
          <div class="meta-item-right">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <circle cx="5" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </span>
            <span>${vNo}</span>
          </div>
          ` : ''}
        </div>

        <div class="meta-row" style="font-size: 16px;">
          <div class="meta-item-left">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="10" r="3.2"></circle>
                <path d="M6.5 19.5c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5"></path>
              </svg>
            </span>
            <span>${data.partyName || 'CASH SALE'}</span>
          </div>
          <div class="meta-item-right">
            <span class="meta-icon-badge">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            <span>${formatDisplayDate(data.date)}</span>
          </div>
        </div>

        <div class="divider"></div>

        ${!isSummaryOnly ? `
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">SR.</th>
                <th>ITEM NAME</th>
                ${showPCode ? '<th style="width: 130px;">PARTY CODE</th>' : ''}
                ${sizeCols.map(sc => `<th style="width: 80px;">${sc.label}</th>`).join('')}
                <th style="width: 80px;">U CAP</th>
                <th style="width: 80px;">L CAP</th>
              </tr>
            </thead>
            <tbody>
              ${rawRowsHtml}
              ${!isSummaryOnly ? `
                <tr class="total-row" style="height: 36px;">
                  <td style="text-align: center; font-weight: 800; font-size: 13px;">TOTAL</td>
                  <td style="text-align: left; font-weight: 800; font-size: 14px; padding-left: 10px;">${data.editId || ''}</td>
                  ${showPCode ? '<td></td>' : ''}
                  ${sizeCols.map(sc => {
                    const sum = colSums[sc.field] || 0;
                    return `<td style="text-align: center; font-size: 16px; font-weight: 900; color: #1d4ed8;">${sum > 0 ? sum : ''}</td>`;
                  }).join('')}
                  <td style="text-align: center; font-size: 16px; font-weight: 900; color: #1d4ed8;">${colSums.uCap > 0 ? colSums.uCap : ''}</td>
                  <td style="text-align: center; font-size: 16px; font-weight: 900; color: #1d4ed8;">${colSums.lCap > 0 ? colSums.lCap : ''}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        ` : ''}

        ${(isEstimate || isSummaryOnly) && validGroups.length > 0 ? `
          <div style="font-weight: 800; font-size: 16px; margin: 12px 0 6px 0; color: #000000;">GROUP SUMMARY / ESTIMATE TOTALS</div>
          <table>
            <thead>
              <tr>
                <th>MOULD NAME</th>
                <th style="width: 100px;">QTY</th>
                <th style="width: 130px;">PRICE</th>
                <th style="width: 150px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${groupRowsHtml}
            </tbody>
          </table>
        ` : ''}

        ${isEstimate || isSummaryOnly ? `
          <div class="footer-box">
            <div class="subtotal-row">
              <span>SUB-TOTAL</span>
              <span>${formatIndianCurrency(data.subTotal)}</span>
            </div>
            ${adjustmentsHtml}
            <div class="balance-line">
              <span>${(data.balanceLabel || 'BALANCE').toUpperCase()}</span>
              <span>${formatIndianCurrency(data.finalBalance)}</span>
            </div>
          </div>
        ` : ''}
      </body>
    </html>
  `;

  // Create isolated invisible iframe for instant print
  let printFrame = document.getElementById('high-speed-print-frame') as HTMLIFrameElement | null;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'high-speed-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    // Trigger instant print as soon as rendered
    setTimeout(() => {
      try {
        printFrame?.contentWindow?.focus();
        printFrame?.contentWindow?.print();
      } catch (err) {
        console.error('Direct print error:', err);
      }
    }, 60);
  }
}
