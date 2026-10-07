import sqlite3
import json
import os

TRACK_DB = r'F:\BillTrack\database\bill_data.db'
MODERN_DB = 'billapp.db'

print(f"Connecting to Track DB: {TRACK_DB}")
print(f"Connecting to Modern DB: {MODERN_DB}")

c_trk = sqlite3.connect(TRACK_DB)
c_trk.row_factory = sqlite3.Row

c_mod = sqlite3.connect(MODERN_DB)
c_mod.row_factory = sqlite3.Row

# 1. Main Groups
trk_mgs = c_trk.execute("SELECT * FROM main_groups").fetchall()
mod_mgs = c_mod.execute("SELECT * FROM skip_main_groups").fetchall()
mod_mg_map = {r['name'].strip().lower(): r['id'] for r in mod_mgs}

print(f"\nTrack Main Groups: {len(trk_mgs)}")
for idx, r in enumerate(trk_mgs):
    m_name = (r['main_group_name'] or '').strip()
    if not m_name:
        continue
    if m_name.lower() not in mod_mg_map:
        new_id = f"mg_{len(mod_mg_map) + 1}"
        c_mod.execute("INSERT INTO skip_main_groups (id, name) VALUES (?, ?)", (new_id, m_name))
        mod_mg_map[m_name.lower()] = new_id
        print(f"  + Added missing Main Group: {m_name} ({new_id})")

# 2. Sub Groups
trk_sgs = c_trk.execute("SELECT * FROM skip_groups").fetchall()
mod_sgs = c_mod.execute("SELECT * FROM skip_sub_groups").fetchall()
mod_sg_map = {r['group_name'].strip().lower(): r['id'] for r in mod_sgs}

# Normalize alias map (e.g., '7d uv' <-> '7d-uv')
if '7d-uv' in mod_sg_map and '7d uv' not in mod_sg_map:
    # Update '7D-UV' to '7D UV' in modern DB so it matches BillTrack perfectly
    c_mod.execute("UPDATE skip_sub_groups SET group_name = '7D UV' WHERE group_name = '7D-UV'")
    c_mod.commit()
    print("  -> Renamed '7D-UV' to '7D UV' in skip_sub_groups")

# Refresh mod_sgs
mod_sgs = c_mod.execute("SELECT * FROM skip_sub_groups").fetchall()
mod_sg_map = {r['group_name'].strip().lower(): r['id'] for r in mod_sgs}
mod_sg_main = {r['group_name'].strip().lower(): r['main_group'] for r in mod_sgs}

print(f"\nTrack Sub Groups: {len(trk_sgs)}")
for idx, r in enumerate(trk_sgs):
    g_name = (r['group_name'] or '').strip()
    m_name = (r['main_group'] or '').strip()
    sum_col = (r['sum_column'] or 'QTY').strip()
    if not g_name:
        continue

    # Also handle dash vs space normalization
    norm_key = g_name.lower().replace('-', ' ')
    matched_id = None
    for k, v in mod_sg_map.items():
        if k == g_name.lower() or k.replace('-', ' ') == norm_key:
            matched_id = v
            break

    if not matched_id:
        m_id = mod_mg_map.get(m_name.lower())
        if not m_id:
            m_id = f"mg_{len(mod_mg_map) + 1}"
            c_mod.execute("INSERT INTO skip_main_groups (id, name) VALUES (?, ?)", (m_id, m_name))
            mod_mg_map[m_name.lower()] = m_id
        new_sg_id = f"sg_{len(mod_sg_map) + 1}"
        c_mod.execute("""
            INSERT INTO skip_sub_groups (id, main_group_id, main_group, group_name, sum_column)
            VALUES (?, ?, ?, ?, ?)
        """, (new_sg_id, m_id, m_name, g_name, sum_col))
        mod_sg_map[g_name.lower()] = new_sg_id
        mod_sg_main[g_name.lower()] = m_name
        print(f"  + Added missing Sub Group: {g_name} ({new_sg_id})")

