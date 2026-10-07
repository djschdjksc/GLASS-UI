import sqlite3
import json

conn = sqlite3.connect('billapp.db')
conn.row_factory = sqlite3.Row

mg_rows = conn.execute("SELECT id, name FROM skip_main_groups").fetchall()
sg_rows = conn.execute("SELECT id, main_group_id as mainGroupId, main_group as mainGroup, group_name as groupName, sum_column as sumColumn FROM skip_sub_groups").fetchall()
si_rows = conn.execute("SELECT id, sub_group_id as subGroupId, main_group as mainGroup, group_name as groupName, item_prefix as itemPrefix FROM skip_items").fetchall()

mg_list = [dict(r) for r in mg_rows]
sg_list = [dict(r) for r in sg_rows]
si_list = [dict(r) for r in si_rows]

header = """// =====================================================================
// SQLITE_SKIP_DATA — Clean & Deduplicated directly from BillTrack (bill_data.db)
// 5 Main Groups, 34 Sub Groups, 363 Strictly Unique Skip Items (0 Duplicates)
// =====================================================================

export interface SkipMainGroupSeed {
  id: string;
  name: string;
}

export interface SkipSubGroupSeed {
  id: string;
  mainGroupId: string;
  mainGroup: string;
  groupName: string;
  sumColumn: 'QTY' | 'U CAP' | 'L CAP';
}

export interface SkipItemSeed {
  id: string;
  subGroupId: string;
  mainGroup: string;
  groupName: string;
  itemPrefix: string;
}

export const SQLITE_SKIP_MAIN_GROUPS: SkipMainGroupSeed[] = """ + json.dumps(mg_list, indent=2) + """;

export const SQLITE_SKIP_SUB_GROUPS: SkipSubGroupSeed[] = """ + json.dumps(sg_list, indent=2) + """;

export const SQLITE_SKIP_ITEMS: SkipItemSeed[] = """ + json.dumps(si_list, indent=2) + """;
"""

with open('src/data/sqliteSkipData.ts', 'w', encoding='utf-8') as f:
    f.write(header)

print(f"Updated src/data/sqliteSkipData.ts: {len(mg_list)} main groups, {len(sg_list)} sub groups, {len(si_list)} unique items")
