from sqlalchemy import Column, String, Enum, Boolean, ForeignKey  
from app.core.database import Base  
import enum  
  
class UserRole(str, enum.Enum):  
    CLIENT = "client"  
    OPERATIONS_AGENT = "operations_agent"  
    OPERATIONS_MANAGER = "operations_manager"  
    CLAIMS_AGENT = "claims_agent"  
    UNDERWRITER = "underwriter"  
    COMPLIANCE = "compliance"  
    ADMINISTRATOR = "administrator"  
  
class User(Base):  
    __tablename__ = "users"  
    id = Column(String, primary_key=True)  
    email = Column(String, unique=True, nullable=False)  
    hashed_password = Column(String, nullable=False)  
    full_name = Column(String, nullable=False)  
    role = Column(  
        Enum(  
            UserRole,  
            name="userrole",  
            values_callable=lambda enum_class: [member.value for member in enum_class],  
        ),  
        nullable=False,  
    )  
    client_id = Column(String, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)  
    is_active = Column(Boolean, default=True)
