import sqlite3, json

conn = sqlite3.connect('f:/MODERN SUMMARY APP/billapp.db')
conn.row_factory = sqlite3.Row

# Get all unique parties from parties, bills, receipts, adjustments
parties_rows = conn.execute("SELECT name FROM parties").fetchall()
all_p_names = set(r['name'].strip() for r in parties_rows if r['name'])

bill_parties = conn.execute("SELECT DISTINCT party FROM bills WHERE party IS NOT NULL AND party != ''").fetchall()
for bp in bill_parties:
    all_p_names.add(bp['party'].strip())

rcpt_parties = conn.execute("SELECT DISTINCT party FROM party_receipts WHERE party IS NOT NULL AND party != ''").fetchall()
for rp in rcpt_parties:
    all_p_names.add(rp['party'].strip())

adj_parties = conn.execute("SELECT DISTINCT party FROM bill_adjustments WHERE party IS NOT NULL AND party != ''").fetchall()
for ap in adj_parties:
    all_p_names.add(ap['party'].strip())

print(f"Total merged unique party names: {len(all_p_names)}")
