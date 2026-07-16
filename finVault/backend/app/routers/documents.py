from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import DocumentStatus, User
from ..schemas import ApplicationDetail
from ..security import current_user
from ..file_utils import save_upload
from .. import services as svc

r = APIRouter(prefix='/api/applications', tags=['documents'])

@r.post('/{number}/documents/{requirement_code}', response_model=ApplicationDetail)
async def upload(number: str, requirement_code: str, file: UploadFile = File(...), db: Session = Depends(get_db), u: User = Depends(current_user)):
    a = svc.get_app(db, number, u)
    d = next((x for x in a.documents if x.requirement_code == requirement_code), None)
    if not d:
        raise HTTPException(404, 'Document requirement not found')

    old_path = settings.upload_dir / d.stored_name if d.stored_name else None
    name, size, digest = await save_upload(file)
    d.original_name = file.filename or d.display_name
    d.stored_name = name
    d.mime_type = file.content_type
    d.file_size = size
    d.sha256 = digest
    d.uploaded_by_id = u.id
    d.uploaded_at = datetime.now(timezone.utc)
    d.status = DocumentStatus.UPLOADED
    svc.audit(db, u, 'document_uploaded', {'requirement_code': requirement_code, 'sha256': digest}, a)
    svc.add_message(db, a, u, f'Document uploaded: {d.display_name}.')
    db.commit()

    if old_path and old_path.exists() and old_path.name != name:
        old_path.unlink(missing_ok=True)
    return svc.detail(svc.get_app(db, number, u))

@r.get('/{number}/documents/{requirement_code}/download')
def download(number: str, requirement_code: str, db: Session = Depends(get_db), u: User = Depends(current_user)):
    a = svc.get_app(db, number, u)
    d = next((x for x in a.documents if x.requirement_code == requirement_code), None)
    if not d or not d.stored_name:
        raise HTTPException(404, 'Uploaded document not found')
    path = settings.upload_dir / d.stored_name
    if not path.is_file():
        raise HTTPException(410, 'Document file is no longer available')
    return FileResponse(path, media_type=d.mime_type, filename=d.original_name)
