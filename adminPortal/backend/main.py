from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import docker
from typing import List, Dict, Any
from pydantic import BaseModel
import hashlib
import subprocess
import os
import time
from database import get_db, AdminUser, Base, engine
from sqlalchemy.orm import Session
from fastapi import FastAPI, HTTPException, Depends

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Admin Portal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_docker_client():
    return docker.from_env()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.hashed_password != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return {"status": "success", "token": "dummy_jwt_token"}

@app.get("/api/containers")
def get_containers():
    try:
        client = get_docker_client()
        containers = client.containers.list(all=True)
        result = []
        for c in containers:
            result.append({
                "id": c.short_id,
                "name": c.name,
                "status": c.status,
                "image": c.image.tags[0] if c.image.tags else "unknown",
                "ports": c.ports,
                "created": c.attrs.get("Created"),
                "startedAt": c.attrs.get("State", {}).get("StartedAt")
            })
        return {"containers": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
def get_stats():
    try:
        client = get_docker_client()
        containers = client.containers.list(filters={"status": "running"})
        stats_list = []
        for c in containers:
            # We pass stream=False to get a single stats snapshot
            stats = c.stats(stream=False)
            
            # Calculate CPU usage percentage
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
            system_cpu_delta = stats['cpu_stats'].get('system_cpu_usage', 0) - stats['precpu_stats'].get('system_cpu_usage', 0)
            number_cpus = stats['cpu_stats'].get('online_cpus', 1)
            
            cpu_percent = 0.0
            if system_cpu_delta > 0 and cpu_delta > 0:
                cpu_percent = (cpu_delta / system_cpu_delta) * number_cpus * 100.0
                
            # Calculate Memory usage percentage
            mem_usage = stats['memory_stats'].get('usage', 0)
            mem_limit = stats['memory_stats'].get('limit', 1)
            mem_percent = (mem_usage / mem_limit) * 100.0 if mem_limit > 0 else 0.0
            
            stats_list.append({
                "id": c.short_id,
                "name": c.name,
                "cpu_percent": round(cpu_percent, 2),
                "mem_percent": round(mem_percent, 2),
                "mem_usage_bytes": mem_usage,
                "mem_limit_bytes": mem_limit
            })
        return {"stats": stats_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/containers/{container_id}/start")
def start_container(container_id: str):
    try:
        client = get_docker_client()
        container = client.containers.get(container_id)
        container.start()
        return {"status": "success", "message": f"Container {container_id} started."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/containers/{container_id}/stop")
def stop_container(container_id: str):
    try:
        client = get_docker_client()
        container = client.containers.get(container_id)
        container.stop()
        return {"status": "success", "message": f"Container {container_id} stopped."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/containers/{container_id}")
def delete_container(container_id: str):
    try:
        client = get_docker_client()
        container = client.containers.get(container_id)
        container.remove(force=True)
        return {"status": "success", "message": f"Container {container_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
