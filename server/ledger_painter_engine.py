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

        # Totals calculation
        self.total_dr = 0.0
        self.total_cr = 0.0
        for e in self.entries:
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

        self.net = self.total_dr - self.total_cr

        # Compute pagination
        # Page 1 top takes ~200px before rows start
        # Page 2+ top takes ~60px
        self.row_h = 24
        self.pages = []
        self._paginate()

    def _paginate(self):
        curr_page = []
        page_idx = 0
        y = 200 # approximate y after headers on page 0
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
        cols = ["Date", "Type", "Bill No", "Particulars", "Debit (Dr)", "Credit (Cr)", "Balance"]
        col_ws = [int(table_W * p) for p in [0.11, 0.09, 0.09, 0.31, 0.13, 0.13, 0.14]]

        y = 40
        if page_num == 0:
            # Title
            font_title = QFont("Segoe UI")
            font_title.setBold(True)
            font_title.setPixelSize(34)
            painter.setFont(font_title)
            painter.setPen(QColor("#1e3a5f"))
            painter.drawText(QRect(0, y, self.W, 42), Qt.AlignmentFlag.AlignCenter, "LEDGER / KHATA BAHI")
            y += 50

            # Party name & Period
            font_party = QFont("Segoe UI")
            font_party.setPixelSize(20)
            painter.setFont(font_party)
            painter.setPen(QColor("#374151"))
            p_text = f"Party: {self.party}"
            if self.date_from or self.date_to:
                p_text += f"    |    Period: {self.date_from or 'Start'} to {self.date_to or 'Current'}"
            painter.drawText(QRect(40, y, self.W - 80, 26), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, p_text)
            y += 32

            # Concise summary line
            summary_txt = f"Billed (Dr): \u20b9{self.total_dr:,.2f}    |    Received (Cr): \u20b9{self.total_cr:,.2f}    |    Net Balance: \u20b9{abs(self.net):,.2f} {'Dr' if self.net > 0 else ('Cr' if self.net < 0 else '')}"
            font_summary = QFont("Segoe UI")
            font_summary.setBold(True)
            font_summary.setPixelSize(17)
            painter.setFont(font_summary)
            painter.setPen(QColor("#dc2626") if self.net > 0 else QColor("#16a34a"))
            painter.drawText(QRect(40, y, self.W - 80, 24), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, summary_txt)
            y += 32

            # Separator line
            painter.setPen(QColor("#1e3a5f"))
            painter.drawLine(40, y, self.W - 40, y)
            y += 14
        else:
            # Header for continuing pages
            font_sub = QFont("Segoe UI")
            font_sub.setBold(True)
            font_sub.setPixelSize(18)
            painter.setFont(font_sub)
            painter.setPen(QColor("#1e3a5f"))
            painter.drawText(QRect(40, y, self.W - 80, 24), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, f"Party: {self.party} (Page {page_num + 1} of {self.total_pages})")
            y += 32

        # Draw Table Header
        font_header = QFont("Segoe UI")
        font_header.setBold(True)
        font_header.setPixelSize(15)
        painter.setFont(font_header)
        painter.fillRect(QRect(40, y, table_W, 26), QColor("#1e3a5f"))
        painter.setPen(QColor("#ffffff"))
        x = 40
        for ci, (ch, cw) in enumerate(zip(cols, col_ws)):
            align = Qt.AlignmentFlag.AlignLeft if ci == 3 else Qt.AlignmentFlag.AlignCenter
            x_pad = 6 if ci == 3 else 0
            painter.drawText(QRect(x + x_pad, y, cw - (x_pad * 2), 26), align | Qt.AlignmentFlag.AlignVCenter, ch)
            x += cw
        y += 26

        # Draw Rows for this page
        font_row = QFont("Segoe UI")
        font_row.setPixelSize(14)
        painter.setFont(font_row)
        page_entries = self.pages[page_num] if page_num < len(self.pages) else []

        for r_idx, item in enumerate(page_entries):
            bg = "#f8fafc" if r_idx % 2 == 0 else "#ffffff"
            painter.fillRect(QRect(40, y, table_W, self.row_h), QColor(bg))

            date_val = str(item.get("date", "")).strip()
            type_val = str(item.get("type", "")).strip().upper()
            bill_val = str(item.get("billNo", item.get("bill_no", ""))).strip()
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

            row_data = [date_val, type_val, bill_val, part_val, dr_val, cr_val, bal_val]

            x = 40
            for ci, (val, cw) in enumerate(zip(row_data, col_ws)):
                align = Qt.AlignmentFlag.AlignCenter
                x_pad = 2
                if ci == 3:
                    align = Qt.AlignmentFlag.AlignLeft
                    x_pad = 6
                
                if ci == 4 and val != "\u2014":
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
            font_total.setPixelSize(14)
            painter.setFont(font_total)

            label_w = col_ws[0] + col_ws[1] + col_ws[2] + col_ws[3]
            painter.setPen(QColor("#1e3a5f"))
            painter.drawText(QRect(40 + 2, y, label_w - 6, self.row_h), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, "TOTALS / BALANCE: ")

            # Debit Sum
            x_dr = 40 + label_w
            val_dr = f"\u20b9{self.total_dr:,.2f}" if self.total_dr > 0 else "\u2014"
            painter.setPen(QColor("#dc2626") if self.total_dr > 0 else QColor("#374151"))
            painter.drawText(QRect(x_dr + 2, y, col_ws[4] - 4, self.row_h), Qt.AlignmentFlag.AlignCenter | Qt.AlignmentFlag.AlignVCenter, val_dr)

            # Credit Sum
            x_cr = x_dr + col_ws[4]
            val_cr = f"\u20b9{self.total_cr:,.2f}" if self.total_cr > 0 else "\u2014"
            painter.setPen(QColor("#16a34a") if self.total_cr > 0 else QColor("#374151"))
            painter.drawText(QRect(x_cr + 2, y, col_ws[5] - 4, self.row_h), Qt.AlignmentFlag.AlignCenter | Qt.AlignmentFlag.AlignVCenter, val_cr)

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
                painter.setPen(QColor("#374151"))
            painter.drawText(QRect(x_bal + 2, y, col_ws[6] - 4, self.row_h), Qt.AlignmentFlag.AlignCenter | Qt.AlignmentFlag.AlignVCenter, val_bal)

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
