import sqlite3

def fix_schema():
    conn = sqlite3.connect('backend/aegis.db')
    cursor = conn.cursor()
    try:
        print("Dropping production_telemetry table...")
        cursor.execute("DROP TABLE IF EXISTS production_telemetry")
        conn.commit()
        print("Table dropped. Backend will recreate it on restart.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
