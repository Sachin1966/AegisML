from app import models, database
from sqlalchemy.orm import Session

def reset_db():
    try:
        print("Dropping all tables...")
        models.Base.metadata.drop_all(bind=database.engine)
        print("Recreating tables...")
        models.Base.metadata.create_all(bind=database.engine)
        print("Database schema reset successful.")
    except Exception as e:
        print(f"Error resetting DB: {e}")

if __name__ == "__main__":
    reset_db()
