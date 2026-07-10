import re

# Fix Dashboard Stats
path_dashboard = '/root/tezqarza-gateway/backend/app/routes/dashboard.py'
with open(path_dashboard, 'r') as f:
    text = f.read()

text = text.replace('@router.get("/stats", response_model=schemas.DashboardStats, dependencies=[Depends(verify_admin_key)])', '@router.get("/stats", response_model=schemas.DashboardStats)')

with open(path_dashboard, 'w') as f:
    f.write(text)

# Fix Applications POST
path_app = '/root/tezqarza-gateway/backend/app/routes/applications.py'
with open(path_app, 'r') as f:
    text2 = f.read()

text2 = text2.replace('@router.post("/", response_model=schemas.ApplicationResponse)', '@router.post("", response_model=schemas.ApplicationResponse)')

with open(path_app, 'w') as f:
    f.write(text2)
