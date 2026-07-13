from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import docker
from typing import List, Dict, Any

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
                "created": c.attrs.get("Created")
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
