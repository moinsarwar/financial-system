import os
import json
import logging
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import psycopg2
from psycopg2.extras import Json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('POSTGRES_DB', 'financial_system'),
            user=os.getenv('POSTGRES_USER', 'system'),
            password=os.getenv('POSTGRES_PASSWORD', 'secret123'),
            host=os.getenv('POSTGRES_HOST', 'postgres'),
            port=os.getenv('POSTGRES_PORT', '5432')
        )
        return conn
    except Exception as e:
        logger.error(f"DB connection failed: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS dar_store (
                        id SERIAL PRIMARY KEY,
                        data JSONB NOT NULL
                    )
                """)
                # Insert initial row if empty
                cur.execute("SELECT COUNT(*) FROM dar_store")
                if cur.fetchone()[0] == 0:
                    cur.execute("INSERT INTO dar_store (data) VALUES (%s)", (Json({}),))
            conn.commit()
        except Exception as e:
            logger.error(f"DB init failed: {e}")
        finally:
            conn.close()

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/digital-asset-register")
async def get_index():
    return FileResponse("static/index.html")

@app.get("/digital-asset-register/api/data")
async def get_data():
    conn = get_db_connection()
    if not conn:
        return JSONResponse(status_code=500, content={"error": "Database connection failed"})
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT data FROM dar_store ORDER BY id ASC LIMIT 1")
            row = cur.fetchone()
            if row:
                return JSONResponse(content=row[0])
            return JSONResponse(content={})
    except Exception as e:
        logger.error(f"Get data error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        conn.close()

@app.post("/digital-asset-register/api/data")
async def save_data(request: Request):
    try:
        data = await request.json()
        conn = get_db_connection()
        if not conn:
            return JSONResponse(status_code=500, content={"error": "Database connection failed"})
        
        with conn.cursor() as cur:
            cur.execute("UPDATE dar_store SET data = %s", (Json(data),))
            if cur.rowcount == 0:
                cur.execute("INSERT INTO dar_store (data) VALUES (%s)", (Json(data),))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Save data error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

app.mount("/digital-asset-register/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
