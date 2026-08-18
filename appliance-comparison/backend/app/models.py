from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(200), nullable=False)
    phone = Column(String(50))
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inquiries = relationship("Inquiry", back_populates="user")
    applications = relationship("Application", back_populates="user")


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True)
    name = Column(String(200))
    brand = Column(String(100))
    price = Column(String(50))
    capacity = Column(String(50))
    capacity_num = Column(Float, nullable=True)
    capacity_unit = Column(String(20))
    energy = Column(String(50))
    warranty = Column(String(50))
    noise = Column(String(50))
    category = Column(String(50))
    mfg = Column(String(50))
    origin = Column(String(50))
    variant = Column(String(100))
    model_year = Column(Integer)
    is_new = Column(Boolean, default=False)
    source = Column(String(200))
    logo = Column(String(10))
    annual_energy = Column(Float, default=0)
    annual_maint = Column(Float, default=0)
    fuel_type = Column(String(50), default="electric")
    gas_cylinders_per_month = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    message = Column(Text)
    inquiry_type = Column(String(50), default="info")
    appliance_key = Column(String(50))
    appliance_name = Column(String(200))
    source = Column(String(100), default="site")
    status = Column(String(50), default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="inquiries")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    application_type = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    address = Column(Text)
    preferred_date = Column(String(50))
    notes = Column(Text)
    appliance_key = Column(String(50))
    appliance_name = Column(String(200))
    source = Column(String(100), default="site")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
