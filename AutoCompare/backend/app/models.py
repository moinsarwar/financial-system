import enum

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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
    city = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inquiries = relationship("Inquiry", back_populates="user")
    applications = relationship("Application", back_populates="user")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    price = Column(String(80), nullable=False)
    engine = Column(String(100))
    power = Column(String(50))
    fuel = Column(String(50))
    transmission = Column(String(80))
    dimensions = Column(String(80))
    safety = Column(Text)
    features = Column(Text)
    warranty = Column(String(100))
    service = Column(String(200))
    ownership = Column(String(80))
    category = Column(String(50))
    mfg = Column(String(50), index=True)
    origin = Column(String(50), index=True)
    variant = Column(String(100))
    model_year = Column(String(20))
    source = Column(String(200))
    source_date = Column(String(50))
    powertrain = Column(String(20), index=True)
    condition = Column(String(20), index=True)
    logo = Column(String(20), default="🚗")
    price_source = Column(String(100))
    spec_source = Column(String(100))
    fuel_efficiency = Column(Float, nullable=True)
    annual_maint = Column(Float, default=40000)
    insurance_pct = Column(Float, default=0.025)
    battery_kwh = Column(String(20))
    range_km = Column(String(20))
    ac_charge_kw = Column(String(20))
    dc_charge_kw = Column(String(20))


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    message = Column(Text)
    inquiry_type = Column(String(50), default="info")
    vehicle_key = Column(String(50))
    vehicle_name = Column(String(200))
    source = Column(String(100), default="site")
    status = Column(String(50), default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="inquiries")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    application_type = Column(String(50), nullable=False, default="testdrive")
    status = Column(String(50), default="pending")
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    city = Column(String(100))
    preferred_date = Column(String(50))
    preferred_time = Column(String(50))
    notes = Column(Text)
    vehicle_key = Column(String(50))
    vehicle_name = Column(String(200))
    source = Column(String(100), default="site")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
