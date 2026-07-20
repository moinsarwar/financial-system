from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from decimal import Decimal
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import Application, User, UserRole, ProductType, ApplicationStatus, StatusEvent, Document
from ..security import hash_password
from ..workflows import document_requirements
from ..services import add_message, system_user, audit

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

class IntegrationApplicant(BaseModel):
    external_user_id: str
    name: str
    cnic: Optional[str] = None

class IntegrationApplicationPayload(BaseModel):
    source_system: str
    source_application_id: str
    applicant: IntegrationApplicant
    product_type: str
    amount: Optional[Decimal] = None
    details: Optional[str] = None

@router.post("/applications")
def receive_application(payload: IntegrationApplicationPayload, db: Session = Depends(get_db)):
    existing_app = db.scalar(
        select(Application).where(
            Application.source_system == payload.source_system,
            Application.source_application_id == payload.source_application_id
        )
    )
    if existing_app:
        return {"status": "success", "message": "Application already exists", "application_number": existing_app.application_number}

    user = db.scalar(select(User).where(User.public_id == payload.applicant.external_user_id))
    if not user:
        user = User(
            public_id=payload.applicant.external_user_id,
            name=payload.applicant.name,
            cnic=payload.applicant.cnic,
            username=f"int_{payload.applicant.external_user_id.lower()}",
            password_hash=hash_password("Integration123!"),
            role=UserRole.APPLICANT
        )
        db.add(user)
        db.flush()

    import uuid
    app_num = f"APP-{str(uuid.uuid4())[:8].upper()}"
    
    product_map = {
        "health": ProductType.HEALTH_INSURANCE,
        "life": ProductType.LIFE_INSURANCE,
        "motor": ProductType.CAR_LOAN,
        "loan": ProductType.PERSONAL_LOAN,
    }
    try:
        p_type = product_map.get(payload.product_type) or ProductType(payload.product_type)
    except ValueError:
        p_type = ProductType.PERSONAL_LOAN

    new_app = Application(
        application_number=app_num,
        applicant_id=user.id,
        product_type=p_type,
        status=ApplicationStatus.SUBMITTED,
        amount=payload.amount,
        details=payload.details,
        source_system=payload.source_system,
        source_application_id=payload.source_application_id
    )
    db.add(new_app)
    db.flush()

    # Create documents
    for code, name in document_requirements(p_type, 'individual'):
        db.add(Document(application_id=new_app.id, requirement_code=code, display_name=name))

    # Add initial status events
    db.add(StatusEvent(application_id=new_app.id, from_status=None, to_status=ApplicationStatus.DRAFT, changed_by_id=user.id, reason='Application imported'))
    db.add(StatusEvent(application_id=new_app.id, from_status=ApplicationStatus.DRAFT, to_status=ApplicationStatus.SUBMITTED, changed_by_id=user.id, reason='Application submitted'))
    
    # Audit log
    audit(db, user, 'application_created', {'number': new_app.application_number}, new_app)
    audit(db, user, 'status_changed', {'from': 'draft', 'to': 'submitted', 'reason': 'Application submitted'}, new_app)
    
    # Add initial message
    sys_user = system_user(db) or user
    add_message(db, new_app, sys_user, 'Application created successfully.')
    add_message(db, new_app, sys_user, 'Application moved to submitted.')

    db.commit()
    db.refresh(new_app)

    return {"status": "success", "message": "Application imported successfully", "application_number": new_app.application_number}
