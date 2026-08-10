import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..config import get_settings
from ..database import get_db

router = APIRouter(prefix="/api/documents", tags=["documents"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_BYTES = 10 * 1024 * 1024


def _safe_ext(filename: str) -> str:
    _, ext = os.path.splitext(filename or "")
    return ext.lower()


@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    application_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] not in ("user", "admin"):
        raise HTTPException(status_code=403, detail="Only users/admins can upload documents")

    ext = _safe_ext(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF/JPG/PNG allowed")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    user_id = current_user["id"] if current_user["role"] == "user" else None
    if application_id is not None:
        app_row = (
            db.query(models.Application)
            .filter(models.Application.id == application_id)
            .first()
        )
        if not app_row:
            raise HTTPException(status_code=404, detail="Application not found")
        if current_user["role"] == "user" and app_row.user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        user_id = app_row.user_id

    os.makedirs(settings.UPLOAD_ROOT, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    storage_path = os.path.join(settings.UPLOAD_ROOT, stored_name)
    with open(storage_path, "wb") as fh:
        fh.write(data)

    doc = models.Document(
        user_id=user_id,
        application_id=application_id,
        doc_type=doc_type,
        filename=stored_name,
        storage_path=storage_path,
        original_name=file.filename or stored_name,
        mime_type=file.content_type,
        size_bytes=len(data),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=List[schemas.DocumentResponse])
def list_documents(
    application_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    q = db.query(models.Document)
    role = current_user["role"]
    if role == "user":
        q = q.filter(models.Document.user_id == current_user["id"])
    elif role == "vendor":
        vendor_app_ids = [
            a.id
            for a in db.query(models.Application.id)
            .filter(models.Application.vendor_id == current_user["id"])
            .all()
        ]
        q = q.filter(models.Document.application_id.in_(vendor_app_ids or [-1]))
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    if application_id is not None:
        q = q.filter(models.Document.application_id == application_id)
    return q.order_by(models.Document.id.desc()).all()


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    role = current_user["role"]
    if role == "user" and doc.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role == "vendor":
        if not doc.application_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        app_row = (
            db.query(models.Application)
            .filter(models.Application.id == doc.application_id)
            .first()
        )
        if not app_row or app_row.vendor_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")

    if not os.path.isfile(doc.storage_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(
        doc.storage_path,
        filename=doc.original_name,
        media_type=doc.mime_type or "application/octet-stream",
    )
