#!/usr/bin/env bash
# Switch edge from host nginx → Caddy with on-demand TLS for ANY subdomain.
# Run on server as root: bash gateway/install-caddy-ondemand.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Install Caddy if missing"
if ! command -v caddy >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> Install ask-server (on-demand allowlist)"
cp "$ROOT/gateway/ask-server.py" /usr/local/bin/tce-ask-server.py
chmod +x /usr/local/bin/tce-ask-server.py
cat >/etc/systemd/system/tce-ask-server.service <<'EOF'
[Unit]
Description=TCE Caddy on-demand TLS ask server
After=network.target

[Service]
ExecStart=/usr/bin/python3 /usr/local/bin/tce-ask-server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now tce-ask-server.service

echo "==> Stop host nginx (free :80/:443 for Caddy)"
systemctl disable --now nginx 2>/dev/null || true

echo "==> Install Caddyfile"
cp "$ROOT/gateway/Caddyfile" /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy

echo "==> Wait for hello on-demand cert"
sleep 3
curl -sI "https://hello.thecomparisonengine.com/" | head -15 || true
curl -skI "https://ahmedfin.thecomparisonengine.com/" | head -10 || true
curl -skI "https://reseller.thecomparisonengine.com/" | head -10 || true
curl -skI "https://thecomparisonengine.com/" | head -10 || true

echo "Done. Any new subdomain gets a cert automatically on first visit."
