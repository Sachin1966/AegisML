import sqlite3
import os

db_path = 'sami.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Attempting to add 'prediction_entropy' column to 'internal_signals' table...")
    cursor.execute("ALTER TABLE internal_signals ADD COLUMN prediction_entropy FLOAT DEFAULT 0.0")
    conn.commit()
    print("Success: Column added.")
except sqlite3.OperationalError as e:
    print(f"Operation failed (Column might already exist): {e}")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    conn.close()
