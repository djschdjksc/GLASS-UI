import sqlite3

c1 = sqlite3.connect(r'f:\SUMMARY\BillApp\database\bill_data.db')
c2 = sqlite3.connect('billapp.db')

tables1 = [t[0] for t in c1.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
tables2 = [t[0] for t in c2.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

print('--- LEGACY DB TABLES ---')
for t in sorted(tables1):
    cnt = c1.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
    print(f'  {t}: {cnt} rows')

print('\n--- MODERN DB (billapp.db) TABLES ---')
for t in sorted(tables2):
    cnt = c2.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
    print(f'  {t}: {cnt} rows')
