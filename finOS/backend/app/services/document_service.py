import os, uuid, hashlib  
from pathlib import Path  
from sqlalchemy.orm import Session  
from app.models.document import Document  
from app.models.client import Client  
from app.models.user import User, UserRole  
from app.services.audit_service import log_audit  
from app.core.config import settings  
  
def get_documents(db: Session, current_user: User, search: str = None, doc_type: str = None, department: str = None):  
    query = db.query(Document).join(Client, Client.id == Document.client_id)  
    if current_user.role == UserRole.CLIENT:  
        query = query.filter(Document.client_id == current_user.client_id)  
    if search:  
        query = query.filter(Document.name.ilike(f"%{search}%") | Client.name.ilike(f"%{search}%") | Document.original_filename.ilike(f"%{search}%"))  
    if doc_type:  
        query = query.filter(Document.type == doc_type)  
    if department:  
        query = query.filter(Client.assigned_department == department)  
    return query.order_by(Document.uploaded_at.desc()).all()  
  
def get_document(db: Session, document_id: str, current_user: User):  
    query = db.query(Document).filter(Document.id == document_id)  
    if current_user.role == UserRole.CLIENT:  
        query = query.filter(Document.client_id == current_user.client_id)  
    return query.first()  
  
def create_document(db: Session, client_id: str, name: str, original_filename: str,  
                    doc_type: str, file_content: bytes, mime_type: str,  
                    ref_id: str = None, ref_type: str = None,  
                    current_user: User = None, ip_address: str = None, request_id: str = None):  
    client = db.query(Client).filter(Client.id == client_id).first()  
    if not client: raise ValueError("Client not found")  
    if current_user and current_user.role == UserRole.CLIENT and client.id != current_user.client_id:  
        raise PermissionError("Cannot upload for another client")  
    storage_id = uuid.uuid4().hex  
    storage_key = f"{storage_id[:2]}/{storage_id[2:4]}/{storage_id}"  
    full_path = Path(settings.UPLOAD_ROOT) / storage_key  
    os.makedirs(full_path.parent, exist_ok=True)  
    checksum = hashlib.sha256(file_content).hexdigest()  
    temp_path = full_path.with_suffix(".tmp")  
    try:  
        with open(temp_path, "wb") as f:  
            f.write(file_content)  
        doc = Document(  
            id=f"DOC-{uuid.uuid4().hex[:8].upper()}",  
            client_id=client.id,  
            type=doc_type,  
            name=name,  
            original_filename=original_filename,  
            ref_id=ref_id,  
            ref_type=ref_type,  
            status="pending",  
            size_bytes=len(file_content),  
            mime_type=mime_type,  
            checksum=checksum,  
            storage_key=storage_key,  
            uploaded_by_user=current_user.id if current_user else None,  
        )  
        db.add(doc)  
        db.flush()  
        os.replace(temp_path, full_path)  
        log_audit(db, current_user.id, client.id, "document", doc.id, "document.uploaded",  
                  f"Uploaded {doc.name}", client.assigned_department or "", ip_address, request_id)  
        db.refresh(doc)  
        return doc  
    except Exception:  
        temp_path.unlink(missing_ok=True)  
        full_path.unlink(missing_ok=True)  
        raise
