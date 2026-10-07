import sqlite3
import json

conn = sqlite3.connect('billapp.db')
conn.row_factory = sqlite3.Row

rows = conn.execute("""
    SELECT shortcut, conversion, u_cap, l_cap, multiplication, color, box_size, weight_per_pcs, real_item_name, group_name
    FROM conversions
""").fetchall()

conv_list = []
for r in rows:
    d = dict(r)
    # Ensure numeric conversion
    d['multiplication'] = float(d['multiplication'] or 1.0)
    d['box_size'] = float(d['box_size'] or 1.0)
    d['weight_per_pcs'] = float(d['weight_per_pcs'] or 0.0)
    conv_list.append(d)

header = """export interface SqliteControlRow {
  shortcut: string;
  conversion: string;
  size?: number | string;
  u_cap: string | number;
  l_cap: string | number;
  multiplication: number;
  color: string;
  box_size: number;
  weight_per_pcs: number;
  real_item_name: string;
  group_name: string;
}

export const SQLITE_CONTROL_CONVERSIONS: SqliteControlRow[] = """ + json.dumps(conv_list, indent=2) + """;
"""

with open('src/data/sqliteControlPanel.ts', 'w', encoding='utf-8') as f:
    f.write(header)

print(f"Updated src/data/sqliteControlPanel.ts with {len(conv_list)} conversions")
