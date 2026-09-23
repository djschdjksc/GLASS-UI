import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { localDb } from '../services/db/localDb';
import { syncEngine } from '../services/sync/syncEngine';
import type { BillRecord, PartyRecord, StockItemRecord, LedgerEntryRecord } from '../services/db/schema';
import type { SyncStats } from '../services/sync/syncTypes';

interface DatabaseContextType {
  bills: BillRecord[];
  parties: PartyRecord[];
  stockItems: StockItemRecord[];
  ledgerEntries: LedgerEntryRecord[];
  syncStats: SyncStats;
  isReady: boolean;
  saveBill: (bill: BillRecord) => Promise<BillRecord>;
  deleteBill: (id: string) => Promise<void>;
  saveParty: (party: PartyRecord) => Promise<PartyRecord>;
  saveStockItem: (item: StockItemRecord) => Promise<StockItemRecord>;
  saveLedgerEntry: (entry: LedgerEntryRecord) => Promise<LedgerEntryRecord>;
  triggerSync: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<BillRecord[]>(() => localDb.getBills());
  const [parties, setParties] = useState<PartyRecord[]>(() => localDb.getParties());
  const [stockItems, setStockItems] = useState<StockItemRecord[]>(() => localDb.getStockItems());
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryRecord[]>(() => localDb.getLedgerEntries());
  const [syncStats, setSyncStats] = useState<SyncStats>(() => syncEngine.getStats());
  const [isReady, setIsReady] = useState<boolean>(localDb.isReady());

  useEffect(() => {
    // Start background sync engine
    syncEngine.start();

    // Subscribe to reactive database changes
    const unsubBills = localDb.subscribe('bills', (updated: BillRecord[]) => setBills([...updated]));
    const unsubParties = localDb.subscribe('parties', (updated: PartyRecord[]) => setParties([...updated]));
    const unsubStock = localDb.subscribe('stock', (updated: StockItemRecord[]) => setStockItems([...updated]));
    const unsubLedger = localDb.subscribe('ledger', (updated: LedgerEntryRecord[]) => setLedgerEntries([...updated]));
    const unsubSync = syncEngine.subscribe((stats) => setSyncStats({ ...stats }));

    // Initial sync
    setBills(localDb.getBills());
    setParties(localDb.getParties());
    setStockItems(localDb.getStockItems());
    setLedgerEntries(localDb.getLedgerEntries());
    setIsReady(true);

    return () => {
      unsubBills();
      unsubParties();
      unsubStock();
      unsubLedger();
      unsubSync();
      syncEngine.stop();
    };
  }, []);

  const handleSaveBill = useCallback(async (bill: BillRecord) => {
    return await localDb.saveBill(bill);
  }, []);

  const handleDeleteBill = useCallback(async (id: string) => {
    return await localDb.deleteBill(id);
  }, []);

  const handleSaveParty = useCallback(async (party: PartyRecord) => {
    return await localDb.saveParty(party);
  }, []);

  const handleSaveStockItem = useCallback(async (item: StockItemRecord) => {
    return await localDb.saveStockItem(item);
  }, []);

  const handleSaveLedgerEntry = useCallback(async (entry: LedgerEntryRecord) => {
    return await localDb.saveLedgerEntry(entry);
  }, []);

  const handleTriggerSync = useCallback(async () => {
    await syncEngine.syncAll();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        bills,
        parties,
        stockItems,
        ledgerEntries,
        syncStats,
        isReady,
        saveBill: handleSaveBill,
        deleteBill: handleDeleteBill,
        saveParty: handleSaveParty,
        saveStockItem: handleSaveStockItem,
        saveLedgerEntry: handleSaveLedgerEntry,
        triggerSync: handleTriggerSync
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return ctx;
};
