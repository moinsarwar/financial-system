import os
import sys
from datetime import datetime

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.front_product import FrontProduct

products_data = [
    {
        'product_id': 'MZN_CC_01',
        'product_type': 'credit_card',
        'jurisdiction': ['PK'],
        'pricing': {'currency': 'PKR', 'frequency': 'annual', 'fee': 5000, 'max_amount': 50000},
        'features': [{'name': '1% Cashback'}, {'name': 'Lounge Access'}],
        'compliance': {'sharia_certified': True},
        'status': 'active',
        'version': '1',
        'provider_id': 'System Seed'
    },
    {
        'product_id': 'HBL_PL_01',
        'product_type': 'personal_loan',
        'jurisdiction': ['PK'],
        'pricing': {'currency': 'PKR', 'frequency': 'monthly', 'fee': 2500, 'max_amount': 300000},
        'features': [{'name': 'Quick Approval'}],
        'compliance': {'sharia_certified': False},
        'status': 'active',
        'version': '1',
        'provider_id': 'System Seed'
    },
    {
        'product_id': 'EFU_HLTH_01',
        'product_type': 'health_insurance',
        'jurisdiction': ['PK'],
        'pricing': {'currency': 'PKR', 'frequency': 'annual', 'fee': 15000, 'max_amount': 500000},
        'features': [{'name': '500+ Hospitals'}],
        'compliance': {'sharia_certified': False},
        'status': 'active',
        'version': '1',
        'provider_id': 'System Seed'
    },
    {
        'product_id': 'SLM_MTR_01',
        'product_type': 'motor_insurance',
        'jurisdiction': ['PK'],
        'pricing': {'currency': 'PKR', 'frequency': 'annual', 'fee': 16000, 'max_amount': 1000000},
        'features': [{'name': 'Tracker included'}],
        'compliance': {'sharia_certified': True},
        'status': 'active',
        'version': '1',
        'provider_id': 'System Seed'
    },
    {
        'product_id': 'EFU_LIFE_01',
        'product_type': 'life_insurance',
        'jurisdiction': ['PK'],
        'pricing': {'currency': 'PKR', 'frequency': 'monthly', 'fee': 12000, 'max_amount': 2500000},
        'features': [{'name': 'Savings + Protection'}],
        'compliance': {'sharia_certified': False},
        'status': 'active',
        'version': '1',
        'provider_id': 'System Seed'
    }
]

def seed():
    db = SessionLocal()
    try:
        print("Seeding front products...")
        for p_data in products_data:
            existing = db.query(FrontProduct).filter(FrontProduct.product_id == p_data['product_id']).first()
            if not existing:
                new_product = FrontProduct(
                    product_id=p_data['product_id'],
                    product_type=p_data['product_type'],
                    jurisdiction=p_data['jurisdiction'],
                    pricing=p_data['pricing'],
                    features=p_data['features'],
                    compliance=p_data['compliance'],
                    status=p_data['status'],
                    version=p_data['version'],
                    provider_id=p_data['provider_id'],
                    last_updated=datetime.utcnow()
                )
                db.add(new_product)
        
        db.commit()
        print("Successfully seeded front products.")
    except Exception as e:
        print(f"Failed to seed products: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
