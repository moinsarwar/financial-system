import json

with open("finOS/scratch/test_products.json", "r") as f:
    data = json.load(f)

savings = [p for p in data["products"] if "saving" in p.get("product_type", "").lower()]
print(f"Total savings products: {len(savings)}")
print("First 2 savings products:")
for p in data["products"]:
    if "saving" in p.get("product_type", "").lower():
        print(p.get("product_type"), p.get("jurisdiction"))
