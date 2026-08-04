# Domain gateway for The Comparison Engine
#
# Routes:
#   http://thecomparisonengine.com              → finOS
#   http://www.thecomparisonengine.com          → finOS
#   http://{partner}.thecomparisonengine.com    → finOS (white-label)
#   http://reseller.thecomparisonengine.com     → Reseller portal
#
## DNS (at your registrar)
#   A     @            → 163.245.222.160
#   A     www          → 163.245.222.160
#   A     reseller     → 163.245.222.160
#   A     *            → 163.245.222.160   (wildcard for partner subdomains)
#
## Windows access (browser on Windows → this server)
#   Point DNS as above, OR temporarily edit:
#   C:\Windows\System32\drivers\etc\hosts
#     163.245.222.160  thecomparisonengine.com
#     163.245.222.160  www.thecomparisonengine.com
#     163.245.222.160  reseller.thecomparisonengine.com
#     163.245.222.160  ahmedfin.thecomparisonengine.com
#
## Start order on server
#   1. finOS stack (creates finos_default network)
#   2. reseller stack (joins finos_default, creates reseller_default)
#   3. gateway (joins both networks, binds :80)
#
#   cd /path/to/financial-system/finOS && docker compose -f docker-compose.dev.yml -p finos up -d
#   cd /path/to/financial-system/reseller && docker compose up -d
#   cd /path/to/financial-system/gateway && docker compose up -d
#
# If host nginx already owns :80, stop it first:  systemctl stop nginx
