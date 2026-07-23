from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum  
from sqlalchemy.orm import relationship  
from datetime import datetime  
import enum  
  
from .database import Base  
  
class ResellerStatus(str, enum.Enum):  
    ACTIVE = "active"  
    PENDING = "pending"  
    SUSPENDED = "suspended"  
  
class Reseller(Base):  
    __tablename__ = "resellers"  
  
    id = Column(Integer, primary_key=True, index=True)  
    name = Column(String, nullable=False)  
    business_name = Column(String, nullable=True)  
    subdomain = Column(String, unique=True, nullable=False, index=True)  
    email = Column(String, unique=True, nullable=False, index=True)  
    phone = Column(String, nullable=True)  
    status = Column(Enum(ResellerStatus), default=ResellerStatus.PENDING)  
    conversions = Column(Integer, default=0)  
    commission = Column(Float, default=0.0)  
    market_focus = Column(String, nullable=True)  
    created_at = Column(DateTime, default=datetime.utcnow)  
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  
  
    customers = relationship("Customer", back_populates="reseller", cascade="all, delete-orphan")  
    activities = relationship("Activity", back_populates="reseller", cascade="all, delete-orphan")  
    testimonials = relationship("Testimonial", back_populates="reseller", cascade="all, delete-orphan")  
  
class Customer(Base):  
    __tablename__ = "customers"  
  
    id = Column(Integer, primary_key=True, index=True)  
    reseller_id = Column(Integer, ForeignKey("resellers.id"))  
    name = Column(String, nullable=False)  
    email = Column(String, nullable=False)  
    product = Column(String, nullable=False)  
    status = Column(String, nullable=False)  # Approved, Pending, In Progress, etc.  
    date = Column(DateTime, default=datetime.utcnow)  
  
    reseller = relationship("Reseller", back_populates="customers")  
  
class Activity(Base):  
    __tablename__ = "activities"  
  
    id = Column(Integer, primary_key=True, index=True)  
    reseller_id = Column(Integer, ForeignKey("resellers.id"))  
    date = Column(DateTime, default=datetime.utcnow)  
    product = Column(String, nullable=False)  
    conversion_status = Column(String, nullable=False)  # Approved, Pending, Declined  
    commission = Column(Float, default=0.0)  
  
    reseller = relationship("Reseller", back_populates="activities")  
  
class Testimonial(Base):  
    __tablename__ = "testimonials"  
  
    id = Column(Integer, primary_key=True, index=True)  
    reseller_id = Column(Integer, ForeignKey("resellers.id"))  
    name = Column(String, nullable=False)  
    comment = Column(String, nullable=False)  
    rating = Column(Integer, nullable=False)  
    date = Column(DateTime, default=datetime.utcnow)  
  
    reseller = relationship("Reseller", back_populates="testimonials")
