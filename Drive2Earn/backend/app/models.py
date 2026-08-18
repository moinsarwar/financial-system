import enum

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy import JSON
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

    estimates = relationship("AffordabilityEstimate", back_populates="user")
    applications = relationship("Application", back_populates="user")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    label = Column(String(100), nullable=False)
    icon = Column(String(20), default="")
    price = Column(Integer, nullable=False)
    price_min = Column(Integer, nullable=False)
    price_max = Column(Integer, nullable=False)
    price_step = Column(Integer, nullable=False)
    default_daily_earning = Column(Integer, nullable=False)
    default_fuel_pct = Column(Float, nullable=False)
    default_rental = Column(Integer, nullable=False)
    maintenance_reserve = Column(Integer, nullable=False)
    description = Column(Text, default="")
    features = Column(JSON, default=list)
    monthly_payment_estimate = Column(String(50), default="")
    sort_order = Column(Integer, default=0)


class ModelAssumption(Base):
    __tablename__ = "model_assumptions"

    id = Column(Integer, primary_key=True)
    financing_rate = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    insurance_rate = Column(Float, nullable=False)
    max_affordability_ratio = Column(Float, nullable=False)
    downtime_reserve = Column(Float, nullable=False)
    fleet_vehicle_type = Column(String(50), default="car")


class AffordabilityEstimate(Base):
    __tablename__ = "affordability_estimates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_key = Column(String(50), nullable=False)
    income = Column(Integer, nullable=False)
    employment = Column(String(50), nullable=False)
    deposit = Column(Integer, default=0)
    vehicle_price = Column(Integer, nullable=False)
    monthly_vehicle_cost = Column(Integer, nullable=False)
    repayment_ratio = Column(Float, nullable=False)
    status = Column(String(50), nullable=False)
    follow_up = Column(String(50), default="new")
    suggested_vehicle = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="estimates")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pathway = Column(String(20), nullable=False, default="drive")
    vehicle_key = Column(String(50), nullable=False)
    vehicle_label = Column(String(100), nullable=False)
    vehicle_price = Column(Integer, nullable=False)
    deposit = Column(Integer, default=0)
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    city = Column(String(100))
    income = Column(Integer, default=0)
    employment = Column(String(50), default="salaried")
    notes = Column(Text)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")


class CalculatorSnapshot(Base):
    __tablename__ = "calculator_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    mode = Column(String(20), nullable=False)
    payload = Column(JSON, nullable=False)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
