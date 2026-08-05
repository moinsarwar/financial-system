#!/usr/bin/env bash
# Replace the static HTML on :80/:443 with finOS (:3000) + Reseller (:9004) over HTTPS.
# Run ON THE SERVER as root, from the financial-system repo root:
#   bash gateway/replace-html-with-apps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_NAME="thecomparisonengine.com"
AVAIL="/etc/nginx/sites-available/${SITE_NAME}"
ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"

echo "==> 1) Ensure apps are up (finOS :3000, Reseller :9004)"
docker network create finvault_default 2>/dev/null || true

# Prefer already-running production stacks; only start if ports are down
if ! curl -sf -o /dev/null http://127.0.0.1:3000/; then
  echo "   finOS :3000 not responding — starting prod compose"
  cd "$ROOT/finOS"
  docker compose -f docker-compose.prod.yml -p finos up -d --build
fi

if ! curl -sf -o /dev/null http://127.0.0.1:9004/; then
  echo "   Reseller :9004 not responding — starting reseller compose"
  cd "$ROOT/reseller"
  docker compose up -d --build
  docker exec comparison_backend python seed.py 2>/dev/null || true
  docker exec comparison_backend python seed_users.py 2>/dev/null || true
fi

echo "==> 2) Disable old nginx sites that serve static HTML (GreenDrive index.html)"
mkdir -p /etc/nginx/sites-available/disabled-backup
shopt -s nullglob
for f in /etc/nginx/sites-enabled/*; do
  base="$(basename "$f")"
  echo "   disabling $base"
  cp -a "$f" "/etc/nginx/sites-available/disabled-backup/$base" 2>/dev/null || true
  rm -f "$f"
done

echo "==> 3) Install HTTPS reverse-proxy (finOS→3000, reseller→9004)"
cp "$ROOT/gateway/host-nginx-https.conf" "$AVAIL"
ln -sfn "$AVAIL" "$ENABLED"
mkdir -p /var/www/certbot

echo "==> 4) SSL cert"
if [ ! -d /etc/letsencrypt/live/thecomparisonengine.com ]; then
  certbot certonly --nginx \
    -d thecomparisonengine.com \
    -d www.thecomparisonengine.com \
    -d reseller.thecomparisonengine.com \
    --non-interactive --agree-tos --register-unsafely-without-email || \
  certbot certonly --webroot -w /var/www/certbot \
    -d thecomparisonengine.com \
    -d www.thecomparisonengine.com \
    -d reseller.thecomparisonengine.com \
    --non-interactive --agree-tos --register-unsafely-without-email
fi

if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  curl -sL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "==> 5) nginx -t && reload"
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

echo "==> 6) Health"
sleep 2
curl -s -o /dev/null -w "finOS :3000  %{http_code}\n" http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w "Reseller :9004 %{http_code}\n" http://127.0.0.1:9004/ || true
curl -sk -o /dev/null -w "HTTPS apex     %{http_code}\n" https://thecomparisonengine.com/ || true
curl -sk -o /dev/null -w "HTTPS reseller %{http_code}\n" https://reseller.thecomparisonengine.com/ || true

echo ""
echo "Done."
echo "  https://thecomparisonengine.com/        → finOS :3000"
echo "  https://reseller.thecomparisonengine.com/ → Reseller :9004"
