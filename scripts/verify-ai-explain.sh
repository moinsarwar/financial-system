#!/bin/bash
set -e
echo "=== warm model ==="
curl -sS http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen2.5:1.5b","messages":[{"role":"user","content":"ping"}],"stream":false,"keep_alive":-1,"options":{"num_predict":8}}' \
  | head -c 300
echo
echo "=== ollama ps ==="
ollama ps
echo "=== ai health backend ==="
docker exec finos-backend-1 curl -sS http://127.0.0.1:8000/api/ai/health
echo
echo "=== ai health via :3000 ==="
curl -sS http://127.0.0.1:3000/api/ai/health
echo
echo "=== explain stream sample ==="
curl -sS -N -X POST http://127.0.0.1:3000/api/ai/explain \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{"intent":"savings","age":32,"income_band":"100k-250k","jurisdiction":"PK","top_eligible":[{"id":"p1","name":"HBL Savings Plus","provider":"HBL","type":"savings","completeness":92,"profitRate":"8.5% p.a."}],"excluded_sample":[{"id":"p2","name":"Youth Saver","provider":"ABL","reasons":["Age 32 outside 18-25"]}],"stream":true}' \
  | head -n 40
echo
echo DONE
