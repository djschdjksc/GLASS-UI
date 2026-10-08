import { createClient } from '@supabase/supabase-js';
import type { BillRecord } from './db/schema';

// Supabase Connection Configuration
export const SUPABASE_URL = 'https://cdlyljyhcxhpuqbsaxan.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_AeYMSkKgL09Rd0bZF4eTmw_2arKL1Ls';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

export interface UserProfile {
  name: string;
  prefix: string;
  role: string;
  terminal: string;
  avatarId?: number;
}

export const getUserPrefix = (name: string, customPrefix?: string): string => {
  if (customPrefix && customPrefix.trim()) {
    return customPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  const clean = (name || 'USER').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean || 'BILL';
};

export const getUserProfile = (): UserProfile => {
  const name = localStorage.getItem('modern_app_user_name') || '';
  const storedPrefix = localStorage.getItem('modern_app_user_prefix') || '';
  const prefix = storedPrefix || getUserPrefix(name);
  const role = localStorage.getItem('modern_app_user_role') || 'Billing Counter';
  const terminal = localStorage.getItem('modern_app_user_terminal') || 'Counter #1';
  const avatarIdStr = localStorage.getItem('modern_app_user_avatar_id');
  const avatarId = avatarIdStr ? parseInt(avatarIdStr, 10) : undefined;
  return { name, prefix, role, terminal, avatarId };
};

export const setUserProfile = (profile: Partial<UserProfile>) => {
  if (profile.name !== undefined) localStorage.setItem('modern_app_user_name', profile.name);
  if (profile.prefix !== undefined) localStorage.setItem('modern_app_user_prefix', profile.prefix.toUpperCase().trim());
  if (profile.role !== undefined) localStorage.setItem('modern_app_user_role', profile.role);
  if (profile.terminal !== undefined) localStorage.setItem('modern_app_user_terminal', profile.terminal);
  if (profile.avatarId !== undefined) localStorage.setItem('modern_app_user_avatar_id', String(profile.avatarId));
  window.dispatchEvent(new Event('storage'));
};

// Generates next token for this operator (e.g. ROHIT-1, ROHIT-2)
export const getNextUserToken = (allBills: BillRecord[], userPrefix: string): string => {
  const prefixUpper = (userPrefix || 'BILL').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let maxNum = 0;

  for (const b of allBills) {
    const tok = String(b.token || '').toUpperCase().trim();
    if (tok.startsWith(`${prefixUpper}-`)) {
      const numPart = parseInt(tok.substring(prefixUpper.length + 1), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  return `${prefixUpper}-${maxNum + 1}`;
};

// Convert internal BillRecord to Supabase public.bills row
export const billRecordToSupabase = (bill: BillRecord, userName: string) => {
  const ver = bill.version || 1;
  const operatorName = userName || bill.lastModifiedBy || 'User';
  const prefix = getUserPrefix(operatorName);
  const editId = bill.editId || `${prefix}-${ver}`;

  // Package dynamic cols and extra metadata (adjustments, balanceLabel, vehicleType, notes, hasPartyCodeCol, splitRowIndex)
  // inside dynamic_cols JSONB column so all 4-5 computers receive full data without Supabase schema mismatch!
  const cleanCols = Array.isArray(bill.dynamicCols)
    ? bill.dynamicCols.filter((c: any) => c && !c.__meta)
    : [];

  const metaPayload: any = {
    __meta: true,
    vehicleType: bill.vehicleType || '',
    adjustments: Array.isArray(bill.adjustments) ? bill.adjustments : [],
    balanceLabel: bill.balanceLabel || 'BALANCE',
    customItemGroups: Array.isArray(bill.customItemGroups) ? bill.customItemGroups : [],
    notes: bill.notes || '',
    hasPartyCodeCol: Boolean(bill.hasPartyCodeCol),
    splitRowIndex: bill.splitRowIndex ?? null
  };

  const storedDynamicCols = [...cleanCols, metaPayload];

  return {
    id: bill.id,
    token: String(bill.token || ''),
    date: bill.date || new Date().toISOString().split('T')[0],
    party: bill.party || 'Standard Account',
    doc_type: bill.docType || 'SALE BILL',
    vehicle: bill.vehicle || '',
    type_selection: bill.typeSelection || 'WHOLESALE',
    total: Number(bill.total || 0),
    status: bill.status || 'PAID',
    raw_items: bill.rawItems || [],
    finished_items: bill.finishedItems || [],
    dynamic_cols: storedDynamicCols,
    last_modified_by: operatorName,
    updated_at: new Date().toISOString(),
    version: ver,
    edit_id: editId
  };
};

// Convert Supabase public.bills row to internal BillRecord
export const supabaseToBillRecord = (row: any): BillRecord => {
  const modUser = row.last_modified_by || 'User';
  const ver = Number(row.version) || 1;
  const prefix = getUserPrefix(modUser);
  const editId = row.edit_id || `${prefix}-${ver}`;

  const rawDyn = row.dynamic_cols;
  let dynamicCols: any[] = [];
  let metaObj: any = {};

  if (Array.isArray(rawDyn)) {
    const metaItem = rawDyn.find((item: any) => item && item.__meta);
    if (metaItem) {
      metaObj = metaItem;
      dynamicCols = rawDyn.filter((item: any) => item && !item.__meta);
    } else {
      dynamicCols = rawDyn;
    }
  } else if (rawDyn && typeof rawDyn === 'object') {
    dynamicCols = Array.isArray(rawDyn.cols) ? rawDyn.cols : [];
    metaObj = rawDyn.meta || rawDyn;
  }

  return {
    id: row.id,
    token: String(row.token || ''),
    date: row.date || new Date().toISOString().slice(0, 10),
    party: row.party || 'Standard Account',
    docType: row.doc_type || 'SALE BILL',
    vehicle: row.vehicle || '',
    vehicleType: metaObj.vehicleType || '',
    typeSelection: row.type_selection || 'WHOLESALE',
    total: Number(row.total || 0),
    status: row.status || 'PAID',
    rawItems: (row.raw_items || []).map((r: any, idx: number) => ({
      id: String(r.id || idx + 1),
      name: r.name || '',
      qty: Number(r.qty || 0),
      uCap: Number(r.uCap || 0),
      lCap: Number(r.lCap || 0),
      partyCode: r.partyCode,
      ...r // Preserve dynamic column sizes (e.g. qty_12, col_15ft)
    })),
    finishedItems: (row.finished_items || []).map((f: any, idx: number) => ({
      id: String(f.id || idx + 1),
      mould: f.mould || '',
      qty: Number(f.qty || 0),
      price: Number(f.price || 0),
      total: Number(f.total || 0)
    })),
    dynamicCols,
    adjustments: Array.isArray(metaObj.adjustments) ? metaObj.adjustments : [],
    balanceLabel: metaObj.balanceLabel || 'BALANCE',
    customItemGroups: Array.isArray(metaObj.customItemGroups) ? metaObj.customItemGroups : [],
    hasPartyCodeCol: Boolean(metaObj.hasPartyCodeCol),
    notes: metaObj.notes || '',
    splitRowIndex: metaObj.splitRowIndex ?? null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    synced: true,
    version: ver,
    lastModifiedBy: modUser,
    editId: editId
  };
};
