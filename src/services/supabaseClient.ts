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
  return { name, prefix, role, terminal };
};

export const setUserProfile = (profile: Partial<UserProfile>) => {
  if (profile.name !== undefined) localStorage.setItem('modern_app_user_name', profile.name);
  if (profile.prefix !== undefined) localStorage.setItem('modern_app_user_prefix', profile.prefix.toUpperCase().trim());
  if (profile.role !== undefined) localStorage.setItem('modern_app_user_role', profile.role);
  if (profile.terminal !== undefined) localStorage.setItem('modern_app_user_terminal', profile.terminal);
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
    dynamic_cols: bill.dynamicCols || [],
    last_modified_by: userName || 'User',
    updated_at: new Date().toISOString(),
    version: (bill.version || 1) + 1
  };
};

// Convert Supabase public.bills row to internal BillRecord
export const supabaseToBillRecord = (row: any): BillRecord => {
  return {
    id: row.id,
    token: String(row.token || ''),
    date: row.date || '2026-07-23',
    party: row.party || 'Standard Account',
    docType: row.doc_type || 'SALE BILL',
    vehicle: row.vehicle || '',
    typeSelection: row.type_selection || 'WHOLESALE',
    total: Number(row.total || 0),
    status: row.status || 'PAID',
    rawItems: (row.raw_items || []).map((r: any, idx: number) => ({
      id: String(r.id || idx + 1),
      name: r.name || '',
      qty: Number(r.qty || 0),
      uCap: Number(r.uCap || 0),
      lCap: Number(r.lCap || 0),
      partyCode: r.partyCode
    })),
    finishedItems: (row.finished_items || []).map((f: any, idx: number) => ({
      id: String(f.id || idx + 1),
      mould: f.mould || '',
      qty: Number(f.qty || 0),
      price: Number(f.price || 0),
      total: Number(f.total || 0)
    })),
    dynamicCols: row.dynamic_cols || [],
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    synced: true,
    version: row.version || 1
  };
};
