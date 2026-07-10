import re

path = '/root/tezqarza-gateway/backend/app/routes/products.py'
with open(path, 'r') as f:
    text = f.read()

text = text.replace('@router.get("/",', '@router.get("",')

with open(path, 'w') as f:
    f.write(text)
