import sqlite3, json
conn = sqlite3.connect('f:/MODERN SUMMARY APP/billapp.db')
c = conn.cursor()
c.execute("SELECT id, party, raw_items, finished_items FROM bills WHERE id IN ('B-74', 'B-75', 'B-76')")
for r in c.fetchall():
    print('ID:', r[0])
    raw = json.loads(r[2]) if r[2] else []
    fin = json.loads(r[3]) if r[3] else []
    print(f'  Raw count: {len(raw)}: {raw}')
    print(f'  Fin count: {len(fin)}: {fin}')
