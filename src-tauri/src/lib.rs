pub mod db;

use db::{DbState, init_db};
use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = app.path().app_local_data_dir()
                .expect("Could not get app data dir")
                .join("billapp.db");

            std::fs::create_dir_all(db_path.parent().unwrap()).ok();

            let conn = init_db(db_path.to_str().unwrap())
                .expect("Failed to initialize SQLite database");

            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Bills
            db::get_bills,
            db::get_bill_by_id,
            db::save_bill,
            db::delete_bill,
            // Parties
            db::get_parties,
            db::save_party,
            db::delete_party,
            // Skip Groups
            db::get_skip_main_groups,
            db::save_skip_main_group,
            db::delete_skip_main_group,
            db::get_skip_sub_groups,
            db::save_skip_sub_group,
            db::delete_skip_sub_group,
            db::get_skip_items,
            db::save_skip_item,
            db::delete_skip_item,
            // Stock
            db::get_stock_items,
            db::save_stock_item,
            db::delete_stock_item,
            // Ledger
            db::get_ledger_entries,
            db::save_ledger_entry,
            // Settings
            db::get_setting,
            db::set_setting,
            db::get_db_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
