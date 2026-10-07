import urllib.request, urllib.parse, json

def test_ledger(p):
    url = f"http://127.0.0.1:5006/api/db/ledger?party={urllib.parse.quote(p)}"
    req = urllib.request.urlopen(url)
    data = json.loads(req.read().decode())
    print(f"Party: {p}")
    print(f"  Info: {data.get('partyInfo')}")
    print(f"  Entries count: {len(data.get('entries', []))}")
    print(f"  Debit: {data.get('totalDebit')}, Credit: {data.get('totalCredit')}, Net: {data.get('netBalance')}")
    for e in data.get('entries', [])[:3]:
        print(f"    [{e.get('date')}] {e.get('type')} {e.get('voucher')}: Dr={e.get('debit')} Cr={e.get('credit')} Bal={e.get('balance')} | {e.get('particulars')}")

test_ledger('3D INTERIORS')
test_ledger('MANNI')
test_ledger('ROHIT')
