import type { RawItem, FinishedItem } from '../../types';

export interface BillRecord {
  id: string;
  token: string;
  date: string;
  party: string;
  docType: string;
  vehicle: string;
  typeSelection: string;
  total: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
  createdAt: number;
  updatedAt: number;
  synced: boolean;
  version: number;
}

export interface PartyRecord {
  id: string;
  name: string;
  contact: string;
  phone: string;
  city: string;
  district?: string;
  balance: number;
  limit: number;
  gstin: string;
  updatedAt: number;
  synced: boolean;
}

export interface StockItemRecord {
  id: string;
  code: string;
  name: string;
  category: 'FINISHED GOODS' | 'RAW MATERIAL' | 'ALLOY AGENT' | 'CONSUMABLE';
  qty: number;
  minQty: number;
  uom: string;
  rack: string;
  status: 'IN STOCK' | 'LOW STOCK' | 'CRITICAL';
  updatedAt: number;
  synced: boolean;
}

export interface LedgerEntryRecord {
  id: string;
  partyId: string;
  date: string;
  type: 'OPENING BAL' | 'SALE BILL' | 'PAYMENT' | 'JOURNAL' | 'CREDIT NOTE';
  voucher: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  updatedAt: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'bills' | 'parties' | 'stock' | 'ledger';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export interface AppPreferences {
  tableRowHeight: 'compact' | 'normal' | 'spacious';
  customRowHeightPx: number;
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  soundVolume: number;
  bgType: 'image' | 'color';
  bgImage: string;
  bgColor: string;
  blurAmount: number;
  overlayOpacity: number;
  glassOpacity: number;
  autoSyncIntervalMs: number;
  serverEndpointUrl: string;
  columnWidths: Record<string, number>;
}
