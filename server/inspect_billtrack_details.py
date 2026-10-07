import sqlite3

conn = sqlite3.connect(r'F:\BillTrack\database\bill_data.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

print("--- CONTROL_PANEL (CONVERSIONS) ---")
cp_rows = c.execute("SELECT * FROM control_panel").fetchall()
print(f"Total control_panel rows: {len(cp_rows)}")
# Check for duplicate shortcuts or conversions
from collections import Counter
shortcuts = [r['shortcut'].strip() for r in cp_rows if r['shortcut']]
convs = [r['conversion'].strip() for r in cp_rows if r['conversion']]
print(f"Unique shortcuts: {len(set(shortcuts))}, duplicate shortcuts: {[k for k, v in Counter(shortcuts).items() if v > 1]}")
print(f"Unique conversions: {len(set(convs))}, duplicate conversions: {[k for k, v in Counter(convs).items() if v > 1]}")

print("\n--- SKIP_ITEMS ---")
si_rows = c.execute("SELECT * FROM skip_items").fetchall()
print(f"Total skip_items rows: {len(si_rows)}")
prefixes = [r['item_prefix'].strip() for r in si_rows if r['item_prefix']]
print(f"Unique prefixes overall: {len(set(prefixes))}, duplicates overall: {len(prefixes) - len(set(prefixes))}")

# Check duplicates PER GROUP
group_prefixes = {}
for r in si_rows:
    grp = (r['group_name'] or '').strip()
    pfx = (r['item_prefix'] or '').strip()
    if grp not in group_prefixes:
        group_prefixes[grp] = []
    group_prefixes[grp].append(pfx)

print(f"\nGroups count in skip_items: {len(group_prefixes)}")
total_dups_in_group = 0
for grp, p_list in sorted(group_prefixes.items()):
    c_counts = Counter(p_list)
    dups = {k: v for k, v in c_counts.items() if v > 1}
    if dups:
        print(f"  Group '{grp}': {len(p_list)} items, {len(dups)} duplicated items: {list(dups.items())[:3]}")
        total_dups_in_group += sum(v - 1 for v in dups.values())

print(f"Total duplicate entries within groups in skip_items: {total_dups_in_group}")

print("\n--- CONTROL_GROUPS ---")
cg_rows = c.execute("SELECT * FROM control_groups").fetchall()
print(f"Total control_groups: {len(cg_rows)}")
for r in cg_rows:
    print(f"  {dict(r)}")

print("\n--- MAIN_GROUPS ---")
mg_rows = c.execute("SELECT * FROM main_groups").fetchall()
for r in mg_rows:
    print(f"  {dict(r)}")

print("\n--- SKIP_GROUPS ---")
sg_rows = c.execute("SELECT * FROM skip_groups").fetchall()
print(f"Total skip_groups: {len(sg_rows)}")
for r in sg_rows[:10]:
    print(f"  {dict(r)}")
