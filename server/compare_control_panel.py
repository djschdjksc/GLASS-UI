import sqlite3

c_track = sqlite3.connect(r'F:\BillTrack\database\bill_data.db')
c_track.row_factory = sqlite3.Row
c_modern = sqlite3.connect('billapp.db')
c_modern.row_factory = sqlite3.Row

track_cp = c_track.execute("SELECT * FROM control_panel").fetchall()
modern_cp = c_modern.execute("SELECT * FROM control_panel").fetchall()

print(f"Track control_panel count: {len(track_cp)}")
print(f"Modern control_panel count: {len(modern_cp)}")

track_shortcuts = set(r['shortcut'] for r in track_cp)
modern_shortcuts = set(r['shortcut'] for r in modern_cp)

print(f"In Track but not in Modern: {track_shortcuts - modern_shortcuts}")
print(f"In Modern but not in Track: {modern_shortcuts - track_shortcuts}")

print("\nSample Track control_panel rows:")
for r in track_cp[:5]:
    print(dict(r))
