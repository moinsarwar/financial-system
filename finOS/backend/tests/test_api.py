from sqlalchemy import select
from decimal import Decimal

from app.models.application import Application
from app.models.client import Client, LifecycleStage
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.audit_log import AuditLog
  
def auth_header(token: str) -> dict:  
    return {"Authorization": f"Bearer {token}"}  
  
def test_health(api_client):  
    r = api_client.get("/health")  
    assert r.status_code == 200  
    assert r.json() == {"status": "ok"}  
  
def test_login_success(api_client):  
    r = api_client.post("/api/auth/login", json={"email": "client@finos.com", "password": "password123"})  
    assert r.status_code == 200  
    assert "access_token" in r.json()  
  
def test_login_failure_audited(api_client):  
    r = api_client.post("/api/auth/login", json={"email": "client@finos.com", "password": "wrong"})  
    assert r.status_code == 401  
    # Audit entry should exist – we can check via activity endpoint (requires admin)  
    # This test just ensures no exception.  
  
def test_admin_can_create_client(api_client, admin_token):  
    r = api_client.post("/api/clients", headers=auth_header(admin_token),  
                        json={"name": "Test", "email": "new@example.com", "phone": "123",  
                              "assigned_department": "lending"})  
    assert r.status_code == 200  
    assert r.json()["name"] == "Test"  
  
def test_duplicate_email_returns_409(api_client, admin_token):  
    api_client.post("/api/clients", headers=auth_header(admin_token),  
                    json={"name": "Dup", "email": "dup@example.com", "phone": "123",  
                          "assigned_department": "lending"})  
    r = api_client.post("/api/clients", headers=auth_header(admin_token),  
                        json={"name": "Dup2", "email": "dup@example.com", "phone": "456",  
                              "assigned_department": "lending"})  
    assert r.status_code == 409  
  
def test_client_cannot_read_another_client(api_client, db_session, client_token):  
    other = Client(id="test-other", name="Other", email="other@example.com", assigned_department="lending")  
    db_session.add(other)  
    db_session.flush()  
    r = api_client.get("/api/clients/test-other", headers=auth_header(client_token))  
    assert r.status_code == 404  
  
def test_application_workflow(api_client, admin_token):  
    # create client  
    r = api_client.post("/api/clients", headers=auth_header(admin_token),  
                        json={"name": "App Client", "email": "app@example.com", "phone": "123",  
                              "assigned_department": "loan"})  
    cid = r.json()["id"]  
    # create app  
    r = api_client.post("/api/applications", headers=auth_header(admin_token),  
                        json={"client_id": cid, "product_type": "loan", "amount": "50000"})  
    assert r.status_code == 200  
    aid = r.json()["id"]  
    # advance  
    r = api_client.post(f"/api/applications/{aid}/advance", headers=auth_header(admin_token))  
    assert r.status_code == 200  
    assert r.json()["step_index"] == 1  
  
def test_completed_application_creates_product(api_client, db_session, admin_token):  
    r = api_client.post("/api/clients", headers=auth_header(admin_token),  
                        json={"name": "Complete", "email": "complete@example.com", "phone": "123",  
                              "assigned_department": "motor"})  
    cid = r.json()["id"]  
    r = api_client.post("/api/applications", headers=auth_header(admin_token),  
                        json={"client_id": cid, "product_type": "motor", "amount": "100000"})  
    aid = r.json()["id"]  
    app = db_session.query(Application).filter(Application.id == aid).first()  
    for _ in range(len(app.steps)-1):  
        r = api_client.post(f"/api/applications/{aid}/advance", headers=auth_header(admin_token))  
        assert r.status_code == 200  
    policies = db_session.query(Policy).filter(Policy.application_id == aid).all()  
    assert len(policies) == 1  
    # Client should now be customer  
    client = db_session.query(Client).filter(Client.id == cid).first()  
    assert client.lifecycle_stage == "customer"  
  
def test_claim_list_contains_client_name(api_client, admin_token):  
    r = api_client.get("/api/claims", headers=auth_header(admin_token))  
    assert r.status_code == 200  
    claims = r.json()  
    assert claims  
    assert "client_name" in claims[0]  
  
