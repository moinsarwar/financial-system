import yaml
with open('/root/financial-system/k8s/ingress.yaml', 'r') as f:
    docs = list(yaml.safe_load_all(f))

ingress = docs[0]
paths = ingress['spec']['rules'][0]['http']['paths']

for p in paths:
    if p['path'] == '/execute_tools':
        p['backend']['service']['port']['number'] = 8003

with open('/root/financial-system/k8s/ingress.yaml', 'w') as f:
    yaml.dump(ingress, f, sort_keys=False)
