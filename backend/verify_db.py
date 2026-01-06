import sqlite3
import os

conn = sqlite3.connect('sami.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(internal_signals)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Columns in internal_signals: {columns}")
if 'prediction_entropy' in columns:
    print("VERIFIED: prediction_entropy exists.")
else:
    print("MISSING: prediction_entropy NOT found.")
conn.close()
