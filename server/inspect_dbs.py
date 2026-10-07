import sqlite3
import os

print("=" * 60)
print("INSPECTING F:\\SUMMARY\\BillApp\\database\\bill_data.db")
print("=" * 60)

old_db = r'f:\SUMMARY\BillApp\database\bill_data.db'
if os.path.exists(old_db):
    conn = sqlite3.connect(old_db)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]
    print(f"Found {len(tables)} tables: {tables}\n")
    for t_name in tables:
        if t_name == 'sqlite_sequence': continue
        cur.execute(f"PRAGMA table_info({t_name});")
        cols = [f"{c[1]} ({c[2]})" for c in cur.fetchall()]
        cur.execute(f"SELECT count(*) FROM {t_name};")
        cnt = cur.fetchone()[0]
        print(f"Table: {t_name} -> {cnt} rows")
        print(f"  Columns: {', '.join(cols)}")
        # Sample 1 row
        cur.execute(f"SELECT * FROM {t_name} LIMIT 1;")
        sample = cur.fetchone()
        if sample:
            print(f"  Sample: {sample[:6]}")
        print()
    conn.close()
else:
    print(f"Old DB does not exist at {old_db}")

print("=" * 60)
print("INSPECTING F:\\MODERN SUMMARY APP\\billapp.db")
print("=" * 60)

new_db = r'f:\MODERN SUMMARY APP\billapp.db'
if os.path.exists(new_db):
    conn2 = sqlite3.connect(new_db)
    cur2 = conn2.cursor()
    cur2.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables2 = [t[0] for t in cur2.fetchall()]
    print(f"Found {len(tables2)} tables: {tables2}\n")
    for t_name in tables2:
        if t_name == 'sqlite_sequence': continue
        cur2.execute(f"PRAGMA table_info({t_name});")
        cols = [f"{c[1]} ({c[2]})" for c in cur2.fetchall()]
        cur2.execute(f"SELECT count(*) FROM {t_name};")
        cnt = cur2.fetchone()[0]
        print(f"Table: {t_name} -> {cnt} rows")
        print(f"  Columns: {', '.join(cols)}")
        cur2.execute(f"SELECT * FROM {t_name} LIMIT 1;")
        sample = cur2.fetchone()
        if sample:
            print(f"  Sample: {sample[:6]}")
        print()
    conn2.close()
