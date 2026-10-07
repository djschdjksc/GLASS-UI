import urllib.request, json

def test(url_name, path):
    try:
        url = f"http://127.0.0.1:5006{path}"
        res = urllib.request.urlopen(url)
        data = json.loads(res.read().decode())
        if isinstance(data, list):
            print(f"[{url_name}] OK - {len(data)} records")
        elif isinstance(data, dict):
            if 'entries' in data:
                print(f"[{url_name}] OK - {len(data['entries'])} entries, Dr: {data.get('totalDebit')}, Cr: {data.get('totalCredit')}, Bal: {data.get('netBalance')}")
            else:
                print(f"[{url_name}] OK - {data}")
    except Exception as e:
        print(f"[{url_name}] FAILED: {e}")

print("=== VERIFYING ALL BACKEND ENDPOINTS ===")
test("STATUS", "/api/db/status")
test("BILLS", "/api/db/bills")
test("PARTIES", "/api/db/parties")
test("LEDGER PARTIES", "/api/db/ledger/parties")
test("LEDGER 3D INTERIORS", "/api/db/ledger?party=3D%20INTERIORS")
test("LEDGER MANNI", "/api/db/ledger?party=MANNI")
test("LEDGER ROHIT", "/api/db/ledger?party=ROHIT")
test("SKIP MAIN GROUPS", "/api/db/skip-main-groups")
test("SKIP SUB GROUPS", "/api/db/skip-sub-groups")
test("SKIP ITEMS", "/api/db/skip-items")
test("CONVERSIONS", "/api/db/conversions")
test("BILL ITEM NAMES", "/api/db/bill-item-names")
test("CONTROL GROUPS", "/api/db/groups")
