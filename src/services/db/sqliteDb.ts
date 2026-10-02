/**
 * sqliteDb.ts — SQLite Database Service (via Python db_server on port 5006)
 * USB-portable: billapp.db stored on USB drive with the app
 * Falls back gracefully if server not running
 */

const DB_URL = 'http://127.0.0.1:5006';

// ─── Core fetch helpers ───────────────────────────────────────────────────────

async function dbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${DB_URL}${path}`);
  if (!res.ok) throw new Error(`DB GET ${path} failed: ${res.status}`);
  return res.json();
}

async function dbPost<T = { success: boolean }>(path: string, body: any): Promise<T> {
  const res = await fetch(`${DB_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`DB POST ${path} failed: ${res.status}`);
  return res.json();
}

async function dbDelete(path: string): Promise<void> {
  const res = await fetch(`${DB_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DB DELETE ${path} failed: ${res.status}`);
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function checkDbServer(): Promise<boolean> {
  try {
    const data = await dbGet<any>('/api/db/status');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function getDbInfo(): Promise<any> {
  return dbGet('/api/db/info');
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export async function getBills(): Promise<any[]> {
  return dbGet('/api/db/bills');
}

export async function getBillById(id: string): Promise<any | null> {
  return dbGet(`/api/db/bills/${id}`);
}

export async function saveBill(bill: any): Promise<void> {
  // Clean empty rows before saving
  const clean = {
    ...bill,
    rawItems: (bill.rawItems || []).filter((r: any) =>
      (r.name && r.name.trim()) || Number(r.qty) > 0 || Number(r.uCap) > 0 || Number(r.lCap) > 0
    ),
    finishedItems: (bill.finishedItems || []).filter((f: any) =>
      (f.mould && f.mould.trim() && f.mould !== 'Mould Name') &&
      (Number(f.qty) > 0 || Number(f.total) > 0)
    )
  };
  await dbPost('/api/db/bills', clean);
}

export async function deleteBill(id: string): Promise<void> {
  await dbDelete(`/api/db/bills/${id}`);
}

// ─── Parties ──────────────────────────────────────────────────────────────────

export async function getParties(): Promise<any[]> {
  return dbGet('/api/db/parties');
}

export async function saveParty(party: any): Promise<void> {
  await dbPost('/api/db/parties', party);
}

export async function deleteParty(id: string): Promise<void> {
  await dbDelete(`/api/db/parties/${id}`);
}

// ─── Skip Main Groups ─────────────────────────────────────────────────────────

export async function getSkipMainGroups(): Promise<any[]> {
  return dbGet('/api/db/skip-main-groups');
}

export async function saveSkipMainGroup(group: any): Promise<void> {
  await dbPost('/api/db/skip-main-groups', group);
}

export async function deleteSkipMainGroup(id: string): Promise<void> {
  await dbDelete(`/api/db/skip-main-groups/${id}`);
}

// ─── Skip Sub Groups ──────────────────────────────────────────────────────────

export async function getSkipSubGroups(): Promise<any[]> {
  return dbGet('/api/db/skip-sub-groups');
}

export async function saveSkipSubGroup(group: any): Promise<void> {
  await dbPost('/api/db/skip-sub-groups', group);
}

export async function deleteSkipSubGroup(id: string): Promise<void> {
  await dbDelete(`/api/db/skip-sub-groups/${id}`);
}

// ─── Skip Items ───────────────────────────────────────────────────────────────

export async function getSkipItems(): Promise<any[]> {
  return dbGet('/api/db/skip-items');
}

export async function saveSkipItem(item: any): Promise<void> {
  await dbPost('/api/db/skip-items', item);
}

export async function deleteSkipItem(id: string): Promise<void> {
  await dbDelete(`/api/db/skip-items/${id}`);
}

// ─── Conversions ──────────────────────────────────────────────────────────────

export async function getConversions(): Promise<any[]> {
  return dbGet('/api/db/conversions');
}

export async function saveConversion(conv: any): Promise<void> {
  await dbPost('/api/db/conversions', conv);
}

export async function deleteConversion(id: string): Promise<void> {
  await dbDelete(`/api/db/conversions/${id}`);
}

// ─── Control Groups (Manage Groups) ──────────────────────────────────────────

export async function getControlGroups(): Promise<any[]> {
  return dbGet('/api/db/groups');
}

export async function saveControlGroup(group: any): Promise<void> {
  await dbPost('/api/db/groups', group);
}

export async function deleteControlGroup(id: string): Promise<void> {
  await dbDelete(`/api/db/groups/${id}`);
}

export async function saveControlGroupsBulk(groups: any[]): Promise<void> {
  await dbPost('/api/db/groups/bulk', groups);
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function getStockItems(): Promise<any[]> {
  return dbGet('/api/db/stock');
}

export async function saveStockItem(item: any): Promise<void> {
  await dbPost('/api/db/stock', item);
}

export async function deleteStockItem(id: string): Promise<void> {
  await dbDelete(`/api/db/stock/${id}`);
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export async function getLedgerEntries(partyId?: string): Promise<any[]> {
  const path = partyId ? `/api/db/ledger?partyId=${partyId}` : '/api/db/ledger';
  return dbGet(path);
}

export async function saveLedgerEntry(entry: any): Promise<void> {
  await dbPost('/api/db/ledger', entry);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const data = await dbGet<{ value: string | null }>(`/api/db/settings/${key}`);
  return data.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await dbPost('/api/db/settings', { key, value });
}

// ─── Data Sync (Export/Import for other USB users) ───────────────────────────

export async function exportAllData(): Promise<{
  bills: any[];
  parties: any[];
  skipMainGroups: any[];
  skipSubGroups: any[];
  skipItems: any[];
  conversions: any[];
}> {
  const [bills, parties, skipMainGroups, skipSubGroups, skipItems, conversions] = await Promise.all([
    getBills(),
    getParties(),
    getSkipMainGroups(),
    getSkipSubGroups(),
    getSkipItems(),
    getConversions()
  ]);
  return { bills, parties, skipMainGroups, skipSubGroups, skipItems, conversions };
}

export async function importData(data: { bills?: any[]; parties?: any[] }): Promise<void> {
  await dbPost('/api/db/import', data);
}
