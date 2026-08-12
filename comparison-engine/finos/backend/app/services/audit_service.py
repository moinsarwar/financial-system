from sqlalchemy.orm import Session  
from app.models.audit_log import AuditLog  
from app.models.user import User, UserRole  
from app.core.database import SessionLocal  
from datetime import datetime, timezone  
import uuid  
from typing import Optional  
  
def log_audit(db: Session, actor_user_id: str, client_id: Optional[str],  
              subject_type: Optional[str], subject_id: Optional[str],  
              event: str, details: str, department: str = "",  
              ip_address: str = None, request_id: str = None) -> AuditLog:  
    log_entry = AuditLog(  
        id=f"audit-{uuid.uuid4().hex[:8]}",  
        time=datetime.now(timezone.utc),  
        actor_user_id=actor_user_id,  
        client_id=client_id,  
        subject_type=subject_type,  
        subject_id=subject_id,  
        event=event,  
        details=details,  
        department=department,  
        ip_address=ip_address,  
        request_id=request_id,  
    )  
    db.add(log_entry)  
    return log_entry  
  
def record_failed_login(email: str, ip_address: str | None = None):  
    audit_db = SessionLocal()  
    try:  
        log_audit(audit_db, None, None, "auth", None, "login.failed",  
                  f"Failed login attempt for {email}", "", ip_address)  
        audit_db.commit()  
    except Exception:  
        audit_db.rollback()  
    finally:  
        audit_db.close()

def get_activity(db: Session, current_user: User, search: str = None, event_type: str = None, limit: int = 100):
    query = db.query(AuditLog)
    if search:
        from sqlalchemy import or_
        query = query.filter(or_(AuditLog.event.ilike(f"%{search}%"), AuditLog.details.ilike(f"%{search}%")))
    if event_type:
        query = query.filter(AuditLog.event == event_type)
    return query.order_by(AuditLog.time.desc()).limit(limit).all()
