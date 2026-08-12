import os, hashlib  
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form  
from fastapi.responses import FileResponse  
from sqlalchemy.orm import Session  
from app.api.dependencies import get_current_user, require_permission  
from app.core.database import get_db  
from app.models.user import User  
from app.schemas import DocumentResponse  
from app.services.document_service import get_documents, get_document, create_document  
from app.services.mapper_service import map_document_response  
from app.core.config import settings  
  
router = APIRouter()  
MAX_FILE_SIZE = 10 * 1024 * 1024  
ALLOWED_MIME_TYPES = {  
    "application/pdf", "image/jpeg", "image/png",  
    "application/msword",  
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"  
}  
  
@router.get("/", response_model=list[DocumentResponse])  
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user),  
                   search: str = Query(None), doc_type: str = Query(None), department: str = Query(None), ref_id: str = Query(None)):  
    docs = get_documents(db, current_user, search, doc_type, department, ref_id)  
    return [map_document_response(db, doc) for doc in docs]  
  
@router.get("/{document_id}", response_model=DocumentResponse)  
def get_document_detail(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):  
    doc = get_document(db, document_id, current_user)  
    if not doc: raise HTTPException(404, "Document not found")  
    return map_document_response(db, doc)  
  
@router.get("/{document_id}/download")  
def download_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):  
    doc = get_document(db, document_id, current_user)  
    if not doc: raise HTTPException(404, "Document not found")  
    storage_key = doc.storage_key or doc.original_filename
    if not storage_key: raise HTTPException(404, "File not stored")  
    file_path = os.path.join(settings.UPLOAD_ROOT, storage_key)  
    if not os.path.exists(file_path): raise HTTPException(404, "File not found")  
    return FileResponse(file_path, filename=doc.original_filename or doc.name)  
  
@router.post("/upload", response_model=DocumentResponse)  
async def upload_document(  
    client_id: str = Form(...),  
    name: str = Form(...),  
    doc_type: str = Form(...),  
    ref_id: str = Form(None),  
    ref_type: str = Form(None),  
    file: UploadFile = File(...),  
    db: Session = Depends(get_db),  
    current_user: User = Depends(require_permission("document.upload")),  
    req: Request = None,  
):  
    if file.content_type not in ALLOWED_MIME_TYPES:  
        raise HTTPException(415, "Unsupported document type")  
    content = await file.read(MAX_FILE_SIZE + 1)  
    if len(content) > MAX_FILE_SIZE:  
        raise HTTPException(413, "File exceeds the 10 MB limit")  
    try:  
        doc = create_document(  
            db, client_id, name, file.filename, doc_type, content, file.content_type,  
            ref_id, ref_type, current_user,  
            req.client.host if req else None,  
            req.headers.get("X-Request-ID") if req else None  
        )  
        return map_document_response(db, doc)  
    except (PermissionError, ValueError) as e:  
        raise HTTPException(400, str(e))
