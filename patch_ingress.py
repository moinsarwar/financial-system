import yaml
with open('/root/financial-system/k8s/ingress.yaml', 'r') as f:
    docs = list(yaml.safe_load_all(f))

ingress = docs[0]
paths = ingress['spec']['rules'][0]['http']['paths']

existing_paths = [p['path'] for p in paths]
if '/validate_mode_action' not in existing_paths:
    paths.append({
        'path': '/validate_mode_action',
        'pathType': 'Prefix',
        'backend': {
            'service': {
                'name': 'policy-service',
                'port': {'number': 8002}
            }
        }
    })
if '/evaluate_output' not in existing_paths:
    paths.append({
        'path': '/evaluate_output',
        'pathType': 'Prefix',
        'backend': {
            'service': {
                'name': 'policy-service',
                'port': {'number': 8002}
            }
        }
    })

with open('/root/financial-system/k8s/ingress.yaml', 'w') as f:
    yaml.dump(ingress, f, sort_keys=False)
