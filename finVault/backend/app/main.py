from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth,applications,documents,messages,dashboard
app=FastAPI(title=settings.app_name,version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origin_list,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
for r in [auth.r,applications.r,documents.r,messages.r,dashboard.r]: app.include_router(r)
@app.get('/health')
def health(): return {'status':'ok','service':'finvault'}
