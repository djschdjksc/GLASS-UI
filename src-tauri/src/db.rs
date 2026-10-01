use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RawItem {
    pub id: String,
    pub name: String,
    pub qty: f64,
    #[serde(rename = "uCap")]
    pub u_cap: f64,
    #[serde(rename = "lCap")]
    pub l_cap: f64,
    #[serde(rename = "partyCode", skip_serializing_if = "Option::is_none")]
    pub party_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FinishedItem {
    pub id: String,
    pub mould: String,
    pub qty: f64,
    pub price: f64,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BillRecord {
    pub id: String,
    pub token: String,
    pub date: String,
    pub party: String,
    #[serde(rename = "docType")]
    pub doc_type: String,
    pub vehicle: String,
    #[serde(rename = "typeSelection")]
    pub type_selection: String,
    pub total: f64,
    pub status: String,
    #[serde(rename = "rawItems")]
    pub raw_items: Vec<RawItem>,
    #[serde(rename = "finishedItems")]
    pub finished_items: Vec<FinishedItem>,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartyRecord {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub station: Option<String>,
    pub district: Option<String>,
    pub state: Option<String>,
    pub pincode: Option<String>,
    pub balance: f64,
    pub limit: f64,
    pub gstin: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkipMainGroup {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkipSubGroup {
    pub id: String,
    #[serde(rename = "mainGroupId")]
    pub main_group_id: String,
    #[serde(rename = "mainGroup")]
    pub main_group: String,
    #[serde(rename = "groupName")]
    pub group_name: String,
    #[serde(rename = "sumColumn")]
    pub sum_column: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkipItem {
    pub id: String,
    #[serde(rename = "subGroupId")]
    pub sub_group_id: String,
    #[serde(rename = "mainGroup")]
    pub main_group: String,
    #[serde(rename = "groupName")]
    pub group_name: String,
    #[serde(rename = "itemPrefix")]
    pub item_prefix: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Conversion {
    pub id: String,
    pub rule: String,
    pub value: f64,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockItem {
    pub id: String,
    pub code: String,
    pub name: String,
    pub category: String,
    pub qty: f64,
    #[serde(rename = "minQty")]
    pub min_qty: f64,
    pub uom: String,
    pub rack: Option<String>,
    pub status: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LedgerEntry {
    pub id: String,
    #[serde(rename = "partyId")]
    pub party_id: String,
    pub date: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub voucher: String,
    pub particulars: String,
    pub debit: f64,
    pub credit: f64,
    pub balance: f64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

// ─── DB State ─────────────────────────────────────────────────────────────────

pub struct DbState(pub Mutex<Connection>);

// ─── Init ─────────────────────────────────────────────────────────────────────

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;

    // WAL mode = maximum concurrent read/write speed
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA cache_size=10000;")?;

    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS bills (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            date TEXT NOT NULL,
            party TEXT NOT NULL,
            doc_type TEXT NOT NULL DEFAULT 'SALE BILL',
            vehicle TEXT DEFAULT '',
            type_selection TEXT DEFAULT 'WHOLESALE',
            total REAL DEFAULT 0,
            status TEXT DEFAULT 'PAID',
            raw_items TEXT DEFAULT '[]',
            finished_items TEXT DEFAULT '[]',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS parties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT DEFAULT '',
            station TEXT DEFAULT '',
            district TEXT DEFAULT '',
            state TEXT DEFAULT '',
            pincode TEXT DEFAULT '',
            balance REAL DEFAULT 0,
            party_limit REAL DEFAULT 500000,
            gstin TEXT DEFAULT '',
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS skip_main_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS skip_sub_groups (
            id TEXT PRIMARY KEY,
            main_group_id TEXT NOT NULL,
            main_group TEXT NOT NULL,
            group_name TEXT NOT NULL,
            sum_column TEXT DEFAULT 'QTY'
        );

        CREATE TABLE IF NOT EXISTS skip_items (
            id TEXT PRIMARY KEY,
            sub_group_id TEXT NOT NULL,
            main_group TEXT NOT NULL,
            group_name TEXT NOT NULL,
            item_prefix TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conversions (
            id TEXT PRIMARY KEY,
            rule TEXT NOT NULL,
            value REAL DEFAULT 0,
            description TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS stock_items (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT DEFAULT '',
            qty REAL DEFAULT 0,
            min_qty REAL DEFAULT 0,
            uom TEXT DEFAULT 'PCS',
            rack TEXT DEFAULT '',
            status TEXT DEFAULT 'IN STOCK',
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ledger (
            id TEXT PRIMARY KEY,
            party_id TEXT NOT NULL,
            date TEXT NOT NULL,
            entry_type TEXT NOT NULL,
            voucher TEXT DEFAULT '',
            particulars TEXT DEFAULT '',
            debit REAL DEFAULT 0,
            credit REAL DEFAULT 0,
            balance REAL DEFAULT 0,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_bills_token ON bills(token);
        CREATE INDEX IF NOT EXISTS idx_bills_party ON bills(party);
        CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
        CREATE INDEX IF NOT EXISTS idx_skip_items_prefix ON skip_items(item_prefix);
        CREATE INDEX IF NOT EXISTS idx_ledger_party ON ledger(party_id);
    ")?;

    Ok(conn)
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

// Bills
#[tauri::command]
pub fn get_bills(state: State<DbState>) -> Result<Vec<BillRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,token,date,party,doc_type,vehicle,type_selection,total,status,raw_items,finished_items,created_at,updated_at FROM bills ORDER BY CAST(token AS INTEGER) DESC"
    ).map_err(|e| e.to_string())?;

    let bills = stmt.query_map([], |row| {
        let raw_items_json: String = row.get(9)?;
        let finished_items_json: String = row.get(10)?;
        let raw_items: Vec<RawItem> = serde_json::from_str(&raw_items_json).unwrap_or_default();
        let finished_items: Vec<FinishedItem> = serde_json::from_str(&finished_items_json).unwrap_or_default();
        Ok(BillRecord {
            id: row.get(0)?,
            token: row.get(1)?,
            date: row.get(2)?,
            party: row.get(3)?,
            doc_type: row.get(4)?,
            vehicle: row.get(5)?,
            type_selection: row.get(6)?,
            total: row.get(7)?,
            status: row.get(8)?,
            raw_items,
            finished_items,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(bills)
}

#[tauri::command]
pub fn get_bill_by_id(id: String, state: State<DbState>) -> Result<Option<BillRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,token,date,party,doc_type,vehicle,type_selection,total,status,raw_items,finished_items,created_at,updated_at FROM bills WHERE id=?1"
    ).map_err(|e| e.to_string())?;

    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let raw_items: Vec<RawItem> = serde_json::from_str(&row.get::<_,String>(9).unwrap_or_default()).unwrap_or_default();
        let finished_items: Vec<FinishedItem> = serde_json::from_str(&row.get::<_,String>(10).unwrap_or_default()).unwrap_or_default();
        Ok(Some(BillRecord {
            id: row.get(0)?,
            token: row.get(1)?,
            date: row.get(2)?,
            party: row.get(3)?,
            doc_type: row.get(4)?,
            vehicle: row.get(5)?,
            type_selection: row.get(6)?,
            total: row.get(7)?,
            status: row.get(8)?,
            raw_items,
            finished_items,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn save_bill(bill: BillRecord, state: State<DbState>) -> Result<BillRecord, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let raw_json = serde_json::to_string(&bill.raw_items).map_err(|e| e.to_string())?;
    let fin_json = serde_json::to_string(&bill.finished_items).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO bills (id,token,date,party,doc_type,vehicle,type_selection,total,status,raw_items,finished_items,created_at,updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
        params![
            bill.id, bill.token, bill.date, bill.party, bill.doc_type,
            bill.vehicle, bill.type_selection, bill.total, bill.status,
            raw_json, fin_json, bill.created_at, bill.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(bill)
}

#[tauri::command]
pub fn delete_bill(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM bills WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// Parties
#[tauri::command]
pub fn get_parties(state: State<DbState>) -> Result<Vec<PartyRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,name,phone,station,district,state,pincode,balance,party_limit,gstin,updated_at FROM parties ORDER BY name"
    ).map_err(|e| e.to_string())?;
    let parties = stmt.query_map([], |row| {
        Ok(PartyRecord {
            id: row.get(0)?,
            name: row.get(1)?,
            phone: row.get(2)?,
            station: row.get(3)?,
            district: row.get(4)?,
            state: row.get(5)?,
            pincode: row.get(6)?,
            balance: row.get(7)?,
            limit: row.get(8)?,
            gstin: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok()).collect();
    Ok(parties)
}

#[tauri::command]
pub fn save_party(party: PartyRecord, state: State<DbState>) -> Result<PartyRecord, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO parties (id,name,phone,station,district,state,pincode,balance,party_limit,gstin,updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        params![
            party.id, party.name, party.phone, party.station, party.district,
            party.state, party.pincode, party.balance, party.limit, party.gstin, party.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(party)
}

#[tauri::command]
pub fn delete_party(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM parties WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// Skip Groups & Items
#[tauri::command]
pub fn get_skip_main_groups(state: State<DbState>) -> Result<Vec<SkipMainGroup>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id,name FROM skip_main_groups ORDER BY name").map_err(|e| e.to_string())?;
    let items = stmt.query_map([], |row| Ok(SkipMainGroup { id: row.get(0)?, name: row.get(1)? }))
        .map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(items)
}

#[tauri::command]
pub fn save_skip_main_group(group: SkipMainGroup, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT OR REPLACE INTO skip_main_groups (id,name) VALUES (?1,?2)", params![group.id, group.name]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_skip_main_group(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skip_main_groups WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skip_sub_groups WHERE main_group_id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_skip_sub_groups(state: State<DbState>) -> Result<Vec<SkipSubGroup>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id,main_group_id,main_group,group_name,sum_column FROM skip_sub_groups").map_err(|e| e.to_string())?;
    let items = stmt.query_map([], |row| Ok(SkipSubGroup {
        id: row.get(0)?, main_group_id: row.get(1)?, main_group: row.get(2)?,
        group_name: row.get(3)?, sum_column: row.get(4)?
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(items)
}

#[tauri::command]
pub fn save_skip_sub_group(group: SkipSubGroup, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO skip_sub_groups (id,main_group_id,main_group,group_name,sum_column) VALUES (?1,?2,?3,?4,?5)",
        params![group.id, group.main_group_id, group.main_group, group.group_name, group.sum_column]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_skip_sub_group(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skip_sub_groups WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skip_items WHERE sub_group_id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_skip_items(state: State<DbState>) -> Result<Vec<SkipItem>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id,sub_group_id,main_group,group_name,item_prefix FROM skip_items ORDER BY item_prefix").map_err(|e| e.to_string())?;
    let items = stmt.query_map([], |row| Ok(SkipItem {
        id: row.get(0)?, sub_group_id: row.get(1)?, main_group: row.get(2)?,
        group_name: row.get(3)?, item_prefix: row.get(4)?
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(items)
}

#[tauri::command]
pub fn save_skip_item(item: SkipItem, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO skip_items (id,sub_group_id,main_group,group_name,item_prefix) VALUES (?1,?2,?3,?4,?5)",
        params![item.id, item.sub_group_id, item.main_group, item.group_name, item.item_prefix]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_skip_item(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM skip_items WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// Stock
#[tauri::command]
pub fn get_stock_items(state: State<DbState>) -> Result<Vec<StockItem>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,code,name,category,qty,min_qty,uom,rack,status,updated_at FROM stock_items ORDER BY name"
    ).map_err(|e| e.to_string())?;
    let items = stmt.query_map([], |row| Ok(StockItem {
        id: row.get(0)?, code: row.get(1)?, name: row.get(2)?, category: row.get(3)?,
        qty: row.get(4)?, min_qty: row.get(5)?, uom: row.get(6)?, rack: row.get(7)?,
        status: row.get(8)?, updated_at: row.get(9)?
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(items)
}

#[tauri::command]
pub fn save_stock_item(item: StockItem, state: State<DbState>) -> Result<StockItem, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO stock_items (id,code,name,category,qty,min_qty,uom,rack,status,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![item.id, item.code, item.name, item.category, item.qty, item.min_qty, item.uom, item.rack, item.status, item.updated_at]
    ).map_err(|e| e.to_string())?;
    Ok(item)
}

#[tauri::command]
pub fn delete_stock_item(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM stock_items WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// Ledger
#[tauri::command]
pub fn get_ledger_entries(party_id: Option<String>, state: State<DbState>) -> Result<Vec<LedgerEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let entries = if let Some(pid) = party_id {
        let mut stmt = conn.prepare("SELECT id,party_id,date,entry_type,voucher,particulars,debit,credit,balance,updated_at FROM ledger WHERE party_id=?1 ORDER BY date").map_err(|e| e.to_string())?;
        stmt.query_map(params![pid], |row| Ok(LedgerEntry {
            id: row.get(0)?, party_id: row.get(1)?, date: row.get(2)?, entry_type: row.get(3)?,
            voucher: row.get(4)?, particulars: row.get(5)?, debit: row.get(6)?, credit: row.get(7)?,
            balance: row.get(8)?, updated_at: row.get(9)?
        })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect()
    } else {
        let mut stmt = conn.prepare("SELECT id,party_id,date,entry_type,voucher,particulars,debit,credit,balance,updated_at FROM ledger ORDER BY date").map_err(|e| e.to_string())?;
        stmt.query_map([], |row| Ok(LedgerEntry {
            id: row.get(0)?, party_id: row.get(1)?, date: row.get(2)?, entry_type: row.get(3)?,
            voucher: row.get(4)?, particulars: row.get(5)?, debit: row.get(6)?, credit: row.get(7)?,
            balance: row.get(8)?, updated_at: row.get(9)?
        })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect()
    };
    Ok(entries)
}

#[tauri::command]
pub fn save_ledger_entry(entry: LedgerEntry, state: State<DbState>) -> Result<LedgerEntry, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO ledger (id,party_id,date,entry_type,voucher,particulars,debit,credit,balance,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![entry.id, entry.party_id, entry.date, entry.entry_type, entry.voucher, entry.particulars, entry.debit, entry.credit, entry.balance, entry.updated_at]
    ).map_err(|e| e.to_string())?;
    Ok(entry)
}

// Settings
#[tauri::command]
pub fn get_setting(key: String, state: State<DbState>) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key=?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES (?1,?2)", params![key, value]).map_err(|e| e.to_string())?;
    Ok(())
}

// DB Path
#[tauri::command]
pub fn get_db_path(app: tauri::AppHandle) -> String {
    app.path().app_data_dir()
        .map(|p| p.join("billapp.db").to_string_lossy().to_string())
        .unwrap_or_else(|_| "billapp.db".to_string())
}
