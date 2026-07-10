import glob
for f in glob.glob('/root/financial-system/finCompare/k8s/*.yaml'):
    content = open(f).read()
    content = content.replace('namespace: finCompare', 'namespace: fincompare')
    content = content.replace('name: finCompare', 'name: fincompare')
    open(f, 'w').write(content)
