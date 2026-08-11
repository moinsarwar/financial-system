from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    USER = "user"
    VENDOR = "vendor"
    ADMIN = "admin"


class ApplicationStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"


class RepaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class ProductType(str, enum.Enum):
    FINANCED = "financed"
    CASH = "cash"
    BOTH = "both"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    cnic = Column(String, unique=True)
    phone = Column(String)
    address = Column(String)
    salary = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", back_populates="user")
    repayments = relationship("Repayment", back_populates="user")
    documents = relationship("Document", back_populates="user")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="vendor")
    applications = relationship("Application", back_populates="vendor")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    profit = Column(Float, default=0)
    category = Column(String, nullable=False)
    type = Column(Enum(ProductType), default=ProductType.FINANCED)
    saving_factor_electric = Column(Float, default=0)
    saving_factor_fuel = Column(Float, default=0)
    warranty = Column(String)
    installation = Column(String)
    monthly_saving = Column(Float, default=0)
    annual_saving = Column(Float, default=0)
    payback = Column(String)
    rating = Column(Float, default=4.0)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="products")
    applications = relationship("Application", back_populates="product")


class Lender(Base):
    __tablename__ = "lenders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    profit_rate = Column(Float, nullable=False)
    max_tenure = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CompareSettings(Base):
    """Singleton-style row (id=1) for compare / financing formula defaults."""

    __tablename__ = "compare_settings"

    id = Column(Integer, primary_key=True, default=1)
    down_payment_rate = Column(Float, default=0.2, nullable=False)
    default_horizon_years = Column(Integer, default=5, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    lender_id = Column(Integer, ForeignKey("lenders.id"))

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING_REVIEW)
    applied_date = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_date = Column(DateTime(timezone=True))
    approved_date = Column(DateTime(timezone=True))

    down_payment = Column(Float, nullable=False)
    monthly_installment = Column(Float, nullable=False)
    tenure = Column(Integer, nullable=False)
    total_deferred = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0)
    remaining_amount = Column(Float, default=0)
    next_due_date = Column(DateTime(timezone=True))

    application_details = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
    product = relationship("Product", back_populates="applications")
    vendor = relationship("Vendor", back_populates="applications")
    lender = relationship("Lender")
    repayments = relationship("Repayment", back_populates="application")
    documents = relationship("Document", back_populates="application")


class Repayment(Base):
    __tablename__ = "repayments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_date = Column(DateTime(timezone=True))
    amount = Column(Float, nullable=False)
    status = Column(Enum(RepaymentStatus), default=RepaymentStatus.PENDING)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="repayments")
    user = relationship("User", back_populates="repayments")


class CashSale(Base):
    __tablename__ = "cash_sales"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    buyer_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor")
    product = relationship("Product")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    doc_type = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    mime_type = Column(String)
    size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="documents")
    application = relationship("Application", back_populates="documents")
