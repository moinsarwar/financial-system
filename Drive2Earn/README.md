# Drive to Earn

Static prototype — vehicle access for earning drivers (single HTML page).

**Live:** https://drive-to-earn.thecomparisonengine.com

## Local

```bash
cd ~/financial-system/Drive2Earn
docker compose up -d
# http://localhost:9017
```

## Production

```bash
ssh root@163.245.222.160 "cd /root/financial-system/Drive2Earn && docker compose up -d"
```

Caddy: `drive-to-earn.thecomparisonengine.com` → `127.0.0.1:9017`
