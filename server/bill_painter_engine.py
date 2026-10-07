# Native PyQt6 BillPainter Engine extracted from F:\SUMMARY\BillApp\main.py
# 100% Exact Desktop Print & Image Engine

import sys
import re
from collections import defaultdict
from PyQt6.QtCore import Qt, QRect, QSize, QSizeF, QPoint, QPointF
from PyQt6.QtGui import QFont, QPen, QBrush, QColor, QPainter, QImage, QPixmap, QPageSize, QPageLayout, QPainterPath, QFontMetrics
from PyQt6.QtPrintSupport import QPrinter

def format_display_date(db_date):
    if not db_date: return ""
    try:
        parts = str(db_date).split("-")
        if len(parts) == 3 and len(parts[0]) == 4: # yyyy-mm-dd
            return f"{parts[2]}-{parts[1]}-{parts[0]}"
    except: pass
    return str(db_date)

def format_slip_no(serial_no, bill_type):
    if serial_no is None or str(serial_no).strip() == "" or str(serial_no) == "N/A":
        return "N/A"
    serial_str = str(serial_no)
    prefix = db_manager.get_setting("slip_prefix", "")
    if prefix and serial_str.startswith(prefix):
        return serial_str
    return f"{prefix}{serial_str}"

class BillPainter:
    def __init__(self, data):
        self.d = data
        self.W = 1414 # Portrait A4 width by default
        
        if self.d.get("is_price_list"):
            self.margin = 30
            self.cur_y = 20
            h_base = 350
            h_items = len(self.d.get("prices", [])) * 60
            self.H = min(h_base + h_items + 200, 30000)
            self.full_h = self.H
            self.sum_qty = 0.0; self.sum_ucap = 0.0; self.sum_lcap = 0.0; self.sum_pcs = 0.0
            self.grand_total = 0.0
            self.is_last_page = True
            self.total_pages = 1
            return

        if self.d.get("is_summary_only"):
            # DYNAMIC HEIGHT FOR SUMMARY ONLY (Omit detailed items table)
            h_base = 450
            h_items = 0
            h_groups_hdr = 200
            h_groups = len(self.d.get("groups", [])) * 60 # row_h = 60
            h_footer = 250 + (len(self.d.get("adjustments", [])) * 50) + 200
            self.full_h = min(h_base + h_items + h_groups_hdr + h_groups + h_footer, 30000)
            self.H = 2000
            self.margin = 30
            self.cur_y = 20
            self.is_last_page = True
            self.total_pages = 1
        elif self.d.get("is_estimate"):
            # DYNAMIC HEIGHT FOR ESTIMATE (Match Loading Slip compact size)
            h_base = 450 
            h_items = len(self.d.get("items", [])) * 60 # row_h = 60
            h_groups_hdr = 200 
            h_groups = len(self.d.get("groups", [])) * 60 # row_h = 60
            h_footer = 250 + (len(self.d.get("adjustments", [])) * 50) + 200
            self.full_h = min(h_base + h_items + h_groups_hdr + h_groups + h_footer, 30000)
            self.H = 2000 
            self.margin = 30 # Matching Loading Slip margins
            self.cur_y = 20
        elif self.d.get("is_loading_slip"):
            # DYNAMIC HEIGHT FOR LOADING SLIP (Continuous Image)
            h_base = 400
            h_items = len(self.d.get("items", [])) * 60
            h_footer = 200 # Simple footer for loading slip
            self.full_h = min(h_base + h_items + h_footer, 30000)
            self.H = 2000
            self.margin = 30
        elif self.d.get("is_equation"):
            h_base = 350
            raw_items = self.d.get("items", [])
            party_count = len(set(str(it.get('party') if isinstance(it, dict) else it[0]) for it in raw_items)) or 1
            h_items = len(raw_items) * 85 + (party_count * 160)
            h_footer = 200
            self.full_h = min(h_base + h_items + h_footer, 30000)
            self.H = 2000
            self.margin = 62
            self.cur_y = 20
        else:
            self.H = 2000
            self.full_h = 2000
            self.margin = 60
            self.cur_y = 60
            
        # --- PRE-CALCULATE GRAND TOTALS FOR ALL PAGES ---
        self.sum_qty = 0.0; self.sum_ucap = 0.0; self.sum_lcap = 0.0
        self.sum_pcs = 0.0; self.sum_boxes = 0.0; self.sum_weight = 0.0; self.sum_amt = 0.0
        
        items = self.d.get("items", [])
        dyn_cols = self.d.get("dynamic_cols", []) or []
        self.col_sums = {"qty": 0.0, "u_cap": 0.0, "l_cap": 0.0}
        for dc in dyn_cols:
            fld = dc.get("field")
            if fld:
                self.col_sums[fld] = 0.0

        if self.d.get("is_loading_slip"):
            for item in items:
                try:
                    q_num = float(item.get("qty", 0) or 0)
                    u_num = float(item.get("u_cap", 0) or 0)
                    l_num = float(item.get("l_cap", 0) or 0)
                    self.sum_qty += q_num
                    self.col_sums["qty"] += q_num
                    self.sum_ucap += u_num
                    self.col_sums["u_cap"] += u_num
                    self.sum_lcap += l_num
                    self.col_sums["l_cap"] += l_num
                    for dc in dyn_cols:
                        fld = dc.get("field")
                        if fld:
                            self.col_sums[fld] += float(item.get(fld, 0) or 0)
                except: pass
        elif self.d.get("is_equation"):
            for item in items:
                try:
                    self.sum_pcs += float(item.get("actual_qty", 0) or 0)
                    self.sum_boxes += float(item.get("boxes", 0) or 0)
                    self.sum_weight += float(item.get("weight", 0) or 0)
                    self.sum_amt += float(item.get("total", 0) or 0)
                except: pass

        # Override values if fit_on_one_page is active
        if self.d.get("fit_on_one_page"):
            self.H = self.full_h
            self.is_last_page = True
            self.total_pages = 1

    def paint(self, painter, rect=None, page_num=0):
        self.is_img_mode_flag = (page_num == -1) or bool(self.d.get("is_image_mode"))
        if rect:
            painter.save()
            painter.setViewport(rect)
            win_h = self.full_h if page_num == -1 else self.H
            painter.setWindow(0, 0, self.W, win_h)

        # Enable high-quality subpixel antialiasing & smooth transforms
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)

        # Pure White Clean Background
        draw_h = self.full_h if page_num == -1 else self.H
        painter.fillRect(0, 0, self.W, draw_h, QColor("#FFFFFF"))
        
        if self.d.get("is_price_list"):
            self._draw_price_list(painter)
        else:
            # Note: self._draw_grid handles header drawing internally for Loading Slip multi-page
            self._draw_grid(painter, page_num=page_num)
            
            # Only draw footer on the last page or if it's a single page
            if not self.d.get("is_loading_slip") or self.is_last_page:
                self._draw_footer(painter)
        
        if rect:
            painter.restore()

    def _draw_price_list(self, painter):
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        m = self.margin
        y = self.cur_y
        
        # Header
        f = QFont("Segoe UI", 0, QFont.Weight.Bold)
        f.setPixelSize(40) # Reduced from 50
        painter.setFont(f)
        painter.setPen(QPen(Qt.GlobalColor.black))
        painter.drawText(QRect(0, y, self.W, 70), Qt.AlignmentFlag.AlignCenter, "PRICE LIST")
        
        y += 120
        f.setPixelSize(38)
        painter.setFont(f)
        painter.drawText(m, y, f"PARTY: {self.d.get('party', '')}")
        painter.drawText(self.W - m - 400, y, f"DATE: {format_display_date(self.d.get('date', ''))}")
        y += 80
        
        # Table Headers
        cols = [("ITEM NAME", 600), ("LATEST PRICE", 377), ("RECENT DATE", 377)]
        f.setPixelSize(30)
        painter.setFont(f)
        x = m
        for txt, w in cols:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor("#475569"))) # Slate header
            painter.drawRect(x, y, w, 60)
            painter.setPen(QPen(Qt.GlobalColor.white))
            painter.drawText(QRect(x+5, y, w-10, 60), Qt.AlignmentFlag.AlignCenter, txt)
            x += w
        y += 60
        
        # Rows
        f.setPixelSize(32)
        painter.setFont(f)
        prices = self.d.get("prices", [])
        
        for idx, row in enumerate(prices):
            x = m
            
            # Alternating background
            if idx % 2 == 0:
                painter.setBrush(QBrush(QColor("#96b6d7")))
            else:
                painter.setBrush(QBrush(QColor("#f1f5f9")))
                
            row_w = sum(c[1] for c in cols)
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRect(x, y, row_w, 60)
            
            painter.setPen(QPen(Qt.GlobalColor.black, 2))
            painter.setBrush(Qt.BrushStyle.NoBrush)
            
            # Item Name
            painter.drawRect(x, y, cols[0][1], 60)
            painter.setPen(QPen(Qt.GlobalColor.black))
            align_left = Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter
            align_center = Qt.AlignmentFlag.AlignCenter
            
            item_name = str(row[0]).replace(".", "").replace("-", " ")
            painter.drawText(QRect(x+20, y, cols[0][1]-40, 60), align_left, item_name)
            x += cols[0][1]
            
            # Price
            painter.setPen(QPen(Qt.GlobalColor.black, 2))
            painter.drawRect(x, y, cols[1][1], 60)
            f.setWeight(QFont.Weight.Bold)
            painter.setFont(f)
            
            try:
                price_str = format_indian_currency(row[1])
            except:
                price_str = f"{row[1]:.2f}"
                
            painter.drawText(QRect(x+20, y, cols[1][1]-40, 60), align_center, f"{price_str}")
            x += cols[1][1]
            
            # Date
            painter.setPen(QPen(Qt.GlobalColor.black, 2))
            painter.drawRect(x, y, cols[2][1], 60)
            f.setWeight(QFont.Weight.Normal)
            painter.setFont(f)
            painter.drawText(QRect(x+20, y, cols[2][1]-40, 60), align_center, format_display_date(row[2]))
            
            y += 60
            
        self.cur_y = y

    def _render_lucide_icon(self, painter, x, y, size, stroke_col, draw_fn, badge_fill=None):
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        if badge_fill:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(badge_fill))
            painter.drawRoundedRect(x - 3, y - 3, size + 6, size + 6, 6, 6)

        painter.translate(x, y)
        scale = size / 24.0
        painter.scale(scale, scale)

        pen = QPen(stroke_col, 2.1, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.BrushStyle.NoBrush)

        draw_fn(painter)
        painter.restore()

    def _draw_slip_icon(self, painter, x, y, size=34, is_image=False):
        stroke_col = QColor("#2563eb") if is_image else Qt.GlobalColor.black
        badge_fill = QColor("#eff6ff") if is_image else None

        def _draw(p):
            path = QPainterPath()
            path.moveTo(14, 2)
            path.lineTo(6, 2)
            path.quadTo(4, 2, 4, 4)
            path.lineTo(4, 20)
            path.quadTo(4, 22, 6, 22)
            path.lineTo(18, 22)
            path.quadTo(20, 22, 20, 20)
            path.lineTo(20, 8)
            path.closeSubpath()
            p.drawPath(path)

            flap = QPainterPath()
            flap.moveTo(14, 2)
            flap.lineTo(14, 8)
            flap.lineTo(20, 8)
            p.drawPath(flap)

            p.drawLine(8, 9, 10, 9)
            p.drawLine(8, 13, 16, 13)
            p.drawLine(8, 17, 16, 17)

        self._render_lucide_icon(painter, x, y, size, stroke_col, _draw, badge_fill)

    def _draw_vehicle_type_icon(self, painter, x, y, size=34, is_image=False):
        stroke_col = QColor("#ea580c") if is_image else Qt.GlobalColor.black
        badge_fill = QColor("#fff7ed") if is_image else None

        def _draw(p):
            path = QPainterPath()
            path.moveTo(14, 18)
            path.lineTo(14, 6)
            path.quadTo(14, 4, 12, 4)
            path.lineTo(4, 4)
            path.quadTo(2, 4, 2, 6)
            path.lineTo(2, 17)
            path.quadTo(2, 18, 3, 18)
            path.lineTo(5, 18)
            p.drawPath(path)

            p.drawLine(9, 18, 15, 18)

            cab = QPainterPath()
            cab.moveTo(19, 18)
            cab.lineTo(21, 18)
            cab.quadTo(22, 18, 22, 17)
            cab.lineTo(22, 13.35)
            cab.lineTo(18.52, 9)
            cab.lineTo(14, 9)
            p.drawPath(cab)

            p.drawEllipse(QPointF(7, 18.5), 2.5, 2.5)
            p.drawEllipse(QPointF(17, 18.5), 2.5, 2.5)

        self._render_lucide_icon(painter, x, y, size, stroke_col, _draw, badge_fill)

    def _draw_vehicle_no_icon(self, painter, x, y, size=34, is_image=False):
        stroke_col = QColor("#0284c7") if is_image else Qt.GlobalColor.black
        badge_fill = QColor("#f0f9ff") if is_image else None

        def _draw(p):
            car = QPainterPath()
            car.moveTo(19, 17)
            car.lineTo(21, 17)
            car.quadTo(22, 17, 22, 16)
            car.lineTo(22, 13)
            car.lineTo(16, 10)
            car.lineTo(13.8, 7.7)
            car.quadTo(13, 7, 12.2, 7)
            car.lineTo(5, 7)
            car.lineTo(2.2, 10.8)
            car.quadTo(2, 11.5, 2, 12)
            car.lineTo(2, 16)
            car.quadTo(2, 17, 3, 17)
            car.lineTo(5, 17)
            p.drawPath(car)

            p.drawLine(9, 17, 15, 17)
            p.drawEllipse(QPointF(7, 17), 2.0, 2.0)
            p.drawEllipse(QPointF(17, 17), 2.0, 2.0)

        self._render_lucide_icon(painter, x, y, size, stroke_col, _draw, badge_fill)

    def _draw_party_icon(self, painter, x, y, size=34, is_image=False):
        stroke_col = QColor("#7c3aed") if is_image else Qt.GlobalColor.black
        badge_fill = QColor("#ede9fe") if is_image else None

        def _draw(p):
            body = QPainterPath()
            body.moveTo(19, 21)
            body.lineTo(19, 19)
            body.quadTo(19, 15, 15, 15)
            body.lineTo(9, 15)
            body.quadTo(5, 15, 5, 19)
            body.lineTo(5, 21)
            p.drawPath(body)

            p.drawEllipse(QPointF(12, 7), 4.0, 4.0)

        self._render_lucide_icon(painter, x, y, size, stroke_col, _draw, badge_fill)

    def _draw_calendar_icon(self, painter, x, y, size=34, is_image=False):
        stroke_col = QColor("#dc2626") if is_image else Qt.GlobalColor.black
        badge_fill = QColor("#fef2f2") if is_image else None

        def _draw(p):
            p.drawLine(8, 2, 8, 6)
            p.drawLine(16, 2, 16, 6)

            body = QPainterPath()
            body.addRoundedRect(3, 4, 18, 18, 2.0, 2.0)
            p.drawPath(body)

            p.drawLine(3, 10, 21, 10)

        self._render_lucide_icon(painter, x, y, size, stroke_col, _draw, badge_fill)

    def _draw_loading_header(self, painter):
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        # Header (Type & Bill ID)
        
        # Header Label (Centered Bold)
        f_h = QFont("Segoe UI", 0, QFont.Weight.Bold)
        f_h.setPixelSize(60)
        painter.setFont(f_h)
        painter.setPen(QPen(Qt.GlobalColor.black))
        
        # Get Context-aware Title and Labels
        b_type = self.d.get("bill_type", "Bill")
        pfx = ""
        if b_type == "Order": pfx = "ORDER "
        elif b_type == "Return": pfx = "RETURN "

        title = f"{pfx}ESTIMATE"
        if self.d.get("is_loading_slip") and not self.d.get("is_estimate"): 
            title = f"{pfx}LOADING SLIP"
        if self.d.get("is_equation"): 
            title = "MULTI-PARTY REPORT"
        
        painter.drawText(QRect(0, 20, self.W, 80), Qt.AlignmentFlag.AlignCenter, title)
        
        # Info Block
        f_i = QFont("Segoe UI", 0, QFont.Weight.Bold)
        f_i.setPixelSize(35)
        painter.setFont(f_i)
        painter.setPen(QPen(Qt.GlobalColor.black))
        metrics = QFontMetrics(f_i)
        y = 130
        icon_size = 34
        icon_gap = 12
        icon_y_offset = 27
        table_right = self.margin + 1290
        is_img = bool(getattr(self, 'is_img_mode_flag', False) or self.d.get("is_image_mode"))

        # Locked X position for right column: Upper Vehicle Icon & Lower Date Icon in exact same vertical line
        right_icon_x = table_right - 280
        right_text_x = right_icon_x + icon_size + icon_gap
        max_right_w = table_right - right_text_x

        # Row 1 (Upper 3: Slip No | Vehicle Type | Vehicle No)
        # 1. Slip No (Left)
        self._draw_slip_icon(painter, self.margin, y - icon_y_offset, icon_size, is_image=is_img)
        bill_str = str(self.d.get('bill_no', 'N/A'))
        painter.drawText(self.margin + icon_size + icon_gap, y, bill_str)

        # 2 & 3. Vehicle Type & Vehicle No
        raw_v_type = str(self.d.get('v_type', '')).strip()
        v_type = "SELF" if raw_v_type.upper() == "OWN VEHICLE" else raw_v_type
        v_name = str(self.d.get('v_name', '')).strip()

        if v_type and v_name:
            # Vehicle Type in center
            v_type_x = 520
            self._draw_vehicle_type_icon(painter, v_type_x, y - icon_y_offset, icon_size, is_image=is_img)
            painter.drawText(v_type_x + icon_size + icon_gap, y, v_type)

            # Vehicle No on locked right position
            self._draw_vehicle_no_icon(painter, right_icon_x, y - icon_y_offset, icon_size, is_image=is_img)
            painter.drawText(QRect(right_text_x, y - 35, max_right_w, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, v_name)
        elif v_type:
            self._draw_vehicle_type_icon(painter, right_icon_x, y - icon_y_offset, icon_size, is_image=is_img)
            painter.drawText(QRect(right_text_x, y - 35, max_right_w, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, v_type)
        elif v_name:
            self._draw_vehicle_no_icon(painter, right_icon_x, y - icon_y_offset, icon_size, is_image=is_img)
            painter.drawText(QRect(right_text_x, y - 35, max_right_w, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, v_name)

        # Row 2 (Lower 2: Party Name | Date)
        y += 50
        # 1. Party Name (Left)
        party_str = str(self.d.get('party', 'N/A'))
        self._draw_party_icon(painter, self.margin, y - icon_y_offset, icon_size, is_image=is_img)
        painter.drawText(QRect(self.margin + icon_size + icon_gap, y - 35, right_icon_x - (self.margin + icon_size + icon_gap) - 20, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, party_str)

        # 2. Date (Right - EXACT same column position as Upper Vehicle Icon)
        date_str = format_display_date(self.d.get('date', 'N/A'))
        self._draw_calendar_icon(painter, right_icon_x, y - icon_y_offset, icon_size, is_image=is_img)
        painter.drawText(QRect(right_text_x, y - 35, max_right_w, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, date_str)

        self.cur_y = y + 70

    def _draw_generic_header(self, painter):
        self._draw_loading_header(painter)

    def _get_table_cols(self):
        dyn_cols = self.d.get("dynamic_cols", []) or []
        show_party_code = bool(self.d.get("show_party_code"))
        # Exactly match lower table width: MOULD NAME(520) + QTY(230) + PRICE(230) + TOTAL(310) = 1290px
        table_w = 1290
        sr_w = 70
        avail_w = table_w - sr_w

        # Helper to parse feet size for sorting descending
        def parse_feet_size(val):
            if str(val).lower() == 'qty':
                return 10.0
            import re as _re
            m = _re.search(r'(\d+(\.\d+)?)', str(val))
            return float(m.group(1)) if m else 10.0

        size_cols = [{'field': 'qty', 'label': '(10 FT)', 'size': 10.0}]
        for dc in dyn_cols:
            fld = dc.get('field')
            lbl = dc.get('label') or fld
            size_cols.append({
                'field': fld,
                'label': str(lbl),
                'size': parse_feet_size(lbl or fld)
            })
        size_cols.sort(key=lambda x: x['size'], reverse=True)

        num_qty_cols = len(size_cols) + 2  # all size cols + u_cap + l_cap

        if show_party_code:
            # User rule: ITEM NAME and PARTY CODE must be EK BARABAR (equal)!
            # All other numeric columns must be EK BARABAR (each_w)!
            # And ITEM NAME and PARTY CODE must be DOUBLE (2x) the size of each numeric column!
            total_units = 4 + num_qty_cols
            each_w = int(avail_w / total_units)
            pcode_w = each_w * 2
            desc_w = avail_w - pcode_w - (num_qty_cols * each_w)  # equals 2*each_w + remainder
        else:
            # When PARTY CODE is hidden:
            # ITEM NAME is 2 units, each numeric col is 1 unit (exact double 2x, NOT 4x!)
            total_units = 2 + num_qty_cols
            each_w = int(avail_w / total_units)
            pcode_w = 0
            desc_w = avail_w - (num_qty_cols * each_w)  # equals 2*each_w + remainder

        cols = [
            ("SR.", sr_w, "sr"),
            ("ITEM NAME", desc_w, "desc")
        ]
        if show_party_code:
            cols.append(("PARTY CODE", pcode_w, "party_code"))
        for sc in size_cols:
            cols.append((sc['label'].upper(), each_w, sc['field']))
        cols.append(("U CAP", each_w, "u_cap"))
        cols.append(("L CAP", each_w, "l_cap"))
        return cols

    def _draw_column_headers(self, painter, cols, row_h):
        x = self.margin
        dyn_cols = self.d.get("dynamic_cols", []) or []
        show_party_code = bool(self.d.get("show_party_code"))
        hdr_font_size = 24 if (len(dyn_cols) > 2 or show_party_code) else 30
        f = QFont("Segoe UI", 0, QFont.Weight.Bold)
        f.setPixelSize(hdr_font_size)
        painter.setFont(f)
        for col_info in cols:
            txt = col_info[0]
            w = col_info[1]
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(Qt.GlobalColor.black))
            painter.drawRect(x, self.cur_y, w, row_h)
            painter.setPen(QPen(Qt.GlobalColor.white))
            painter.drawText(QRect(x+5, self.cur_y, w-10, row_h), Qt.AlignmentFlag.AlignCenter, txt)
            x += w
        self.cur_y += row_h

    def _draw_data_rows_simple(self, painter, items_to_draw, cols, row_h, font_size, start_idx, is_image=False):
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.setPen(QPen(Qt.GlobalColor.black, 2))
        f = QFont("Segoe UI", 0, QFont.Weight.Bold)
        f.setPixelSize(font_size)
        painter.setFont(f)
        
        def bz(v): return f"{v:g}" if v != 0 else ""
        
        for i_rel, item in enumerate(items_to_draw):
            idx = start_idx + i_rel
            x = self.margin
            
            raw_desc = str(item.get("desc", ""))
            clean_desc = raw_desc.replace(".", "").replace("-", " ")
            
            row_data = [str(idx + 1), clean_desc]
            for col_info in cols[2:]:
                fld = col_info[2] if len(col_info) > 2 else None
                if fld == 'party_code':
                    row_data.append(str(item.get("party_code", "")))
                elif fld:
                    try:
                        v = float(item.get(fld, 0) or 0)
                        row_data.append(bz(v))
                    except:
                        row_data.append(str(item.get(fld, "")))
                
            # BG Color for Estimate / Loading Slip in Image Mode
            if (self.d.get("is_estimate") or self.d.get("is_loading_slip")) and is_image:
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(QBrush(QColor("#96b6d7")))
                row_full_w = sum(c[1] for c in cols)
                painter.drawRect(x, self.cur_y, row_full_w, row_h)
                painter.setPen(QPen(Qt.GlobalColor.black, 2))
                painter.setBrush(Qt.BrushStyle.NoBrush)

            for i, val in enumerate(row_data):
                if i >= len(cols):
                    break
                w = cols[i][1]
                painter.drawRect(x, self.cur_y, w, row_h)
                align = Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter if i == 1 else Qt.AlignmentFlag.AlignCenter
                
                # Column 1 = item name: parse (NOTE) and draw the note in italics
                if i == 1:
                    import re as _re
                    note_match = _re.match(r'^(.*?)\s*\(([^)]+)\)\s*$', str(val))
                    if note_match:
                        base_text = note_match.group(1).strip()
                        note_text = "(" + note_match.group(2).strip() + ")"
                        # Draw base name in bold
                        painter.drawText(QRect(x+10, self.cur_y, w-20, row_h), align, base_text)
                        # Measure base text width to place note right after it
                        fm = painter.fontMetrics()
                        base_w = fm.horizontalAdvance(base_text)
                        # Switch to italic font for the note
                        italic_f = QFont("Segoe UI", 0, QFont.Weight.Normal)
                        italic_f.setPixelSize(max(font_size - 2, 14))
                        italic_f.setItalic(True)
                        painter.save()
                        painter.setFont(italic_f)
                        note_x = x + 10 + base_w + 22
                        if note_x < x + w - 10:
                            painter.drawText(QRect(note_x, self.cur_y, w - (note_x - x) - 10, row_h),
                                             Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, note_text)
                        painter.restore()
                        painter.setFont(f)  # Restore bold font
                    else:
                        painter.drawText(QRect(x+10, self.cur_y, w-20, row_h), align, str(val))
                else:
                    painter.drawText(QRect(x+5, self.cur_y, w-10, row_h), align, str(val))
                x += w
            self.cur_y += row_h

    def _draw_equation_rows(self, painter, items_to_draw, cols, row_h, font_size):
        last_party = None
        f_data = QFont("Segoe UI", 0, QFont.Weight.Bold)
        f_data.setPixelSize(font_size)
        
        for item in items_to_draw:
            # Handle both dict (Estimate) and list (Equation Report) formats
            if isinstance(item, list):
                # Format from main.py prepare_report: [Party, %, Item, PCS, Boxes, Mult, Share, Rate, Weight, Total]
                if len(item) < 10: continue
                current_party = str(item[0])
                share_per = str(item[1])
                desc = str(item[2])
                pcs = str(item[3])
                boxes = str(item[4])
                mult = str(item[5])
                bill_qty = str(item[6])
                rate = str(item[7])
                weight = str(item[8])
                total = str(item[9])
                paid_amt = str(item[10]) if len(item) > 10 else "0"
            else:
                current_party = str(item.get("party", "Unknown"))
                share_per = str(item.get("share_per", ""))
                desc = str(item.get("desc", ""))
                pcs = f"{float(item.get('actual_qty', 0) or 0):g}"
                boxes = f"{float(item.get('boxes', 0) or 0):g}"
                mult = str(item.get("mult", ""))
                bill_qty = str(item.get("bill_qty", ""))
                rate = f"{float(item.get('rate', 0.0)):,.2f}"
                weight = f"{float(item.get('weight', 0) or 0):.2f}"
                total = f"{float(item.get('total', 0.0) or 0.0):,.2f}"
                paid_amt = "0"

            # --- PARTY HEADER ---
            if current_party != last_party:
                last_party = current_party
                self.cur_y += 20
                f_party = QFont("Segoe UI", 0, QFont.Weight.Bold)
                f_party.setPixelSize(30)
                painter.setFont(f_party)
                painter.setPen(QPen(QColor("#1e40af")))
                
                header_text = f"PARTY: {current_party}"
                if share_per and share_per != "0":
                    header_text += f" ({share_per}%)"
                
                painter.drawText(QRect(self.margin, self.cur_y, self.W, 60), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, header_text)
                
                # Draw Paid Amt on the Right side of the header line
                if paid_amt and paid_amt != "0":
                    amt_text = f"TOTAL: ₹ {paid_amt}"
                    painter.drawText(QRect(self.margin, self.cur_y, self.W - (2 * self.margin), 60), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, amt_text)

                self.cur_y += 70
                
                # Draw Table Headers for this Party
                x_hdr = self.margin
                f_hdr = QFont("Segoe UI", 0, QFont.Weight.Bold)
                f_hdr.setPixelSize(24)
                painter.setFont(f_hdr)
                for txt_hdr, w_hdr in cols:
                    painter.setPen(Qt.PenStyle.NoPen)
                    painter.setBrush(QBrush(Qt.GlobalColor.black))
                    painter.drawRect(x_hdr, self.cur_y, w_hdr, row_h)
                    painter.setPen(QPen(Qt.GlobalColor.white))
                    painter.drawText(QRect(x_hdr+5, self.cur_y, w_hdr-10, row_h), Qt.AlignmentFlag.AlignCenter, txt_hdr)
                    x_hdr += w_hdr
                self.cur_y += row_h

            # --- DATA ROW ---
            painter.setFont(f_data)
            painter.setPen(QPen(Qt.GlobalColor.black, 2))
            painter.setBrush(Qt.BrushStyle.NoBrush)
            
            clean_desc = desc.replace(".", "").replace("-", " ")
            row_data = [clean_desc, pcs, boxes, mult, bill_qty, rate, weight, total]
            
            x = self.margin
            for i, val in enumerate(row_data):
                w = cols[i][1]
                painter.drawRect(x, self.cur_y, w, row_h)
                align = Qt.AlignmentFlag.AlignCenter
                if i == 0: align = Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter
                if i >= 5: align = Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter
                painter.drawText(QRect(x+10, self.cur_y, w-20, row_h), align, str(val))
                x += w
            self.cur_y += row_h

    def _draw_grid(self, painter, page_num=0):
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        total_val = 0.0
        
        # 1. Determine Columns and Settings
        if self.d.get("is_equation"):
            cols = [("ITEM NAME", 330), ("PCS", 100), ("BOXES", 90), ("MULT", 100), ("BILL QTY", 140), ("PRICE", 140), ("WEIGHT", 150), ("TOTAL", 240)]
            row_h = 85
            data_font_size = 25
        else:
            cols = self._get_table_cols()
            row_h = 60
            dyn_cols = self.d.get("dynamic_cols", []) or []
            data_font_size = 28 if len(dyn_cols) > 2 else 35

        items = self.d.get("items", [])
        
        # 2. SEPARATE MODES
        if self.d.get("is_summary_only"):
            self.is_last_page = True
            self.total_pages = 1
            self._draw_loading_header(painter)
        elif page_num == -1:
            # --- IMAGE COPY MODE (Single Long Document) ---
            self.is_last_page = True
            self.total_pages = 1
            
            self._draw_loading_header(painter)
                
            if self.d.get("is_equation"):
                self._draw_equation_rows(painter, items, cols, row_h, data_font_size)
            else:
                self._draw_column_headers(painter, cols, row_h)
                self._draw_data_rows_simple(painter, items, cols, row_h, data_font_size, start_idx=0, is_image=True)
            
        else:
            # --- PRINT MODE (Paginated) ---
            if self.d.get("fit_on_one_page"):
                items_to_draw = items
                start_idx = 0
                self.total_pages = 1
                self.is_last_page = True
            else:
                default_rows = 27
                rows_per_page = int(self.d.get("rows_per_page") or default_rows)
                start_idx = page_num * rows_per_page
                items_to_draw = items[start_idx : start_idx + rows_per_page]
                self.total_pages = max(1, (len(items) + rows_per_page - 1) // rows_per_page)
                self.is_last_page = (start_idx + rows_per_page >= len(items)) or (page_num >= self.total_pages - 1)

            self._draw_loading_header(painter)
                
            if self.d.get("is_equation"):
                self._draw_equation_rows(painter, items_to_draw, cols, row_h, data_font_size)
            else:
                self._draw_column_headers(painter, cols, row_h)
                self._draw_data_rows_simple(painter, items_to_draw, cols, row_h, data_font_size, start_idx=start_idx, is_image=False)

        

        

            

        
        last_party = None
        party_pcs_sum = 0.0

        
        # --- NEW: DRAW GROUP SECTION FOR ESTIMATE ---
        # Filter groups to ensure we only draw if there's actual content
        raw_groups = self.d.get("groups", [])
        groups = [g for g in raw_groups if any(str(x).strip() for x in g)]
        
        is_img_mode = (page_num == -1) or bool(self.d.get("is_image_mode"))
        
        if (self.d.get("is_estimate") or self.d.get("is_summary_only")) and self.is_last_page and groups:
            self.cur_y += 30
            # Header Label
            f_est = QFont("Segoe UI", 0, QFont.Weight.Bold)
            f_est.setPixelSize(35)
            painter.setFont(f_est)
            painter.setPen(QPen(Qt.GlobalColor.black))
            painter.drawText(QRect(self.margin, self.cur_y, self.W, 60), Qt.AlignmentFlag.AlignLeft, "GROUP SUMMARY / ESTIMATE TOTALS")
            self.cur_y += 60
            
            # Table Headers (Black BG / White Text)
            group_cols = [("MOULD NAME", 520), ("QTY", 230), ("PRICE", 230), ("TOTAL", 310)]
            x = self.margin
            for txt, w in group_cols:
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(QBrush(Qt.GlobalColor.black))
                painter.drawRect(x, self.cur_y, w, row_h)
                painter.setPen(QPen(Qt.GlobalColor.white))
                painter.drawText(QRect(x+5, self.cur_y, w-10, row_h), Qt.AlignmentFlag.AlignCenter, txt)
                x += w
            self.cur_y += row_h
            
            # Data Rows
            painter.setPen(QPen(Qt.GlobalColor.black, 2))
            painter.setBrush(Qt.BrushStyle.NoBrush) 
            for row in groups:
                x = self.margin
                
                # BG Color ONLY for Image Mode
                if is_img_mode:
                    painter.setPen(Qt.PenStyle.NoPen)
                    painter.setBrush(QBrush(QColor("#96b6d7")))
                    row_full_w = sum(c[1] for c in group_cols)
                    painter.drawRect(x, self.cur_y, row_full_w, row_h)
                    painter.setPen(QPen(Qt.GlobalColor.black, 2))
                    painter.setBrush(Qt.BrushStyle.NoBrush)

                for i, val in enumerate(row):
                    if i >= len(group_cols): break
                    
                    # --- SANITIZE MOULD NAME ---
                    draw_val = str(val)
                    if i == 0:
                        draw_val = draw_val.replace(".", "").replace("-", " ")

                    w = group_cols[i][1]
                    painter.drawRect(x, self.cur_y, w, row_h)
                    align = Qt.AlignmentFlag.AlignCenter
                    if i == 0: align = Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter
                    if i >= 2: align = Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter
                    painter.drawText(QRect(x+10, self.cur_y, w-20, row_h), align, draw_val)
                    x += w
                self.cur_y += row_h

        # Calculate Grand Total from Groups if in Estimate mode or Summary Only mode
        if self.d.get("is_estimate") or self.d.get("is_summary_only"):
            groups_sum = 0.0
            for row in self.d.get("groups", []):
                try:
                    if len(row) >= 4:
                        val_clean = str(row[3]).replace("₹", "").replace(",", "").strip()
                        groups_sum += float(val_clean)
                except: pass
            self.grand_total = groups_sum
        else:
            self.grand_total = total_val

    def _draw_footer(self, painter):
        self.cur_y += 30
        f = QFont("Segoe UI", 0, QFont.Weight.Bold)
        
        if self.d.get("is_loading_slip") and not self.d.get("is_estimate"):
            f.setPixelSize(30)
            f.setWeight(QFont.Weight.Bold)
            painter.setFont(f)
            # Draw Totals dynamically aligned under each column
            cols = self._get_table_cols()
            x_footer = self.margin
            for i, col_info in enumerate(cols):
                w = col_info[1]
                fld = col_info[2] if len(col_info) > 2 else None
                if i == 0:
                    pass # 'TOTAL' text removed as requested
                elif i == 1:
                    edit_id = str(self.d.get('edit_id', '')).strip()
                    if edit_id:
                        painter.drawText(QRect(x_footer + 15, self.cur_y, w - 15, 60), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, edit_id)
                elif fld and fld in self.col_sums:
                    sum_val = self.col_sums[fld]
                    if sum_val != 0:
                        painter.drawText(QRect(x_footer, self.cur_y, w, 60), Qt.AlignmentFlag.AlignCenter, f"{sum_val:g}")
                x_footer += w
        
        elif self.d.get("is_equation"):
            painter.setPen(QPen(Qt.GlobalColor.black, 3))
            painter.drawLine(self.margin, self.cur_y, self.W - self.margin, self.cur_y)
            self.cur_y += 10
            f.setPixelSize(30)
            f.setWeight(QFont.Weight.Bold)
            painter.setFont(f)
            # Alignment with cols: [("ITEM NAME", 330), ("PCS", 100), ("BOXES", 90), ("MULT", 100), ("BILL QTY", 140), ("PRICE", 140), ("WEIGHT", 150), ("TOTAL", 240)]
            painter.drawText(QRect(self.margin, self.cur_y, 330, 60), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, "GRAND TOTAL:")
            x_pcs = self.margin + 330
            painter.drawText(QRect(x_pcs, self.cur_y, 100, 60), Qt.AlignmentFlag.AlignCenter, f"{self.sum_pcs:g}")
            x_boxes = x_pcs + 100
            painter.drawText(QRect(x_boxes, self.cur_y, 90, 60), Qt.AlignmentFlag.AlignCenter, f"{self.sum_boxes:g}")
            x_weight = self.margin + 330 + 100 + 90 + 100 + 140 + 140
            painter.drawText(QRect(x_weight, self.cur_y, 150, 60), Qt.AlignmentFlag.AlignCenter, f"{self.sum_weight:.2f}")
            x_total = x_weight + 150
            painter.drawText(QRect(x_total, self.cur_y, 240, 60), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, format_indian_currency(self.sum_amt))

        elif self.d.get("is_estimate") or self.d.get("is_summary_only"):
            # --- SHARED ALIGNMENT CONFIG (Aligns flush with 1290px tables) ---
            table_right = self.margin + 1290
            block_w = 700
            val_w = 300
            x_label = table_right - block_w
            x_value = table_right - val_w
            
            # 1. Draw Sub-Total (Sum of Groups)
            self.cur_y += 40
            f_sub = QFont("Segoe UI", 0, QFont.Weight.Bold)
            f_sub.setPixelSize(35)
            painter.setFont(f_sub)
            painter.setPen(QPen(Qt.GlobalColor.black))
            
            painter.drawText(QRect(x_label, self.cur_y, block_w, 60), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, "SUB-TOTAL")
            painter.drawText(QRect(x_value, self.cur_y, val_w, 60), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, format_indian_currency(self.grand_total))
            
            # 2. Draw Adjustments if any
            adjs = self.d.get("adjustments", [])
            f_adj = QFont("Segoe UI", 0, QFont.Weight.Normal)
            f_adj.setPixelSize(30)
            f_adj.setItalic(True) # Italicize as requested
            painter.setFont(f_adj)
            
            final_total = self.grand_total
            is_img_adj = bool(getattr(self, 'is_img_mode_flag', False) or self.d.get("is_image_mode"))
            
            for adj in adjs:
                desc = adj.get("desc", "Adjustment")
                val = float(adj.get("val", 0.0) or 0.0)
                adj_type = str(adj.get("type", "")).lower()
                desc_lower = desc.lower()
                
                # Check if adjustment is Receive (Paisa Aaya) vs Pay (Paisa Gaya)
                is_recv = False
                if adj_type in ("receive", "recv", "sub_receive"):
                    is_recv = True
                elif adj_type in ("pay", "add_pay"):
                    is_recv = False
                elif "pay" in desc_lower or "debit" in desc_lower or "freight" in desc_lower or "bhada" in desc_lower or "lene wala" in desc_lower or "bakaya" in desc_lower:
                    is_recv = False
                elif "receive" in desc_lower or "jama" in desc_lower or "recv" in desc_lower or "return" in desc_lower or "dene wala" in desc_lower or "advance" in desc_lower or "discount" in desc_lower:
                    is_recv = True
                elif adj_type == "add":
                    is_recv = True # In modern UI '+' was Receive
                elif adj_type == "sub":
                    is_recv = False # In modern UI '-' was Pay
                else:
                    is_recv = True
                
                if is_recv:
                    final_total -= val
                    prefix = "(-)"
                    val_color = QColor("#16a34a") if is_img_adj else Qt.GlobalColor.black # Green for Receive
                else:
                    final_total += val
                    prefix = "(+)"
                    val_color = QColor("#dc2626") if is_img_adj else Qt.GlobalColor.black # Red for Pay
                
                self.cur_y += 45
                painter.setPen(QPen(Qt.GlobalColor.black))
                painter.drawText(QRect(x_label, self.cur_y, block_w, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"{prefix} {desc}")
                painter.setPen(QPen(val_color))
                painter.drawText(QRect(x_value, self.cur_y, val_w, 50), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, format_indian_currency(val))
            
            # 3. Draw Final Balance with custom label (or ADVANCE if negative)
            self.cur_y += 65
            f.setPixelSize(48)
            f.setWeight(QFont.Weight.Bold)
            f.setItalic(False) # Ensure not italic
            painter.setFont(f)
            painter.setPen(QPen(Qt.GlobalColor.black))
            
            custom_lbl = str(self.d.get("balance_label") or "").strip()
            if not custom_lbl:
                custom_lbl = "ADVANCE" if final_total < 0 else "BALANCE"
            balance_label = custom_lbl.upper()
            display_val = format_indian_currency(abs(final_total) if final_total < 0 else final_total)
                
            painter.drawText(QRect(x_label, self.cur_y, block_w, 80), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"{balance_label}")
            painter.drawText(QRect(x_value, self.cur_y, val_w, 80), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, display_val)
        else:
            if not self.d.get("is_equation"):
                f.setPixelSize(45) # ENLARGED Total Font
                painter.setFont(f)
                painter.drawText(self.W - 650, self.cur_y, f"NET TOTAL: ₹ {self.grand_total:,.2f}")
                
                # Report Footer Label
                bill_type = self.d.get("bill_type", "Bill")
                if bill_type == "Order":
                     f.setPixelSize(40)
                     painter.setFont(f)
                     painter.setPen(QColor("#000000"))
                     painter.drawText(QRect(0, self.cur_y + 100, self.W, 70), Qt.AlignmentFlag.AlignCenter, "--- ORDERS ---")


def qc(h): return QColor(h)

def format_indian_currency(num):
    try:
        val = float(num)
        s = f"{abs(val):.2f}"
        parts = s.split(".")
        integer_part = parts[0]
        decimal_part = parts[1]
        
        if len(integer_part) <= 3:
            res = f"{integer_part}.{decimal_part}"
        else:
            last_three = integer_part[-3:]
            remaining = integer_part[:-3]
            groups = []
            while remaining:
                groups.append(remaining[-2:])
                remaining = remaining[:-2]
            groups.reverse()
            res = ",".join(groups) + "," + last_three + "." + decimal_part
        
        return f"₹ {res}" if val >= 0 else f"-₹ {res}"
    except:
        return "₹ 0.00"

