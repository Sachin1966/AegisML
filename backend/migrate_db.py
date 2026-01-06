import sqlite3
import os

DB_FILE = "sami.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print("Database not found, skipping migration (it will be created fresh).")
        return

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(internal_signals)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "accuracy" not in columns:
            print("Adding 'accuracy' column to internal_signals table...")
            cursor.execute("ALTER TABLE internal_signals ADD COLUMN accuracy FLOAT DEFAULT 0.0")
            conn.commit()
            print("Migration successful.")
        else:
            print("'accuracy' column already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
