"""
db_server.py — BillApp SQLite Database Server
USB-portable: billapp.db stored alongside this file
Speed: WAL mode, in-memory cache for reads
Port: 5006
"""
import sys, os, json, sqlite3, time, re
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Lock

# ─── DB Path (same folder as this script = USB portable) ──────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, '..', 'billapp.db')
DB_PATH = os.path.normpath(DB_PATH)

db_lock = Lock()

# ─── Init DB ──────────────────────────────────────────────────────────────────
def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # WAL = max concurrent read/write speed
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA cache_size=10000")
    conn.execute("PRAGMA temp_store=MEMORY")
    return conn

def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS bills (
                id TEXT PRIMARY KEY,
                token TEXT NOT NULL,
                date TEXT NOT NULL,
                party TEXT NOT NULL,
                doc_type TEXT DEFAULT 'SALE BILL',
                vehicle TEXT DEFAULT '',
                type_selection TEXT DEFAULT 'WHOLESALE',
                total REAL DEFAULT 0,
                status TEXT DEFAULT 'PAID',
                raw_items TEXT DEFAULT '[]',
                finished_items TEXT DEFAULT '[]',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS parties (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT DEFAULT '',
                station TEXT DEFAULT '',
                district TEXT DEFAULT '',
                state_name TEXT DEFAULT '',
                pincode TEXT DEFAULT '',
                balance REAL DEFAULT 0,
                party_limit REAL DEFAULT 500000,
                gstin TEXT DEFAULT '',
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS skip_main_groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS skip_sub_groups (
                id TEXT PRIMARY KEY,
                main_group_id TEXT NOT NULL,
                main_group TEXT NOT NULL,
                group_name TEXT NOT NULL,
                sum_column TEXT DEFAULT 'QTY'
            );
            CREATE TABLE IF NOT EXISTS skip_items (
                id TEXT PRIMARY KEY,
                sub_group_id TEXT NOT NULL,
                main_group TEXT NOT NULL,
                group_name TEXT NOT NULL,
                item_prefix TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS control_panel (
                id TEXT PRIMARY KEY,
                shortcut TEXT NOT NULL,
                conversion TEXT NOT NULL,
                u_cap TEXT DEFAULT '0',
                l_cap TEXT DEFAULT '0',
                multiplication REAL DEFAULT 1.0,
                color TEXT DEFAULT '#000000',
                box_size REAL DEFAULT 1.0,
                weight_per_pcs REAL DEFAULT 0.0,
                real_item_name TEXT DEFAULT '',
                group_name TEXT DEFAULT '',
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS conversions (
                id TEXT PRIMARY KEY,
                shortcut TEXT NOT NULL,
                conversion TEXT NOT NULL,
                u_cap TEXT DEFAULT '0',
                l_cap TEXT DEFAULT '0',
                multiplication REAL DEFAULT 1.0,
                color TEXT DEFAULT '#000000',
                box_size REAL DEFAULT 1.0,
                weight_per_pcs REAL DEFAULT 0.0,
                real_item_name TEXT DEFAULT '',
                group_name TEXT DEFAULT '',
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS bill_item_names (
                id TEXT PRIMARY KEY,
                group_name TEXT NOT NULL,
                item_name TEXT NOT NULL,
                value TEXT DEFAULT '',
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS mould_prices (
                mould_name TEXT PRIMARY KEY,
                price REAL DEFAULT 0,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS bill_adjustments (
                id TEXT PRIMARY KEY,
                bill_db_id INTEGER,
                party TEXT,
                bill_date TEXT,
                adj_type TEXT,
                description TEXT,
                amount REAL,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS stock_items (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                category TEXT DEFAULT '',
                qty REAL DEFAULT 0,
                min_qty REAL DEFAULT 0,
                uom TEXT DEFAULT 'PCS',
                rack TEXT DEFAULT '',
                status TEXT DEFAULT 'IN STOCK',
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS party_receipts (
                id TEXT PRIMARY KEY,
                party TEXT NOT NULL,
                amount REAL NOT NULL,
                receipt_date TEXT NOT NULL,
                remarks TEXT DEFAULT 'Payment Received',
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS ledger (
                id TEXT PRIMARY KEY,
                party_id TEXT NOT NULL,
                date TEXT NOT NULL,
                entry_type TEXT NOT NULL,
                voucher TEXT DEFAULT '',
                particulars TEXT DEFAULT '',
                debit REAL DEFAULT 0,
                credit REAL DEFAULT 0,
                balance REAL DEFAULT 0,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS control_groups (
                id TEXT PRIMARY KEY,
                group_name TEXT NOT NULL,
                group_index TEXT DEFAULT '',
                weight_per_pc REAL DEFAULT 0,
                pcs_per_box INTEGER DEFAULT 1,
                multiplication REAL DEFAULT 1.0,
                real_item_name TEXT DEFAULT '',
                skip_eq INTEGER DEFAULT 0,
                chain_parent TEXT DEFAULT 'NONE',
                sort_order INTEGER DEFAULT 0,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_bills_token ON bills(token);
            CREATE INDEX IF NOT EXISTS idx_bills_party ON bills(party);
            CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
            CREATE INDEX IF NOT EXISTS idx_skip_items_prefix ON skip_items(item_prefix);
            CREATE INDEX IF NOT EXISTS idx_ledger_party ON ledger(party_id);
            CREATE INDEX IF NOT EXISTS idx_party_receipts_party ON party_receipts(party);
            CREATE INDEX IF NOT EXISTS idx_ctrl_groups_name ON control_groups(group_name);
        """)

        # Auto-seed default groups if empty
        grp_cnt = conn.execute("SELECT COUNT(*) FROM control_groups").fetchone()[0]
        if grp_cnt == 0:
            defaults = [
                ('grp-1', 'BFP', 'G-101', 0.85, 1, 1.0, 'BFP Gold Series Aluminium', 0, 'RAW-ALUM-6063', 1),
                ('grp-2', 'JOINTER', 'G-102', 1.20, 12, 1.25, 'Jointer Clamp 10mm Standard', 0, 'RAW-ALUM-6063', 2),
                ('grp-3', 'CAPS', 'G-103', 4.80, 6, 1.10, 'Die Core Cap 50mm Precision', 1, 'NONE', 3),
                ('grp-4', 'MOULDS', 'G-104', 12.50, 1, 1.50, 'Mould 14x20 Standard Housing', 0, 'RAW-HARDENER-H88', 4),
                ('grp-5', 'ACCESSORIES', 'G-105', 0.45, 24, 1.0, 'Flange Coupling Pin Alloy', 1, 'NONE', 5),
            ]
            now_ms = int(time.time() * 1000)
            for g in defaults:
                conn.execute("""
                    INSERT INTO control_groups (id, group_name, group_index, weight_per_pc, pcs_per_box, multiplication, real_item_name, skip_eq, chain_parent, sort_order, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (*g, now_ms))
            print(f"[DB] Initialized {len(defaults)} default control groups")

    print(f"[DB] SQLite initialized at: {DB_PATH}")

# ─── Helper ───────────────────────────────────────────────────────────────────
def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ─── HTTP Handler ─────────────────────────────────────────────────────────────
class DBHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Silent logging for speed

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        # ZERO CACHE: Ensure neither Edge nor Chrome ever caches critical database records
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        params = {}
        if '?' in self.path:
            import urllib.parse
            qs = self.path.split('?')[1]
            for kv in qs.split('&'):
                if '=' in kv:
                    k, v = kv.split('=', 1)
                    params[urllib.parse.unquote_plus(k)] = urllib.parse.unquote_plus(v)


        try:
            with db_lock, get_conn() as conn:
                # ── Root Dashboard ──
                if path in ('/', ''):
                    bill_count = conn.execute("SELECT COUNT(*) FROM bills").fetchone()[0]
                    party_count = conn.execute("SELECT COUNT(*) FROM parties").fetchone()[0]
                    skip_count = conn.execute("SELECT COUNT(*) FROM skip_items").fetchone()[0]
                    db_size = round(os.path.getsize(DB_PATH) / 1024 / 1024, 2) if os.path.exists(DB_PATH) else 0
                    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Modern Summary App - SQLite Engine</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px; margin: 0; }}
        .card {{ background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }}
        .badge {{ display: inline-block; background: #10b981; color: #fff; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; }}
        h1 {{ margin-top: 0; font-size: 22px; color: #38bdf8; display: flex; align-items: center; justify-content: space-between; }}
        .stat {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }}
        .stat:last-child {{ border-bottom: none; }}
        .val {{ font-weight: bold; color: #a78bfa; font-family: monospace; font-size: 15px; }}
        .link {{ color: #38bdf8; text-decoration: none; font-size: 13px; }}
        .link:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
    <div class="card">
        <h1><span>⚡ SQLite DB Server</span> <span class="badge">ONLINE</span></h1>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">Dedicated High-Speed USB Database Engine for Modern Summary App</p>
        <div class="stat"><span>Database File</span><span class="val" style="font-size: 12px; color: #e2e8f0;">{DB_PATH}</span></div>
        <div class="stat"><span>Status</span><span class="val" style="color: #34d399;">Active (WAL Mode)</span></div>
        <div class="stat"><span>Total Saved Bills</span><span class="val">{bill_count}</span></div>
        <div class="stat"><span>Total Parties</span><span class="val">{party_count}</span></div>
        <div class="stat"><span>Skip Items Cached</span><span class="val">{skip_count}</span></div>
        <div class="stat"><span>Database File Size</span><span class="val">{db_size} MB</span></div>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 15px;">
            <a class="link" href="/api/db/info" target="_blank">View Raw JSON Info →</a>
            <a class="link" href="/api/db/bills" target="_blank">View Bills API →</a>
            <a class="link" href="/api/db/parties" target="_blank">View Parties API →</a>
        </div>
    </div>
</body>
</html>"""
                    body = html.encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(body)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(body)
                    return

                # ── Status ──
                elif path == '/api/db/status':
                    self.send_json({'status': 'ok', 'db': DB_PATH})

                # ── Bills ──
                elif path == '/api/db/bills':
                    rows = conn.execute("SELECT * FROM bills ORDER BY CAST(token AS INTEGER) DESC").fetchall()
                    bills = []
                    for r in rows:
                        b = dict(r)
                        b['rawItems'] = json.loads(b.pop('raw_items', '[]'))
                        b['finishedItems'] = json.loads(b.pop('finished_items', '[]'))
                        b['docType'] = b.pop('doc_type', 'SALE BILL')
                        b['typeSelection'] = b.pop('type_selection', 'WHOLESALE')
                        b['createdAt'] = b.pop('created_at', 0)
                        b['updatedAt'] = b.pop('updated_at', 0)
                        bills.append(b)
                    self.send_json(bills)

                elif path.startswith('/api/db/bills/'):
                    bid = path.split('/')[-1]
                    row = conn.execute("SELECT * FROM bills WHERE id=?", (bid,)).fetchone()
                    if row:
                        b = dict(row)
                        b['rawItems'] = json.loads(b.pop('raw_items', '[]'))
                        b['finishedItems'] = json.loads(b.pop('finished_items', '[]'))
                        b['docType'] = b.pop('doc_type', 'SALE BILL')
                        b['typeSelection'] = b.pop('type_selection', 'WHOLESALE')
                        b['createdAt'] = b.pop('created_at', 0)
                        b['updatedAt'] = b.pop('updated_at', 0)
                        self.send_json(b)
                    else:
                        self.send_json(None)

                # ── Parties ──
                elif path == '/api/db/parties':
                    rows = conn.execute("SELECT * FROM parties ORDER BY name").fetchall()
                    parties = []
                    known_names = set()
                    for r in rows:
                        p = dict(r)
                        p['state'] = p.pop('state_name', '')
                        p['limit'] = p.pop('party_limit', 500000)
                        p['updatedAt'] = p.pop('updated_at', 0)
                        parties.append(p)
                        known_names.add(p['name'].strip().lower())

                    # Merge distinct parties from bills so autocomplete has both base & suffixed names
                    bill_parties = conn.execute("SELECT DISTINCT party FROM bills WHERE party IS NOT NULL AND TRIM(party) != ''").fetchall()
                    for bp in bill_parties:
                        name = bp['party'].strip()
                        if name.lower() not in known_names:
                            known_names.add(name.lower())
                            station = name.split(' - ')[-1].strip() if ' - ' in name else ''
                            parties.append({
                                'id': f"P_bill_{len(parties)+1}",
                                'name': name,
                                'phone': '',
                                'station': station,
                                'district': station,
                                'state': '',
                                'pincode': '',
                                'balance': 0,
                                'limit': 500000,
                                'gstin': '',
                                'updatedAt': 0
                            })
                    parties.sort(key=lambda x: x['name'].lower())
                    self.send_json(parties)

                elif path == '/api/db/ledger/parties':
                    known = set()
                    for r in conn.execute("SELECT DISTINCT name FROM parties WHERE name IS NOT NULL AND TRIM(name) != ''").fetchall():
                        known.add(r[0].strip())
                    for r in conn.execute("SELECT DISTINCT party FROM bills WHERE party IS NOT NULL AND TRIM(party) != ''").fetchall():
                        known.add(r[0].strip())
                    for r in conn.execute("SELECT DISTINCT party FROM party_receipts WHERE party IS NOT NULL AND TRIM(party) != ''").fetchall():
                        known.add(r[0].strip())
                    for r in conn.execute("SELECT DISTINCT party FROM bill_adjustments WHERE party IS NOT NULL AND TRIM(party) != ''").fetchall():
                        known.add(r[0].strip())
                    all_parties = sorted(known, key=lambda x: x.lower())
                    self.send_json(all_parties)

                # ── Skip ──
                elif path == '/api/db/skip-main-groups':
                    rows = conn.execute("SELECT * FROM skip_main_groups ORDER BY name").fetchall()
                    self.send_json(rows_to_list(rows))

                elif path == '/api/db/skip-sub-groups':
                    rows = conn.execute("SELECT * FROM skip_sub_groups").fetchall()
                    result = []
                    for r in rows:
                        d = dict(r)
                        d['mainGroupId'] = d.pop('main_group_id')
                        d['mainGroup'] = d.pop('main_group')
                        d['groupName'] = d.pop('group_name')
                        d['sumColumn'] = d.pop('sum_column')
                        result.append(d)
                    self.send_json(result)

                elif path == '/api/db/skip-items':
                    rows = conn.execute("SELECT * FROM skip_items ORDER BY item_prefix").fetchall()
                    result = []
                    for r in rows:
                        d = dict(r)
                        d['subGroupId'] = d.pop('sub_group_id')
                        d['mainGroup'] = d.pop('main_group')
                        d['groupName'] = d.pop('group_name')
                        d['itemPrefix'] = d.pop('item_prefix')
                        result.append(d)
                    self.send_json(result)

                # ── Conversions ──
                elif path == '/api/db/conversions':
                    rows = conn.execute("SELECT * FROM control_panel ORDER BY id").fetchall()
                    convs = []
                    for r in rows:
                        d = dict(r)
                        d['uCap'] = d.get('u_cap', '')
                        d['lCap'] = d.get('l_cap', '')
                        d['boxSize'] = d.get('box_size', 1.0)
                        d['weightPerPcs'] = d.get('weight_per_pcs', 0.0)
                        d['realItemName'] = d.get('real_item_name', '')
                        d['groupName'] = d.get('group_name', '')
                        convs.append(d)
                    self.send_json(convs)

                # ── Bill Item Names ──
                elif path == '/api/db/bill-item-names':
                    rows = conn.execute("SELECT * FROM bill_item_names ORDER BY group_name, item_name").fetchall()
                    items = []
                    for r in rows:
                        d = dict(r)
                        g = d.pop('group_name', '')
                        it = d.pop('item_name', '')
                        val = d.get('value', '')
                        try:
                            rate_val = float(val or 0)
                        except Exception:
                            rate_val = 0.0
                        d['groupName'] = g
                        d['itemName'] = it
                        d['category'] = d.get('category') or g
                        d['printName'] = d.get('print_name') or it
                        d['shortCode'] = d.get('short_code') or it
                        d['rate'] = rate_val
                        d['isActive'] = bool(d.get('is_active', 1))
                        d['updatedAt'] = d.pop('updated_at', 0)
                        items.append(d)
                    self.send_json(items)

                # ── Mould Prices ──
                elif path == '/api/db/mould-prices':
                    rows = conn.execute("SELECT * FROM mould_prices ORDER BY mould_name").fetchall()
                    items = []
                    for r in rows:
                        d = dict(r)
                        d['mouldName'] = d.pop('mould_name', '')
                        d['updatedAt'] = d.pop('updated_at', 0)
                        items.append(d)
                    self.send_json(items)

                # ── Bill Adjustments ──
                elif path in ('/api/db/bill-adjustments', '/api/db/adjustments'):
                    party = params.get('party', '').strip()
                    if party:
                        rows = conn.execute("SELECT * FROM bill_adjustments WHERE LOWER(party)=LOWER(?) ORDER BY bill_date DESC", (party,)).fetchall()
                    else:
                        rows = conn.execute("SELECT * FROM bill_adjustments ORDER BY bill_date DESC").fetchall()
                    items = []
                    for r in rows:
                        d = dict(r)
                        d['billDbId'] = d.pop('bill_db_id', 0)
                        d['billDate'] = d.pop('bill_date', '')
                        d['adjType'] = d.pop('adj_type', '')
                        d['updatedAt'] = d.pop('updated_at', 0)
                        items.append(d)
                    self.send_json(items)

                # ── Control Groups (Manage Groups) ──
                elif path == '/api/db/groups':
                    rows = conn.execute("SELECT * FROM control_groups ORDER BY sort_order ASC, rowid ASC").fetchall()
                    groups = []
                    for r in rows:
                        groups.append({
                            'id': r['id'],
                            'groupName': r['group_name'],
                            'groupIndex': r['group_index'],
                            'weightPerPc': float(r['weight_per_pc'] or 0),
                            'pcsPerBox': int(r['pcs_per_box'] or 1),
                            'multiplication': float(r['multiplication'] or 1.0),
                            'realItemName': r['real_item_name'] or '',
                            'skipEq': bool(r['skip_eq']),
                            'chainParent': r['chain_parent'] or 'NONE',
                            'sortOrder': int(r['sort_order'] or 0),
                            'updatedAt': int(r['updated_at'] or 0)
                        })
                    self.send_json(groups)

                # ── Stock ──
                elif path == '/api/db/stock':
                    rows = conn.execute("SELECT * FROM stock_items ORDER BY name").fetchall()
                    result = []
                    for r in rows:
                        d = dict(r)
                        d['minQty'] = d.pop('min_qty')
                        d['updatedAt'] = d.pop('updated_at')
                        result.append(d)
                    self.send_json(result)

                # ── Ledger (Live Statement from Bills + Receipts + Adjustments) ──
                elif path == '/api/db/ledger':
                    party_name = params.get('party', '').strip()
                    date_from = params.get('dateFrom', '').strip()
                    date_to = params.get('dateTo', '').strip()

                    entries = []
                    opening_balance = 0.0
                    party_info = {}
                    running_bal = 0.0
                    total_dr = 0.0
                    total_cr = 0.0

                    if party_name:
                        def party_matches(record_party, search_party):
                            if not record_party or not search_party:
                                return False
                            rp = str(record_party).strip().lower()
                            sp = str(search_party).strip().lower()
                            if rp == sp:
                                return True
                            if rp.startswith(sp + ' -') or rp.startswith(sp + '-') or rp.startswith(sp + ' '):
                                return True
                            if sp.startswith(rp + ' -') or sp.startswith(rp + '-') or sp.startswith(rp + ' '):
                                return True
                            rp_base = rp.split(' -')[0].strip()
                            sp_base = sp.split(' -')[0].strip()
                            if rp_base and sp_base and rp_base == sp_base:
                                return True
                            if sp in rp or rp in sp:
                                return True
                            return False

                        # Helper for computing true bill total
                        def extract_bill_total(b_row):
                            try:
                                tot = round(float(b_row['total'] or 0.0), 2)
                            except Exception:
                                tot = 0.0
                            if tot == 0.0:
                                try:
                                    fin = b_row['finished_items']
                                    if fin:
                                        items = json.loads(fin) if isinstance(fin, str) else fin
                                        tot = round(sum(float(it.get('total', 0) or 0) for it in items), 2)
                                except Exception:
                                    pass
                            if tot == 0.0:
                                try:
                                    raw = b_row['raw_items']
                                    if raw:
                                        items = json.loads(raw) if isinstance(raw, str) else raw
                                        raw_tot = 0.0
                                        for it in items:
                                            q = float(it.get('qty', 0) or 0)
                                            u = float(it.get('uCap', 0) or 0)
                                            l = float(it.get('lCap', 0) or 0)
                                            raw_tot += q * (u + l)
                                        tot = round(raw_tot, 2)
                                except Exception:
                                    pass
                            return tot

                        # 0. Fetch Party metadata (phone, station, gstin, state)
                        all_parties = conn.execute("SELECT * FROM parties").fetchall()
                        p_row = next((p for p in all_parties if party_matches(p['name'], party_name)), None)
                        if p_row:
                            party_info = {
                                'name': p_row['name'],
                                'phone': p_row['phone'] or '',
                                'station': p_row['station'] or '',
                                'district': p_row['district'] or '',
                                'state': p_row['state_name'] or '',
                                'gstin': p_row['gstin'] or ''
                            }
                            if p_row['balance']:
                                try:
                                    opening_balance = round(float(p_row['balance'] or 0), 2)
                                except Exception:
                                    pass
                        else:
                            # Synthesize party metadata from name string if contains - Station
                            station_part = party_name.split(' - ')[-1].strip() if ' - ' in party_name else ''
                            party_info = {
                                'name': party_name,
                                'phone': '',
                                'station': station_part,
                                'district': station_part,
                                'state': '',
                                'gstin': ''
                            }

                        all_bills = conn.execute("SELECT * FROM bills").fetchall()
                        matched_bills = [b for b in all_bills if party_matches(b['party'], party_name)]

                        all_rcpts = conn.execute("SELECT * FROM party_receipts").fetchall()
                        matched_rcpts = [r for r in all_rcpts if party_matches(r['party'], party_name)]

                        all_adjs = conn.execute("SELECT * FROM bill_adjustments").fetchall()
                        matched_adjs = [a for a in all_adjs if party_matches(a['party'], party_name)]

                        # 0.1 Calculate Opening Balance (B/F) prior to date_from
                        if date_from:
                            for pb in matched_bills:
                                b_date = (pb['date'] or '')[:10]
                                if b_date and b_date < date_from:
                                    pb_type = (pb['doc_type'] or '').upper()
                                    is_ret = 'RETURN' in pb_type
                                    tot = extract_bill_total(pb)
                                    if is_ret:
                                        opening_balance = round(opening_balance - tot, 2)
                                    else:
                                        opening_balance = round(opening_balance + tot, 2)

                            for pr in matched_rcpts:
                                r_date = (pr['receipt_date'] or '')[:10]
                                if r_date and r_date < date_from:
                                    amt = round(float(pr['amount'] or 0), 2)
                                    opening_balance = round(opening_balance - amt, 2)

                            for pa in matched_adjs:
                                a_date = (pa['bill_date'] or '')[:10]
                                if a_date and a_date < date_from:
                                    amt = round(float(pa['amount'] or 0), 2)
                                    if pa['adj_type'] in ('add', 'pay'):
                                        opening_balance = round(opening_balance + amt, 2)
                                    else:
                                        opening_balance = round(opening_balance - amt, 2)

                        # 1. Current Entries in selected date range
                        current_entries = []

                        # Bills
                        for b in matched_bills:
                            b_date = (b['date'] or '')[:10]
                            if (not date_from or b_date >= date_from) and (not date_to or b_date <= date_to):
                                b_type = (b['doc_type'] or '').upper()
                                is_return = 'RETURN' in b_type
                                is_order = 'ORDER' in b_type
                                tot = extract_bill_total(b)

                                if is_return:
                                    current_entries.append({
                                        'id': 'b_' + str(b['id']),
                                        'rawId': b['id'],
                                        'date': b_date,
                                        'type': 'SALE RETURN',
                                        'voucher': f"R-{b['token']}",
                                        'particulars': 'Sale Return',
                                        'debit': 0.0,
                                        'credit': tot,
                                        'canDelete': False
                                    })
                                elif is_order:
                                    current_entries.append({
                                        'id': 'b_' + str(b['id']),
                                        'rawId': b['id'],
                                        'date': b_date,
                                        'type': 'ORDER',
                                        'voucher': f"O-{b['token']}",
                                        'particulars': 'Order Estimate',
                                        'debit': tot,
                                        'credit': 0.0,
                                        'canDelete': False
                                    })
                                else:
                                    current_entries.append({
                                        'id': 'b_' + str(b['id']),
                                        'rawId': b['id'],
                                        'date': b_date,
                                        'type': 'SALE BILL',
                                        'voucher': f"B-{b['token']}",
                                        'particulars': 'Sale Bill',
                                        'debit': tot,
                                        'credit': 0.0,
                                        'canDelete': False
                                    })

                        # Receipts
                        for r in matched_rcpts:
                            r_date = (r['receipt_date'] or '')[:10]
                            if (not date_from or r_date >= date_from) and (not date_to or r_date <= date_to):
                                amt = round(float(r['amount'] or 0), 2)
                                current_entries.append({
                                    'id': 'rcpt_' + str(r['id']),
                                    'rawId': r['id'],
                                    'date': r_date,
                                    'type': 'RECEIPT',
                                    'voucher': f"RCP-{r['id']}",
                                    'particulars': r['remarks'] or 'Payment Received',
                                    'debit': 0.0,
                                    'credit': amt,
                                    'canDelete': True
                                })

                        # Adjustments
                        for a in matched_adjs:
                            a_date = (a['bill_date'] or '')[:10]
                            if (not date_from or a_date >= date_from) and (not date_to or a_date <= date_to):
                                amt = round(float(a['amount'] or 0), 2)
                                is_add = a['adj_type'] in ('add', 'pay')
                                desc = a['description'] or ('Adjustment (+)' if is_add else 'Adjustment (-)')
                                current_entries.append({
                                    'id': 'adj_' + str(a['id']),
                                    'rawId': a['id'],
                                    'date': a_date,
                                    'type': 'ADJUSTMENT',
                                    'voucher': f"ADJ-{a['id']}",
                                    'particulars': desc,
                                    'debit': amt if is_add else 0.0,
                                    'credit': 0.0 if is_add else amt,
                                    'canDelete': True
                                })

                        # Stable chronological sort: date, invoices/orders before returns/receipts/adjustments, then id
                        current_entries.sort(key=lambda x: (
                            x['date'] or '',
                            0 if x['type'] in ('SALE BILL', 'ORDER') else (1 if x['type'] == 'SALE RETURN' else 2),
                            str(x['id'])
                        ))

                        # Assemble final entries with running balance
                        if date_from:
                            entries.append({
                                'id': 'opening_bf',
                                'rawId': 0,
                                'date': date_from,
                                'type': 'OPENING BALANCE',
                                'voucher': 'B/F',
                                'particulars': 'Opening Balance (Brought Forward)',
                                'debit': opening_balance if opening_balance > 0 else 0.0,
                                'credit': abs(opening_balance) if opening_balance < 0 else 0.0,
                                'balance': opening_balance,
                                'canDelete': False
                            })

                        running_bal = opening_balance
                        for e in current_entries:
                            running_bal = round(running_bal + e['debit'] - e['credit'], 2)
                            e['balance'] = running_bal
                            entries.append(e)

                        total_dr = round(sum(e['debit'] for e in current_entries), 2)
                        total_cr = round(sum(e['credit'] for e in current_entries), 2)

                    self.send_json({
                        'party': party_name,
                        'partyInfo': party_info,
                        'openingBalance': opening_balance,
                        'entries': entries,
                        'totalDebit': total_dr,
                        'totalCredit': total_cr,
                        'netBalance': running_bal,
                        'dateFrom': date_from,
                        'dateTo': date_to
                    })


                # ── Receipts List ──
                elif path == '/api/db/receipts':
                    party_name = params.get('party', '').strip()
                    if party_name:
                        rows = conn.execute("SELECT * FROM party_receipts WHERE LOWER(party) = LOWER(?) ORDER BY receipt_date DESC", (party_name,)).fetchall()
                    else:
                        rows = conn.execute("SELECT * FROM party_receipts ORDER BY receipt_date DESC").fetchall()
                    self.send_json([dict(r) for r in rows])


                # ── Settings ──
                elif path.startswith('/api/db/settings/'):
                    key = path.split('/')[-1]
                    row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
                    self.send_json({'value': row[0] if row else None})

                # ── DB Info ──
                elif path == '/api/db/info':
                    bill_count = conn.execute("SELECT COUNT(*) FROM bills").fetchone()[0]
                    party_count = conn.execute("SELECT COUNT(*) FROM parties").fetchone()[0]
                    skip_count = conn.execute("SELECT COUNT(*) FROM skip_items").fetchone()[0]
                    self.send_json({
                        'status': 'ok', 'db_path': DB_PATH,
                        'bills': bill_count, 'parties': party_count, 'skip_items': skip_count,
                        'size_mb': round(os.path.getsize(DB_PATH) / 1024 / 1024, 2) if os.path.exists(DB_PATH) else 0
                    })

                else:
                    self.send_json({'error': 'Not found'}, 404)

        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def do_POST(self):
        path = self.path
        body = self.read_body()
        try:
            with db_lock, get_conn() as conn:
                now = int(time.time() * 1000)

                # ── Save Bill ──
                if path == '/api/db/bills':
                    b = body
                    conn.execute("""
                        INSERT OR REPLACE INTO bills
                        (id,token,date,party,doc_type,vehicle,type_selection,total,status,raw_items,finished_items,created_at,updated_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """, (
                        b.get('id'), b.get('token', '0'), b.get('date', ''), b.get('party', ''),
                        b.get('docType', 'SALE BILL'), b.get('vehicle', ''), b.get('typeSelection', 'WHOLESALE'),
                        b.get('total', 0), b.get('status', 'PAID'),
                        json.dumps(b.get('rawItems', []), ensure_ascii=False),
                        json.dumps(b.get('finishedItems', []), ensure_ascii=False),
                        b.get('createdAt', now), now
                    ))
                    self.send_json({'success': True})

                # ── Bulk Update Bill Prefix ──
                elif path == '/api/db/bills/bulk-prefix':
                    prefix = body.get('prefix', '').strip()
                    if prefix:
                        rows = conn.execute("SELECT id, token FROM bills").fetchall()
                        for r in rows:
                            bid = r['id']
                            tok = str(r['token'] or '')
                            m = re.search(r'\d+$', tok)
                            num = m.group(0) if m else '1'
                            new_tok = f"{prefix}{num}"
                            conn.execute("UPDATE bills SET token=? WHERE id=?", (new_tok, bid))
                        conn.commit()
                    self.send_json({'success': True})

                # ── Save Party ──
                elif path == '/api/db/parties':
                    p = body
                    conn.execute("""
                        INSERT OR REPLACE INTO parties
                        (id,name,phone,station,district,state_name,pincode,balance,party_limit,gstin,updated_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?)
                    """, (
                        p.get('id'), p.get('name', ''), p.get('phone', ''), p.get('station', ''),
                        p.get('district', ''), p.get('state', ''), p.get('pincode', ''),
                        p.get('balance', 0), p.get('limit', 500000), p.get('gstin', ''), now
                    ))
                    self.send_json({'success': True})

                # ── Save Skip Main Group ──
                elif path == '/api/db/skip-main-groups':
                    g = body
                    conn.execute("INSERT OR REPLACE INTO skip_main_groups (id,name) VALUES (?,?)", (g['id'], g['name']))
                    self.send_json({'success': True})

                elif path == '/api/db/skip-main-groups/bulk':
                    items = body if isinstance(body, list) else body.get('groups', [])
                    if isinstance(body, dict) and body.get('mode') == 'replace':
                        conn.execute("DELETE FROM skip_main_groups")
                    for g in items:
                        conn.execute("INSERT OR REPLACE INTO skip_main_groups (id,name) VALUES (?,?)", (g['id'], g['name']))
                    self.send_json({'success': True, 'count': len(items)})

                # ── Save Skip Sub Group ──
                elif path == '/api/db/skip-sub-groups':
                    g = body
                    conn.execute("INSERT OR REPLACE INTO skip_sub_groups (id,main_group_id,main_group,group_name,sum_column) VALUES (?,?,?,?,?)",
                        (g['id'], g.get('mainGroupId',''), g.get('mainGroup',''), g.get('groupName',''), g.get('sumColumn','QTY')))
                    self.send_json({'success': True})

                elif path == '/api/db/skip-sub-groups/bulk':
                    items = body if isinstance(body, list) else body.get('groups', [])
                    if isinstance(body, dict) and body.get('mode') == 'replace':
                        conn.execute("DELETE FROM skip_sub_groups")
                    for g in items:
                        conn.execute("INSERT OR REPLACE INTO skip_sub_groups (id,main_group_id,main_group,group_name,sum_column) VALUES (?,?,?,?,?)",
                            (g['id'], g.get('mainGroupId',''), g.get('mainGroup',''), g.get('groupName',''), g.get('sumColumn','QTY')))
                    self.send_json({'success': True, 'count': len(items)})

                # ── Save Skip Item ──
                elif path == '/api/db/skip-items':
                    it = body
                    iid = str(it.get('id') or f"si_{now}")
                    conn.execute("INSERT OR REPLACE INTO skip_items (id,sub_group_id,main_group,group_name,item_prefix) VALUES (?,?,?,?,?)",
                        (iid, it.get('subGroupId',''), it.get('mainGroup',''), it.get('groupName',''), it.get('itemPrefix','')))
                    self.send_json({'success': True, 'id': iid})

                elif path == '/api/db/skip-items/bulk':
                    items = body if isinstance(body, list) else body.get('items', [])
                    replace_groups = body.get('replace_groups', []) if isinstance(body, dict) else []
                    if replace_groups:
                        for rg in replace_groups:
                            conn.execute("DELETE FROM skip_items WHERE TRIM(LOWER(group_name)) = TRIM(LOWER(?)) OR sub_group_id = ?", (str(rg), str(rg)))
                    elif isinstance(body, dict) and body.get('mode') == 'replace':
                        conn.execute("DELETE FROM skip_items")
                    for it in items:
                        iid = str(it.get('id') or f"si_{now}_{it.get('itemPrefix', '')}")
                        conn.execute("INSERT OR REPLACE INTO skip_items (id,sub_group_id,main_group,group_name,item_prefix) VALUES (?,?,?,?,?)",
                            (iid, str(it.get('subGroupId','')), str(it.get('mainGroup','')), str(it.get('groupName','')), str(it.get('itemPrefix',''))))
                    self.send_json({'success': True, 'count': len(items)})

                # ── Save Conversion ──
                elif path == '/api/db/conversions':
                    c = body
                    cid = str(c.get('id') or f"cp_{c.get('shortcut', '')}_{c.get('conversion', '')}".lower().replace(' ', '_'))
                    u_cap = str(c.get('u_cap') if c.get('u_cap') is not None else c.get('uCap', '0'))
                    l_cap = str(c.get('l_cap') if c.get('l_cap') is not None else c.get('lCap', '0'))
                    multiplication = float(c.get('multiplication', 1.0) or 1.0)
                    color = str(c.get('color', '#000000'))
                    box_size = float(c.get('box_size') if c.get('box_size') is not None else c.get('boxSize', 1.0) or 1.0)
                    weight = float(c.get('weight_per_pcs') if c.get('weight_per_pcs') is not None else c.get('weight', c.get('weightPerPcs', 0.0)) or 0.0)
                    real_name = str(c.get('real_item_name') or c.get('realItemName', ''))
                    grp_name = str(c.get('group_name') or c.get('groupName', ''))
                    shortcut = str(c.get('shortcut', ''))
                    conversion = str(c.get('conversion', ''))

                    conn.execute("""
                        INSERT OR REPLACE INTO control_panel
                        (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (cid, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight, real_name, grp_name, now))

                    conn.execute("""
                        INSERT OR REPLACE INTO conversions
                        (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (cid, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight, real_name, grp_name, now))

                    self.send_json({'success': True, 'id': cid})

                # ── Bulk Save Conversions ──
                elif path == '/api/db/conversions/bulk':
                    items = body if isinstance(body, list) else body.get('conversions', [])
                    if isinstance(body, dict) and body.get('mode') == 'replace':
                        conn.execute("DELETE FROM control_panel")
                        conn.execute("DELETE FROM conversions")
                    for c in items:
                        cid = str(c.get('id') or f"cp_{c.get('shortcut', '')}_{c.get('conversion', '')}".lower().replace(' ', '_'))
                        u_cap = str(c.get('u_cap') if c.get('u_cap') is not None else c.get('uCap', '0'))
                        l_cap = str(c.get('l_cap') if c.get('l_cap') is not None else c.get('lCap', '0'))
                        multiplication = float(c.get('multiplication', 1.0) or 1.0)
                        color = str(c.get('color', '#000000'))
                        box_size = float(c.get('box_size') if c.get('box_size') is not None else c.get('boxSize', 1.0) or 1.0)
                        weight = float(c.get('weight_per_pcs') if c.get('weight_per_pcs') is not None else c.get('weight', c.get('weightPerPcs', 0.0)) or 0.0)
                        real_name = str(c.get('real_item_name') or c.get('realItemName', ''))
                        grp_name = str(c.get('group_name') or c.get('groupName', ''))
                        shortcut = str(c.get('shortcut', ''))
                        conversion = str(c.get('conversion', ''))

                        conn.execute("""
                            INSERT OR REPLACE INTO control_panel
                            (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (cid, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight, real_name, grp_name, now))

                        conn.execute("""
                            INSERT OR REPLACE INTO conversions
                            (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (cid, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight, real_name, grp_name, now))
                    self.send_json({'success': True, 'count': len(items)})

                # ── Save Bill Item Name ──
                elif path == '/api/db/bill-item-names':
                    it = body
                    iid = str(it.get('id') or f"bin_{now}")
                    g_name = it.get('category') or it.get('groupName') or it.get('group_name') or ''
                    i_name = it.get('printName') or it.get('itemName') or it.get('item_name') or it.get('shortCode') or ''
                    val_str = str(it.get('rate') if it.get('rate') is not None else it.get('value', ''))
                    conn.execute("INSERT OR REPLACE INTO bill_item_names (id, group_name, item_name, value, updated_at) VALUES (?,?,?,?,?)",
                        (iid, g_name, i_name, val_str, now))
                    self.send_json({'success': True, 'id': iid})

                # ── Bulk Save Bill Item Names ──
                elif path == '/api/db/bill-item-names/bulk':
                    payload = body
                    mode = payload.get('mode', 'replace') if isinstance(payload, dict) else 'replace'
                    items = payload.get('items', []) if isinstance(payload, dict) else (payload if isinstance(payload, list) else [])
                    if mode == 'replace':
                        conn.execute("DELETE FROM bill_item_names")
                    import random
                    for idx, it in enumerate(items):
                        iid = str(it.get('id') or f"bin_{now}_{idx}_{random.randint(100, 999)}")
                        g_name = it.get('category') or it.get('groupName') or it.get('group_name') or ''
                        i_name = it.get('printName') or it.get('itemName') or it.get('item_name') or it.get('shortCode') or ''
                        val_str = str(it.get('rate') if it.get('rate') is not None else it.get('value', ''))
                        conn.execute("INSERT OR REPLACE INTO bill_item_names (id, group_name, item_name, value, updated_at) VALUES (?,?,?,?,?)",
                            (iid, g_name, i_name, val_str, now))
                    self.send_json({'success': True, 'count': len(items)})

                # ── Save Mould Price ──
                elif path == '/api/db/mould-prices':
                    m = body
                    conn.execute("INSERT OR REPLACE INTO mould_prices (mould_name, price, updated_at) VALUES (?,?,?)",
                        (m.get('mouldName',''), float(m.get('price', 0)), now))
                    self.send_json({'success': True})

                # ── Save Bill Adjustment ──
                elif path in ('/api/db/bill-adjustments', '/api/db/adjustments'):
                    a = body
                    aid = str(a.get('id') or f"adj_{now}")
                    conn.execute("""
                        INSERT OR REPLACE INTO bill_adjustments (id, bill_db_id, party, bill_date, adj_type, description, amount, updated_at)
                        VALUES (?,?,?,?,?,?,?,?)
                    """, (aid, a.get('billDbId', 0), a.get('party', ''), a.get('billDate', ''), a.get('adjType', ''), a.get('description', ''), float(a.get('amount', 0)), now))
                    self.send_json({'success': True, 'id': aid})

                # ── Save Control Group ──
                elif path == '/api/db/groups':
                    g = body
                    gid = g.get('id') or f"grp-{now}"
                    conn.execute("""
                        INSERT OR REPLACE INTO control_groups
                        (id, group_name, group_index, weight_per_pc, pcs_per_box, multiplication, real_item_name, skip_eq, chain_parent, sort_order, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        gid,
                        g.get('groupName', ''),
                        g.get('groupIndex', ''),
                        float(g.get('weightPerPc', 0)),
                        int(g.get('pcsPerBox', 1)),
                        float(g.get('multiplication', 1.0)),
                        g.get('realItemName', ''),
                        1 if g.get('skipEq') else 0,
                        g.get('chainParent', 'NONE'),
                        int(g.get('sortOrder', 0)),
                        now
                    ))
                    self.send_json({'success': True, 'id': gid})

                # ── Bulk Save Control Groups (Atomic Replacement) ──
                elif path == '/api/db/groups/bulk':
                    items = body if isinstance(body, list) else body.get('groups', [])
                    conn.execute("DELETE FROM control_groups")
                    for idx, g in enumerate(items):
                        conn.execute("""
                            INSERT OR REPLACE INTO control_groups
                            (id, group_name, group_index, weight_per_pc, pcs_per_box, multiplication, real_item_name, skip_eq, chain_parent, sort_order, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            g.get('id') or f"grp-{idx+1}",
                            g.get('groupName', ''),
                            g.get('groupIndex', ''),
                            float(g.get('weightPerPc', 0)),
                            int(g.get('pcsPerBox', 1)),
                            float(g.get('multiplication', 1.0)),
                            g.get('realItemName', ''),
                            1 if g.get('skipEq') else 0,
                            g.get('chainParent', 'NONE'),
                            idx + 1,
                            now
                        ))
                    self.send_json({'success': True, 'count': len(items)})

                # ── Save Stock Item ──
                elif path == '/api/db/stock':
                    s = body
                    conn.execute("INSERT OR REPLACE INTO stock_items (id,code,name,category,qty,min_qty,uom,rack,status,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                        (s['id'], s.get('code',''), s.get('name',''), s.get('category',''),
                         s.get('qty',0), s.get('minQty',0), s.get('uom','PCS'), s.get('rack',''), s.get('status','IN STOCK'), now))
                    self.send_json({'success': True})

                # ── Save Receipt ──
                elif path == '/api/db/receipts':
                    rcpt = body
                    rcpt_id = rcpt.get('id') or f"RCP_{now}"
                    party = rcpt.get('party', '').strip()
                    amount = float(rcpt.get('amount', 0))
                    r_date = rcpt.get('date') or time.strftime('%Y-%m-%d')
                    remarks = rcpt.get('remarks', 'Payment Received').strip()

                    conn.execute("""
                        INSERT OR REPLACE INTO party_receipts (id, party, amount, receipt_date, remarks, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (rcpt_id, party, amount, r_date, remarks, now))

                    # Update party balance: receipt reduces party's debt (credit)
                    p_row = conn.execute("SELECT balance FROM parties WHERE LOWER(name) = LOWER(?)", (party,)).fetchone()
                    if p_row:
                        new_bal = float(p_row['balance'] or 0) - amount
                        conn.execute("UPDATE parties SET balance = ?, updated_at = ? WHERE LOWER(name) = LOWER(?)", (new_bal, now, party))

                    self.send_json({'success': True, 'id': rcpt_id})

                # ── Save Ledger Entry ──
                elif path == '/api/db/ledger':
                    l = body
                    conn.execute("INSERT OR REPLACE INTO ledger (id,party_id,date,entry_type,voucher,particulars,debit,credit,balance,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                        (l['id'], l.get('partyId',''), l.get('date',''), l.get('type',''), l.get('voucher',''),
                         l.get('particulars',''), l.get('debit',0), l.get('credit',0), l.get('balance',0), now))
                    self.send_json({'success': True})


                # ── Save Setting ──
                elif path == '/api/db/settings':
                    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)", (body['key'], body['value']))
                    self.send_json({'success': True})

                # ── Bulk Import (for sync from other device) ──
                elif path == '/api/db/import':
                    data = body
                    imported = 0
                    for b in data.get('bills', []):
                        conn.execute("INSERT OR REPLACE INTO bills (id,token,date,party,doc_type,vehicle,type_selection,total,status,raw_items,finished_items,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                            (b.get('id'), b.get('token','0'), b.get('date',''), b.get('party',''),
                             b.get('docType','SALE BILL'), b.get('vehicle',''), b.get('typeSelection','WHOLESALE'),
                             b.get('total',0), b.get('status','PAID'),
                             json.dumps(b.get('rawItems',[])), json.dumps(b.get('finishedItems',[])),
                             b.get('createdAt',now), now))
                        imported += 1
                    for p in data.get('parties', []):
                        conn.execute("INSERT OR REPLACE INTO parties (id,name,phone,station,district,state_name,pincode,balance,party_limit,gstin,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                            (p.get('id'), p.get('name',''), p.get('phone',''), p.get('station',''),
                             p.get('district',''), p.get('state',''), p.get('pincode',''),
                             p.get('balance',0), p.get('limit',500000), p.get('gstin',''), now))
                        imported += 1
                    self.send_json({'success': True, 'imported': imported})

                else:
                    self.send_json({'error': 'Not found'}, 404)

        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def do_DELETE(self):
        path = self.path
        try:
            with db_lock, get_conn() as conn:
                if '/api/db/bills/' in path:
                    import urllib.parse
                    bid = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM bills WHERE id=? OR token=?", (bid, bid))
                    self.send_json({'success': True})

                elif '/api/db/parties/' in path:
                    import urllib.parse
                    pid = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM parties WHERE id=? OR TRIM(LOWER(name))=TRIM(LOWER(?))", (pid, pid))
                    self.send_json({'success': True})

                elif '/api/db/skip-main-groups/' in path:
                    gid = path.split('/')[-1]
                    conn.execute("DELETE FROM skip_main_groups WHERE id=?", (gid,))
                    conn.execute("DELETE FROM skip_sub_groups WHERE main_group_id=?", (gid,))
                    self.send_json({'success': True})

                elif '/api/db/skip-sub-groups/' in path:
                    gid = path.split('/')[-1]
                    conn.execute("DELETE FROM skip_sub_groups WHERE id=?", (gid,))
                    conn.execute("DELETE FROM skip_items WHERE sub_group_id=?", (gid,))
                    self.send_json({'success': True})

                elif '/api/db/skip-items/' in path:
                    import urllib.parse
                    iid = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM skip_items WHERE id=? OR item_prefix=?", (iid, iid))
                    self.send_json({'success': True})

                elif '/api/db/conversions/' in path:
                    import urllib.parse
                    cid = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM control_panel WHERE id=? OR shortcut=?", (cid, cid))
                    conn.execute("DELETE FROM conversions WHERE id=? OR shortcut=?", (cid, cid))
                    self.send_json({'success': True})

                elif '/api/db/bill-item-names/' in path:
                    import urllib.parse
                    iid = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM bill_item_names WHERE id=?", (iid,))
                    self.send_json({'success': True})

                elif '/api/db/mould-prices/' in path:
                    import urllib.parse
                    mname = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM mould_prices WHERE mould_name=?", (mname,))
                    self.send_json({'success': True})

                elif '/api/db/bill-adjustments/' in path or '/api/db/adjustments/' in path:
                    import urllib.parse
                    aid = urllib.parse.unquote_plus(path.split('/')[-1])
                    conn.execute("DELETE FROM bill_adjustments WHERE id=?", (aid,))
                    self.send_json({'success': True})

                elif '/api/db/groups/' in path:
                    gid = path.split('/')[-1]
                    conn.execute("DELETE FROM control_groups WHERE id=?", (gid,))
                    self.send_json({'success': True})

                elif '/api/db/stock/' in path:
                    sid = path.split('/')[-1]
                    conn.execute("DELETE FROM stock_items WHERE id=?", (sid,))
                    self.send_json({'success': True})

                elif '/api/db/receipts/' in path:
                    rid = path.split('/')[-1]
                    # Also restore party balance if needed
                    rcpt = conn.execute("SELECT party, amount FROM party_receipts WHERE id=?", (rid,)).fetchone()
                    if rcpt:
                        p_row = conn.execute("SELECT balance FROM parties WHERE LOWER(name)=LOWER(?)", (rcpt['party'],)).fetchone()
                        if p_row:
                            new_bal = float(p_row['balance'] or 0) + float(rcpt['amount'] or 0)
                            conn.execute("UPDATE parties SET balance=? WHERE LOWER(name)=LOWER(?)", (new_bal, rcpt['party']))
                    conn.execute("DELETE FROM party_receipts WHERE id=?", (rid,))
                    self.send_json({'success': True})


                else:
                    self.send_json({'error': 'Not found'}, 404)

        except Exception as e:
            self.send_json({'error': str(e)}, 500)


# ─── Start ────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    port = 5006
    server = HTTPServer(('127.0.0.1', port), DBHandler)
    print(f"[DB Server] Running on http://127.0.0.1:{port}")
    print(f"[DB Server] Database: {DB_PATH}")
    print(f"[DB Server] Ready for connections...")
    server.serve_forever()