c_mod.commit()

# Refresh maps
mod_sgs = c_mod.execute("SELECT * FROM skip_sub_groups").fetchall()
mod_sg_map = {}
for r in mod_sgs:
    mod_sg_map[r['group_name'].strip().lower()] = r['id']
    mod_sg_map[r['group_name'].strip().lower().replace('-', ' ')] = r['id']

# 3. Skip Items
trk_items = c_trk.execute("SELECT * FROM skip_items").fetchall()
print(f"\nTrack Skip Items total in DB: {len(trk_items)}")

# Clear modern skip_items first
c_mod.execute("DELETE FROM skip_items")

seen = set()
inserted_count = 0
duplicates_dropped = 0

for idx, r in enumerate(trk_items):
    pfx = (r['item_prefix'] or '').strip()
    g_name = (r['group_name'] or '').strip()
    m_grp = (r['main_group'] or '').strip()

    if not pfx or not g_name:
        continue

    # Key per group to deduplicate identical prefixes within same group
    key = (g_name.lower(), pfx.lower())
    if key in seen:
        duplicates_dropped += 1
        continue
    seen.add(key)

    sg_id = mod_sg_map.get(g_name.lower()) or mod_sg_map.get(g_name.lower().replace('-', ' ')) or ''
    item_id = f"si_{inserted_count + 1}"

    c_mod.execute("""
        INSERT INTO skip_items (id, sub_group_id, main_group, group_name, item_prefix)
        VALUES (?, ?, ?, ?, ?)
    """, (item_id, sg_id, m_grp, g_name, pfx))
    inserted_count += 1

c_mod.commit()

print(f"\n=== MIGRATION COMPLETED ===")
print(f"Total inserted skip items into billapp.db: {inserted_count}")
print(f"Duplicates dropped within groups: {duplicates_dropped}")

# Verify
total_in_db = c_mod.execute("SELECT count(*) FROM skip_items").fetchone()[0]
print(f"Verified count in billapp.db: {total_in_db}")

# 4. Also update src/data/sqliteSkipData.ts so the initial bundle seed is also 100% current
mg_rows = [dict(r) for r in c_mod.execute("SELECT id, name FROM skip_main_groups").fetchall()]
sg_rows = [dict(r) for r in c_mod.execute("SELECT id, main_group_id as mainGroupId, main_group as mainGroup, group_name as groupName, sum_column as sumColumn FROM skip_sub_groups").fetchall()]
si_rows = [dict(r) for r in c_mod.execute("SELECT id, sub_group_id as subGroupId, main_group as mainGroup, group_name as groupName, item_prefix as itemPrefix FROM skip_items").fetchall()]

header = f"""// =====================================================================
// SQLITE_SKIP_DATA — Clean & Deduplicated directly from BillTrack (bill_data.db)
// {len(mg_rows)} Main Groups, {len(sg_rows)} Sub Groups, {len(si_rows)} Skip Items
// =====================================================================

export interface SkipMainGroupSeed {{
  id: string;
  name: string;
}}

export interface SkipSubGroupSeed {{
  id: string;
  mainGroupId: string;
  mainGroup: string;
  groupName: string;
  sumColumn: 'QTY' | 'U CAP' | 'L CAP';
}}

export interface SkipItemSeed {{
  id: string;
  subGroupId: string;
  mainGroup: string;
  groupName: string;
  itemPrefix: string;
}}

export const SQLITE_SKIP_MAIN_GROUPS: SkipMainGroupSeed[] = {json.dumps(mg_rows, indent=2)};

export const SQLITE_SKIP_SUB_GROUPS: SkipSubGroupSeed[] = {json.dumps(sg_rows, indent=2)};

export const SQLITE_SKIP_ITEMS: SkipItemSeed[] = {json.dumps(si_rows, indent=2)};
"""

with open('src/data/sqliteSkipData.ts', 'w', encoding='utf-8') as f:
    f.write(header)

print(f"Updated src/data/sqliteSkipData.ts successfully!")
