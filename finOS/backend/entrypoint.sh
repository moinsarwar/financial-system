#!/bin/sh  
set -e  
  
echo "Waiting for database..."  
  
python - <<'PY'  
import os  
import time  
import psycopg2  
  
database_url = os.environ["DATABASE_URL"]  
  
for attempt in range(30):  
    try:  
        connection = psycopg2.connect(database_url)  
        connection.close()  
        print("Database is ready.")  
        break  
    except psycopg2.OperationalError:  
        if attempt == 29:  
            raise  
        time.sleep(2)  
PY  
  
echo "Running migrations..."  
alembic upgrade head  
  
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then  
    echo "Seeding demonstration data..."  
    python -m app.scripts.seed_demo  
fi  
  
exec "$@"
