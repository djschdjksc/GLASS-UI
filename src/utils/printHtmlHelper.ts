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
    const q = isActual ? (Number(it.qty) || 0) : 0;
    const u = isActual ? (Number(it.uCap) || 0) : 0;
    const l = isActual ? (Number(it.lCap) || 0) : 0;
    const cleanName = isActual ? (it.name || '').replace(/\./g, '').replace(/-/g, ' ') : '';
    const pCode = isActual ? (it.partyCode || '') : '';

    return `
      <tr style="height: 31px;">
        <td style="text-align: center; font-weight: 700; width: 50px;">${isActual ? idx + 1 : ''}</td>
        <td style="text-align: left; font-weight: 700; padding-left: 10px; font-size: 14.5px;">${cleanName}</td>
        ${showPCode ? `<td style="text-align: center; font-weight: 700; width: 130px;">${pCode}</td>` : ''}
        <td style="text-align: center; font-weight: 800; font-size: 15px; width: 90px;">${q > 0 ? q : ''}</td>
        <td style="text-align: center; font-weight: 800; font-size: 15px; width: 90px;">${u > 0 ? u : ''}</td>
        <td style="text-align: center; font-weight: 800; font-size: 15px; width: 90px;">${l > 0 ? l : ''}</td>
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
    const color = adj.type === 'sub' ? '#b91c1c' : '#047857';
    return `
      <div style="display: flex; justify-content: space-between; font-style: italic; font-size: 15px; font-weight: 700; color: ${color}; margin-bottom: 4px;">
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
            font-size: 15px;
            font-weight: 800;
            margin-bottom: 6px;
            color: #000000;
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
          <span>${slipPrefix} ${data.billNo || '0001'}</span>
          <span>DATE: ${formatDisplayDate(data.date)}</span>
        </div>

        <div class="meta-row" style="font-size: 16px;">
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
                <th style="width: 90px;">QTY</th>
                <th style="width: 90px;">U CAP</th>
                <th style="width: 90px;">L CAP</th>
              </tr>
            </thead>
            <tbody>
              ${rawRowsHtml}
              ${isLoadingSlip ? `
                <tr class="total-row" style="height: 36px;">
                  <td colspan="${showPCode ? 3 : 2}" style="text-align: right; font-size: 15px; font-weight: 900; padding-right: 14px; letter-spacing: 0.5px;">TOTAL</td>
                  <td style="text-align: center; font-size: 16px; font-weight: 900; color: #1d4ed8;">${totalQty > 0 ? totalQty : ''}</td>
                  <td style="text-align: center; font-size: 16px; font-weight: 900; color: #1d4ed8;">${totalUCap > 0 ? totalUCap : ''}</td>
                  <td style="text-align: center; font-size: 16px; font-weight: 900; color: #1d4ed8;">${totalLCap > 0 ? totalLCap : ''}</td>
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
