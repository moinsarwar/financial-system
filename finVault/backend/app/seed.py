from sqlalchemy import select
from .database import SessionLocal,Base,engine
from .models import *
from .security import hash_password
from .schemas import ApplicationCreate,AccountData
from .services import create_application,transition
Base.metadata.create_all(engine)
def run():
 db=SessionLocal()
 try:
  if db.scalar(select(User.id).limit(1)): return
  admin=User(public_id='USR-ADMIN-001',name='FinVault Administrator',cnic='35202-1111111-1',username='admin',password_hash=hash_password('Admin123!'),role=UserRole.ADMIN)
  ahmed=User(public_id='USR-0001',name='Ahmed Khan',cnic='35202-1234567-1',username='ahmed',password_hash=hash_password('User123!'),role=UserRole.APPLICANT)
  sana=User(public_id='USR-0002',name='Sana Ali',cnic='35202-7654321-2',username='sana',password_hash=hash_password('User123!'),role=UserRole.APPLICANT)
  system=User(public_id='USR-SYSTEM',name='FinVault System',username='system',password_hash=hash_password('disabled-account'),role=UserRole.SYSTEM,is_active=False)
  db.add_all([admin,ahmed,sana,system]); db.commit()
  examples=[(ProductType.CAR_LOAN,ahmed.cnic,Decimal('4500000'),None),(ProductType.HEALTH_INSURANCE,sana.cnic,Decimal('250000'),None),(ProductType.BANK_ACCOUNT,ahmed.cnic,None,AccountData(account_type='savings',account_holder='individual',account_mode='islamic',expected_turnover=150000,preferred_branch='Gulberg Lahore',cheque_book=True,debit_card=True,digital_banking=True,purpose='Salary and savings'))]
  for p,cnic,amt,acc in examples: create_application(db,ApplicationCreate(product_type=p,applicant_cnic=cnic,amount=amt,details='Seed demonstration application',account_data=acc),admin)
 finally: db.close()
if __name__=='__main__': run()
