import glob
for f in glob.glob('/root/financial-system/finCompare/k8s/*.yaml'):
    content = open(f).read()
    content = content.replace('namespace: financial-system', 'namespace: finCompare')
    content = content.replace('name: financial-system', 'name: finCompare')
    content = content.replace('financial-system-ingress', 'fincompare-ingress')
    open(f, 'w').write(content)
