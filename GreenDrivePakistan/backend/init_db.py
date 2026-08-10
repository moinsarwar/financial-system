from app.database import engine, Base, SessionLocal
from app import models, auth, schemas
from app.services.finance import calculate_product_profit

# Create tables
Base.metadata.create_all(bind=engine)
print('Database tables created successfully!')

db = SessionLocal()

# Create Admin
admin = db.query(models.User).filter(models.User.email == 'admin@demo.com').first()
if not admin:
    admin = models.User(
        email='admin@demo.com',
        name='Super Admin',
        password_hash=auth.get_password_hash('admin123'),
        role='admin',
        cnic='12345-1234567-1',
        is_active=True
    )
    db.add(admin)
    db.commit()
    print('Admin user created!')
else:
    print('Admin user already exists!')

# Create Vendors
vendors_data = [
    {'name': 'SolarTech Solutions', 'email': 'vendor@demo.com', 'password': 'vendor123', 'description': 'Premium solar solutions'},
    {'name': 'EcoRides Pakistan', 'email': 'vendor2@demo.com', 'password': 'vendor123', 'description': 'Electric vehicles'},
    {'name': 'CoolAir Industries', 'email': 'vendor3@demo.com', 'password': 'vendor123', 'description': 'Energy-efficient cooling'}
]
for v_data in vendors_data:
    existing = db.query(models.Vendor).filter(models.Vendor.email == v_data['email']).first()
    if not existing:
        vendor = models.Vendor(
            name=v_data['name'],
            email=v_data['email'],
            password_hash=auth.get_password_hash(v_data['password']),
            description=v_data['description']
        )
        db.add(vendor)
db.commit()
print('Vendors created successfully!')

# Create Products
vendors = db.query(models.Vendor).all()
vendor_map = {v.name: v.id for v in vendors}
products = [
    {'vendor_id': vendor_map.get('SolarTech Solutions'), 'name': 'Solar Panel Kit (3kW)', 'price': 450000, 'category': 'Solar', 'saving_factor_electric': 0.70, 'warranty': '25 years', 'installation': 'Included', 'rating': 4.9},
    {'vendor_id': vendor_map.get('SolarTech Solutions'), 'name': 'Lithium Battery (200Ah)', 'price': 280000, 'category': 'Battery', 'saving_factor_electric': 0.30, 'warranty': '5 years', 'installation': 'Included', 'rating': 4.7},
    {'vendor_id': vendor_map.get('EcoRides Pakistan'), 'name': 'Electric Bike (Commuter)', 'price': 180000, 'category': 'EV', 'saving_factor_fuel': 0.80, 'warranty': '2 years', 'installation': 'Free assembly', 'rating': 4.8},
]
for p_data in products:
    existing = db.query(models.Product).filter(models.Product.name == p_data['name']).first()
    if not existing and p_data['vendor_id']:
        monthly_saving = p_data.get('saving_factor_electric', 0) * 15000 + p_data.get('saving_factor_fuel', 0) * 10000
        product = models.Product(
            **p_data,
            profit=calculate_product_profit(p_data['price']),
            monthly_saving=monthly_saving,
            annual_saving=monthly_saving * 12,
            payback=f"{int(p_data['price'] / (monthly_saving * 12))} years" if monthly_saving > 0 else 'N/A'
        )
        db.add(product)
db.commit()
print('Products created successfully!')
db.close()
