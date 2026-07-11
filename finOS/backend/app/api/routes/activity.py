from fastapi import APIRouter, Depends, Query  
from sqlalchemy.orm import Session  
from app.api.dependencies import get_current_user, require_permission  
from app.core.database import get_db  
from app.models.user import User  
from app.schemas import ActivityResponse  
from app.services.audit_service import get_activity  
  
router = APIRouter()  
  
@router.get("/", response_model=list[ActivityResponse])  
def list_activity(  
    db: Session = Depends(get_db),  
    current_user: User = Depends(require_permission("activity.read_all")),  
    search: str = Query(None),  
    event_type: str = Query(None),  
    limit: int = Query(100, le=500),  
):  
    return get_activity(db, current_user, search, event_type, limit)
