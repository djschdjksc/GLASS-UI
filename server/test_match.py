import sqlite3

conn = sqlite3.connect('f:/MODERN SUMMARY APP/billapp.db')
c = conn.cursor()
c.execute('SELECT DISTINCT party FROM bills')
parties = [r[0] for r in c.fetchall()]

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

matched = [p for p in parties if party_matches(p, '3D INTERIORS')]
print('Matched for 3D INTERIORS:', matched)

matched_rohit = [p for p in parties if party_matches(p, 'ROHIT')]
print('Matched for ROHIT:', matched_rohit)

matched_ajay = [p for p in parties if party_matches(p, 'AJAY KUMAR')]
print('Matched for AJAY KUMAR:', matched_ajay)
