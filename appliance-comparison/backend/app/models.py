from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from .database import Base


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
