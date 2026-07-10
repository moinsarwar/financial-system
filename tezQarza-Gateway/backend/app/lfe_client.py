import httpx
from typing import Dict, Any, List
from .config import settings

class LfeClient:
    def __init__(self):
        self.base_url = settings.LFE_BASE_URL
        self.api_key = settings.LFE_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def submit_application(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {
            **self.headers,
            "Idempotency-Key": payload.get("ref", "")
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/applications/intake",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    async def check_eligibility(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{self.base_url}/eligibility/check",
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_products(self) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.base_url}/products/available",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.base_url}/dashboard/stats",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

# Mock client for demonstration (deterministic)
class MockLfeClient(LfeClient):
    async def submit_application(self, payload):
        import hashlib
        cnic = payload.get("cnic", "")
        seed = sum(ord(c) for c in cnic) if cnic else 0
        score = 520 + (seed % 280)
        if score >= 720:
            decision = "approved"
        elif score >= 620:
            decision = "review"
        else:
            decision = "rejected"
        route = "SME Lending Route" if payload.get("product_type") == "business" else "Personal Lending Route"
        return {
            "lfe_application_id": f"LFE-{hashlib.md5(cnic.encode()).hexdigest()[:8].upper()}",
            "lfe_decision_id": f"DEC-{hashlib.md5(cnic.encode()).hexdigest()[:8].upper()}",
            "decision": decision,
            "score": score,
            "risk_band": "medium" if score < 700 else "low",
            "route": route,
            "matched_lenders": ["NBFC-01", "Bank-02"] if decision != "rejected" else [],
            "reason_codes": ["DTI within acceptable range", "Income verified"],
            "policy_version": "MOCK_V1.0",
            "audit_id": f"AUD-{hashlib.md5(cnic.encode()).hexdigest()[:8].upper()}"
        }

    async def check_eligibility(self, payload):
        return {"eligible": True, "products": ["Personal Loan", "Salary Advance"]}

    async def get_products(self):
        return [
            {"lfe_product_id": "LFE-PERS-01", "name": "Personal Loan", "icon": "fa-user", "type": "personal",
             "group_name": "Personal Finance", "max_amount": 1500000, "min_tenure": 3, "max_tenure": 12,
             "tag": "Consumer", "ideal": "Salaried professionals", "processing": "2-4 hrs"},
            {"lfe_product_id": "LFE-SME-01", "name": "SME Business Loan", "icon": "fa-building", "type": "business",
             "group_name": "Business Finance", "max_amount": 4000000, "min_tenure": 12, "max_tenure": 60,
             "tag": "Enterprise", "ideal": "SMEs scaling up", "processing": "8-12 hrs"}
        ]

    async def get_dashboard_stats(self):
        return {
            "total_submitted": 45,
            "lfe_accepted": 42,
            "decisions_returned": 40,
            "routed_to_lender": 28,
            "approved_in_principle": 20,
            "rejected": 8,
            "manual_review": 12,
            "avg_lfe_response_time": 1.2,
            "top_rejection_reasons": [{"reason": "DTI too high", "count": 5}],
            "top_product_routes": [{"route": "SME Lending", "count": 15}],
            "lender_match_rate": 75.0
        }

# Use mock for development, real client for production
lfe_client = MockLfeClient() if settings.ENVIRONMENT != "production" else LfeClient()
