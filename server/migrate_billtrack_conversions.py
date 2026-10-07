import sqlite3
import time
import json

src_path = r'F:\BillTrack\database\bill_data.db'
dst_path = 'billapp.db'

print(f"Connecting to source: {src_path}")
c_src = sqlite3.connect(src_path)
c_src.row_factory = sqlite3.Row

print(f"Connecting to destination: {dst_path}")
c_dst = sqlite3.connect(dst_path)
c_dst.row_factory = sqlite3.Row

now_ms = int(time.time() * 1000)

# ─── 1. REPLACE CONTROL_PANEL & CONVERSIONS ───
print("\n--- 1. Migrating control_panel & conversions ---")
src_cp = c_src.execute("SELECT * FROM control_panel").fetchall()
print(f"Source control_panel records: {len(src_cp)}")

c_dst.execute("DELETE FROM control_panel")
c_dst.execute("DELETE FROM conversions")

cp_count = 0
for idx, r in enumerate(src_cp):
    cid = f"cp_{now_ms}_{idx + 1}"
    shortcut = (r['shortcut'] or '').strip()
    conv = (r['conversion'] or '').strip()
    u_cap = str(r['u_cap'] if r['u_cap'] is not None else '')
    l_cap = str(r['l_cap'] if r['l_cap'] is not None else '')
    mult = float(r['multiplication'] if r['multiplication'] is not None else 1.0)
    color = r['color'] or '#000000'
    box_size = float(r['box_size'] if r['box_size'] is not None else 1.0)
    wt = float(r['weight_per_pcs'] if r['weight_per_pcs'] is not None else 0.0)
    real_name = r['real_item_name'] or ''
    grp = r['group_name'] or 'General'

    c_dst.execute("""
        INSERT INTO control_panel (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (cid, shortcut, conv, u_cap, l_cap, mult, color, box_size, wt, real_name, grp, now_ms))

    c_dst.execute("""
        INSERT INTO conversions (id, shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (cid, shortcut, conv, u_cap, l_cap, mult, color, box_size, wt, real_name, grp, now_ms))
    cp_count += 1

print(f"Inserted {cp_count} records into control_panel & conversions in billapp.db")


# ─── 2. REPLACE CONTROL_GROUPS ───
print("\n--- 2. Migrating control_groups ---")
src_cg = c_src.execute("SELECT * FROM control_groups").fetchall()
print(f"Source control_groups records: {len(src_cg)}")

c_dst.execute("DELETE FROM control_groups")
cg_count = 0
for idx, r in enumerate(src_cg):
    gid = f"grp_{idx + 1}"
    g_name = (r['group_name'] or '').strip()
    g_idx = str(r['group_index'] if r['group_index'] is not None else idx + 1)
    wt = float(r['weight'] if r['weight'] is not None else 0.0)
    box_sz = int(r['box_size'] if r['box_size'] is not None else 1)
    mult = float(r['multiplication'] if r['multiplication'] is not None else 1.0)
    real_name = r['real_item_name'] or ''
    skip_eq = 1 if r['skip_equation'] else 0
    chain_p = r['chain_parent'] or 'NONE'

    c_dst.execute("""
        INSERT INTO control_groups (id, group_name, group_index, weight_per_pc, pcs_per_box, multiplication, real_item_name, skip_eq, chain_parent, sort_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (gid, g_name, g_idx, wt, box_sz, mult, real_name, skip_eq, chain_p, idx + 1, now_ms))
    cg_count += 1

print(f"Inserted {cg_count} records into control_groups in billapp.db")


# ─── 3. REPLACE SKIP_MAIN_GROUPS, SKIP_SUB_GROUPS, SKIP_ITEMS ───
print("\n--- 3. Migrating skip_main_groups, skip_sub_groups, skip_items ---")
src_mg = c_src.execute("SELECT * FROM main_groups").fetchall()
src_sg = c_src.execute("SELECT * FROM skip_groups").fetchall()
src_si = c_src.execute("SELECT * FROM skip_items").fetchall()

c_dst.execute("DELETE FROM skip_main_groups")
c_dst.execute("DELETE FROM skip_sub_groups")
c_dst.execute("DELETE FROM skip_items")

# 3a. Main groups
mg_map = {}  # name -> id
for idx, r in enumerate(src_mg):
    mg_name = (r['main_group_name'] or '').strip()
    if not mg_name: continue
    mg_id = f"mg_{idx + 1}"
    mg_map[mg_name] = mg_id
    c_dst.execute("INSERT INTO skip_main_groups (id, name) VALUES (?, ?)", (mg_id, mg_name))

print(f"Inserted {len(mg_map)} skip_main_groups: {list(mg_map.keys())}")

# 3b. Sub groups
sg_map = {}  # group_name -> id
for idx, r in enumerate(src_sg):
    m_grp = (r['main_group'] or '').strip()
    g_name = (r['group_name'] or '').strip()
    sum_col = (r['sum_column'] or 'QTY').strip()
    if not g_name: continue

    m_id = mg_map.get(m_grp)
    if not m_id:
        m_id = f"mg_{len(mg_map) + 1}"
        mg_map[m_grp] = m_id
        c_dst.execute("INSERT INTO skip_main_groups (id, name) VALUES (?, ?)", (m_id, m_grp))

    sg_id = f"sg_{idx + 1}"
    sg_map[g_name] = sg_id
    c_dst.execute("""
        INSERT INTO skip_sub_groups (id, main_group_id, main_group, group_name, sum_column)
        VALUES (?, ?, ?, ?, ?)
    """, (sg_id, m_id, m_grp, g_name, sum_col))

print(f"Inserted {len(sg_map)} skip_sub_groups")

# 3c. Skip items with strict deduplication
seen_in_group = set()  # (group_name_lower, item_prefix_lower)
unique_items = []
duplicates_dropped = []

for r in src_si:
    pfx = (r['item_prefix'] or '').strip()
    g_name = (r['group_name'] or '').strip()
    m_grp = (r['main_group'] or '').strip()
    if not pfx or not g_name: continue

    key = (g_name.lower(), pfx.lower())
    if key in seen_in_group:
        duplicates_dropped.append((g_name, pfx))
    else:
        seen_in_group.add(key)
        sg_id = sg_map.get(g_name, '')
        unique_items.append((sg_id, m_grp, g_name, pfx))

for idx, (sg_id, m_grp, g_name, pfx) in enumerate(unique_items):
    iid = f"si_{idx + 1}"
    c_dst.execute("""
        INSERT INTO skip_items (id, sub_group_id, main_group, group_name, item_prefix)
        VALUES (?, ?, ?, ?, ?)
    """, (iid, sg_id, m_grp, g_name, pfx))

print(f"Total source skip items: {len(src_si)}")
print(f"Duplicates removed: {len(duplicates_dropped)}")
print(f"Unique skip items inserted: {len(unique_items)}")


# ─── 4. BILL ITEM NAMES ───
print("\n--- 4. Checking bill_item_names ---")
src_bin = c_src.execute("SELECT * FROM bill_item_names").fetchall()
print(f"Source bill_item_names records: {len(src_bin)}")
c_dst.execute("DELETE FROM bill_item_names")
bin_count = 0
for idx, r in enumerate(src_bin):
    bid = str(r['id'] or idx + 1)
    grp = (r['group_name'] or '').strip()
    iname = (r['item_name'] or '').strip()
    val = str(r['value'] if r['value'] is not None else '')
    c_dst.execute("""
        INSERT INTO bill_item_names (id, group_name, item_name, value, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, (bid, grp, iname, val, now_ms))
    bin_count += 1

print(f"Inserted {bin_count} records into bill_item_names in billapp.db")

c_dst.commit()
c_dst.close()
c_src.close()

print("\n=== MIGRATION COMPLETE SUCCESSFULLY ===")
