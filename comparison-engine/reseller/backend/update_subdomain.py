import sys
sys.path.append(".")
from app.database import SessionLocal
from app.models import Reseller

db = SessionLocal()
resellers = db.query(Reseller).all()

for r in resellers:
    old = r.subdomain
    if "compareengine.pk" in r.subdomain:
        r.subdomain = r.subdomain.replace("compareengine.pk", "fincompare.pk")
    if "ahmedfin" in r.subdomain:
        r.subdomain = r.subdomain.replace("ahmedfin", "ahmed")
    
    if old != r.subdomain:
        print(f"Updated: {old} -> {r.subdomain}")

db.commit()
db.close()
