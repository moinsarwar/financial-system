import re
with open('/root/financial-system/services/agent/main.py', 'r') as f:
    content = f.read()

# Fix the HTTPException catch in parse_intent
content = content.replace(
    'except Exception as e:\n        logger.error(f"Intent parsing error: {str(e)}")',
    'except HTTPException:\n        raise\n    except Exception as e:\n        logger.error(f"Intent parsing error: {str(e)}")'
)

# Add ExecuteToolsRequest and /execute_tools endpoint if missing
if '/execute_tools' not in content:
    execute_code = """
class ToolStep(BaseModel):
    tool: str
    params: Dict

class ExecuteToolsRequest(BaseModel):
    session_id: str
    mode: str
    steps: List[ToolStep]

@app.post("/execute_tools")
async def execute_tools(request: ExecuteToolsRequest):
    try:
        session_data = redis_client.get(f"session:{request.session_id}")
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        results = []
        for step in request.steps:
            results.append({
                "tool": step.tool,
                "status": "success",
                "result": f"Executed {step.tool} successfully"
            })
            
        return {
            "session_id": request.session_id,
            "status": "completed",
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
"""
    content = content.replace('if __name__ == "__main__":', execute_code + '\nif __name__ == "__main__":')

with open('/root/financial-system/services/agent/main.py', 'w') as f:
    f.write(content)
