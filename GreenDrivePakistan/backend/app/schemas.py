from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    VENDOR = "vendor"
    ADMIN = "admin"


class ApplicationStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"


class ProductType(str, Enum):
    FINANCED = "financed"
    CASH = "cash"
    BOTH = "both"


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    salary: float = 0


class UserCreate(UserBase):
    password: str
    cnic: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    cnic: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VendorBase(BaseModel):
    name: str
    email: EmailStr
    description: Optional[str] = None


class VendorCreate(VendorBase):
    password: str


class VendorResponse(VendorBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    type: ProductType = ProductType.FINANCED
    saving_factor_electric: float = 0
    saving_factor_fuel: float = 0
    warranty: Optional[str] = None
    installation: Optional[str] = None
    monthly_saving: float = 0
    annual_saving: float = 0
    payback: Optional[str] = None
    rating: float = 4.0
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    vendor_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    type: Optional[ProductType] = None
    saving_factor_electric: Optional[float] = None
    saving_factor_fuel: Optional[float] = None
    warranty: Optional[str] = None
    installation: Optional[str] = None
    monthly_saving: Optional[float] = None
    annual_saving: Optional[float] = None
    payback: Optional[str] = None
    rating: Optional[float] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    vendor_id: int
    profit: float
    is_active: bool
    created_at: Optional[datetime] = None
    vendor: Optional[VendorResponse] = None

    class Config:
        from_attributes = True


class ApplicationDetails(BaseModel):
    monthly_income: float
    employment: str
    existing_bills: str
    notes: Optional[str] = None


class ApplicationCreate(BaseModel):
    product_id: int
    application_details: ApplicationDetails


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class RepaymentResponse(BaseModel):
    id: int
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    amount: float
    status: str

    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    vendor_id: int
    status: ApplicationStatus
    applied_date: Optional[datetime] = None
    reviewed_date: Optional[datetime] = None
    approved_date: Optional[datetime] = None
    down_payment: float
    monthly_installment: float
    tenure: int
    total_deferred: float
    paid_amount: float
    remaining_amount: float
    next_due_date: Optional[datetime] = None
    application_details: Dict[str, Any] = Field(default_factory=dict)
    product: Optional[ProductResponse] = None
    vendor: Optional[VendorResponse] = None
    user: Optional[UserResponse] = None
    repayments: List[RepaymentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CashSaleCreate(BaseModel):
    product_id: int
    buyer_name: str
    amount: float


class CashSaleResponse(BaseModel):
    id: int
    vendor_id: int
    product_id: int
    buyer_name: str
    amount: float
    sale_date: Optional[datetime] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class LenderBase(BaseModel):
    name: str
    profit_rate: float
    max_tenure: int


class LenderCreate(LenderBase):
    pass


class LenderUpdate(BaseModel):
    name: Optional[str] = None
    profit_rate: Optional[float] = None
    max_tenure: Optional[int] = None
    is_active: Optional[bool] = None


class LenderResponse(LenderBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class CompareInput(BaseModel):
    electricity_bill: float
    fuel_bill: float
    compare_type: str = "both"


class CompareResult(BaseModel):
    product_id: int
    product_name: str
    price: float
    monthly_installment: float
    current_total_bill: float
    new_total_bill: float
    monthly_saving: float
    yearly_saving: float
    five_year_net_saving: float
    down_payment: float
    saving_factor_electric: float
    saving_factor_fuel: float


class CompareResponse(BaseModel):
    results: List[CompareResult]
    best_product: Optional[CompareResult] = None
    total_current_bill: float


class AdminStats(BaseModel):
    total_users: int
    total_vendors: int
    total_applications: int
    financed_volume: float
    cash_volume: float
    total_revenue: float
    pending_applications: int
    active_loans: int
    completed_loans: int


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    application_id: Optional[int] = None
    doc_type: str
    filename: str
    storage_path: str
    original_name: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
