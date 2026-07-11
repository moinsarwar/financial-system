from sqlalchemy.orm import Session

from app.models.claim import Claim
from app.models.client import Client
from app.models.document import Document


def map_claim_response(
    db: Session,
    claim: Claim,
) -> dict:
    client = (
        db.query(Client)
        .filter(Client.id == claim.client_id)
        .first()
    )

    return {
        "id": claim.id,
        "client_id": claim.client_id,
        "client_name": client.name if client else "",
        "product_type": claim.product_type,
        "product_label": claim.product_label,
        "policy_id": claim.policy_id,
        "type": claim.type,
        "amount": claim.amount,
        "currency": claim.currency,
        "current_step": claim.current_step,
        "step_index": claim.step_index,
        "steps": claim.steps or [],
        "outcome": claim.outcome,
        "incident_date": claim.incident_date,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
        "description": claim.description,
        "severity": claim.severity,
        "reserve_amount": claim.reserve_amount,
        "approved_amount": claim.approved_amount,
        "fraud_indicator": bool(claim.fraud_indicator),
        "payment_ref": claim.payment_ref,
        "insurer_ref": claim.insurer_ref,
        "timeline": claim.timeline or [],
        "resolution_reason_code": claim.resolution_reason_code,
        "resolution_notes": claim.resolution_notes,
        "resolved_at": claim.resolved_at,
        "resolved_by_user_id": claim.resolved_by_user_id,
    }


def map_document_response(
    db: Session,
    document: Document,
) -> dict:
    client = (
        db.query(Client)
        .filter(Client.id == document.client_id)
        .first()
    )

    return {
        "id": document.id,
        "client_id": document.client_id,
        "client_name": client.name if client else "",
        "type": document.type,
        "name": document.name,
        "original_filename": document.original_filename,
        "ref_id": document.ref_id,
        "ref_type": document.ref_type,
        "uploaded_at": document.uploaded_at,
        "status": document.status,
        "mime_type": document.mime_type or "",
        "size_bytes": document.size_bytes or 0,
        "checksum": document.checksum or "",
        "storage_key": document.storage_key or "",
        "uploaded_by_user": document.uploaded_by_user,
    }
