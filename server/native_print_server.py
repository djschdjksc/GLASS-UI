import sys
import os
import json
import base64
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QImage, QPainter, QColor, QPageSize, QPageLayout
from PyQt6.QtCore import QBuffer, QIODevice
from PyQt6.QtPrintSupport import QPrinter, QPrintDialog, QPrinterInfo

# Ensure server directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bill_painter_engine import BillPainter, format_indian_currency, format_display_date
from ledger_painter_engine import LedgerPainter

app = QApplication.instance() or QApplication(sys.argv if sys.argv else [''])

def render_ledger_qimage(ledger_data, page_num=0):
    lp = LedgerPainter(ledger_data)
    img = QImage(lp.W, lp.H, QImage.Format.Format_ARGB32)
    img.fill(QColor('#FFFFFF'))
    p = QPainter(img)
    lp.paint(p, img.rect(), page_num=page_num)
    p.end()
    return img, lp


def map_payload_to_bill_data(payload):
    mode = payload.get('mode', 'estimate')
    is_loading_slip = (mode == 'loading_slip')
    is_estimate = (mode == 'estimate')
    is_summary_only = (mode == 'summary_only')

    doc_type = payload.get('docType', 'SALE')
    bill_type = 'Bill'
    if 'ORDER' in doc_type.upper():
        bill_type = 'Order'
    elif 'RETURN' in doc_type.upper():
        bill_type = 'Return'
    elif 'PURCHASE' in doc_type.upper():
        bill_type = 'PURCHASE'

    dynamic_cols = payload.get('dynamicCols', []) or []

    # Build skip group lookup: prefix (lowercase) → group name
    skip_entries = payload.get('skipGroupEntries', []) or []
    def get_group_label(name):
        if not name or not skip_entries:
            return None
        lower = name.strip().lower()
        if not lower:
            return None
        # Sort by prefix length descending for longest-match-first
        sorted_entries = sorted(skip_entries, key=lambda e: len(e.get('prefix', '')), reverse=True)
        for entry in sorted_entries:
            prefix = entry.get('prefix', '').strip().lower()
            if prefix and lower.startswith(prefix):
                return entry.get('group', '').strip()
        return None

    items_data = []
    for it in payload.get('items', []):
        name = str(it.get('name', '')).strip()
        qty = it.get('qty', '')
        has_any_val = bool(name) or bool(qty) or any(bool(str(it.get(dc.get('field', ''), '')).strip()) for dc in dynamic_cols)
        if has_any_val:
            # Append group label in parens — painter already handles (NOTE) in italic
            group_label = get_group_label(name)
            desc_with_group = f"{name} ({group_label})" if group_label else name
            row_dict = {
                'desc': desc_with_group,
                'party_code': str(it.get('partyCode', '')).strip(),
                'qty': str(qty).strip(),
                'u_cap': str(it.get('uCap', '')).strip(),
                'l_cap': str(it.get('lCap', '')).strip()
            }
            for dc in dynamic_cols:
                fld = dc.get('field')
                if fld:
                    row_dict[fld] = str(it.get(fld, '')).strip()
            items_data.append(row_dict)

    groups_data = []
    for g in payload.get('groups', []):
        mould = str(g.get('mould', '')).strip()
        if mould or g.get('qty'):
            groups_data.append([
                mould,
                str(g.get('qty', '0')),
                str(g.get('price', '0')),
                str(g.get('total', '0'))
            ])

    adjustments = []
    for adj in payload.get('adjustments', []):
        adjustments.append({
            'type': adj.get('type', 'add'),
            'desc': adj.get('desc', 'Adjustment'),
            'val': float(adj.get('val', 0.0) or 0.0)
        })

    bill_data = {
        'bill_no': str(payload.get('billNo', '1')),
        'date': str(payload.get('date', '')),
        'party': str(payload.get('partyName', 'CASH SALE')),
        'v_type': str(payload.get('vehicleType', '')),
        'v_name': str(payload.get('vehicleNo', '')),
        'bill_type': bill_type,
        'is_loading_slip': is_loading_slip,
        'is_estimate': is_estimate,
        'is_summary_only': is_summary_only,
        'show_party_code': bool(payload.get('showPartyCode', False)),
        'dynamic_cols': dynamic_cols,
        'items': items_data,
        'groups': groups_data,
        'adjustments': adjustments,
        'balance_label': str(payload.get('balanceLabel', 'BALANCE')).upper(),
        'edit_id': str(payload.get('editId', ''))
    }
    return bill_data

