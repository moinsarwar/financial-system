import yaml
import glob
import os

def process():
    paths = glob.glob('k8s/*.yaml')
    for path in paths:
        with open(path, 'r') as f:
            docs = list(yaml.safe_load_all(f))
        
        modified = False
        for doc in docs:
            if not doc: continue
            if doc.get('kind') in ['Deployment', 'StatefulSet']:
                try:
                    containers = doc['spec']['template']['spec']['containers']
                    for c in containers:
                        if 'resources' in c:
                            del c['resources']
                            modified = True
                        if c.get('name') == 'kafka':
                            env = c.get('env', [])
                            if not any(e.get('name') == 'KAFKA_LISTENERS' for e in env):
                                env.append({'name': 'KAFKA_LISTENERS', 'value': 'PLAINTEXT://0.0.0.0:9092'})
                                c['env'] = env
                                modified = True
                except KeyError:
                    pass
        
        if modified:
            with open(path, 'w') as f:
                yaml.dump_all(docs, f, default_flow_style=False, sort_keys=False)

if __name__ == '__main__':
    process()
