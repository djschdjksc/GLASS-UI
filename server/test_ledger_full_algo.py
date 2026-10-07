import sqlite3, json

conn = sqlite3.connect('f:/MODERN SUMMARY APP/billapp.db')
conn.row_factory = sqlite3.Row

def party_matches(record_party, search_party):
    if not record_party or not search_party:
        return False
    rp = str(record_party).strip().lower()
    sp = str(search_party).strip().lower()
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

def extract_bill_total(b_row):
    try:
        tot = round(float(b_row['total'] or 0.0), 2)
    except Exception:
        tot = 0.0
    if tot == 0.0:
        try:
            fin = b_row['finished_items']
            if fin:
                items = json.loads(fin) if isinstance(fin, str) else fin
                tot = round(sum(float(it.get('total', 0) or 0) for it in items), 2)
        except Exception:
            pass
    if tot == 0.0:
        try:
            raw = b_row['raw_items']
            if raw:
                items = json.loads(raw) if isinstance(raw, str) else raw
                raw_tot = 0.0
                for it in items:
                    q = float(it.get('qty', 0) or 0)
                    u = float(it.get('uCap', 0) or 0)
                    l = float(it.get('lCap', 0) or 0)
                    raw_tot += q * (u + l)
                tot = round(raw_tot, 2)
        except Exception:
            pass
    return tot

def compute_ledger(party_name, date_from='', date_to=''):
    all_bills = conn.execute("SELECT * FROM bills").fetchall()
    all_rcpts = conn.execute("SELECT * FROM party_receipts").fetchall()
    all_adjs = conn.execute("SELECT * FROM bill_adjustments").fetchall()
    all_parties = conn.execute("SELECT * FROM parties").fetchall()

    matched_bills = [b for b in all_bills if party_matches(b['party'], party_name)]
    matched_rcpts = [r for r in all_rcpts if party_matches(r['party'], party_name)]
    matched_adjs = [a for a in all_adjs if party_matches(a['party'], party_name)]

    p_match = next((p for p in all_parties if party_matches(p['name'], party_name)), None)
    opening_bal = 0.0
    if p_match and p_match['balance']:
        try: opening_bal = round(float(p_match['balance'] or 0), 2)
        except: pass

    # Prior
    if date_from:
        for b in matched_bills:
            b_date = (b['date'] or '')[:10]
            if b_date < date_from:
                tot = extract_bill_total(b)
                if 'RETURN' in (b['doc_type'] or '').upper():
                    opening_bal = round(opening_bal - tot, 2)
                else:
                    opening_bal = round(opening_bal + tot, 2)
        for r in matched_rcpts:
            r_date = (r['receipt_date'] or '')[:10]
            if r_date < date_from:
                opening_bal = round(opening_bal - float(r['amount'] or 0), 2)
        for a in matched_adjs:
            a_date = (a['bill_date'] or '')[:10]
            if a_date < date_from:
                amt = float(a['amount'] or 0)
                if a['adj_type'] == 'add': opening_bal = round(opening_bal + amt, 2)
                else: opening_bal = round(opening_bal - amt, 2)

    entries = []
    # Current
    for b in matched_bills:
        b_date = (b['date'] or '')[:10]
        if (not date_from or b_date >= date_from) and (not date_to or b_date <= date_to):
            tot = extract_bill_total(b)
            b_type = (b['doc_type'] or '').upper()
            is_ret = 'RETURN' in b_type
            is_ord = 'ORDER' in b_type
            entries.append({
                'id': f"b_{b['id']}",
                'rawId': b['id'],
                'date': b_date,
                'type': 'SALE RETURN' if is_ret else ('ORDER' if is_ord else 'SALE BILL'),
                'voucher': f"{'R' if is_ret else ('O' if is_ord else 'B')}-{b['token']}",
                'particulars': 'Sale Return' if is_ret else ('Order Estimate' if is_ord else 'Sale Bill'),
                'debit': 0.0 if is_ret else tot,
                'credit': tot if is_ret else 0.0,
                'canDelete': False
            })

    for r in matched_rcpts:
        r_date = (r['receipt_date'] or '')[:10]
        if (not date_from or r_date >= date_from) and (not date_to or r_date <= date_to):
            amt = round(float(r['amount'] or 0), 2)
            entries.append({
                'id': f"rcpt_{r['id']}",
                'rawId': r['id'],
                'date': r_date,
                'type': 'RECEIPT',
                'voucher': f"RCP-{r['id']}",
                'particulars': r['remarks'] or 'Payment Received',
                'debit': 0.0,
                'credit': amt,
                'canDelete': True
            })

    for a in matched_adjs:
        a_date = (a['bill_date'] or '')[:10]
        if (not date_from or a_date >= date_from) and (not date_to or a_date <= date_to):
            amt = round(float(a['amount'] or 0), 2)
            is_add = a['adj_type'] == 'add'
            entries.append({
                'id': f"adj_{a['id']}",
                'rawId': a['id'],
                'date': a_date,
                'type': 'ADJUSTMENT',
                'voucher': f"ADJ-{a['id']}",
                'particulars': a['description'] or 'Adjustment',
                'debit': amt if is_add else 0.0,
                'credit': 0.0 if is_add else amt,
                'canDelete': True
            })

    entries.sort(key=lambda x: (x['date'] or '', 0 if x['type'] in ('SALE BILL', 'ORDER') else (1 if x['type'] == 'SALE RETURN' else 2), str(x['id'])))

    final_entries = []
    if date_from:
        final_entries.append({
            'id': 'opening_bf',
            'rawId': 0,
            'date': date_from,
            'type': 'OPENING BALANCE',
            'voucher': 'B/F',
            'particulars': 'Opening Balance (Brought Forward)',
            'debit': opening_bal if opening_bal > 0 else 0.0,
            'credit': abs(opening_bal) if opening_bal < 0 else 0.0,
            'balance': opening_bal,
            'canDelete': False
        })

    running = opening_bal
    for e in entries:
        running = round(running + e['debit'] - e['credit'], 2)
        e['balance'] = running
        final_entries.append(e)

    return {
        'party': party_name,
        'opening': opening_bal,
        'entries': final_entries,
        'totalDebit': round(sum(e['debit'] for e in entries), 2),
        'totalCredit': round(sum(e['credit'] for e in entries), 2),
        'netBalance': running
    }

for p in ['MANNI - Jalandhar', 'ROHIT', '3D INTERIORS', 'AANYA GRAPHIC']:
    res = compute_ledger(p, '2026-01-01', '2026-12-31')
    print(f"Party: {res['party']} | Entries: {len(res['entries'])} | Total Dr: {res['totalDebit']} | Total Cr: {res['totalCredit']} | Net: {res['netBalance']}")
