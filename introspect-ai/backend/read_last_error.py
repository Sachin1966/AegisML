from app import models, database
from sqlalchemy import desc

def read_error():
    db = database.SessionLocal()
    try:
        last = db.query(models.ProductionTelemetry).order_by(desc(models.ProductionTelemetry.id)).first()
        if last:
            print(f"Last Status: {last.status_code}")
            print(f"Trace: {last.causal_trace}")
        else:
            print("No telemetry found.")
    finally:
        db.close()

if __name__ == "__main__":
    read_error()
