import sqlite3
import os
import shutil
import time

old_db_path = r'f:\SUMMARY\BillApp\database\bill_data.db'
new_db_path = r'f:\MODERN SUMMARY APP\billapp.db'

print(f"Starting DB upgrade from {old_db_path} to {new_db_path}...")

# Backup existing new_db
if os.path.exists(new_db_path):
    backup_path = new_db_path + f".bak_{int(time.time())}"
    shutil.copy2(new_db_path, backup_path)
    print(f"Backup created at: {backup_path}")

conn_old = sqlite3.connect(old_db_path)
conn_old.row_factory = sqlite3.Row

conn_new = sqlite3.connect(new_db_path)
conn_new.row_factory = sqlite3.Row
cur_new = conn_new.cursor()

# 1. CONTROL_PANEL (CONVERSIONS / SHORTCUT RULES)
print("\n[1] Creating and populating 'control_panel' (Conversions & Shortcut rules)...")
cur_new.execute("""
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
""")
cur_new.execute("CREATE INDEX IF NOT EXISTS idx_ctrl_shortcut ON control_panel(shortcut);")
cur_new.execute("CREATE INDEX IF NOT EXISTS idx_ctrl_conversion ON control_panel(conversion);")

cur_old = conn_old.cursor()
cur_old.execute("SELECT * FROM control_panel;")
cp_rows = cur_old.fetchall()
inserted_cp = 0
now_ms = int(time.time() * 1000)

for row in cp_rows:
    sc = row['shortcut'] or ''
    conv = row['conversion'] or ''
    u_cap = str(row['u_cap'] or '0')
    l_cap = str(row['l_cap'] or '0')
    mult = row['multiplication'] if row['multiplication'] is not None else 1.0
    color = row['color'] or '#000000'
    bs = float(row['box_size'] or 1.0)
    wt = float(row['weight_per_pcs'] or 0.0)
    rin = row['real_item_name'] or ''
    gn = row['group_name'] or ''
    row_id = f"cp_{sc}_{conv}".replace(' ', '_').lower()

    cur_new.execute("""
    INSERT OR REPLACE INTO control_panel 
    (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (row_id, sc, conv, u_cap, l_cap, mult, color, bs, wt, rin, gn, now_ms))
    inserted_cp += 1

print(f"  -> Imported {inserted_cp} conversion / shortcut rows into 'control_panel'")

# Also update 'conversions' table to match if queried
cur_new.execute("DROP TABLE IF EXISTS conversions;")
cur_new.execute("""
CREATE TABLE IF NOT EXISTS conversions (
    id TEXT PRIMARY KEY,
    shortcut TEXT,
    conversion TEXT,
    u_cap TEXT,
    l_cap TEXT,
    multiplication REAL,
    color TEXT,
    box_size REAL,
    weight_per_pcs REAL,
    real_item_name TEXT,
    group_name TEXT,
    updated_at INTEGER
);
""")
for row in cp_rows:
    sc = row['shortcut'] or ''
    conv = row['conversion'] or ''
    u_cap = str(row['u_cap'] or '0')
    l_cap = str(row['l_cap'] or '0')
    mult = row['multiplication'] if row['multiplication'] is not None else 1.0
    color = row['color'] or '#000000'
    bs = float(row['box_size'] or 1.0)
    wt = float(row['weight_per_pcs'] or 0.0)
    rin = row['real_item_name'] or ''
    gn = row['group_name'] or ''
    row_id = f"cp_{sc}_{conv}".replace(' ', '_').lower()
    cur_new.execute("""
    INSERT OR REPLACE INTO conversions 
    (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (row_id, sc, conv, u_cap, l_cap, mult, color, bs, wt, rin, gn, now_ms))

# 2. CONTROL_GROUPS
print("\n[2] Syncing 'control_groups'...")
cur_old.execute("SELECT * FROM control_groups;")
cg_rows = cur_old.fetchall()
inserted_cg = 0
for r in cg_rows:
    g_name = r['group_name'] or ''
    g_idx = str(r['group_index'] if r['group_index'] is not None else '')
    wt = float(r['weight'] or 0.0)
    bs = int(r['box_size'] or 1)
    mult = float(r['multiplication'] or 1.0)
    rin = r['real_item_name'] or ''
    seq = int(r['skip_equation'] or 0)
    cp = r['chain_parent'] or 'NONE'
    gid = f"grp_{g_name}".replace(' ', '_').lower()
    
    cur_new.execute("""
    INSERT OR REPLACE INTO control_groups
    (id, group_name, group_index, weight_per_pc, pcs_per_box, multiplication, real_item_name, skip_eq, chain_parent, sort_order, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (gid, g_name, g_idx, wt, bs, mult, rin, seq, cp, inserted_cg, now_ms))
    inserted_cg += 1
print(f"  -> Imported {inserted_cg} control_groups")

# 3. BILL_ITEM_NAMES
print("\n[3] Creating and populating 'bill_item_names'...")
cur_new.execute("""
CREATE TABLE IF NOT EXISTS bill_item_names (
    id TEXT PRIMARY KEY,
    group_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    value TEXT DEFAULT '',
    updated_at INTEGER NOT NULL
);
""")
cur_old.execute("SELECT * FROM bill_item_names;")
bin_rows = cur_old.fetchall()
inserted_bin = 0
for r in bin_rows:
    bid = str(r['id'])
    gn = r['group_name'] or ''
    iname = r['item_name'] or ''
    val = r['value'] or ''
    cur_new.execute("""
    INSERT OR REPLACE INTO bill_item_names (id, group_name, item_name, value, updated_at)
    VALUES (?, ?, ?, ?, ?)
    """, (bid, gn, iname, val, now_ms))
    inserted_bin += 1
print(f"  -> Imported {inserted_bin} bill_item_names")

# 4. MOULD_PRICES
print("\n[4] Creating and populating 'mould_prices'...")
cur_new.execute("""
CREATE TABLE IF NOT EXISTS mould_prices (
    mould_name TEXT PRIMARY KEY,
    price REAL DEFAULT 0,
    updated_at INTEGER NOT NULL
);
""")
cur_old.execute("SELECT * FROM mould_prices;")
for r in cur_old.fetchall():
    cur_new.execute("INSERT OR REPLACE INTO mould_prices (mould_name, price, updated_at) VALUES (?, ?, ?)",
                    (r['mould_name'], float(r['price'] or 0), now_ms))
print("  -> Imported mould_prices")

# 5. BILL_ADJUSTMENTS
print("\n[5] Creating and populating 'bill_adjustments'...")
cur_new.execute("""
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
""")
cur_old.execute("SELECT * FROM bill_adjustments;")
ba_rows = cur_old.fetchall()
inserted_ba = 0
for r in ba_rows:
    cur_new.execute("""
    INSERT OR REPLACE INTO bill_adjustments (id, bill_db_id, party, bill_date, adj_type, description, amount, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (str(r['id']), r['bill_db_id'], r['party'], r['bill_date'], r['adj_type'], r['description'], float(r['amount'] or 0), now_ms))
    inserted_ba += 1
print(f"  -> Imported {inserted_ba} bill_adjustments")

# 6. SETTINGS
print("\n[6] Syncing 'settings'...")
cur_old.execute("SELECT * FROM settings;")
for r in cur_old.fetchall():
    cur_new.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (r['key'], str(r['value'] or '')))

conn_new.commit()
conn_new.close()
conn_old.close()

print("\nSUCCESS! All tables migrated and upgraded into F:\\MODERN SUMMARY APP\\billapp.db.")
