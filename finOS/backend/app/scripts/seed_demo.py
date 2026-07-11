import sys  
from pathlib import Path  
sys.path.insert(0, str(Path(__file__).parent.parent.parent))  
from app.core.database import SessionLocal  
from app.services.seed_service import seed_demo_data  
  
def main():  
    db = SessionLocal()  
    try:  
        seed_demo_data(db, commit=True)  
        print("Demo data seeded successfully.")  
    except Exception as e:  
        db.rollback()  
        print(f"Error seeding: {e}", file=sys.stderr)  
        raise  
    finally:  
        db.close()  
  
if __name__ == "__main__":  
    main()
