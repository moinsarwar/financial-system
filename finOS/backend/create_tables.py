import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import engine, Base
from app.models import Communication, MessageReceipt, InformationRequest
Base.metadata.create_all(bind=engine)
print('Tables created')
