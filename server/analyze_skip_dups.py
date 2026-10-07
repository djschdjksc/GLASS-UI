import sqlite3
from collections import Counter

c_track = sqlite3.connect(r'F:\BillTrack\database\bill_data.db')
c_track.row_factory = sqlite3.Row

track_si = c_track.execute("SELECT * FROM skip_items").fetchall()

print(f"Total rows in skip_items: {len(track_si)}")

# Analysis 1: Group-level duplicates
grp_counts = {}
for r in track_si:
    g = r['group_name'].strip()
    p = r['item_prefix'].strip()
    grp_counts.setdefault(g, []).append(p)

for g, items in grp_counts.items():
    dups = [k for k, v in Counter(items).items() if v > 1]
    if dups:
        print(f"Group '{g}': {len(items)} items -> {len(set(items))} unique. (Duplicates: {dups[:3]}...)")

# Analysis 2: Global prefix duplicates across different groups
pfx_to_grps = {}
for r in track_si:
    g = r['group_name'].strip()
    p = r['item_prefix'].strip()
    pfx_to_grps.setdefault(p, set()).add(g)

cross_group = {p: grps for p, grps in pfx_to_grps.items() if len(grps) > 1}
print(f"\nItem prefixes appearing in multiple groups: {len(cross_group)}")
for p, grps in list(cross_group.items())[:5]:
    print(f"  '{p}' appears in groups: {grps}")
