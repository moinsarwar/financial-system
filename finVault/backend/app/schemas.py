from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from .models import *

class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    public_id: str
    name: str
    cnic: str | None
    username: str
    role: UserRole

class Login(BaseModel):
    username: str
    password: str

class AccountData(BaseModel):
    account_type: Literal['savings','current','basic','salary','freelancer','business']
    account_holder: Literal['individual','joint','business']
    account_mode: Literal['conventional','islamic']
    expected_turnover: Decimal = Field(default=Decimal('0'), ge=0)
    preferred_branch: str = Field(default='', max_length=180)
    cheque_book: bool = True
    debit_card: bool = True
    digital_banking: bool = True
    purpose: str = Field(default='', max_length=500)

class ApplicationCreate(BaseModel):
    product_type: ProductType
    applicant_cnic: str | None = Field(default=None, pattern=r'^\d{5}-\d{7}-\d$')
    amount: Decimal | None = None
    details: str | None = Field(default=None, max_length=4000)
    account_data: AccountData | None = None

    @model_validator(mode='after')
    def validate_product_payload(self):
        if self.product_type == ProductType.BANK_ACCOUNT:
            if self.account_data is None:
                raise ValueError('account_data required for bank account')
            if self.amount is not None and self.amount < 0:
                raise ValueError('initial deposit cannot be negative')
        else:
            if self.amount is None or self.amount <= 0:
                raise ValueError('amount must be greater than zero')
            if self.account_data is not None:
                raise ValueError('account_data is only valid for bank accounts')
        return self

class StatusUpdate(BaseModel):
    status: ApplicationStatus
    expected_version: int = Field(ge=1)
    reason: str | None = Field(default=None, max_length=500)

class InfoRequestItem(BaseModel):
    kind: RequestKind
    label: str = Field(min_length=2, max_length=255)
    document_requirement_code: str | None = Field(default=None, max_length=80)

    @model_validator(mode='after')
    def validate_kind(self):
        if self.kind == RequestKind.DOCUMENT and not self.document_requirement_code:
            raise ValueError('document_requirement_code required for document request')
        if self.kind == RequestKind.TEXT and self.document_requirement_code:
            raise ValueError('document_requirement_code is not valid for text request')
        return self

class InfoRequestCreate(BaseModel):
    items: list[InfoRequestItem] = Field(min_length=1, max_length=10)

class InfoResponse(BaseModel):
    response_text: str = Field(min_length=1, max_length=4000)

class MessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=4000)

class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    requirement_code: str
    display_name: str
    status: DocumentStatus
    original_name: str | None
    uploaded_at: datetime | None

class StatusEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    from_status: ApplicationStatus | None
    to_status: ApplicationStatus
    reason: str | None
    created_at: datetime

class InfoRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    public_id: str
    kind: RequestKind
    label: str
    document_requirement_code: str | None
    response_text: str | None
    status: RequestStatus
    created_at: datetime
    submitted_at: datetime | None
    resolved_at: datetime | None

class ApplicationSummary(BaseModel):
    application_number: str
    applicant_name: str
    applicant_public_id: str
    product_type: ProductType
    product_label: str
    status: ApplicationStatus
    amount: Decimal | None
    version: int
    created_at: datetime
    document_count: int
    uploaded_count: int

class ApplicationDetail(ApplicationSummary):
    details: str | None
    account_data: dict | None
    status_changed_at: datetime
    status_events: list[StatusEventOut]
    documents: list[DocumentOut]
    info_requests: list[InfoRequestOut]

class MessageOut(BaseModel):
    id: int
    application_number: str
    sender_name: str
    sender_role: UserRole
    message: str
    created_at: datetime
    is_read: bool

class Dashboard(BaseModel):
    total: int
    in_progress: int
    successful: int
    rejected: int
    unread_messages: int
