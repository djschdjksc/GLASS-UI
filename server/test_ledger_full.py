import sqlite3, json

conn = sqlite3.connect('f:/MODERN SUMMARY APP/billapp.db')
conn.row_factory = sqlite3.Row

def party_matches(record_party, search_party):
    if not record_party or not search_party:
        return False
    rp = record_party.strip().lower()
    sp = search_party.strip().lower()
    if rp == sp:
        return True
    if rp.startswith(sp + ' -') or rp.startswith(sp + '-') or rp.startswith(sp + ' '):
        return True
    if sp.startswith(rp + ' -') or sp.startswith(rp + '-') or sp.startswith(rp + ' '):
        return True
    rp_base = rp.split(' -')[0].strip()
    sp_base = sp.split(' -')[0].strip()
    if rp_base and sp_base and rp_base == sp_base:
        return True
    if sp in rp or rp in sp:
        return True
    return False

def get_ledger_for_party(target_party, date_from=None, date_to=None):
    # 1. Fetch matching bills
    all_bills = conn.execute("SELECT * FROM bills").fetchall()
    matched_bills = [b for b in all_bills if party_matches(b['party'], target_party)]

    # 2. Fetch matching receipts
    all_rcpts = conn.execute("SELECT * FROM party_receipts").fetchall()
    matched_rcpts = [r for r in all_rcpts if party_matches(r['party'], target_party)]

    # 3. Fetch matching adjustments
    all_adjs = conn.execute("SELECT * FROM bill_adjustments").fetchall()
    matched_adjs = [a for a in all_adjs if party_matches(a['party'], target_party)]

    print(f"Target: '{target_party}' -> Matched Bills: {len(matched_bills)}, Receipts: {len(matched_rcpts)}, Adjustments: {len(matched_adjs)}")
    for b in matched_bills:
        print(f"  Bill: {b['id']} | Token: {b['token']} | Party: {b['party']} | Total: {b['total']} | Date: {b['date']}")
    for a in matched_adjs:
        print(f"  Adjustment: {a['id']} | Party: {a['party']} | Type: {a['adj_type']} | Desc: {a['description']} | Amt: {a['amount']} | Date: {a['bill_date']}")

get_ledger_for_party('MANNI - Jalandhar')
print()
get_ledger_for_party('ROHIT')
print()
get_ledger_for_party('3D INTERIORS')
