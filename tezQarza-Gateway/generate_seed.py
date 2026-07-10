import csv

def map_icon(category):
    c = category.lower()
    if 'personal' in c: return 'fa-user'
    if 'business' in c or 'sme' in c: return 'fa-building'
    if 'auto' in c: return 'fa-car'
    if 'agriculture' in c: return 'fa-leaf'
    if 'home' in c or 'housing' in c: return 'fa-home'
    if 'gold' in c: return 'fa-coins'
    if 'education' in c: return 'fa-graduation-cap'
    return 'fa-box'

def map_type(category):
    c = category.lower()
    if 'personal' in c: return 'personal'
    if 'business' in c or 'sme' in c: return 'business'
    if 'auto' in c: return 'auto'
    if 'home' in c: return 'home'
    return 'general'

sql_statements = ["BEGIN;"]

with open('TezQarza_Pakistan_Financial_Ecosystem_Roadmap.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        pid = f"LFE-PK-{i+1:03d}"
        name = row['Product'].replace("'", "''")
        category = row['Category'].replace("'", "''")
        supplier = row['Supplier'].replace("'", "''")
        features = row['Key Features'].replace("'", "''")
        
        icon = map_icon(row['Category'])
        ptype = map_type(row['Category'])
        
        sql = f"INSERT INTO products (id, lfe_product_id, name, icon, type, group_name, max_amount, min_tenure, max_tenure, tag, ideal, processing, active, last_synced_at) VALUES ('{pid}', '{pid}', '{name}', '{icon}', '{ptype}', '{category}', 1000000, 1, 12, '{supplier}', '{features}', '24 hours', true, NOW()) ON CONFLICT (id) DO NOTHING;"
        sql_statements.append(sql)

sql_statements.append("COMMIT;")

with open('seed.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))
print("Generated seed.sql")
