import sqlite3, json

conn = sqlite3.connect('f:/MODERN SUMMARY APP/billapp.db')
c = conn.cursor()

# Check bills where total is 0 but finished_items has items
c.execute("SELECT id, party, total, finished_items, raw_items FROM bills WHERE party LIKE '%ROHIT%'")
rows = c.fetchall()
print(f"Total Rohit bills: {len(rows)}")
for r in rows:
    fin = json.loads(r[3]) if r[3] else []
    raw = json.loads(r[4]) if r[4] else []
    fin_tot = sum(float(x.get('total', 0) or 0) for x in fin)
    raw_tot = sum(float(x.get('qty', 0) or 0) * (float(x.get('uCap', 0) or 0) + float(x.get('lCap', 0) or 0)) for x in raw)
    print(f"ID: {r[0]} | Party: {r[1]} | Stored Total: {r[2]} | Fin Tot: {fin_tot} | Raw Tot: {raw_tot} | Fin items count: {len(fin)} | Raw count: {len(raw)}")
