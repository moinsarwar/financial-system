import sys
import os

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from sqlalchemy import text

def alter_enum():
    with engine.connect() as conn:
        conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'super_admin'"))
        conn.commit()

if __name__ == "__main__":
    alter_enum()
