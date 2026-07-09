import os

ingress_path = '/root/financial-system/k8s/ingress.yaml'
with open(ingress_path, 'r') as f:
    ingress_content = f.read()

if '- path: /\n' not in ingress_content and '- path: / ' not in ingress_content:
    frontend_rule = """      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
"""
    ingress_content += frontend_rule
    with open(ingress_path, 'w') as f:
        f.write(ingress_content)

import subprocess

# Create or update ConfigMap from actual files
cmd = "kubectl create configmap frontend-html --from-file=frontend/views/ -n financial-system --dry-run=client -o yaml | kubectl apply -f -"
subprocess.run(cmd, shell=True)

frontend_k8s = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-service
  namespace: financial-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend-service
  template:
    metadata:
      labels:
        app: frontend-service
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: html-volume
          mountPath: /usr/share/nginx/html
      volumes:
      - name: html-volume
        configMap:
          name: frontend-html
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: financial-system
spec:
  selector:
    app: frontend-service
  ports:
  - port: 80
    targetPort: 80
"""
with open('/root/financial-system/k8s/frontend-service.yaml', 'w') as f:
    f.write(frontend_k8s)
