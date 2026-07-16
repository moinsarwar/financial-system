import hashlib,secrets
from pathlib import Path
from fastapi import HTTPException,UploadFile
from .config import settings
ALLOWED={'application/pdf':b'%PDF','image/png':b'\x89PNG','image/jpeg':b'\xff\xd8\xff'}
async def save_upload(file:UploadFile):
 if file.content_type not in ALLOWED: raise HTTPException(415,'Only PDF, PNG and JPEG files are allowed')
 data=await file.read(settings.max_upload_mb*1024*1024+1)
 if len(data)>settings.max_upload_mb*1024*1024: raise HTTPException(413,'File too large')
 if not data.startswith(ALLOWED[file.content_type]): raise HTTPException(400,'File signature does not match content type')
 ext={'application/pdf':'.pdf','image/png':'.png','image/jpeg':'.jpg'}[file.content_type]; name=secrets.token_hex(16)+ext
 (settings.upload_dir/name).write_bytes(data)
 return name,len(data),hashlib.sha256(data).hexdigest()
