/**
 * tauriDb.ts — Tauri SQLite Database Service
 * Replaces localDb.ts (IndexedDB) with direct SQLite via Rust backend
 * Speed: ~0.05ms per operation (vs IndexedDB ~5-10ms)
 * USB-safe: data stored in billapp.db alongside the .exe
 */

import { invoke } from '@tauri-apps/api/core';
import type { BillRecord, PartyRecord, StockItemRecord, LedgerEntryRecord } from './schema';

// ─── Type helpers ────────────────────────────────────────────────────────────

type Listener<T> = (data: T) => void;

// ─── TauriDatabase Class ─────────────────────────────────────────────────────

class TauriDatabase {
  private listeners: Map<string, Set<Listener<any>>> = new Map();

  // ── Reactive subscriptions ──────────────────────────────────────────────
  public subscribe<T>(topic: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    this.listeners.get(topic)!.add(listener);
    return () => this.listeners.get(topic)?.delete(listener);
  }

  private notify(topic: string, data: any) {
    this.listeners.get(topic)?.forEach(l => { try { l(data); } catch {} });
  }

  // ── Bills ───────────────────────────────────────────────────────────────
  public async getBills(): Promise<BillRecord[]> {
    return invoke<BillRecord[]>('get_bills');
  }

  public async getBillById(id: string): Promise<BillRecord | null> {
    return invoke<BillRecord | null>('get_bill_by_id', { id });
  }

  public async saveBill(bill: BillRecord): Promise<BillRecord> {
    bill.updatedAt = Date.now();
    // Filter empty rows before saving
    bill.rawItems = (bill.rawItems || []).filter(r =>
      (r.name && r.name.trim()) || (Number(r.qty) > 0) || (Number(r.uCap) > 0) || (Number(r.lCap) > 0)
    );
    bill.finishedItems = (bill.finishedItems || []).filter(f =>
      (f.mould && f.mould.trim() && f.mould !== 'Mould Name') && (Number(f.qty) > 0 || Number(f.total) > 0)
    );
    const saved = await invoke<BillRecord>('save_bill', { bill });
    const bills = await this.getBills();
    this.notify('bills', bills);
    return saved;
  }

  public async deleteBill(id: string): Promise<void> {
    await invoke('delete_bill', { id });
    const bills = await this.getBills();
    this.notify('bills', bills);
  }

  // ── Parties ─────────────────────────────────────────────────────────────
  public async getParties(): Promise<PartyRecord[]> {
    return invoke<PartyRecord[]>('get_parties');
  }

  public async saveParty(party: PartyRecord): Promise<PartyRecord> {
    party.updatedAt = Date.now();
    const saved = await invoke<PartyRecord>('save_party', { party });
    const parties = await this.getParties();
    this.notify('parties', parties);
    return saved;
  }

  public async deleteParty(id: string): Promise<void> {
    await invoke('delete_party', { id });
    const parties = await this.getParties();
    this.notify('parties', parties);
  }

  // ── Skip Items / Groups ─────────────────────────────────────────────────
  public async getSkipMainGroups(): Promise<any[]> {
    return invoke<any[]>('get_skip_main_groups');
  }

  public async saveSkipMainGroup(group: any): Promise<void> {
    await invoke('save_skip_main_group', { group });
    this.notify('skip_main_groups', await this.getSkipMainGroups());
  }

  public async deleteSkipMainGroup(id: string): Promise<void> {
    await invoke('delete_skip_main_group', { id });
    this.notify('skip_main_groups', await this.getSkipMainGroups());
  }

  public async getSkipSubGroups(): Promise<any[]> {
    return invoke<any[]>('get_skip_sub_groups');
  }

  public async saveSkipSubGroup(group: any): Promise<void> {
    await invoke('save_skip_sub_group', { group });
    this.notify('skip_sub_groups', await this.getSkipSubGroups());
  }

  public async deleteSkipSubGroup(id: string): Promise<void> {
    await invoke('delete_skip_sub_group', { id });
    this.notify('skip_sub_groups', await this.getSkipSubGroups());
  }

  public async getSkipItems(): Promise<any[]> {
    return invoke<any[]>('get_skip_items');
  }

  public async saveSkipItem(item: any): Promise<void> {
    await invoke('save_skip_item', { item });
    this.notify('skip_items', await this.getSkipItems());
  }

  public async deleteSkipItem(id: string): Promise<void> {
    await invoke('delete_skip_item', { id });
    this.notify('skip_items', await this.getSkipItems());
  }

  // ── Conversions ─────────────────────────────────────────────────────────
  public async getConversions(): Promise<any[]> {
    return invoke<any[]>('get_conversions');
  }

  public async saveConversion(conv: any): Promise<void> {
    await invoke('save_conversion', { conv });
    this.notify('conversions', await this.getConversions());
  }

  public async deleteConversion(id: string): Promise<void> {
    await invoke('delete_conversion', { id });
    this.notify('conversions', await this.getConversions());
  }

  // ── Stock ────────────────────────────────────────────────────────────────
  public async getStockItems(): Promise<StockItemRecord[]> {
    return invoke<StockItemRecord[]>('get_stock_items');
  }

  public async saveStockItem(item: StockItemRecord): Promise<StockItemRecord> {
    item.updatedAt = Date.now();
    const saved = await invoke<StockItemRecord>('save_stock_item', { item });
    this.notify('stock', await this.getStockItems());
    return saved;
  }

  public async deleteStockItem(id: string): Promise<void> {
    await invoke('delete_stock_item', { id });
    this.notify('stock', await this.getStockItems());
  }

  // ── Ledger ───────────────────────────────────────────────────────────────
  public async getLedgerEntries(partyId?: string): Promise<LedgerEntryRecord[]> {
    return invoke<LedgerEntryRecord[]>('get_ledger_entries', { partyId: partyId || null });
  }

  public async saveLedgerEntry(entry: LedgerEntryRecord): Promise<LedgerEntryRecord> {
    entry.updatedAt = Date.now();
    const saved = await invoke<LedgerEntryRecord>('save_ledger_entry', { entry });
    this.notify('ledger', await this.getLedgerEntries());
    return saved;
  }

  // ── Settings / Preferences ───────────────────────────────────────────────
  public async getSetting(key: string): Promise<string | null> {
    return invoke<string | null>('get_setting', { key });
  }

  public async setSetting(key: string, value: string): Promise<void> {
    await invoke('set_setting', { key, value });
  }

  // ── Data Export (for sync to other users) ────────────────────────────────
  public async exportAllData(): Promise<string> {
    return invoke<string>('export_all_data');
  }

  public async importData(jsonData: string): Promise<void> {
    await invoke('import_data', { jsonData });
    // Notify all topics after import
    const bills = await this.getBills();
    const parties = await this.getParties();
    this.notify('bills', bills);
    this.notify('parties', parties);
  }

  // ── DB Stats ─────────────────────────────────────────────────────────────
  public async getDbPath(): Promise<string> {
    return invoke<string>('get_db_path');
  }
}

export const tauriDb = new TauriDatabase();
