import os
os.environ['DATABASE_URL']='sqlite:///./test_finvault.db'
from fastapi.testclient import TestClient
from app.database import Base,engine,SessionLocal
from app.main import app
from app.models import User,UserRole
from app.security import hash_password
import pytest
@pytest.fixture(autouse=True)
def dbsetup():
 Base.metadata.drop_all(engine); Base.metadata.create_all(engine); db=SessionLocal(); db.add_all([User(public_id='A',name='Admin',cnic='35202-1111111-1',username='admin',password_hash=hash_password('x'),role=UserRole.ADMIN),User(public_id='U',name='User',cnic='35202-2222222-2',username='user',password_hash=hash_password('x'),role=UserRole.APPLICANT),User(public_id='S',name='System',username='system',password_hash=hash_password('x'),role=UserRole.SYSTEM,is_active=False)]); db.commit(); db.close(); yield
@pytest.fixture
def client(): return TestClient(app)
def token(client,user): return client.post('/api/auth/login',data={'username':user,'password':'x'}).json()['access_token']
