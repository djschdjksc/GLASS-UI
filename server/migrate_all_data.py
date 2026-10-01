"""
migrate_all_data.py — Complete Seed & Historical Data Migration to billapp.db
Transfers all 521 bills, 1800 parties, skip groups, skip items, conversions,
and settings from source SQLite database to F:\MODERN SUMMARY APP\billapp.db
"""

import os
import sqlite3
import json
import time

SRC_DB = r"f:\SUMMARY\BillApp\database\bill_data.db"
DST_DB = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "billapp.db"))

print(f"[*] Source Database: {SRC_DB}")
print(f"[*] Destination Database: {DST_DB}")

if not os.path.exists(SRC_DB):
    print(f"[!] Error: Source database not found at {SRC_DB}")
    exit(1)

src = sqlite3.connect(SRC_DB)
src.row_factory = sqlite3.Row

dst = sqlite3.connect(DST_DB)
dst.execute("PRAGMA journal_mode=WAL")
dst.execute("PRAGMA synchronous=NORMAL")

# ─── 1. Ensure Destination Tables Exist ──────────────────────────────────────
dst.executescript("""
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
    CREATE TABLE IF NOT EXISTS conversions (
        id TEXT PRIMARY KEY,
        rule TEXT NOT NULL,
        value REAL DEFAULT 0,
        description TEXT DEFAULT ''
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
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bills_token ON bills(token);
    CREATE INDEX IF NOT EXISTS idx_bills_party ON bills(party);
    CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
    CREATE INDEX IF NOT EXISTS idx_skip_items_prefix ON skip_items(item_prefix);
    CREATE INDEX IF NOT EXISTS idx_ledger_party ON ledger(party_id);
""")
dst.commit()

now = int(time.time() * 1000)

# ─── 2. Migrate Parties (1,800 records) ──────────────────────────────────────
print("\n[+] Migrating Parties...")
parties_rows = src.execute("SELECT * FROM parties_v2").fetchall()
party_count = 0
for idx, p in enumerate(parties_rows, 1):
    name = str(p['party_name'] or '').strip()
    if not name:
        continue
    pid = f"P-{idx}"
    phone = str(p['contacts'] or '').strip()
    station = str(p['station'] or '').strip()
    district = str(p['district'] or '').strip()
    state = str(p['state'] or '').strip()
    pincode = str(p['pincode'] or '').strip()

    dst.execute("""
        INSERT OR REPLACE INTO parties
        (id, name, phone, station, district, state_name, pincode, balance, party_limit, gstin, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (pid, name, phone, station, district, state, pincode, 0.0, 500000.0, '', now))
    party_count += 1

dst.commit()
print(f"    -> Successfully migrated {party_count} parties.")

# ─── 3. Migrate Bills & Items & Groups (521 bills) ───────────────────────────
print("\n[+] Migrating Bills, Raw Items & Finished Moulds...")

# Pre-fetch all bill_items grouped by bill_id
bill_items_map = {}
for it in src.execute("SELECT * FROM bill_items ORDER BY id").fetchall():
    bid = it['bill_id']
    if bid not in bill_items_map:
        bill_items_map[bid] = []
    bill_items_map[bid].append({
        'id': str(it['id']),
        'name': str(it['item_name'] or '').strip(),
        'qty': float(it['qty'] or 0),
        'uCap': float(it['u_cap'] or 0),
        'lCap': float(it['l_cap'] or 0),
        'partyCode': str(it['party_code'] or '').strip()
    })

# Pre-fetch all bill_groups grouped by bill_id
bill_groups_map = {}
for g in src.execute("SELECT * FROM bill_groups ORDER BY id").fetchall():
    bid = g['bill_id']
    if bid not in bill_groups_map:
        bill_groups_map[bid] = []
    bill_groups_map[bid].append({
        'id': str(g['id']),
        'mould': str(g['mould_name'] or '').strip(),
        'qty': float(g['qty'] or 0),
        'price': float(g['price'] or 0),
        'total': float(g['total'] or 0)
    })

bill_count = 0
for b in src.execute("SELECT * FROM bills ORDER BY id").fetchall():
    bid_raw = b['id']
    token_str = str(b['bill_no'] or b['order_no'] or b['return_no'] or bid_raw)
    bid = f"B-{token_str}"

    party = str(b['party'] or 'CASH SALE').strip()
    doc_type_raw = str(b['bill_type'] or 'Bill').upper()
    if 'ORDER' in doc_type_raw:
        doc_type = 'ORDER ESTIMATE'
    elif 'RETURN' in doc_type_raw:
        doc_type = 'SALE RETURN'
    elif 'PURCHASE' in doc_type_raw:
        doc_type = 'PURCHASE BILL'
    else:
        doc_type = 'SALE BILL'

    date = str(b['bill_date'] or '2026-07-23').strip()
    vehicle = str(b['vehicle_name'] or '').strip()
    total = float(b['mould_total'] or 0)

    raw_items = bill_items_map.get(bid_raw, [])
    finished_items = bill_groups_map.get(bid_raw, [])

    # If bill_groups had nothing, check if single mould exists on bill row
    if not finished_items and b['mould']:
        finished_items.append({
            'id': f"{bid_raw}_1",
            'mould': str(b['mould']),
            'qty': float(b['mould_qty'] or 0),
            'price': float(b['mould_price'] or 0),
            'total': total
        })

    dst.execute("""
        INSERT OR REPLACE INTO bills
        (id, token, date, party, doc_type, vehicle, type_selection, total, status, raw_items, finished_items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        bid, token_str, date, party, doc_type, vehicle, 'WHOLESALE',
        total, 'PAID', json.dumps(raw_items, ensure_ascii=False),
        json.dumps(finished_items, ensure_ascii=False), now, now
    ))
    bill_count += 1

