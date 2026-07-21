import random, uuid  
from decimal import Decimal  
from datetime import datetime, timedelta, timezone  
from sqlalchemy.orm import Session  
from app.core.security import get_password_hash  
from app.models.user import User, UserRole  
from app.models.client import Client, LifecycleStage  
from app.models.application import Application  
from app.models.policy import Policy  
from app.models.holding import Holding  
from app.models.claim import Claim  
from app.services.workflow_service import (  
    WORKFLOWS, CLAIM_STEPS, get_workflow,  
    update_client_lifecycle_state  
)  
  
_rng = random.Random(42)  
  
def random_choice(lst):  
    return _rng.choice(lst)  
def random_int(a,b):  
    return _rng.randint(a,b)  
  
def seed_demo_data(db: Session, commit: bool = False):  
    admin = db.query(User).filter(User.id == "ops1").first()  
    if admin:  
        return  
  
    roles = [  
        ("admin1", "admin@finos.com", "Company Admin", UserRole.SUPER_ADMIN),
        ("ops1", "ops@finos.com", "Operations Director", UserRole.ADMINISTRATOR),  
        ("ops-agent-1", "ops_agent@finos.com", "Operations Agent", UserRole.OPERATIONS_AGENT),  
        ("ops-manager-1", "ops_manager@finos.com", "Operations Manager", UserRole.OPERATIONS_MANAGER),  
        ("claims-agent-1", "claims_agent@finos.com", "Claims Agent", UserRole.CLAIMS_AGENT),  
        ("underwriter-1", "underwriter@finos.com", "Underwriter", UserRole.UNDERWRITER),  
        ("compliance-1", "compliance@finos.com", "Compliance Officer", UserRole.COMPLIANCE),  
    ]  
    for uid, email, name, role in roles:  
        u = User(  
            id=uid,  
            email=email,  
            hashed_password=get_password_hash("password123"),  
            full_name=name,  
            role=role,  
            is_active=True,  
        )  
        db.add(u)  
  
    demo_client = Client(  
        id="c1",  
        name="Demo Client",  
        email="client@finos.com",  
        phone="+92 300 1234567",  
        lifecycle_stage=LifecycleStage.LEAD,  
        assigned_department="motor",  
        engagement_score=92,  
    )  
    db.add(demo_client)  
    demo_user = User(  
        id="c1",  
        email="client@finos.com",  
        hashed_password=get_password_hash("password123"),  
        full_name="Demo Client",  
        role=UserRole.CLIENT,  
        client_id="c1",  
        is_active=True,  
    )  
    db.add(demo_user)  
    db.flush()  
  
    # Leads  
    for i in range(10):  
        c = Client(  
            id=f"lead-{uuid.uuid4().hex[:6]}",  
            name=f"Lead {i}",  
            email=f"lead{i}@example.com",  
            lifecycle_stage=LifecycleStage.LEAD,  
            assigned_department=random_choice(["motor", "lending", "health"]),  
        )  
        db.add(c)  
  
    # Applicants  
    for i in range(10):  
        c = Client(  
            id=f"app-{uuid.uuid4().hex[:6]}",  
            name=f"Applicant {i}",  
            email=f"app{i}@example.com",  
            lifecycle_stage=LifecycleStage.APPLICANT,  
            assigned_department=random_choice(["motor", "lending", "health"]),  
        )  
        db.add(c)  
        db.flush()  
        product_type = random_choice(["motor", "loan"])  
        steps = get_workflow(product_type, "application")  
        app = Application(  
            id=f"APP-{1000+i}",  
            client_id=c.id,  
            product_type=product_type,  
            product_label=product_type.capitalize() + " Product",  
            department=c.assigned_department,  
            steps=steps,  
            step_index=1,  
            current_step=steps[1] if len(steps)>1 else steps[0],  
            amount=Decimal(random_int(10000, 50000)),  
            status="in-progress",  
        )  
        db.add(app)  
        db.flush()  
        update_client_lifecycle_state(db, c.id)  
  
    # Customers  
    for i in range(10):  
        c = Client(  
            id=f"cust-{uuid.uuid4().hex[:6]}",  
            name=f"Customer {i}",  
            email=f"cust{i}@example.com",  
            lifecycle_stage=LifecycleStage.CUSTOMER,  
            assigned_department=random_choice(["motor", "lending", "health"]),  
        )  
        db.add(c)  
        db.flush()  
        product_type = random_choice(["motor", "loan"])  
        steps = get_workflow(product_type, "application")  
        app = Application(  
            id=f"APP-{2000+i}",  
            client_id=c.id,  
            product_type=product_type,  
            product_label=product_type.capitalize() + " Product",  
            department=c.assigned_department,  
            steps=steps,  
            step_index=len(steps)-1,  
            current_step=steps[-1],  
            amount=Decimal(random_int(10000, 50000)),  
            status="completed",  
        )  
        db.add(app)  
        db.flush()  
        if product_type in ["motor", "health", "life", "travel", "business"]:  
            policy = Policy(  
                id=f"POL-{3000+i}",  
                client_id=c.id,  
                product_type=product_type,  
                product_label=app.product_label,  
                application_id=app.id,  
                policy_number=f"POL-{4000+i}",  
                start_date=datetime.now(timezone.utc),  
                end_date=datetime.now(timezone.utc)+timedelta(days=365),  
                premium=Decimal(random_int(5000,20000)),  
                sum_assured=Decimal(random_int(500000,2000000)),  
                status="active",  
            )  
            db.add(policy)  
        else:  
            holding = Holding(  
                id=f"HLD-{5000+i}",  
                client_id=c.id,  
                application_id=app.id,  
                product_type=product_type,  
                product_label=app.product_label,  
                holding_type="loan-account",  
                status="active",  
                details={"monthly_payment": 1000.00},  # JSON-safe float  
            )  
            db.add(holding)  
        db.flush()  
        update_client_lifecycle_state(db, c.id)  
  
    # Demo application and policy  
    demo_app = Application(  
        id="APP-9999",  
        client_id="c1",  
        product_type="motor",  
        product_label="Motor Insurance",  
        department="motor",  
        steps=get_workflow("motor", "application"),  
        step_index=len(get_workflow("motor", "application"))-1,  
        current_step="Policy Issued",  
        amount=Decimal(150000),  
        status="completed",  
    )  
    db.add(demo_app)  
    db.flush()  
  
    demo_policy = Policy(  
        id="POL-9999",  
        client_id="c1",  
        product_type="motor",  
        product_label="Motor Insurance",  
        application_id="APP-9999",  
        policy_number="POL-999999",  
        start_date=datetime.now(timezone.utc),  
        end_date=datetime.now(timezone.utc)+timedelta(days=365),  
        premium=Decimal(15000),  
        sum_assured=Decimal(1500000),  
        status="active",  
    )  
    db.add(demo_policy)  
    db.flush()  
    update_client_lifecycle_state(db, "c1")  
  
    # Demo claim  
    claim = Claim(  
        id="CLM-5001",  
        client_id="c1",  
        product_type="motor",  
        product_label="Motor Insurance",  
        policy_id="POL-9999",  
        type="Accident",  
        amount=Decimal(50000),  
        current_step="Event Reported",  
        step_index=0,  
        steps=CLAIM_STEPS.copy(),  
        incident_date=datetime.now(timezone.utc)-timedelta(days=5),  
        description="Vehicle damage claim",  
        severity="Standard",  
        reserve_amount=Decimal(50000),  
    )  
    db.add(claim)  
    db.flush()  
    update_client_lifecycle_state(db, "c1")  
  
    if commit:  
        db.commit()  
    else:  
        db.flush()
