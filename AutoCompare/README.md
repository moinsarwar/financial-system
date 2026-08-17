# AutoCompare PK

Static prototype — car comparison UI (single HTML page).

**Live:** https://autocompare.thecomparisonengine.com

## Local

```bash
cd ~/financial-system/AutoCompare
docker compose up -d
# http://localhost:9016
```

## Production

```bash
ssh root@163.245.222.160 "cd /root/financial-system/AutoCompare && docker compose up -d"
```

Caddy: `autocompare.thecomparisonengine.com` → `127.0.0.1:9016`