def test_claim_creation_updates_open_claim(api_client, db_session, admin_token):  
    # Create client and policy  
    r = api_client.post("/api/clients", headers=auth_header(admin_token),  
                        json={"name": "Claim Client", "email": "claim@example.com", "phone": "123",  
                              "assigned_department": "motor"})  
    cid = r.json()["id"]  
    r = api_client.post("/api/applications", headers=auth_header(admin_token),  
                        json={"client_id": cid, "product_type": "motor", "amount": "50000"})  
    aid = r.json()["id"]  
    app = db_session.query(Application).filter(Application.id == aid).first()  
    for _ in range(len(app.steps)-1):  
        r = api_client.post(f"/api/applications/{aid}/advance", headers=auth_header(admin_token))  
    policy = db_session.query(Policy).filter(Policy.application_id == aid).first()  
    # Create claim  
    r = api_client.post("/api/claims", headers=auth_header(admin_token),  
                        json={"client_id": cid, "policy_id": policy.id, "type": "Accident",  
                              "amount": "10000", "description": "Test"})  
    assert r.status_code == 200  
    client = db_session.query(Client).filter(Client.id == cid).first()  
    assert client.has_open_claim is True  
    # Resolve claim  
    claim = db_session.query(Claim).filter(Claim.client_id == cid).first()  
    # Advance to Decision Advised  
    for _ in range(4):  
        r = api_client.post(f"/api/claims/{claim.id}/advance", headers=auth_header(admin_token))  
    # Resolve  
    r = api_client.post(f"/api/claims/{claim.id}/resolve", headers=auth_header(admin_token),  
                        json={"outcome": "Payment Confirmed", "reason_code": "valid", "notes": "Approved"})  
    assert r.status_code == 200  
    db_session.refresh(client)  
    assert client.has_open_claim is False

def test_failed_login_is_persisted(
    api_client,
    db_session,
):
    response = api_client.post(
        "/api/auth/login",
        json={
            "email": "client@finos.com",
            "password": "incorrect-password",
        },
    )

    assert response.status_code == 401

    db_session.expire_all()

    audit_entry = db_session.execute(
        select(AuditLog).where(
            AuditLog.event == "login.failed",
        )
    ).scalar_one_or_none()

    assert audit_entry is not None
    assert "client@finos.com" in audit_entry.details

def test_declined_application_recalculates_lifecycle(
    api_client,
    admin_token,
    db_session,
):
    headers = auth_header(
        admin_token,
    )

    client_response = api_client.post(
        "/api/clients",
        headers=headers,
        json={
            "name": "Decision Client",
            "email": "decision@example.com",
            "phone": "03000000000",
            "assigned_department": "lending",
        },
    )

    assert client_response.status_code == 200

    client_id = client_response.json()["id"]

    application_response = api_client.post(
        "/api/applications",
        headers=headers,
        json={
            "client_id": client_id,
            "product_type": "loan",
            "amount": "50000.00",
        },
    )

    assert application_response.status_code == 200

    application_id = application_response.json()["id"]

    decision_response = api_client.post(
        f"/api/applications/{application_id}/decision",
        headers=headers,
        json={
            "outcome": "declined",
            "reason_code": "criteria_not_met",
            "notes": "Applicant did not meet the configured criteria.",
        },
    )

    assert decision_response.status_code == 200
    assert decision_response.json()["status"] == "declined"

    db_session.expire_all()

    client = (
        db_session.query(Client)
        .filter(Client.id == client_id)
        .first()
    )

    assert client is not None
    assert client.lifecycle_stage == LifecycleStage.LEAD

def test_underwriter_can_decide_application(
    api_client,
    admin_token,
    underwriter_token,
):
    admin_headers = auth_header(
        admin_token,
    )

    underwriter_headers = auth_header(
        underwriter_token,
    )

    client_response = api_client.post(
        "/api/clients",
        headers=admin_headers,
        json={
            "name": "Underwriter Client",
            "email": "underwriter-client@example.com",
            "phone": "03000000001",
            "assigned_department": "lending",
        },
    )

    client_id = client_response.json()["id"]

    application_response = api_client.post(
        "/api/applications",
        headers=admin_headers,
        json={
            "client_id": client_id,
            "product_type": "loan",
            "amount": "75000.00",
        },
    )

    application_id = application_response.json()["id"]

    decision_response = api_client.post(
        f"/api/applications/{application_id}/decision",
        headers=underwriter_headers,
        json={
            "outcome": "declined",
            "reason_code": "underwriting_threshold",
            "notes": "Underwriting threshold was not satisfied.",
        },
    )

    assert decision_response.status_code == 200
    assert (
        decision_response.json()["decision_reason_code"]
        == "underwriting_threshold"
    )

def test_document_upload_stores_checksum_and_downloads(
    api_client,
    admin_token,
):
    headers = auth_header(
        admin_token,
    )

    content = b"%PDF-1.4 test document content"

    response = api_client.post(
        "/api/documents/upload",
        headers=headers,
        data={
            "client_id": "c1",
            "name": "Test PDF",
            "doc_type": "General",
        },
        files={
            "file": (
                "test.pdf",
                content,
                "application/pdf",
            ),
        },
    )

    assert response.status_code == 200

    payload = response.json()

    assert payload["original_filename"] == "test.pdf"
    assert payload["checksum"]
    assert payload["storage_key"]

    document_id = payload["id"]

    download_response = api_client.get(
        f"/api/documents/{document_id}/download",
        headers=headers,
    )

    assert download_response.status_code == 200
    assert download_response.content == content
