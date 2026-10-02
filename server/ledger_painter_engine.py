# Native PyQt6 LedgerPainter Engine extracted from F:\SUMMARY\BillApp\main.py
# Resolution-independent Virtual Canvas (1000 x 1414) for A4 Portrait Ledger Printing & Previews

from PyQt6.QtCore import Qt, QRect
from PyQt6.QtGui import QFont, QPen, QColor, QPainter, QImage

class LedgerPainter:
    def __init__(self, data):
        """
        data expected format:
        {
            "party": str,
            "dateFrom": str,
            "dateTo": str,
            "entries": [
                {
                    "date": str,
                    "type": str,
                    "billNo": str,
                    "particulars": str,
                    "debit": float or str,
                    "credit": float or str,
                    "balance": float or str
                }, ...
            ],
            "totalDebit": float,
            "totalCredit": float,
            "netBalance": float
        }
        """
        self.d = data
        self.W = 1000
        self.H = 1414
        self.party = str(self.d.get("party", "")).strip() or "All Parties"
        self.date_from = str(self.d.get("dateFrom", "")).strip()
        self.date_to = str(self.d.get("dateTo", "")).strip()
        self.entries = self.d.get("entries", []) or []

        self.party_info = self.d.get("partyInfo", {}) or {}
        self.opening_balance = float(self.d.get("openingBalance", 0) or 0)

        # Totals calculation
        self.total_dr = 0.0
        self.total_cr = 0.0
        for e in self.entries:
            if str(e.get("type", "")).upper() == 'OPENING BALANCE':
                continue
            try:
                dr = float(str(e.get("debit", 0)).replace("₹", "").replace(",", "").strip() or 0)
                self.total_dr += dr
            except Exception:
                pass
            try:
                cr = float(str(e.get("credit", 0)).replace("₹", "").replace(",", "").strip() or 0)
                self.total_cr += cr
            except Exception:
                pass

        if "totalDebit" in self.d and self.d["totalDebit"] is not None:
            try: self.total_dr = float(self.d["totalDebit"])
            except: pass
        if "totalCredit" in self.d and self.d["totalCredit"] is not None:
            try: self.total_cr = float(self.d["totalCredit"])
            except: pass

        if "netBalance" in self.d and self.d["netBalance"] is not None:
            try: self.net = float(self.d["netBalance"])
            except: self.net = round(self.opening_balance + self.total_dr - self.total_cr, 2)
        else:
            self.net = round(self.opening_balance + self.total_dr - self.total_cr, 2)

        # Compute pagination
        # Page 1 top takes ~250px before rows start (with party metadata)
        # Page 2+ top takes ~80px
        self.row_h = 24
        self.pages = []
        self._paginate()

    def _paginate(self):
        curr_page = []
        page_idx = 0
        y = 240 # approximate y after headers on page 0
        max_y = self.H - 80

        for item in self.entries:
            if y + self.row_h > max_y:
                self.pages.append(curr_page)
                curr_page = []
                page_idx += 1
                y = 80 # header space on subsequent pages
            curr_page.append(item)
            y += self.row_h

        # check if totals fit on current page
        if y + self.row_h + 30 > max_y and curr_page:
            self.pages.append(curr_page)
            self.pages.append([]) # empty items page for totals
        else:
            self.pages.append(curr_page)

        self.total_pages = max(1, len(self.pages))

    def paint(self, painter: QPainter, rect, page_num=0):
        if page_num < 0 or page_num >= self.total_pages:
            page_num = 0

        painter.save()
        painter.setViewport(rect)
        painter.setWindow(0, 0, self.W, self.H)

        # White background
        painter.fillRect(QRect(0, 0, self.W, self.H), QColor("#ffffff"))

        # Setup geometry & columns
        table_W = self.W - 80
        cols = ["Date", "Type", "Voucher #", "Particulars", "Debit (Dr)", "Credit (Cr)", "Balance"]
        col_ws = [int(table_W * p) for p in [0.11, 0.11, 0.10, 0.28, 0.13, 0.13, 0.14]]

        y = 35
        if page_num == 0:
            # Title
            font_title = QFont("Segoe UI")
            font_title.setBold(True)
            font_title.setPixelSize(30)
            painter.setFont(font_title)
            painter.setPen(QColor("#1e3a5f"))
            painter.drawText(QRect(0, y, self.W, 36), Qt.AlignmentFlag.AlignCenter, "LEDGER / KHATA BAHI")
            y += 42

            # Party name
            font_party = QFont("Segoe UI")
            font_party.setBold(True)
            font_party.setPixelSize(20)
            painter.setFont(font_party)
            painter.setPen(QColor("#0f172a"))
            painter.drawText(QRect(40, y, self.W - 80, 26), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"Party: {self.party}")
            y += 26

            # Party Metadata (Phone, GSTIN, Station)
            meta_parts = []
            phone = self.party_info.get("phone") or ""
            gstin = self.party_info.get("gstin") or ""
            station = self.party_info.get("station") or ""
            district = self.party_info.get("district") or ""
            state = self.party_info.get("state") or ""

            if phone: meta_parts.append(f"Phone: {phone}")
            if gstin: meta_parts.append(f"GSTIN: {gstin}")
            loc = ", ".join(filter(None, [station, district, state]))
            if loc: meta_parts.append(f"Station: {loc}")

            if meta_parts:
                font_meta = QFont("Segoe UI")
                font_meta.setPixelSize(13)
                painter.setFont(font_meta)
                painter.setPen(QColor("#64748b"))
                painter.drawText(QRect(40, y, self.W - 80, 20), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, "    |    ".join(meta_parts))
                y += 22

            # Period & Opening Balance Line
            font_period = QFont("Segoe UI")
            font_period.setPixelSize(14)
            painter.setFont(font_period)
            painter.setPen(QColor("#334155"))
            p_text = f"Period: {self.date_from or 'Start'} to {self.date_to or 'Current'}"
            if self.opening_balance != 0:
                op_sign = "Dr" if self.opening_balance > 0 else "Cr"
                p_text += f"    |    Opening Balance (B/F): \u20b9{abs(self.opening_balance):,.2f} {op_sign}"
            painter.drawText(QRect(40, y, self.W - 80, 22), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, p_text)
            y += 26

            # Concise summary line
            summary_txt = f"Total Billed (Dr): \u20b9{self.total_dr:,.2f}    |    Total Received (Cr): \u20b9{self.total_cr:,.2f}    |    Net Closing Balance: \u20b9{abs(self.net):,.2f} {'Dr' if self.net > 0 else ('Cr' if self.net < 0 else 'Nil')}"
            font_summary = QFont("Segoe UI")
            font_summary.setBold(True)
            font_summary.setPixelSize(15)
            painter.setFont(font_summary)
            painter.setPen(QColor("#dc2626") if self.net > 0 else (QColor("#16a34a") if self.net < 0 else QColor("#475569")))
            painter.drawText(QRect(40, y, self.W - 80, 24), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, summary_txt)
            y += 28

            # Separator line
            painter.setPen(QColor("#cbd5e1"))
            painter.drawLine(40, y, self.W - 40, y)
            y += 12
        else:
            # Header for continuing pages
            font_sub = QFont("Segoe UI")
            font_sub.setBold(True)
            font_sub.setPixelSize(16)
            painter.setFont(font_sub)
            painter.setPen(QColor("#1e3a5f"))
            painter.drawText(QRect(40, y, self.W - 80, 24), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"Party: {self.party}    |    Period: {self.date_from or 'Start'} to {self.date_to or 'Current'} (Page {page_num + 1} of {self.total_pages})")
            y += 32

        # Draw Table Header
        font_header = QFont("Segoe UI")
        font_header.setBold(True)
        font_header.setPixelSize(13)
        painter.setFont(font_header)
        painter.fillRect(QRect(40, y, table_W, 26), QColor("#1e3a5f"))
        painter.setPen(QColor("#ffffff"))
        x = 40
        for ci, (ch, cw) in enumerate(zip(cols, col_ws)):
            align = Qt.AlignmentFlag.AlignLeft if ci == 3 else (Qt.AlignmentFlag.AlignRight if ci in (4, 5, 6) else Qt.AlignmentFlag.AlignCenter)
            x_pad = 8 if ci in (3, 4, 5, 6) else 0
            painter.drawText(QRect(x + x_pad, y, cw - (x_pad * 2), 26), align | Qt.AlignmentFlag.AlignVCenter, ch)
            x += cw
        y += 26

        # Draw Rows for this page
        font_row = QFont("Segoe UI")
        font_row.setPixelSize(13)
        painter.setFont(font_row)
        page_entries = self.pages[page_num] if page_num < len(self.pages) else []

        for r_idx, item in enumerate(page_entries):
            type_val = str(item.get("type", "")).strip().upper()
            is_opening = type_val == "OPENING BALANCE"

            bg = "#fef9c3" if is_opening else ("#f8fafc" if r_idx % 2 == 0 else "#ffffff")
            painter.fillRect(QRect(40, y, table_W, self.row_h), QColor(bg))

            date_val = str(item.get("date", "")).strip()
            bill_val = str(item.get("voucher", item.get("billNo", item.get("bill_no", "")))).strip()
            part_val = str(item.get("particulars", "")).strip()
            
            dr_raw = item.get("debit", 0)
            dr_val = f"\u20b9{float(dr_raw):,.2f}" if (dr_raw and float(dr_raw) > 0) else "\u2014"
            
            cr_raw = item.get("credit", 0)
            cr_val = f"\u20b9{float(cr_raw):,.2f}" if (cr_raw and float(cr_raw) > 0) else "\u2014"
            
            bal_raw = item.get("balance", "")
            if isinstance(bal_raw, (int, float)):
                bal_val = f"\u20b9{abs(float(bal_raw)):,.2f}" + (" Dr" if float(bal_raw) > 0 else (" Cr" if float(bal_raw) < 0 else ""))
            else:
                bal_val = str(bal_raw) or "\u2014"

            row_data = [date_val, "B/F" if is_opening else type_val, bill_val, part_val, dr_val, cr_val, bal_val]

            x = 40
            for ci, (val, cw) in enumerate(zip(row_data, col_ws)):
                align = Qt.AlignmentFlag.AlignCenter
                x_pad = 2
                if ci == 3:
                    align = Qt.AlignmentFlag.AlignLeft
                    x_pad = 8
                elif ci in (4, 5, 6):
                    align = Qt.AlignmentFlag.AlignRight
                    x_pad = 8
                
                if is_opening:
                    painter.setPen(QColor("#b45309"))
                elif ci == 4 and val != "\u2014":
                    painter.setPen(QColor("#dc2626"))
                elif ci == 5 and val != "\u2014":
                    painter.setPen(QColor("#16a34a"))
                elif ci == 6 and val != "\u2014":
                    painter.setPen(QColor("#dc2626") if "Dr" in val else (QColor("#16a34a") if "Cr" in val else QColor("#374151")))
                else:
                    painter.setPen(QColor("#374151"))

                painter.drawText(QRect(x + x_pad, y, cw - (x_pad * 2), self.row_h), align | Qt.AlignmentFlag.AlignVCenter, val)
                x += cw

            painter.setPen(QColor("#e2e8f0"))
            painter.drawLine(40, y + self.row_h, self.W - 40, y + self.row_h)
            y += self.row_h

        # If last page, draw Totals Row
        if page_num == self.total_pages - 1:
            y += 4
            # Double line at the top of the totals row
            painter.setPen(QColor("#1e3a5f"))
            painter.drawLine(40, y, self.W - 40, y)
            painter.drawLine(40, y + 2, self.W - 40, y + 2)
            y += 5

            # Background for totals row
            painter.fillRect(QRect(40, y, table_W, self.row_h), QColor("#f1f5f9"))

            font_total = QFont("Segoe UI")
            font_total.setBold(True)
            font_total.setPixelSize(13)
            painter.setFont(font_total)

            label_w = col_ws[0] + col_ws[1] + col_ws[2] + col_ws[3]
            painter.setPen(QColor("#1e3a5f"))
            painter.drawText(QRect(40 + 2, y, label_w - 10, self.row_h), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, "TOTALS / CLOSING BALANCE: ")

            # Debit Sum
            x_dr = 40 + label_w
            val_dr = f"\u20b9{self.total_dr:,.2f}" if self.total_dr > 0 else "\u2014"
            painter.setPen(QColor("#dc2626") if self.total_dr > 0 else QColor("#374151"))
            painter.drawText(QRect(x_dr + 2, y, col_ws[4] - 10, self.row_h), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, val_dr)

            # Credit Sum
            x_cr = x_dr + col_ws[4]
            val_cr = f"\u20b9{self.total_cr:,.2f}" if self.total_cr > 0 else "\u2014"
            painter.setPen(QColor("#16a34a") if self.total_cr > 0 else QColor("#374151"))
            painter.drawText(QRect(x_cr + 2, y, col_ws[5] - 10, self.row_h), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, val_cr)

            # Net Balance
            x_bal = x_cr + col_ws[5]
            val_bal = f"\u20b9{abs(self.net):,.2f}"
            if self.net > 0:
                val_bal += " Dr"
                painter.setPen(QColor("#dc2626"))
            elif self.net < 0:
                val_bal += " Cr"
                painter.setPen(QColor("#16a34a"))
            else:
                val_bal = "Nil (₹0.00)"
                painter.setPen(QColor("#374151"))
            painter.drawText(QRect(x_bal + 2, y, col_ws[6] - 10, self.row_h), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, val_bal)

            y += self.row_h
            # Double line at bottom of totals row
            painter.setPen(QColor("#1e3a5f"))
            painter.drawLine(40, y, self.W - 40, y)
            painter.drawLine(40, y + 2, self.W - 40, y + 2)

        # Footer page number
        painter.setFont(QFont("Segoe UI", 10))
        painter.setPen(QColor("#94a3b8"))
        painter.drawText(QRect(40, self.H - 35, self.W - 80, 20), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, f"Page {page_num + 1} of {self.total_pages}")

        painter.restore()
