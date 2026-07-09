import urllib.request
import json

payload = {
    "provider_id": "System Seed",
    "schema_hash": "seed_123",
    "products": [
        {
            'product_id': 'MZN_CC_01',
            'product_type': 'credit_card',
            'jurisdiction': ['PK'],
            'pricing': {'currency': 'PKR', 'frequency': 'annual', 'fee': 5000, 'max_amount': 50000},
            'features': [{'name': '1% Cashback'}, {'name': 'Lounge Access'}],
            'compliance': {'sharia_certified': True},
            'status': 'active',
            'version': '1'
        },
        {
            'product_id': 'HBL_PL_01',
            'product_type': 'personal_loan',
            'jurisdiction': ['PK'],
            'pricing': {'currency': 'PKR', 'frequency': 'monthly', 'fee': 2500, 'max_amount': 300000},
            'features': [{'name': 'Quick Approval'}],
            'compliance': {'sharia_certified': False},
            'status': 'active',
            'version': '1'
        },
        {
            'product_id': 'EFU_HLTH_01',
            'product_type': 'health_insurance',
            'jurisdiction': ['PK'],
            'pricing': {'currency': 'PKR', 'frequency': 'annual', 'fee': 15000, 'max_amount': 500000},
            'features': [{'name': '500+ Hospitals'}],
            'compliance': {'sharia_certified': False},
            'status': 'active',
            'version': '1'
        },
        {
            'product_id': 'SLM_MTR_01',
            'product_type': 'motor_insurance',
            'jurisdiction': ['PK'],
            'pricing': {'currency': 'PKR', 'frequency': 'annual', 'fee': 16000, 'max_amount': 1000000},
            'features': [{'name': 'Tracker included'}],
            'compliance': {'sharia_certified': True},
            'status': 'active',
            'version': '1'
        },
        {
            'product_id': 'EFU_LIFE_01',
            'product_type': 'life_insurance',
            'jurisdiction': ['PK'],
            'pricing': {'currency': 'PKR', 'frequency': 'monthly', 'fee': 12000, 'max_amount': 2500000},
            'features': [{'name': 'Savings + Protection'}],
            'compliance': {'sharia_certified': False},
            'status': 'active',
            'version': '1'
        }
    ]
}

req = urllib.request.Request('http://163.245.222.160/provider/ingest', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    response = urllib.request.urlopen(req)
    print(f'Successfully added products!')
except Exception as e:
    print(f'Failed to add products: {e}')
