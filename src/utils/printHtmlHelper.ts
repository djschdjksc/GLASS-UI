import type { BillPrintPayload } from './billCanvasPainter';
import { formatIndianCurrency, formatDisplayDate } from './billCanvasPainter';

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

  let totalQty = 0;
  let totalUCap = 0;
  let totalLCap = 0;

  validItems.forEach(it => {
    totalQty += Number(it.qty) || 0;
    totalUCap += Number(it.uCap) || 0;
    totalLCap += Number(it.lCap) || 0;
  });

  const rawRowsHtml = validItems.map((it, idx) => {
    const q = Number(it.qty) || 0;
    const u = Number(it.uCap) || 0;
    const l = Number(it.lCap) || 0;
    const cleanName = (it.name || '').replace(/\./g, '').replace(/-/g, ' ');
    if (showPCode) {
      return `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="text-align: left; font-weight: 600; padding-left: 10px;">${cleanName}</td>
          <td style="text-align: center;">${it.partyCode || ''}</td>
          <td style="text-align: center; font-weight: 700;">${q > 0 ? q : ''}</td>
          <td style="text-align: center; font-weight: 700;">${u > 0 ? u : ''}</td>
          <td style="text-align: center; font-weight: 700;">${l > 0 ? l : ''}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="text-align: left; font-weight: 600; padding-left: 10px;">${cleanName}</td>
          <td style="text-align: center; font-weight: 700;">${q > 0 ? q : ''}</td>
          <td style="text-align: center; font-weight: 700;">${u > 0 ? u : ''}</td>
          <td style="text-align: center; font-weight: 700;">${l > 0 ? l : ''}</td>
        </tr>
      `;
    }
  }).join('');

  const groupRowsHtml = validGroups.map(g => {
    const q = Number(g.qty) || 0;
    const p = Number(g.price) || 0;
    const t = Number(g.total) || q * p;
    const cleanMould = (g.mould || '').replace(/\./g, '').replace(/-/g, ' ');
    return `
      <tr>
        <td style="text-align: left; font-weight: 600; padding-left: 10px;">${cleanMould}</td>
        <td style="text-align: center; font-weight: 700;">${q > 0 ? q : ''}</td>
        <td style="text-align: right; padding-right: 10px;">₹ ${p.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700; padding-right: 10px;">₹ ${t.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const adjustmentsHtml = (data.adjustments || []).map(adj => {
    const prefix = adj.type === 'sub' ? '(-) ' : '(+) ';
    const color = adj.type === 'sub' ? '#b91c1c' : '#047857';
    return `
      <div style="display: flex; justify-content: space-between; font-style: italic; font-size: 14px; color: ${color}; margin-bottom: 4px;">
        <span>${prefix}${adj.desc || 'Adjustment'}</span>
        <span>${formatIndianCurrency(adj.val || 0)}</span>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - ${data.billNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #000000;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.3;
          }
          .title-header {
            text-align: center;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .divider {
            border-bottom: 2px solid #000000;
            margin: 8px 0 14px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          th {
            background-color: #000000 !important;
            color: #ffffff !important;
            font-weight: 700;
            font-size: 13px;
            padding: 7px 6px;
            text-align: center;
            border: 1.5px solid #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            padding: 6px 8px;
            border: 1.5px solid #000000;
            font-size: 12.5px;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .totals-bar {
            display: flex;
            justify-content: flex-end;
            margin-top: 6px;
            margin-bottom: 12px;
            font-size: 15px;
            font-weight: 700;
            gap: 40px;
            padding-right: 15px;
          }
          .footer-box {
            margin-left: auto;
            width: 380px;
            margin-top: 14px;
          }
          .subtotal-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .balance-line {
            border-top: 2px solid #000000;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 20px;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <div class="title-header">${title}</div>

        <div class="meta-row">
          <span>${slipPrefix} ${data.billNo || '0001'}</span>
          <span>DATE: ${formatDisplayDate(data.date)}</span>
        </div>

        <div class="meta-row" style="font-size: 15px;">
          <span>PARTY: ${data.partyName || 'CASH SALE'}</span>
          ${data.vehicleNo ? `<span>VEHICLE: ${data.vehicleNo}</span>` : ''}
        </div>

        <div class="divider"></div>

        ${!isSummaryOnly ? `
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">SR.</th>
                <th>ITEM NAME</th>
                ${showPCode ? '<th style="width: 130px;">PARTY CODE</th>' : ''}
                <th style="width: 85px;">QTY</th>
                <th style="width: 85px;">U CAP</th>
                <th style="width: 85px;">L CAP</th>
              </tr>
            </thead>
            <tbody>
              ${rawRowsHtml}
            </tbody>
          </table>
          ${isLoadingSlip ? `
            <div class="totals-bar">
              <span>QTY: <strong>${totalQty}</strong></span>
              <span>U CAP: <strong>${totalUCap}</strong></span>
              <span>L CAP: <strong>${totalLCap}</strong></span>
            </div>
          ` : ''}
        ` : ''}

        ${(isEstimate || isSummaryOnly) && validGroups.length > 0 ? `
          <div style="font-weight: 700; font-size: 15px; margin: 12px 0 6px 0;">GROUP SUMMARY / ESTIMATE TOTALS</div>
          <table>
            <thead>
              <tr>
                <th>MOULD NAME</th>
                <th style="width: 90px;">QTY</th>
                <th style="width: 120px;">PRICE</th>
                <th style="width: 140px;">TOTAL</th>
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
    }, 50);
  }
}
