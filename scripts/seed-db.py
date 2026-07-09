import requests, json

url = 'http://163.245.222.160/provider/ingest'
sample_product = {
    'product_id': 'PK_TEST_SAVINGS_001_v1',
    'provider_id': 'TEST_BANK',
    'product_type': 'savings_account',
    'jurisdiction': ['PK'],
    'status': 'active',
    'version': '1',
    'last_updated': '2026-05-05T00:00:00Z',
    'pricing': {'base_rate_percent': 10, 'currency': 'PKR', 'fees': {}, 'frequency': 'monthly'},
    'eligibility_rules': {'rules': []},
    'features': [],
    'compliance': {'sharia_certified': False}
}

try:
    response = requests.post(url, json={'provider_id': 'TEST_BANK', 'schema_hash': 'sha256:abc1234567890abcdef', 'products': [sample_product]})
    print('Status Code:', response.status_code)
    print('Response:', response.text)
except Exception as e:
    print('Error:', e)