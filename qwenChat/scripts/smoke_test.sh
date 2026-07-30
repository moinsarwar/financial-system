#!/bin/bash
set -e
curl -s -X POST http://127.0.0.1:9011/api/data \
  -H 'Content-Type: application/json' \
  -d '{"action":"finos_products"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print("finos_products ok=", d.get("ok"), "total=", (d.get("data") or {}).get("total"))'

curl -s -X POST http://127.0.0.1:9011/api/data \
  -H 'Content-Type: application/json' \
  -d '{"action":"reseller_stats"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print("reseller_stats", d)'

curl -s -X POST http://127.0.0.1:9011/api/data \
  -H 'Content-Type: application/json' \
  -d '{"action":"reseller_list"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print("reseller_list ok=", d.get("ok"), "type=", type(d.get("data")).__name__)'

curl -s http://127.0.0.1:9011/health | python3 -m json.tool
