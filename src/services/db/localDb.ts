import { SQLITE_BILLS, SQLITE_PARTIES } from '../../data/sqliteData';
import type { BillRecord, PartyRecord, StockItemRecord, LedgerEntryRecord, SyncQueueItem } from './schema';

const DB_NAME = 'ModernAccountingDB';
const DB_VERSION = 1;

type Listener<T> = (data: T) => void;

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private dbReadyPromise: Promise<IDBDatabase>;
  private isInitialized = false;

  // Ultra-fast in-memory cache for 0ms reads
  private billsCache: Map<string, BillRecord> = new Map();
  private partiesCache: Map<string, PartyRecord> = new Map();
  private stockCache: Map<string, StockItemRecord> = new Map();
  private ledgerCache: Map<string, LedgerEntryRecord> = new Map();
  private syncQueueCache: Map<string, SyncQueueItem> = new Map();

  // Reactive listeners
  private listeners: Map<string, Set<Listener<any>>> = new Map();

  constructor() {
    // Pre-populate with all 521 real SQLite bills synchronously
    if (SQLITE_BILLS && SQLITE_BILLS.length > 0) {
      SQLITE_BILLS.forEach((raw: any) => {
        const bill: BillRecord = {
          id: raw.id || `B-${raw.token || Math.random().toString(36).substring(2, 7)}`,
          token: String(raw.token || '0'),
          date: raw.date || '2026-07-23',
          party: raw.party || 'Standard Account',
          docType: raw.docType || 'SALE BILL',
          vehicle: raw.vehicle || '',
          typeSelection: raw.typeSelection || 'WHOLESALE',
          total: Number(raw.total || 0),
          status: (raw.status as any) || 'PAID',
          rawItems: (raw.rawItems || []).map((r: any, idx: number) => ({
            id: String(r.id || idx + 1),
            name: r.name || 'Raw Material',
            qty: Number(r.qty || 0),
            uCap: Number(r.uCap || 0),
            lCap: Number(r.lCap || 0)
          })),
          finishedItems: (raw.finishedItems || []).map((f: any, idx: number) => ({
            id: String(f.id || idx + 1),
            mould: f.mould || 'Standard Mould',
            qty: Number(f.qty || 0),
            price: Number(f.price || 0),
            total: Number(f.total || 0)
          })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          synced: true,
          version: 1
        };
        this.billsCache.set(bill.id, bill);
      });
    }

    // Load any custom user-created/saved bills from localStorage synchronously
    try {
      const customBills = JSON.parse(localStorage.getItem('modern_saved_custom_bills') || '[]');
      if (Array.isArray(customBills)) {
        customBills.forEach((b: BillRecord) => {
          // Clean empty rows from previously saved custom bills
          const cleanRaw = (b.rawItems || []).filter(r => {
            const hasName = Boolean(r.name && r.name.trim() !== '');
            const hasQty = (Number(r.qty) || 0) > 0;
            const hasPartyCode = Boolean(r.partyCode && r.partyCode.trim() !== '');
            const hasDyn = Object.keys(r).some(k => (k.startsWith('col_') || k === 'qty') && (Number((r as any)[k]) || 0) > 0);
            const hasCaps = (Number(r.uCap) || 0) > 0 || (Number(r.lCap) || 0) > 0;
            return hasName || hasQty || hasPartyCode || hasDyn || hasCaps;
          });
          const cleanFinished = (b.finishedItems || []).filter(f => {
            const hasMould = Boolean(f.mould && f.mould.trim() !== '' && f.mould !== 'Mould Name' && f.mould !== '-');
            const hasQty = (Number(f.qty) || 0) > 0;
            const hasTotal = (Number(f.total) || 0) > 0;
            const hasPrice = (Number(f.price) || 0) > 0;
            return hasMould && (hasQty || hasTotal || hasPrice);
          });
          const cleanedBill: BillRecord = { ...b, rawItems: cleanRaw, finishedItems: cleanFinished };
          this.billsCache.set(cleanedBill.id, cleanedBill);
        });
      }
    } catch {}

    // Pre-populate with all 1,800 real SQLite parties synchronously
    if (SQLITE_PARTIES && SQLITE_PARTIES.length > 0) {
      SQLITE_PARTIES.forEach((p: any, i: number) => {
        const partyName = (p.party_name || '').trim();
        if (!partyName) return;
        const party: PartyRecord = {
          id: `P-${i + 1}`,
          name: partyName,
          phone: (p.contacts || '').trim(),
          station: (p.station || '').trim(),
          district: (p.district || '').trim(),
          state: (p.state || '').trim(),
          pincode: (p.pincode || '').trim(),
          city: (p.station || p.district || '').trim(),
          contact: (p.district || '').trim(),
          balance: 0,
          limit: 500000,
          gstin: '',
          updatedAt: Date.now(),
          synced: true
        };
        this.partiesCache.set(party.id, party);
      });
    }

    // Load any custom user-created/saved parties from localStorage synchronously
    try {
      const customParties = JSON.parse(localStorage.getItem('modern_saved_custom_parties') || '[]');
      if (Array.isArray(customParties)) {
        customParties.forEach((p: PartyRecord) => this.partiesCache.set(p.id, p));
      }
    } catch {}

    this.dbReadyPromise = this.initIndexedDB();
  }

  private initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store: bills
        if (!db.objectStoreNames.contains('bills')) {
          const store = db.createObjectStore('bills', { keyPath: 'id' });
          store.createIndex('token', 'token', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('party', 'party', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store: parties
        if (!db.objectStoreNames.contains('parties')) {
          const store = db.createObjectStore('parties', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
        }

        // Store: stock
        if (!db.objectStoreNames.contains('stock')) {
          const store = db.createObjectStore('stock', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
        }

        // Store: ledger
        if (!db.objectStoreNames.contains('ledger')) {
          const store = db.createObjectStore('ledger', { keyPath: 'id' });
          store.createIndex('partyId', 'partyId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        // Store: sync_queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store: preferences
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        resolve(this.db);
        this.loadAllToCache().catch((err) => console.warn('Cache warm-up error:', err));
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Pre-load all stores into fast memory cache on app boot
  private async loadAllToCache() {
    if (!this.db) return;
    try {
      const bills = await this.getAllFromStore<BillRecord>('bills');
      bills.forEach(b => this.billsCache.set(b.id, b));

      const parties = await this.getAllFromStore<PartyRecord>('parties');
      parties.forEach(p => this.partiesCache.set(p.id, p));

      const stock = await this.getAllFromStore<StockItemRecord>('stock');
      stock.forEach(s => this.stockCache.set(s.id, s));

      const ledger = await this.getAllFromStore<LedgerEntryRecord>('ledger');
      ledger.forEach(l => this.ledgerCache.set(l.id, l));

      const syncQueue = await this.getAllFromStore<SyncQueueItem>('sync_queue');
      syncQueue.forEach(q => this.syncQueueCache.set(q.id, q));
    } catch (err) {
      console.warn('Cache warm-up warning:', err);
    }
  }

  // Seed default data if empty
  private async ensureSeedData() {
    const existingStoreBills = await this.getAllFromStore<BillRecord>('bills');
    if (existingStoreBills.length < SQLITE_BILLS.length && SQLITE_BILLS && SQLITE_BILLS.length > 0) {
      const now = Date.now();
      for (const raw of SQLITE_BILLS) {
        const bill: BillRecord = {
          id: raw.id || `B-${raw.token || Math.random().toString(36).substring(2, 7)}`,
          token: String(raw.token || '0'),
          date: raw.date || new Date().toISOString().split('T')[0],
          party: raw.party || 'Standard Account',
          docType: raw.docType || 'SALE BILL',
          vehicle: raw.vehicle || 'DL-01-AB-1000',
          typeSelection: raw.typeSelection || 'WHOLESALE',
          total: Number(raw.total || 0),
          status: (raw.status as any) || 'PAID',
          rawItems: (raw.rawItems || []).map((r: any, idx: number) => ({
            id: String(r.id || idx + 1),
            name: r.name || 'Raw Material',
            qty: Number(r.qty || 0),
            uCap: Number(r.uCap || 0),
            lCap: Number(r.lCap || 0)
          })),
          finishedItems: (raw.finishedItems || []).map((f: any, idx: number) => ({
            id: String(f.id || idx + 1),
            mould: f.mould || 'Standard Mould',
            qty: Number(f.qty || 0),
            price: Number(f.price || 0),
            total: Number(f.total || 0)
          })),
          createdAt: now,
          updatedAt: now,
          synced: true,
          version: 1
        };
        await this.saveBill(bill, false);
      }
    }

    if (this.partiesCache.size === 0 && SQLITE_PARTIES && SQLITE_PARTIES.length > 0) {
      const now = Date.now();
      for (let i = 0; i < SQLITE_PARTIES.length; i++) {
        const p = SQLITE_PARTIES[i] as any;
        const party: PartyRecord = {
          id: `P-${i + 1}`,
          name: p.party_name || 'Party',
          contact: p.district || 'Station Head',
          phone: p.contacts || '-',
          city: p.station || p.district || 'Delhi NCR',
          district: p.district || '',
          balance: 0,
          limit: 500000,
          gstin: '06AABCS1429E1Z2',
          updatedAt: now,
          synced: true
        };
        await this.saveParty(party, false);
      }
    }

    if (this.stockCache.size === 0) {
      const defaultStock: StockItemRecord[] = [
        { id: 'STK-1', code: 'STK-01', name: 'Mould 14x20 Finished Housing', category: 'FINISHED GOODS', qty: 142, minQty: 30, uom: 'PCS', rack: 'RACK-A3', status: 'IN STOCK', updatedAt: Date.now(), synced: true },
        { id: 'STK-2', code: 'STK-02', name: 'Mould 18x24 Base Alloy', category: 'FINISHED GOODS', qty: 28, minQty: 25, uom: 'PCS', rack: 'RACK-B1', status: 'LOW STOCK', updatedAt: Date.now(), synced: true },
        { id: 'STK-3', code: 'STK-03', name: 'Aluminium Ingot 6063 Primary', category: 'RAW MATERIAL', qty: 4500, minQty: 1000, uom: 'KG', rack: 'BAY-1', status: 'IN STOCK', updatedAt: Date.now(), synced: true },
        { id: 'STK-4', code: 'STK-04', name: 'Hardener Rods H-88', category: 'ALLOY AGENT', qty: 18, minQty: 50, uom: 'PCS', rack: 'CAB-02', status: 'CRITICAL', updatedAt: Date.now(), synced: true },
        { id: 'STK-5', code: 'STK-05', name: 'Die Core Cap 50mm Finished', category: 'FINISHED GOODS', qty: 86, minQty: 40, uom: 'PCS', rack: 'RACK-C4', status: 'IN STOCK', updatedAt: Date.now(), synced: true }
      ];
      for (const s of defaultStock) {
        await this.saveStockItem(s, false);
      }
    }

    if (this.ledgerCache.size === 0) {
      const defaultLedger: LedgerEntryRecord[] = [
        { id: 'L-1', partyId: 'P-1', date: '2026-09-01', type: 'OPENING BAL', voucher: 'OP-001', particulars: 'Opening Balance b/f', debit: 120000, credit: 0, balance: 120000, updatedAt: Date.now(), synced: true },
        { id: 'L-2', partyId: 'P-1', date: '2026-09-05', type: 'SALE BILL', voucher: 'INV-612', particulars: 'Finished Moulds Delivery Lot #14', debit: 85000, credit: 0, balance: 205000, updatedAt: Date.now(), synced: true },
        { id: 'L-3', partyId: 'P-1', date: '2026-09-10', type: 'PAYMENT', voucher: 'NEFT-8841', particulars: 'HDFC Bank Online Transfer', debit: 0, credit: 150000, balance: 55000, updatedAt: Date.now(), synced: true },
        { id: 'L-4', partyId: 'P-1', date: '2026-09-15', type: 'SALE BILL', voucher: 'INV-621', particulars: 'Precision Die Block Casting Batch', debit: 90200, credit: 0, balance: 145200, updatedAt: Date.now(), synced: true }
      ];
      for (const l of defaultLedger) {
        await this.saveLedgerEntry(l, false);
      }
    }
  }

  // Helper to read all items from an object store
  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve([]); return; }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Helper to write to an object store
  private async putToStore(storeName: string, item: any): Promise<void> {
    if (!this.db) {
      await this.dbReadyPromise;
    }
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          console.warn(`putToStore ${storeName} error:`, req.error);
          resolve();
        };
      } catch (err) {
        console.warn(`putToStore ${storeName} tx error:`, err);
        resolve();
      }
    });
  }

  private async deleteFromStore(storeName: string, key: string): Promise<void> {
    if (!this.db) {
      await this.dbReadyPromise;
    }
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          console.warn(`deleteFromStore ${storeName} error:`, req.error);
          resolve();
        };
      } catch (err) {
        console.warn(`deleteFromStore ${storeName} tx error:`, err);
        resolve();
      }
    });
  }

  // --- Reactive Subscriptions ---
  public subscribe<T>(topic: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(listener);

    return () => {
      this.listeners.get(topic)?.delete(listener);
    };
  }

  private notify(topic: string, data: any) {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach(listener => {
        try { listener(data); } catch (e) { console.error('Listener error:', e); }
      });
    }
  }

  // --- Synchronous Instant Getters (0ms UI latency) ---
  public getBills(): BillRecord[] {
    return Array.from(this.billsCache.values()).sort((a, b) => {
      const numA = parseInt(a.token, 10);
      const numB = parseInt(b.token, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numB - numA;
      }
      return b.updatedAt - a.updatedAt;
    });
  }

  public getBillById(id: string): BillRecord | undefined {
    return this.billsCache.get(id);
  }

  public getParties(): PartyRecord[] {
    return Array.from(this.partiesCache.values());
  }

  public getStockItems(): StockItemRecord[] {
    return Array.from(this.stockCache.values());
  }

  public getLedgerEntries(partyId?: string): LedgerEntryRecord[] {
    const all = Array.from(this.ledgerCache.values());
    return partyId ? all.filter(l => l.partyId === partyId) : all;
  }

  public getSyncQueue(): SyncQueueItem[] {
    return Array.from(this.syncQueueCache.values());
  }

  // --- CRUD Operations (Optimistic UI + Persistent DB + Sync Enqueue) ---
  public async saveBill(bill: BillRecord, enqueueSync = true): Promise<BillRecord> {
    bill.updatedAt = Date.now();

    // Ensure clean raw and finished items without blank/dummy rows
    bill.rawItems = (bill.rawItems || []).filter(r => {
      const hasName = Boolean(r.name && r.name.trim() !== '');
      const hasQty = (Number(r.qty) || 0) > 0;
      const hasPartyCode = Boolean(r.partyCode && r.partyCode.trim() !== '');
      const hasDyn = Object.keys(r).some(k => (k.startsWith('col_') || k === 'qty') && (Number((r as any)[k]) || 0) > 0);
      const hasCaps = (Number(r.uCap) || 0) > 0 || (Number(r.lCap) || 0) > 0;
      return hasName || hasQty || hasPartyCode || hasDyn || hasCaps;
    });

    bill.finishedItems = (bill.finishedItems || []).filter(f => {
      const hasMould = Boolean(f.mould && f.mould.trim() !== '' && f.mould !== 'Mould Name' && f.mould !== '-');
      const hasQty = (Number(f.qty) || 0) > 0;
      const hasTotal = (Number(f.total) || 0) > 0;
      const hasPrice = (Number(f.price) || 0) > 0;
      return hasMould && (hasQty || hasTotal || hasPrice);
    });

    this.billsCache.set(bill.id, bill);

    // Instant Synchronous localStorage persistence backup
    try {
      const currentSavedBills: BillRecord[] = JSON.parse(localStorage.getItem('modern_saved_custom_bills') || '[]');
      const filtered = currentSavedBills.filter(b => b.id !== bill.id && b.token !== bill.token);
      localStorage.setItem('modern_saved_custom_bills', JSON.stringify([bill, ...filtered]));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    this.notify('bills', this.getBills());

    await this.putToStore('bills', bill);

    if (enqueueSync) {
      await this.enqueueSync('bills', bill.id, 'UPDATE', bill);
    }
    return bill;
  }

  public async deleteBill(id: string, enqueueSync = true): Promise<void> {
    this.billsCache.delete(id);
    this.notify('bills', this.getBills());

    await this.deleteFromStore('bills', id);

    if (enqueueSync) {
      await this.enqueueSync('bills', id, 'DELETE', { id });
    }
  }

  public async saveParty(party: PartyRecord, enqueueSync = true): Promise<PartyRecord> {
    party.updatedAt = Date.now();
    this.partiesCache.set(party.id, party);

    try {
      const currentSaved: PartyRecord[] = JSON.parse(localStorage.getItem('modern_saved_custom_parties') || '[]');
      const filtered = currentSaved.filter(p => p.id !== party.id && p.name !== party.name);
      localStorage.setItem('modern_saved_custom_parties', JSON.stringify([party, ...filtered]));
    } catch (e) {
      console.warn('localStorage save party warning:', e);
    }

    this.notify('parties', this.getParties());
    await this.putToStore('parties', party);

    if (enqueueSync) {
      await this.enqueueSync('parties', party.id, 'UPDATE', party);
    }
    return party;
  }

  public async deleteParty(id: string, enqueueSync = true): Promise<void> {
    this.partiesCache.delete(id);
    try {
      const currentSaved: PartyRecord[] = JSON.parse(localStorage.getItem('modern_saved_custom_parties') || '[]');
      const filtered = currentSaved.filter(p => p.id !== id);
      localStorage.setItem('modern_saved_custom_parties', JSON.stringify(filtered));
    } catch {}
    this.notify('parties', this.getParties());
    await this.deleteFromStore('parties', id);
    if (enqueueSync) {
      await this.enqueueSync('parties', id, 'DELETE', { id });
    }
  }

  public async saveStockItem(item: StockItemRecord, enqueueSync = true): Promise<StockItemRecord> {
    item.updatedAt = Date.now();
    this.stockCache.set(item.id, item);
    this.notify('stock', this.getStockItems());

    await this.putToStore('stock', item);

    if (enqueueSync) {
      await this.enqueueSync('stock', item.id, 'UPDATE', item);
    }
    return item;
  }

  public async saveLedgerEntry(entry: LedgerEntryRecord, enqueueSync = true): Promise<LedgerEntryRecord> {
    entry.updatedAt = Date.now();
    this.ledgerCache.set(entry.id, entry);
    this.notify('ledger', this.getLedgerEntries());

    await this.putToStore('ledger', entry);

    if (enqueueSync) {
      await this.enqueueSync('ledger', entry.id, 'UPDATE', entry);
    }
    return entry;
  }

  // --- Background Sync Queue Management ---
  private async enqueueSync(entityType: SyncQueueItem['entityType'], entityId: string, action: SyncQueueItem['action'], payload: any) {
    const queueItem: SyncQueueItem = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType,
      entityId,
      action,
      payload,
      timestamp: Date.now(),
      attempts: 0
    };

    this.syncQueueCache.set(queueItem.id, queueItem);
    this.notify('sync_queue', this.getSyncQueue());
    await this.putToStore('sync_queue', queueItem);
  }

  public async removeSyncQueueItem(id: string): Promise<void> {
    this.syncQueueCache.delete(id);
    this.notify('sync_queue', this.getSyncQueue());
    await this.deleteFromStore('sync_queue', id);
  }

  // Batch import for server sync
  public async applyRemoteDelta(entities: { bills?: BillRecord[]; parties?: PartyRecord[]; stock?: StockItemRecord[]; ledger?: LedgerEntryRecord[] }) {
    if (entities.bills) {
      for (const b of entities.bills) {
        this.billsCache.set(b.id, b);
        await this.putToStore('bills', b);
      }
      this.notify('bills', this.getBills());
    }

    if (entities.parties) {
      for (const p of entities.parties) {
        this.partiesCache.set(p.id, p);
        await this.putToStore('parties', p);
      }
      this.notify('parties', this.getParties());
    }

    if (entities.stock) {
      for (const s of entities.stock) {
        this.stockCache.set(s.id, s);
        await this.putToStore('stock', s);
      }
      this.notify('stock', this.getStockItems());
    }

    if (entities.ledger) {
      for (const l of entities.ledger) {
        this.ledgerCache.set(l.id, l);
        await this.putToStore('ledger', l);
      }
      this.notify('ledger', this.getLedgerEntries());
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const localDb = new LocalDatabase();
