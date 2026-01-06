
import sqlite3
import os

DB_PATH = "backend/sami.db"

def check_and_fix_db():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check columns in internal_signals
    cursor.execute("PRAGMA table_info(internal_signals)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "ev_centrality" not in columns:
        print("Adding missing column 'ev_centrality' to internal_signals...")
        try:
            cursor.execute("ALTER TABLE internal_signals ADD COLUMN ev_centrality FLOAT DEFAULT 0.0")
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("Column 'ev_centrality' already exists.")

    conn.close()

if __name__ == "__main__":
    check_and_fix_db()
