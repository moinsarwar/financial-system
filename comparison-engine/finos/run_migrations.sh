#!/bin/bash
ssh -o BatchMode=yes root@163.245.222.160 'docker exec finos-backend-1 bash -c "cd /app && alembic upgrade head"'