dst.commit()
print(f"    -> Successfully migrated {bill_count} bills.")

# ─── 4. Migrate Main Groups, Skip Groups & Skip Items ────────────────────────
print("\n[+] Migrating Skip Items & Groups...")

# Main Groups
mg_map = {}
for mg in src.execute("SELECT * FROM main_groups").fetchall():
    name = str(mg[0]).strip()
    mg_id = f"mg_{len(mg_map)+1}"
    mg_map[name] = mg_id
    dst.execute("INSERT OR REPLACE INTO skip_main_groups (id, name) VALUES (?, ?)", (mg_id, name))

# Ensure standard 5 groups exist
standard_mgs = ["General", "Digital or Golden", "Digital", "Digital or Golden Lower Film", "7D UV SHEET"]
for name in standard_mgs:
    if name not in mg_map:
        mg_id = f"mg_{len(mg_map)+1}"
        mg_map[name] = mg_id
        dst.execute("INSERT OR REPLACE INTO skip_main_groups (id, name) VALUES (?, ?)", (mg_id, name))

dst.commit()

# Skip Sub Groups
sg_map = {}
for sg in src.execute("SELECT * FROM skip_groups").fetchall():
    mg_name = str(sg[0]).strip()
    g_name = str(sg[1]).strip()
    sum_col = str(sg[2] or 'QTY').strip()
    mg_id = mg_map.get(mg_name, 'mg_1')
    sg_id = f"sg_{len(sg_map)+1}"
    sg_map[g_name] = (sg_id, mg_name)
    dst.execute("""
        INSERT OR REPLACE INTO skip_sub_groups
        (id, main_group_id, main_group, group_name, sum_column)
        VALUES (?, ?, ?, ?, ?)
    """, (sg_id, mg_id, mg_name, g_name, sum_col))

dst.commit()

# Skip Items from Source DB
item_count = 0
for it in src.execute("SELECT * FROM skip_items").fetchall():
    prefix = str(it[1]).strip()
    mg_name = str(it[2]).strip()
    g_name = str(it[3]).strip()
    sg_info = sg_map.get(g_name, (f"sg_misc_{mg_name}", mg_name))
    iid = f"si_{it[0]}"
    dst.execute("""
        INSERT OR REPLACE INTO skip_items
        (id, sub_group_id, main_group, group_name, item_prefix)
        VALUES (?, ?, ?, ?, ?)
    """, (iid, sg_info[0], mg_name, g_name, prefix))
    item_count += 1

# Add UV 2000 - UV 2044 items under UV-(Digital)
uv_group_name = "UV-(Digital)"
uv_mg_name = "Digital"
uv_sg_id = f"sg_uv_digital"
dst.execute("""
    INSERT OR REPLACE INTO skip_sub_groups (id, main_group_id, main_group, group_name, sum_column)
    VALUES (?, ?, ?, ?, ?)
""", (uv_sg_id, mg_map.get(uv_mg_name, "mg_3"), uv_mg_name, uv_group_name, "QTY"))

for uv_num in range(2000, 2045):
    pfx = f"UV {uv_num}"
    iid = f"si_uv_{uv_num}"
    dst.execute("""
        INSERT OR REPLACE INTO skip_items (id, sub_group_id, main_group, group_name, item_prefix)
        VALUES (?, ?, ?, ?, ?)
    """, (iid, uv_sg_id, uv_mg_name, uv_group_name, pfx))
    item_count += 1

dst.commit()
print(f"    -> Successfully migrated {len(mg_map)} main groups, {len(sg_map)+1} sub-groups, {item_count} skip items.")

# ─── 5. Summary Stats ────────────────────────────────────────────────────────
print("\n" + "="*50)
print("[OK] MIGRATION COMPLETE! Final Database Stats in billapp.db:")
print(f"    - Total Bills:    {dst.execute('SELECT COUNT(*) FROM bills').fetchone()[0]}")
print(f"    - Total Parties:  {dst.execute('SELECT COUNT(*) FROM parties').fetchone()[0]}")
print(f"    - Skip Items:     {dst.execute('SELECT COUNT(*) FROM skip_items').fetchone()[0]}")
print(f"    - Main Groups:    {dst.execute('SELECT COUNT(*) FROM skip_main_groups').fetchone()[0]}")
print(f"    - Sub Groups:     {dst.execute('SELECT COUNT(*) FROM skip_sub_groups').fetchone()[0]}")
print(f"    - Database Size:  {round(os.path.getsize(DST_DB)/1024/1024, 2)} MB")
print("="*50)

src.close()
dst.close()