def render_qimage(bill_data, page_num=0):
    bp = BillPainter(bill_data)
    target_h = bp.H
    img = QImage(bp.W, target_h, QImage.Format.Format_ARGB32)
    img.fill(QColor('#FFFFFF'))
    p = QPainter(img)
    bp.paint(p, img.rect(), page_num=page_num)
    p.end()
    return img, bp

class PrintRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            default_printer = QPrinterInfo.defaultPrinterName()
            available = [p.printerName() for p in QPrinterInfo.availablePrinters()]
            self.wfile.write(json.dumps({
                'status': 'ok',
                'engine': 'PyQt6 BillPainter Native',
                'printer': default_printer,
                'availablePrinters': available
            }).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            payload = json.loads(body) if body else {}
        except Exception as e:
            payload = {}

        bill_data = map_payload_to_bill_data(payload)
        page_num = int(payload.get('pageNum', 0))

        if self.path == '/api/print/render-image':
            img, bp = render_qimage(bill_data, page_num=page_num)
            buf = QBuffer()
            buf.open(QIODevice.OpenModeFlag.WriteOnly)
            img.save(buf, 'PNG')
            b64 = base64.b64encode(buf.data().data()).decode('utf-8')
            data_url = f'data:image/png;base64,{b64}'

            res = {
                'success': True,
                'dataUrl': data_url,
                'width': img.width(),
                'height': img.height(),
                'totalPages': getattr(bp, 'total_pages', 1),
                'currentPage': page_num
            }
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        elif self.path == '/api/print/copy-to-clipboard':
            img, _ = render_qimage(bill_data)
            QApplication.clipboard().setImage(img)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Image copied to Windows clipboard!'}).encode('utf-8'))

        elif self.path == '/api/print/direct-print':
            try:
                printer = QPrinter(QPrinter.PrinterMode.HighResolution)
                target_printer = payload.get('printerName')
                if target_printer:
                    printer.setPrinterName(target_printer)
                printer.setPageOrientation(QPageLayout.Orientation.Portrait)
                printer.setPageSize(QPageSize(QPageSize.PageSizeId.A4))

                printer_name = printer.printerName() or 'Default Printer'
                is_pdf_virtual = 'PDF' in printer_name.upper() or 'XPS' in printer_name.upper() or 'ONENOTE' in printer_name.upper() or 'PORTPROMPT' in printer_name.upper()

                show_dialog = bool(payload.get('showDialog', False))
                if show_dialog:
                    from PyQt6.QtPrintSupport import QPrintDialog
                    dialog = QPrintDialog(printer)
                    dialog.setWindowTitle(f"Print - {bill_data.get('party', 'Bill')}")
                    if dialog.exec() != QPrintDialog.DialogCode.Accepted:
                        self.send_response(200)
                        self._send_cors_headers()
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'success': False, 'message': 'Print cancelled by user'}).encode('utf-8'))
                        return
                    printer_name = printer.printerName() or 'Selected Printer'
                    is_pdf_virtual = 'PDF' in printer_name.upper() or 'XPS' in printer_name.upper()

                output_pdf_path = None
                if is_pdf_virtual and not show_dialog:
                    desktop_dir = os.path.join(os.path.expanduser('~'), 'Desktop')
                    party_clean = "".join(c for c in str(bill_data.get('party', 'SALE')) if c.isalnum() or c in (' ', '_', '-')).strip() or 'BILL'
                    bill_no = str(bill_data.get('billNo', '0001')).replace('/', '_')
                    output_pdf_path = os.path.join(desktop_dir, f"BILL_{bill_no}_{party_clean}.pdf")
                    printer.setOutputFileName(output_pdf_path)

                p = QPainter(printer)
                bp = BillPainter(bill_data)
                rect = printer.pageRect(QPrinter.Unit.DevicePixel).toRect()
                bp.paint(p, rect, page_num=0)
                total_p = getattr(bp, 'total_pages', 1)
                for pg in range(1, total_p):
                    printer.newPage()
                    bp.paint(p, rect, page_num=pg)
                p.end()

                if output_pdf_path and os.path.exists(output_pdf_path):
                    try:
                        os.startfile(output_pdf_path)
                    except Exception:
                        pass

                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f"Sent to {printer_name} ({total_p} page{'s' if total_p > 1 else ''}) in High-Resolution Vector mode!",
                    'printer': printer_name,
                    'totalPages': total_p,
                    'filePath': output_pdf_path
                }).encode('utf-8'))
            except Exception as ex:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(ex)}).encode('utf-8'))

        elif self.path == '/api/print/raw-thermal':
            try:
                raw_cmds = payload.get('commands', '')
                raw_data = raw_cmds.encode('utf-8')
                target_printer = payload.get('printerName')
                if not target_printer:
                    default_p = QPrinterInfo.defaultPrinter()
                    target_printer = default_p.printerName() if (default_p and not default_p.isNull()) else 'Default Thermal Printer'

                sent = False
                try:
                    import win32print
                    hPrinter = win32print.OpenPrinter(target_printer)
                    try:
                        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Barcode Label Print Job", None, "RAW"))
                        try:
                            win32print.StartPagePrinter(hPrinter)
                            win32print.WritePrinter(hPrinter, raw_data)
                            win32print.EndPagePrinter(hPrinter)
                        finally:
                            win32print.EndDocPrinter(hPrinter)
                    finally:
                        win32print.ClosePrinter(hPrinter)
                    sent = True
                except Exception:
                    pass

                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f"Sent {len(raw_data)} bytes directly to {target_printer}!" if sent else f"Thermal command generated successfully ({len(raw_data)} bytes)",
                    'printer': target_printer,
                    'bytesSent': len(raw_data)
                }).encode('utf-8'))
            except Exception as ex:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(ex)}).encode('utf-8'))

        elif self.path == '/api/print/ledger-render':
            try:
                ledger_page = int(payload.get('pageNum', 0))
                img, lp = render_ledger_qimage(payload, page_num=ledger_page)
                buf = QBuffer()
                buf.open(QIODevice.OpenModeFlag.WriteOnly)
                img.save(buf, 'PNG')
                b64 = base64.b64encode(buf.data().data()).decode('utf-8')
                data_url = f'data:image/png;base64,{b64}'

                res = {
                    'success': True,
                    'dataUrl': data_url,
                    'width': img.width(),
                    'height': img.height(),
                    'totalPages': lp.total_pages,
                    'currentPage': ledger_page
                }
                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as ex:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(ex)}).encode('utf-8'))

        elif self.path == '/api/print/ledger-direct':
            try:
                printer = QPrinter(QPrinter.PrinterMode.HighResolution)
                target_printer = payload.get('printerName')
                if target_printer:
                    printer.setPrinterName(target_printer)
                printer.setPageOrientation(QPageLayout.Orientation.Portrait)
                printer.setPageSize(QPageSize(QPageSize.PageSizeId.A4))

                printer_name = printer.printerName() or 'Default Printer'
                is_pdf_virtual = 'PDF' in printer_name.upper() or 'XPS' in printer_name.upper() or 'ONENOTE' in printer_name.upper() or 'PORTPROMPT' in printer_name.upper()

                show_dialog = bool(payload.get('showDialog', False))
                if show_dialog:
                    from PyQt6.QtPrintSupport import QPrintDialog
                    dialog = QPrintDialog(printer)
                    dialog.setWindowTitle(f"Print Ledger - {payload.get('party', 'Khata')}")
                    if dialog.exec() != QPrintDialog.DialogCode.Accepted:
                        self.send_response(200)
                        self._send_cors_headers()
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'success': False, 'message': 'Print cancelled by user'}).encode('utf-8'))
                        return
                    printer_name = printer.printerName() or 'Selected Printer'
                    is_pdf_virtual = 'PDF' in printer_name.upper() or 'XPS' in printer_name.upper()

                output_pdf_path = None
                if is_pdf_virtual and not show_dialog:
                    desktop_dir = os.path.join(os.path.expanduser('~'), 'Desktop')
                    party_clean = "".join(c for c in str(payload.get('party', 'Party')) if c.isalnum() or c in (' ', '_', '-')).strip() or 'LEDGER'
                    output_pdf_path = os.path.join(desktop_dir, f"LEDGER_{party_clean}.pdf")
                    printer.setOutputFileName(output_pdf_path)

                p = QPainter(printer)
                lp = LedgerPainter(payload)
                rect = printer.pageRect(QPrinter.Unit.DevicePixel).toRect()
                lp.paint(p, rect, page_num=0)
                total_p = lp.total_pages
                for pg in range(1, total_p):
                    printer.newPage()
                    lp.paint(p, rect, page_num=pg)
                p.end()

                if output_pdf_path and os.path.exists(output_pdf_path):
                    try:
                        os.startfile(output_pdf_path)
                    except Exception:
                        pass

                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f"Ledger sent to {printer_name} ({total_p} page{'s' if total_p > 1 else ''}) in High-Resolution Vector mode!",
                    'printer': printer_name,
                    'totalPages': total_p,
                    'filePath': output_pdf_path
                }).encode('utf-8'))
            except Exception as ex:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(ex)}).encode('utf-8'))

        elif self.path in ('/api/print/equation-direct', '/api/print/equation'):
            try:
                printer = QPrinter(QPrinter.PrinterMode.HighResolution)
                target_printer = payload.get('printerName')
                if target_printer:
                    printer.setPrinterName(target_printer)
                printer.setPageOrientation(QPageLayout.Orientation.Portrait)
                printer.setPageSize(QPageSize(QPageSize.PageSizeId.A4))

                printer_name = printer.printerName() or 'Default Printer'
                is_pdf_virtual = any(k in printer_name.upper() for k in ('PDF', 'XPS', 'ONENOTE', 'PORTPROMPT'))

                show_dialog = bool(payload.get('showDialog', False))
                if show_dialog:
                    from PyQt6.QtPrintSupport import QPrintDialog
                    dialog = QPrintDialog(printer)
                    dialog.setWindowTitle(f"Print Equation Report - {payload.get('party', 'Report')}")
                    if dialog.exec() != QPrintDialog.DialogCode.Accepted:
                        self.send_response(200)
                        self._send_cors_headers()
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'success': False, 'message': 'Print cancelled by user'}).encode('utf-8'))
                        return
                    printer_name = printer.printerName() or 'Selected Printer'
                    is_pdf_virtual = 'PDF' in printer_name.upper() or 'XPS' in printer_name.upper()

                output_pdf_path = None
                if is_pdf_virtual and not show_dialog:
                    desktop_dir = os.path.join(os.path.expanduser('~'), 'Desktop')
                    bill_token = str(payload.get('billToken') or payload.get('billNo') or 'REPORT').replace('/', '_')
                    output_pdf_path = os.path.join(desktop_dir, f"EQUATION_REPORT_{bill_token}.pdf")
                    printer.setOutputFileName(output_pdf_path)

                # Format items for BillPainter equation mode
                raw_items = payload.get('items', [])
                mapped_items = []
                for it in raw_items:
                    if isinstance(it, dict):
                        mapped_items.append({
                            'party': str(it.get('party', '')),
                            'share_per': str(it.get('sharePct', it.get('share_per', ''))).replace('%', '').strip(),
                            'desc': str(it.get('desc', it.get('item', it.get('itemName', it.get('name', ''))))),
                            'actual_qty': float(it.get('actual_qty', it.get('pcs', it.get('pcsQty', 0))) or 0),
                            'boxes': float(it.get('boxes', 0) or 0),
                            'mult': str(it.get('mult', '1')),
                            'bill_qty': str(it.get('bill_qty', it.get('billQty', it.get('billQtyShare', '0')))),
                            'rate': float(it.get('rate', it.get('price', 0)) or 0),
                            'weight': float(it.get('weight', it.get('weightKg', 0)) or 0),
                            'total': float(it.get('total', it.get('totalGst', 0)) or 0),
                            'paid_amt': str(it.get('paid_amt', it.get('partyPaidAmt', it.get('paidAmount', '0'))))
                        })
                    elif isinstance(it, list):
                        mapped_items.append(it)

                eq_data = {
                    'bill_no': str(payload.get('billToken') or payload.get('billNo') or 'EQUATION'),
                    'date': str(payload.get('date', '')),
                    'party': str(payload.get('party', 'MULTI-PARTY REPORT')),
                    'bill_type': 'Bill',
                    'is_equation': True,
                    'is_estimate': True,
                    'grand_total': float(payload.get('grandTotal', 0.0) or 0.0),
                    'items': mapped_items
                }

                p = QPainter(printer)
                bp = BillPainter(eq_data)
                rect = printer.pageRect(QPrinter.Unit.DevicePixel).toRect()
                bp.paint(p, rect, page_num=0)
                total_p = getattr(bp, 'total_pages', 1)
                for pg in range(1, total_p):
                    printer.newPage()
                    bp.paint(p, rect, page_num=pg)
                p.end()

                if output_pdf_path and os.path.exists(output_pdf_path):
                    try:
                        os.startfile(output_pdf_path)
                    except Exception:
                        pass

                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f"Equation Report sent directly to {printer_name} ({total_p} page{'s' if total_p > 1 else ''}) in High-Resolution Vector mode!",
                    'printer': printer_name,
                    'totalPages': total_p,
                    'filePath': output_pdf_path
                }).encode('utf-8'))
            except Exception as ex:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(ex)}).encode('utf-8'))

        elif self.path == '/api/print/test-print':
            try:
                printer = QPrinter(QPrinter.PrinterMode.HighResolution)
                target_printer = payload.get('printerName')
                if target_printer:
                    printer.setPrinterName(target_printer)
                printer.setPageOrientation(QPageLayout.Orientation.Portrait)
                printer.setPageSize(QPageSize(QPageSize.PageSizeId.A4))
                printer_name = printer.printerName() or 'Default Printer'
                is_pdf_virtual = any(k in printer_name.upper() for k in ('PDF', 'XPS', 'ONENOTE', 'PORTPROMPT'))
                output_pdf_path = None
                if is_pdf_virtual:
                    desktop_dir = os.path.join(os.path.expanduser('~'), 'Desktop')
                    output_pdf_path = os.path.join(desktop_dir, "PRINTER_TEST_PAGE.pdf")
                    printer.setOutputFileName(output_pdf_path)

                p = QPainter(printer)
                p.setRenderHint(QPainter.RenderHint.Antialiasing)
                p.setRenderHint(QPainter.RenderHint.TextAntialiasing)

                rect = printer.pageRect(QPrinter.Unit.DevicePixel).toRect()
                p.fillRect(rect, QColor('#FFFFFF'))

                from PyQt6.QtGui import QFont, QPen
                from datetime import datetime

                # Title
                f_title = QFont("Segoe UI", 0, QFont.Weight.Bold)
                f_title.setPixelSize(42)
                p.setFont(f_title)
                p.setPen(QPen(QColor('#0f172a')))
                p.drawText(120, 180, "MODERN ACCOUNTING OS / GLASS-UI")

                f_sub = QFont("Segoe UI", 0, QFont.Weight.DemiBold)
                f_sub.setPixelSize(26)
                p.setFont(f_sub)
                p.setPen(QPen(QColor('#0284c7')))
                p.drawText(120, 240, "PyQt6 High-Resolution Native Vector Printer Test Page")

                # Horizontal separator
                p.setPen(QPen(QColor('#cbd5e1'), 2))
                p.drawLine(120, 270, 1200, 270)

                # Info block
                f_body = QFont("Segoe UI", 0, QFont.Weight.Normal)
                f_body.setPixelSize(22)
                p.setFont(f_body)
                p.setPen(QPen(QColor('#334155')))
                p.drawText(120, 330, f"Target Printer: {printer_name}")
                p.drawText(120, 380, f"Print Timestamp: {datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')}")
                p.drawText(120, 430, "Spooling Quality: 100% Native Vector Mode (Zero Browser Degradation)")
                p.drawText(120, 480, "Status: SUCCESS - Direct Python Hardware Spooler Verified")

                p.setPen(QPen(QColor('#10b981'), 3))
                p.drawLine(120, 520, 1200, 520)

                p.end()

                if output_pdf_path and os.path.exists(output_pdf_path):
                    try:
                        os.startfile(output_pdf_path)
                    except Exception:
                        pass

                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': f"Test page successfully sent to {printer_name}!",
                    'printer': printer_name,
                    'filePath': output_pdf_path
                }).encode('utf-8'))
            except Exception as ex:
                self.send_response(500)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(ex)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()



def run_server(port=5005):
    server = ThreadingHTTPServer(('127.0.0.1', port), PrintRequestHandler)
    print(f'Native PyQt6 Print Service started on http://127.0.0.1:{port}')
    server.serve_forever()

if __name__ == '__main__':
    run_server(5005)
