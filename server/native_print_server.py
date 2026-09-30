import sys
import os
import json
import base64
from http.server import HTTPServer, BaseHTTPRequestHandler
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QImage, QPainter, QColor, QPageSize, QPageLayout
from PyQt6.QtCore import QBuffer, QIODevice
from PyQt6.QtPrintSupport import QPrinter, QPrintDialog

# Ensure server directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bill_painter_engine import BillPainter, format_indian_currency, format_display_date

app = QApplication.instance() or QApplication(sys.argv if sys.argv else [''])

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
    items_data = []
    for it in payload.get('items', []):
        name = str(it.get('name', '')).strip()
        qty = it.get('qty', '')
        has_any_val = bool(name) or bool(qty) or any(bool(str(it.get(dc.get('field', ''), '')).strip()) for dc in dynamic_cols)
        if has_any_val:
            row_dict = {
                'desc': name,
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
        'is_loading_slip': is_loading_slip or is_estimate,
        'is_estimate': is_estimate,
        'is_summary_only': is_summary_only,
        'show_party_code': bool(payload.get('showPartyCode', False)),
        'dynamic_cols': dynamic_cols,
        'items': items_data,
        'groups': groups_data,
        'adjustments': adjustments,
        'balance_label': str(payload.get('balanceLabel', 'BALANCE')).upper()
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
            self.wfile.write(json.dumps({'status': 'ok', 'engine': 'PyQt6 BillPainter Native'}).encode('utf-8'))
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
                printer.setPageOrientation(QPageLayout.Orientation.Portrait)
                printer.setPageSize(QPageSize(QPageSize.PageSizeId.A4))

                if payload.get('showDialog', False):
                    dlg = QPrintDialog(printer)
                    if dlg.exec() != QPrintDialog.DialogCode.Accepted:
                        self.send_response(200)
                        self._send_cors_headers()
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'success': False, 'message': 'Print cancelled by user'}).encode('utf-8'))
                        return

                p = QPainter(printer)
                bp = BillPainter(bill_data)
                rect = printer.pageRect(QPrinter.Unit.DevicePixel).toRect()
                bp.paint(p, rect, page_num=0)
                total_p = getattr(bp, 'total_pages', 1)
                for pg in range(1, total_p):
                    printer.newPage()
                    bp.paint(p, rect, page_num=pg)
                p.end()

                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Native print job sent successfully!'}).encode('utf-8'))
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
    server = HTTPServer(('127.0.0.1', port), PrintRequestHandler)
    print(f'Native PyQt6 Print Service started on http://127.0.0.1:{port}')
    server.serve_forever()

if __name__ == '__main__':
    run_server(5005)
