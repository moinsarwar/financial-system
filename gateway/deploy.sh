#!/usr/bin/env bash
# Deploy The Comparison Engine domains on the app server.
# Usage: bash gateway/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Ensuring Docker networks"
docker network create finvault_default 2>/dev/null || true
docker network create finos_default 2>/dev/null || true
docker network create reseller_default 2>/dev/null || true

echo "==> Freeing host port 80 (system nginx if present)"
if systemctl is-active --quiet nginx 2>/dev/null; then
  systemctl stop nginx || true
  systemctl disable nginx || true
fi

echo "==> Starting finOS"
cd "$ROOT/finOS"
docker compose -f docker-compose.dev.yml -p finos up -d --build

echo "==> Starting Reseller"
cd "$ROOT/reseller"
docker compose up -d --build
docker exec comparison_backend python seed.py 2>/dev/null || true
docker exec comparison_backend python seed_users.py 2>/dev/null || true

echo "==> Starting domain gateway (:80)"
cd "$ROOT/gateway"
docker compose up -d --force-recreate

echo "==> Health checks"
sleep 5
curl -s -o /dev/null -w "finOS API: %{http_code}\n" http://127.0.0.1:8000/health || true
curl -s -o /dev/null -w "Reseller API: %{http_code}\n" http://127.0.0.1:9005/api/health || true
curl -s -o /dev/null -w "Host apex: %{http_code}\n" -H "Host: thecomparisonengine.com" http://127.0.0.1/ || true
curl -s -o /dev/null -w "Host reseller: %{http_code}\n" -H "Host: reseller.thecomparisonengine.com" http://127.0.0.1/ || true

echo "Done."
echo "Open:"
echo "  http://thecomparisonengine.com"
echo "  http://reseller.thecomparisonengine.com"
echo "  http://ahmedfin.thecomparisonengine.com/login"
