# Fix static HTML → finOS (:3000) + Reseller (:9004) with HTTPS

## Production ports
| App | Host port |
|-----|-----------|
| finOS frontend | **3000** |
| Reseller frontend | **9004** |

Host nginx (80/443) must **proxy** to these — not serve `index.html`.

## On server
```bash
cd /path/to/financial-system
git pull
chmod +x gateway/replace-html-with-apps.sh
bash gateway/replace-html-with-apps.sh
```

Or manually:
```bash
# 1) Confirm apps
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:9004/

# 2) Replace nginx site (disable old HTML site first)
rm -f /etc/nginx/sites-enabled/*
cp gateway/host-nginx-https.conf /etc/nginx/sites-available/thecomparisonengine.com
ln -sfn /etc/nginx/sites-available/thecomparisonengine.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Result
- `https://thecomparisonengine.com` → `127.0.0.1:3000` (finOS)
- `https://reseller.thecomparisonengine.com` → `127.0.0.1:9004` (Reseller)
