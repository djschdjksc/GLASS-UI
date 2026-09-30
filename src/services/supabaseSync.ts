import { supabase, getUserProfile, billRecordToSupabase, supabaseToBillRecord } from './supabaseClient';
import { localDb } from './db/localDb';
import type { BillRecord } from './db/schema';
import { macAudio } from '../utils/macAudio';

export interface BillChangeLog {
  id: string;
  bill_id: string;
  bill_token: string;
  user_name: string;
  change_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  changed_at: string;
}

type SyncNotificationCallback = (msg: { title: string; body: string; type: 'bill' | 'chat' | 'info' }) => void;
let notificationCallback: SyncNotificationCallback | null = null;

export const setSyncNotificationListener = (cb: SyncNotificationCallback) => {
  notificationCallback = cb;
};

class SupabaseSyncService {
  private isInitialized = false;
  private channel: any = null;

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Initial Cloud Pull & Local Merge
      await this.pullAllCloudBills();

      // 2. Realtime Subscription to 'bills' table
      this.channel = supabase
        .channel('public:bills:all')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bills' },
          async (payload: any) => {
            const currentUser = getUserProfile();
            const { eventType, new: newRow, old: oldRow } = payload;

            if (eventType === 'DELETE') {
              if (oldRow && oldRow.id) {
                await localDb.deleteBill(oldRow.id, false);
              }
              return;
            }

            if (newRow && newRow.id) {
              const incomingBill = supabaseToBillRecord(newRow);

              // Don't toast for edits made by this exact user
              const isMine = newRow.last_modified_by === currentUser.name;

              // Always apply to local database so local cache is 100% updated
              await localDb.applyRemoteDelta({ bills: [incomingBill] });

              if (!isMine) {
                try {
                  macAudio.playSuccess();
                } catch {}

                const action = eventType === 'INSERT' ? 'Naya Bill Aaya' : 'Bill Update Hua';
                const toastMsg = `${action}: Token #${incomingBill.token} (${incomingBill.party}) from ${newRow.last_modified_by || 'User'}`;
                
                if (notificationCallback) {
                  notificationCallback({
                    title: action,
                    body: toastMsg,
                    type: 'bill'
                  });
                }

                // Dispatch global event for UI components to listen to
                window.dispatchEvent(new CustomEvent('cloud_bill_received', { detail: incomingBill }));
              }
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase realtime init notice:', err);
    }
  }

