import sqlite3

c_track = sqlite3.connect(r'F:\BillTrack\database\bill_data.db')
c_track.row_factory = sqlite3.Row
c_modern = sqlite3.connect('billapp.db')
c_modern.row_factory = sqlite3.Row

print("=== TRACK SKIP_ITEMS ===")
track_si = c_track.execute("SELECT * FROM skip_items").fetchall()
print(f"Total track skip_items: {len(track_si)}")

# Deduplicate items PER GROUP (preserving first occurrence order)
seen = set()
unique_items_per_group = []
duplicates_dropped = []

for r in track_si:
    grp = (r['group_name'] or '').strip()
    pfx = (r['item_prefix'] or '').strip()
    key = (grp.lower(), pfx.lower())
    if key in seen:
        duplicates_dropped.append((grp, pfx))
    else:
        seen.add(key)
        unique_items_per_group.append(r)

print(f"Unique items after deduplication by (group, prefix): {len(unique_items_per_group)}")
print(f"Duplicates dropped: {len(duplicates_dropped)}")

print("\n=== MODERN SKIP_ITEMS SCHEMA ===")
print("PRAGMA table_info(skip_items):", c_modern.execute("PRAGMA table_info(skip_items)").fetchall())
print("Sample modern skip_items:", [dict(r) for r in c_modern.execute("SELECT * FROM skip_items LIMIT 3").fetchall()])

print("\n=== MODERN SKIP_SUB_GROUPS SCHEMA ===")
print("PRAGMA table_info(skip_sub_groups):", c_modern.execute("PRAGMA table_info(skip_sub_groups)").fetchall())
print("Sample modern skip_sub_groups:", [dict(r) for r in c_modern.execute("SELECT * FROM skip_sub_groups LIMIT 3").fetchall()])

print("\n=== MODERN SKIP_MAIN_GROUPS SCHEMA ===")
print("PRAGMA table_info(skip_main_groups):", c_modern.execute("PRAGMA table_info(skip_main_groups)").fetchall())
print("Sample modern skip_main_groups:", [dict(r) for r in c_modern.execute("SELECT * FROM skip_main_groups LIMIT 3").fetchall()])
