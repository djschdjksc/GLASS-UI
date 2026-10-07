import sqlite3
import os

db_path = r'F:\BillTrack\database\bill_data.db'
if not os.path.exists(db_path):
    print(f'File NOT found: {db_path}')
    # Let's search if it's elsewhere
    for root, dirs, files in os.walk(r'F:\BillTrack'):
        for f in files:
            if f.endswith('.db'):
                print('Found db:', os.path.join(root, f))
else:
    print(f'File found: {db_path}, size={os.path.getsize(db_path)} bytes')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    tables = [t[0] for t in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print('Tables in F:\\BillTrack\\database\\bill_data.db:')
    for t in sorted(tables):
        cnt = c.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
        cols = [col[1] for col in c.execute(f'PRAGMA table_info("{t}")').fetchall()]
        print(f'  {t}: {cnt} rows | cols: {cols}')