  // Pull all existing bills from cloud into local IndexedDB
  public async pullAllCloudBills(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(500);

      if (error) {
        console.warn('Error fetching cloud bills:', error.message);
        return 0;
      }

      if (data && data.length > 0) {
        const records = data.map(supabaseToBillRecord);
        await localDb.applyRemoteDelta({ bills: records });
        return records.length;
      }
      return 0;
    } catch (e) {
      console.warn('Failed cloud bill sync:', e);
      return 0;
    }
  }

  // Push Bill to Cloud + Detect & Log Cell-level Changes
  public async saveAndSyncBill(bill: BillRecord, previousBill?: BillRecord): Promise<BillRecord> {
    const user = getUserProfile();
    const userName = user.name || 'User';

    // 1. Instantly save locally (0ms)
    await localDb.saveBill(bill, false);

    // 2. Async Push to Cloud
    const row = billRecordToSupabase(bill, userName);
    if (!previousBill) {
      (row as any).created_by = userName;
    }

    try {
      const { error } = await supabase.from('bills').upsert(row);
      if (error) {
        console.error('Supabase push error:', error.message);
      } else {
        // 3. Log Cell/Field level audit history
        await this.auditBillChanges(bill, previousBill, userName);
      }
    } catch (err: any) {
      console.error('Cloud bill sync error:', err);
    }

    return bill;
  }

  // Delete Bill from Cloud & Local
  public async deleteBill(id: string): Promise<void> {
    await localDb.deleteBill(id, false);
    try {
      await supabase.from('bills').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete bill from cloud:', e);
    }
  }

  // Compare previousBill with new bill and log every single cell change
  private async auditBillChanges(current: BillRecord, prev?: BillRecord, userName = 'User') {
    const changes: {
      bill_id: string;
      bill_token: string;
      user_name: string;
      change_type: string;
      field_name: string;
      old_value: string;
      new_value: string;
    }[] = [];

    const billId = current.id;
    const token = String(current.token);

    if (!prev) {
      changes.push({
        bill_id: billId,
        bill_token: token,
        user_name: userName,
        change_type: 'CREATE',
        field_name: 'Bill Created',
        old_value: '-',
        new_value: `Total ₹${current.total} (${current.party})`
      });
    } else {
      // Header changes
      if (prev.party !== current.party) {
        changes.push({
          bill_id: billId,
          bill_token: token,
          user_name: userName,
          change_type: 'CELL_EDIT',
          field_name: 'Party Name',
          old_value: prev.party || '-',
          new_value: current.party || '-'
        });
      }
      if (prev.docType !== current.docType) {
        changes.push({
          bill_id: billId,
          bill_token: token,
          user_name: userName,
          change_type: 'CELL_EDIT',
          field_name: 'Doc Type',
          old_value: prev.docType || '-',
          new_value: current.docType || '-'
        });
      }
      if (prev.vehicle !== current.vehicle) {
        changes.push({
          bill_id: billId,
          bill_token: token,
          user_name: userName,
          change_type: 'CELL_EDIT',
          field_name: 'Vehicle No',
          old_value: prev.vehicle || '-',
          new_value: current.vehicle || '-'
        });
      }
      if (prev.date !== current.date) {
        changes.push({
          bill_id: billId,
          bill_token: token,
          user_name: userName,
          change_type: 'CELL_EDIT',
          field_name: 'Bill Date',
          old_value: prev.date || '-',
          new_value: current.date || '-'
        });
      }
      if (prev.total !== current.total) {
        changes.push({
          bill_id: billId,
          bill_token: token,
          user_name: userName,
          change_type: 'CELL_EDIT',
          field_name: 'Grand Total',
          old_value: `₹${prev.total}`,
          new_value: `₹${current.total}`
        });
      }

      // Check Raw Items changes
      const maxRaw = Math.max(prev.rawItems?.length || 0, current.rawItems?.length || 0);
      for (let i = 0; i < maxRaw; i++) {
        const pR = prev.rawItems?.[i];
        const cR = current.rawItems?.[i];
        if (!pR && cR && (cR.name || cR.qty)) {
          changes.push({
            bill_id: billId,
            bill_token: token,
            user_name: userName,
            change_type: 'ITEM_ADDED',
            field_name: `Raw Row #${i + 1}`,
            old_value: 'Empty',
            new_value: `${cR.name} (Qty: ${cR.qty})`
          });
        } else if (pR && !cR) {
          changes.push({
            bill_id: billId,
            bill_token: token,
            user_name: userName,
            change_type: 'ITEM_REMOVED',
            field_name: `Raw Row #${i + 1}`,
            old_value: `${pR.name} (Qty: ${pR.qty})`,
            new_value: 'Deleted'
          });
        } else if (pR && cR) {
          if (pR.name !== cR.name) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Raw #${i + 1} Name`,
              old_value: pR.name,
              new_value: cR.name
            });
          }
          if (Number(pR.qty) !== Number(cR.qty)) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Raw #${i + 1} (${cR.name}) Qty`,
              old_value: String(pR.qty),
              new_value: String(cR.qty)
            });
          }
          if (Number(pR.uCap) !== Number(cR.uCap)) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Raw #${i + 1} U-Cap`,
              old_value: String(pR.uCap),
              new_value: String(cR.uCap)
            });
          }
          if (Number(pR.lCap) !== Number(cR.lCap)) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Raw #${i + 1} L-Cap`,
              old_value: String(pR.lCap),
              new_value: String(cR.lCap)
            });
          }
        }
      }

      // Check Finished / Mould Items changes
      const maxMould = Math.max(prev.finishedItems?.length || 0, current.finishedItems?.length || 0);
      for (let i = 0; i < maxMould; i++) {
        const pF = prev.finishedItems?.[i];
        const cF = current.finishedItems?.[i];
        if (!pF && cF && (cF.mould || cF.qty)) {
          changes.push({
            bill_id: billId,
            bill_token: token,
            user_name: userName,
            change_type: 'ITEM_ADDED',
            field_name: `Mould Row #${i + 1}`,
            old_value: 'Empty',
            new_value: `${cF.mould} (Qty: ${cF.qty}, Rate: ₹${cF.price})`
          });
        } else if (pF && !cF) {
          changes.push({
            bill_id: billId,
            bill_token: token,
            user_name: userName,
            change_type: 'ITEM_REMOVED',
            field_name: `Mould Row #${i + 1}`,
            old_value: `${pF.mould} (Qty: ${pF.qty})`,
            new_value: 'Deleted'
          });
        } else if (pF && cF) {
          if (pF.mould !== cF.mould) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Mould #${i + 1} Name`,
              old_value: pF.mould,
              new_value: cF.mould
            });
          }
          if (Number(pF.qty) !== Number(cF.qty)) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Mould #${i + 1} (${cF.mould}) Qty`,
              old_value: String(pF.qty),
              new_value: String(cF.qty)
            });
          }
          if (Number(pF.price) !== Number(cF.price)) {
            changes.push({
              bill_id: billId,
              bill_token: token,
              user_name: userName,
              change_type: 'CELL_EDIT',
              field_name: `Mould #${i + 1} (${cF.mould}) Rate/Price`,
              old_value: `₹${pF.price}`,
              new_value: `₹${cF.price}`
            });
          }
        }
      }
    }

    if (changes.length > 0) {
      try {
        await supabase.from('bill_change_logs').insert(changes);
      } catch (e) {
        console.warn('Failed to insert audit change logs:', e);
      }
    }
  }

  // Fetch change history for a given bill
  public async getBillAuditHistory(billId: string): Promise<BillChangeLog[]> {
    try {
      const { data, error } = await supabase
        .from('bill_change_logs')
        .select('*')
        .eq('bill_id', billId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Error fetching bill change logs:', error);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  }
}

export const supabaseSyncService = new SupabaseSyncService();
