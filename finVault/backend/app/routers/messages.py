from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Application, Communication, MessageReceipt, User
from ..schemas import MessageCreate, MessageOut
from ..security import current_user
from .. import services as svc

r = APIRouter(prefix='/api', tags=['messages'])

def message_out(message, application, sender, receipt):
    return MessageOut(
        id=message.id,
        application_number=application.application_number,
        sender_name=sender.name,
        sender_role=sender.role,
        message=message.message,
        created_at=message.created_at,
        is_read=receipt.read_at is not None,
    )

def receipt_query(user, application_number=None):
    q = (
        select(Communication, Application, User, MessageReceipt)
        .join(Application, Communication.application_id == Application.id)
        .join(User, Communication.sender_id == User.id)
        .join(MessageReceipt, (MessageReceipt.message_id == Communication.id) & (MessageReceipt.user_id == user.id))
    )
    if application_number:
        q = q.where(Application.application_number == application_number)
    return q

@r.get('/messages', response_model=list[MessageOut])
def messages(db: Session = Depends(get_db), u: User = Depends(current_user)):
    q = receipt_query(u).order_by(Communication.created_at.desc())
    return [message_out(m, a, s, rc) for m, a, s, rc in db.execute(q).all()]

@r.get('/messages/unread-count')
def unread(db: Session = Depends(get_db), u: User = Depends(current_user)):
    return {
        'count': db.scalar(
            select(func.count()).select_from(MessageReceipt).where(
                MessageReceipt.user_id == u.id,
                MessageReceipt.read_at.is_(None),
            )
        ) or 0
    }

@r.post('/messages/{message_id}/read')
def mark(message_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    rc = db.scalar(select(MessageReceipt).where(MessageReceipt.message_id == message_id, MessageReceipt.user_id == u.id))
    if not rc:
        raise HTTPException(404, 'Message not found')
    rc.read_at = datetime.now(timezone.utc)
    db.commit()
    return {'ok': True}

@r.get('/applications/{number}/messages', response_model=list[MessageOut])
def application_messages(number: str, db: Session = Depends(get_db), u: User = Depends(current_user)):
    svc.get_app(db, number, u)  # access check
    q = receipt_query(u, number).order_by(Communication.created_at.asc())
    return [message_out(m, a, s, rc) for m, a, s, rc in db.execute(q).all()]

@r.post('/applications/{number}/messages/read')
def mark_thread_read(number: str, db: Session = Depends(get_db), u: User = Depends(current_user)):
    svc.get_app(db, number, u)  # access check
    rows = db.execute(receipt_query(u, number)).all()
    now = datetime.now(timezone.utc)
    for _, _, _, receipt in rows:
        if receipt.read_at is None:
            receipt.read_at = now
    db.commit()
    return {'ok': True, 'marked': len(rows)}

@r.post('/applications/{number}/messages', response_model=MessageOut)
def send(number: str, data: MessageCreate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    a = svc.get_app(db, number, u)
    m = svc.add_message(db, a, u, data.message)
    svc.audit(db, u, 'message_sent', {}, a)
    db.commit()
    receipt = db.scalar(select(MessageReceipt).where(MessageReceipt.message_id == m.id, MessageReceipt.user_id == u.id))
    return message_out(m, a, u, receipt)
