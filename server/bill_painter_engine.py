# Native PyQt6 BillPainter Engine extracted from F:\SUMMARY\BillApp\main.py
# 100% Exact Desktop Print & Image Engine

import sys
import re
from collections import defaultdict
from PyQt6.QtCore import Qt, QRect, QSize, QSizeF, QPoint
from PyQt6.QtGui import QFont, QPen, QBrush, QColor, QPainter, QImage, QPixmap, QPageSize, QPageLayout
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
        
        painter.drawText(QRect(0, 30, self.W, 80), Qt.AlignmentFlag.AlignCenter, title)
        
        # Info Block
        f_i = QFont("Segoe UI", 0, QFont.Weight.Normal)
        f_i.setPixelSize(35)
        painter.setFont(f_i)
        y = 130
        
        bill_label = f"{pfx}NO:" if pfx else "BILL NO:"
        if self.d.get("is_loading_slip") and not self.d.get("is_estimate"):
            bill_label = f"{pfx}SLIP NO:" if pfx else "SLIP NO:"

        edit_sfx = f" [{self.d.get('edit_id')}]" if self.d.get('edit_id') else ""
        painter.drawText(self.margin, y, f"{bill_label} {self.d.get('bill_no', 'N/A')}{edit_sfx}")
        painter.drawText(self.W - 400, y, f"DATE: {format_display_date(self.d.get('date', 'N/A'))}")
        
        if not self.d.get("is_equation"):
            y += 50
            painter.drawText(self.margin, y, f"PARTY: {self.d.get('party', 'N/A')}")
            v_name = str(self.d.get('v_name', '')).strip()
            if v_name:
                painter.drawText(self.W - 400, y, f"VEHICLE: {v_name}")
        
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
                rows_per_page = 27 if self.d.get("is_loading_slip") else 20
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
        
        is_img_mode = (page_num == -1)
        
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
            for col_info in cols:
                w = col_info[1]
                fld = col_info[2] if len(col_info) > 2 else None
                if fld and fld in self.col_sums:
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
            # Alignment with columns: %, ITEM, PCS, BOXES, MULT, BILL, PRICE, TOTAL
            # Widths: 110, 280, 110, 110, 150, 150, 150, 230
            x_pcs = self.margin + 110 + 280
            painter.drawText(QRect(x_pcs, self.cur_y, 100, 60), Qt.AlignmentFlag.AlignCenter, f"{self.sum_pcs:g}")
            painter.drawText(QRect(x_pcs + 100, self.cur_y, 90, 60), Qt.AlignmentFlag.AlignCenter, f"{self.sum_boxes:g}")
            # Total Column
            x_weight = x_pcs + 100 + 90 + 100 + 140 + 140
            painter.drawText(QRect(x_weight, self.cur_y, 150, 60), Qt.AlignmentFlag.AlignCenter, f"{self.sum_weight:.2f}")
            x_total = x_weight + 150
            painter.drawText(QRect(x_total, self.cur_y, 240, 60), Qt.AlignmentFlag.AlignCenter, f"₹ {self.sum_amt:,.2f}")

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
            
            for adj in adjs:
                desc = adj.get("desc", "Adjustment")
                val = adj.get("val", 0.0)
                adj_type = adj.get("type", "add")
                
                if adj_type == "sub":
                    final_total -= val
                    prefix = "(-)"
                else:
                    final_total += val
                    prefix = "(+)"
                
                self.cur_y += 45
                painter.drawText(QRect(x_label, self.cur_y, block_w, 50), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"{prefix} {desc}")
                painter.drawText(QRect(x_value, self.cur_y, val_w, 50), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, format_indian_currency(val))
            
            # 3. Draw Final Balance with custom label
            self.cur_y += 65
            f.setPixelSize(48)
            f.setWeight(QFont.Weight.Bold)
            f.setItalic(False) # Ensure not italic
            painter.setFont(f)
            painter.setPen(QPen(Qt.GlobalColor.black))
            
            balance_label = self.d.get("balance_label", "BALANCE")
            painter.drawText(QRect(x_label, self.cur_y, block_w, 80), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"{balance_label}")
            painter.drawText(QRect(x_value, self.cur_y, val_w, 80), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, format_indian_currency(final_total))
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

