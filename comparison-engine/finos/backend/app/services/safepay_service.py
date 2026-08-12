"""SafePay hosted checkout helpers (sandbox / production)."""
from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import re
from decimal import Decimal
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Canonical product types that require premium payment at submit
PAID_PRODUCT_TYPES = frozenset(
    {
        "motor",
        "health",
        "life",
        "travel",
        "business",
    }
)

# Free / no-charge products at submit
FREE_PRODUCT_TYPES = frozenset(
    {
        "loan",
        "savings",
        "credit",
    }
)

# UI / catalogue aliases → canonical workflow keys
PRODUCT_TYPE_ALIASES = {
    "motor_insurance": "motor",
    "health_insurance": "health",
    "life_insurance": "life",
    "travel_insurance": "travel",
    "business_insurance": "business",
    "personal_loan": "loan",
    "credit_card": "credit",
    "creditcard": "credit",
    "takaful": "life",
    "life_takaful": "life",
    "family_takaful": "life",
}


def normalize_product_type(raw: str | None) -> str:
    if not raw:
        return "motor"
    key = str(raw).strip().lower().replace(" ", "_").replace("-", "_")
    if key in PRODUCT_TYPE_ALIASES:
        return PRODUCT_TYPE_ALIASES[key]
    if "takaful" in key:
        return "life"
    if key in PAID_PRODUCT_TYPES or key in FREE_PRODUCT_TYPES:
        return key
    # Heuristics for free-form catalogue strings
    if "motor" in key or "auto" in key or "car" in key:
        return "motor"
    if "health" in key or "medical" in key:
        return "health"
    if "life" in key:
        return "life"
    if "travel" in key:
        return "travel"
    if "loan" in key:
        return "loan"
    if "saving" in key:
        return "savings"
    if "credit" in key or "card" in key:
        return "credit"
    return key


def requires_payment(product_type: str | None) -> bool:
    canonical = normalize_product_type(product_type)
    if canonical in FREE_PRODUCT_TYPES:
        return False
    if canonical in PAID_PRODUCT_TYPES:
        return True
    # Unknown types: do not charge (safer for savings-like catalogue noise)
    return False


def sandbox_amount() -> Decimal:
    """Last-resort fallback when catalogue has no parseable premium."""
    return Decimal(str(settings.SAFEPAY_AMOUNT_PKR)).quantize(Decimal("0.01"))


# Indicative simulation premiums when catalogue says "varies" / rate-only
_TYPE_DEFAULT_PREMIUM = {
    "motor": Decimal("16000.00"),
    "health": Decimal("25000.00"),
    "life": Decimal("50000.00"),
    "travel": Decimal("8000.00"),
    "business": Decimal("35000.00"),
}

_PREMIUM_KEYS = (
    "premium",
    "annual_premium",
    "annualPremium",
    "annual_cost",
    "annualCost",
    "fee",
    "annual_fee",
    "annualFee",
    "minimum_single_premium",
    "minimumSinglePremium",
    "min_single_premium",
    "starting_premium",
    "startingPremium",
    "base_premium",
    "basePremium",
    "indicative_premium",
    "indicativePremium",
    "min_premium",
    "minimum_premium",
    "minimumPremium",
    "single_premium",
    "singlePremium",
    "monthly_premium",
    "monthlyPremium",
    "monthly_cost",
    "monthlyCost",
)


def parse_money(value: Any) -> Decimal | None:
    """Parse catalogue money fields ('PKR 25,000', 'Rs. 50,000', 25000) → Decimal."""
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01")) if value > 0 else None
    if isinstance(value, (int, float)):
        d = Decimal(str(value))
        return d.quantize(Decimal("0.01")) if d > 0 else None
    text = str(value).strip()
    if not text:
        return None
    lower = text.lower()
    if any(
        token in lower
        for token in (
            "varies",
            "n/a",
            "na",
            "not applicable",
            "no upper",
            "unlimited",
            "of vehicle",
            "of sum",
            "%",
        )
    ):
        # Percent / varies strings are handled separately
        if "%" not in text and "varies" in lower:
            return None
        if "%" in text or "of vehicle" in lower or "of sum" in lower:
            return None
        if any(t in lower for t in ("varies", "n/a", "no upper", "unlimited", "not applicable")):
            return None
    cleaned = (
        text.upper()
        .replace("PKR", "")
        .replace("RS.", "")
        .replace("RS", "")
        .replace(",", "")
        .replace(" ", "")
        .replace("/YEAR", "")
        .replace("/YR", "")
        .replace("/ANNUM", "")
        .replace("/MONTH", "")
        .replace("/MO", "")
    )
    # Keep leading digits / decimal only
    m = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    if not m:
        return None
    try:
        d = Decimal(m.group(1))
    except Exception:
        return None
    return d.quantize(Decimal("0.01")) if d > 0 else None


def parse_percent(value: Any) -> Decimal | None:
    if value is None:
        return None
    text = str(value)
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
    if not m:
        return None
    try:
        return Decimal(m.group(1))
    except Exception:
        return None


def _pricing_dict(product: Any) -> dict:
    if product is None:
        return {}
    if isinstance(product, dict):
        pricing = product.get("pricing") or {}
        return pricing if isinstance(pricing, dict) else {}
    pricing = getattr(product, "pricing", None) or {}
    return pricing if isinstance(pricing, dict) else {}


def _product_type_hint(product: Any) -> str:
    raw = None
    if isinstance(product, dict):
        raw = product.get("type") or product.get("product_type")
    else:
        raw = getattr(product, "product_type", None) or getattr(product, "type", None)
    return normalize_product_type(raw)


def _scan_money_values(obj: Any, *, depth: int = 0) -> list[Decimal]:
    """Collect parseable money amounts from nested pricing / feature blobs."""
    found: list[Decimal] = []
    if depth > 4:
        return found
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = str(k).lower()
            if any(x in key for x in ("coverage", "sum_assured", "sumassured", "max_amount", "limit", "benefit", "death")):
                # coverage-ish — skip for premium scan
                continue
            found.extend(_scan_money_values(v, depth=depth + 1))
    elif isinstance(obj, (list, tuple)):
        for item in obj:
            found.extend(_scan_money_values(item, depth=depth + 1))
    else:
        parsed = parse_money(obj)
        if parsed is not None and parsed >= Decimal("500"):  # ignore tiny noise
            found.append(parsed)
    return found


def resolve_premium_pkr(product: Any, *, fallback: Decimal | None = None) -> Decimal:
    """
    Resolve chargeable premium (PKR) from submit payload / front_products pricing.
    Handles annual/monthly fees, minimum_single_premium, rate×vehicle, and type defaults.
    """
    pricing = _pricing_dict(product)
    ptype = _product_type_hint(product)
    freq = str(
        pricing.get("frequency")
        or (product.get("frequency") if isinstance(product, dict) else "")
        or pricing.get("premium_mode")
        or ""
    ).lower()

    monthly_keys = {
        "monthly_premium",
        "monthlyPremium",
        "monthly_cost",
        "monthlyCost",
    }

    ordered_sources: list[tuple[str, Any]] = []
    if isinstance(product, dict):
        for key in _PREMIUM_KEYS:
            if product.get(key) is not None:
                ordered_sources.append((key, product.get(key)))
    for key in _PREMIUM_KEYS:
        if pricing.get(key) is not None:
            ordered_sources.append((key, pricing.get(key)))

    for key, raw in ordered_sources:
        parsed = parse_money(raw)
        if parsed is None:
            continue
        hint = key.lower()
        if hint in monthly_keys or (
            "month" in freq
            and "single" not in freq
            and hint in {"fee", "premium"}
        ):
            return (parsed * Decimal("12")).quantize(Decimal("0.01"))
        return parsed

    # Rate-based motor (e.g. "2.3% of vehicle value")
    rate = parse_percent(
        pricing.get("premium_rate")
        or pricing.get("premiumRate")
        or (product.get("premiumRate") if isinstance(product, dict) else None)
        or (product.get("premium_rate") if isinstance(product, dict) else None)
    )
    if rate is not None:
        coverage = resolve_coverage_pkr(product, premium=None, _skip_premium_fallback=True)
        base = coverage if coverage and coverage > 0 else Decimal("1000000.00")
        return (base * rate / Decimal("100")).quantize(Decimal("0.01"))

    # Deep scan pricing blob for Rs. amounts (e.g. minimum_single_premium)
    scanned = _scan_money_values(pricing)
    if scanned:
        return min(scanned)

    # Features sometimes embed "minimum Rs. 36,000 per annum"
    features = []
    if isinstance(product, dict):
        features = product.get("features") or []
    scanned_feat = _scan_money_values(features)
    if scanned_feat:
        return min(scanned_feat)

    type_default = _TYPE_DEFAULT_PREMIUM.get(ptype)
    if type_default is not None:
        return type_default

    return (fallback if fallback is not None else sandbox_amount()).quantize(Decimal("0.01"))


def resolve_coverage_pkr(
    product: Any,
    *,
    premium: Decimal | None = None,
    _skip_premium_fallback: bool = False,
) -> Decimal:
    """Coverage / sum assured for policy issuance."""
    pricing = _pricing_dict(product)
    candidates: list[Any] = []
    if isinstance(product, dict):
        candidates.extend(
            [
                product.get("coverage"),
                product.get("sum_assured"),
                product.get("sumAssured"),
                product.get("sumInsured"),
                product.get("coverageLimit"),
                product.get("coverage_limit"),
                product.get("vehicleValue"),
            ]
        )
    candidates.extend(
        [
            pricing.get("coverage_limit"),
            pricing.get("coverageLimit"),
            pricing.get("sum_assured"),
            pricing.get("sumAssured"),
            pricing.get("max_amount"),
            pricing.get("maxAmount"),
            pricing.get("vehicle_value"),
            pricing.get("vehicleValue"),
        ]
    )
    for raw in candidates:
        parsed = parse_money(raw)
        if parsed is not None:
            return parsed

    if _skip_premium_fallback:
        return Decimal("0")

    base = premium if premium is not None else sandbox_amount()
    return (base * Decimal("10")).quantize(Decimal("0.01"))


def _api_base() -> str:
    base = (settings.SAFEPAY_API_BASE or "").rstrip("/")
    if base:
        return base
    if str(settings.SAFEPAY_ENV).lower() == "production":
        return "https://api.getsafepay.com"
    return "https://sandbox.api.getsafepay.com"


def _env_name() -> str:
    return "production" if str(settings.SAFEPAY_ENV).lower() == "production" else "sandbox"


def _secret_key() -> str:
    return (settings.SAFEPAY_SECRET_KEY or settings.SAFEPAY_API_SECRET or "").strip()


def _auth_headers() -> dict[str, str]:
    """Express Checkout APIs use secret auth via X-SFPY-MERCHANT-SECRET."""
    secret = _secret_key()
    if not secret:
        raise RuntimeError("SAFEPAY_SECRET_KEY is not configured")
    return {
        "X-SFPY-MERCHANT-SECRET": secret,
        "Content-Type": "application/json",
    }


def create_checkout(
    *,
    order_id: str,
    amount: Decimal,
    success_url: str,
    cancel_url: str,
) -> dict[str, str]:
    """Create SafePay Express Checkout URL (embedded / hosted).

    Flow matches Safepay docs:
    1) POST /order/payments/v3/ → tracker
    2) POST /client/passport/v1/token → tbt
    3) Redirect to /embedded?environment=&tracker=&tbt=&source=hosted&...
    """
    if not settings.SAFEPAY_API_KEY:
        raise RuntimeError("SAFEPAY_API_KEY is not configured")
    if not _secret_key():
        raise RuntimeError("SAFEPAY_SECRET_KEY is not configured (required for embedded checkout)")

    tracker = _create_payment_tracker(
        amount=amount,
        currency=settings.SAFEPAY_CURRENCY or "PKR",
        order_id=order_id,
    )
    tbt = _create_passport_token()

    params = {
        "environment": _env_name(),
        "tracker": tracker,
        "tbt": tbt,
        "source": "hosted",
        "redirect_url": success_url,
        "cancel_url": cancel_url,
        "webhooks": "true",
    }
    redirect_url = f"{_api_base()}/embedded?{urlencode(params)}"
    return {"tracker": tracker, "redirect_url": redirect_url}


def _create_payment_tracker(*, amount: Decimal, currency: str, order_id: str) -> str:
    """Create Express Checkout payment session; amount in lowest denomination (paisa)."""
    base = _api_base()
    amount_paisa = int((amount * 100).quantize(Decimal("1")))
    payload = {
        "merchant_api_key": settings.SAFEPAY_API_KEY,
        "intent": "CYBERSOURCE",
        "mode": "payment",
        "currency": currency,
        "amount": amount_paisa,
        "metadata": {"order_id": order_id},
        "include_fees": False,
    }

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{base}/order/payments/v3/",
            headers=_auth_headers(),
            json=payload,
        )
        if not resp.is_success:
            # Fallback: legacy init (may not support embedded UI)
            logger.warning(
                "SafePay v3 payment session failed status=%s body=%s — trying legacy init",
                resp.status_code,
                resp.text[:500],
            )
            return _create_tracker_legacy(amount=amount, currency=currency)

        token = _extract_tracker_token(resp.json())
        if not token:
            raise RuntimeError("SafePay v3 response missing tracker.token")
        return token


def _create_tracker_legacy(*, amount: Decimal, currency: str) -> str:
    base = _api_base()
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{base}/order/v1/init",
            headers={"Content-Type": "application/json"},
            json={
                "client": settings.SAFEPAY_API_KEY,
                "amount": float(amount),
                "currency": currency,
                "environment": _env_name(),
            },
        )
        if not resp.is_success:
            raise RuntimeError(
                f"SafePay init failed ({resp.status_code}): {resp.text[:400]}"
            )
        token = _extract_tracker_token(resp.json())
        if not token:
            raise RuntimeError("SafePay init response missing tracker token")
        return token


def _create_passport_token() -> str:
    """POST /client/passport/v1/token → short-lived TBT for /embedded checkout."""
    base = _api_base()
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            f"{base}/client/passport/v1/token",
            headers=_auth_headers(),
            json={},
        )
        if not resp.is_success:
            raise RuntimeError(
                f"SafePay passport/tbt failed ({resp.status_code}): {resp.text[:400]}"
            )
        body = resp.json()
        # Docs: { "data": "<token-string>" }
        data = body.get("data") if isinstance(body, dict) else None
        if isinstance(data, str) and data.strip():
            return data.strip()
        if isinstance(data, dict):
            for key in ("token", "tbt", "passport"):
                if data.get(key):
                    return str(data[key])
        raise RuntimeError("SafePay passport response missing token")


def _extract_tracker_token(payload: Any) -> str | None:
    if not isinstance(payload, dict):
        return None
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    if not isinstance(data, dict):
        return None
    # Express: data.tracker.token
    tracker_obj = data.get("tracker")
    if isinstance(tracker_obj, dict) and tracker_obj.get("token"):
        return str(tracker_obj["token"])
    if isinstance(tracker_obj, str) and tracker_obj:
        return tracker_obj
    for key in ("token", "tracker", "beacon"):
        val = data.get(key)
        if isinstance(val, str) and val:
            return val
        if isinstance(val, dict) and val.get("token"):
            return str(val["token"])
    return None


def _extract_token(payload: Any) -> str | None:
    """Backward-compatible alias."""
    return _extract_tracker_token(payload)

def fetch_payment_state(tracker: str) -> str | None:
    """GET /reporter/api/v1/payments/{tracker} → tracker.state (e.g. TRACKER_ENDED)."""
    if not tracker:
        return None
    base = _api_base()
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(
                f"{base}/reporter/api/v1/payments/{tracker}",
                headers=_auth_headers(),
            )
            if not resp.is_success:
                logger.warning(
                    "SafePay reporter failed status=%s body=%s",
                    resp.status_code,
                    resp.text[:300],
                )
                return None
            body = resp.json()
            data = body.get("data") if isinstance(body, dict) else None
            if not isinstance(data, dict):
                return None
            tracker_obj = data.get("tracker") if isinstance(data.get("tracker"), dict) else data
            state = tracker_obj.get("state") if isinstance(tracker_obj, dict) else None
            return str(state) if state else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("SafePay reporter error: %s", exc)
        return None


def is_tracker_paid(state: str | None) -> bool:
    if not state:
        return False
    return str(state).upper() in {
        "TRACKER_ENDED",
        "PAID",
        "COMPLETED",
        "CAPTURED",
        "SETTLED",
    }


def verify_redirect_sig(tracker: str, signature: str) -> bool:
    """HMAC-SHA256(tracker, secret) for browser redirect authenticity."""
    secret = settings.SAFEPAY_SECRET_KEY or settings.SAFEPAY_WEBHOOK_SECRET
    if not secret or not tracker or not signature:
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        tracker.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected.lower(), signature.lower().removeprefix("sha256="))


def verify_webhook(
    raw_body: bytes,
    signature_header: str | None,
    timestamp_header: str | None = None,
) -> bool:
    """Verify X-SFPY-SIGNATURE against webhook secret.

    Classic Safepay Checkout uses HMAC-SHA512 over the raw JSON body
    (see sfpy-php WebhookSignature). Also accepts SHA256 / Raast timestamp forms.
    """
    secret = settings.SAFEPAY_WEBHOOK_SECRET or settings.SAFEPAY_SECRET_KEY
    if not secret:
        if settings.ENVIRONMENT == "development" and not settings.SAFEPAY_API_KEY:
            return True
        logger.error("SafePay webhook secret not configured")
        return False
    if not signature_header:
        logger.warning("SafePay webhook missing X-SFPY-SIGNATURE")
        return False

    provided = signature_header.strip().lower().removeprefix("sha256=").removeprefix("sha512=")
    secret_keys: list[bytes] = [secret.encode("utf-8")]
    try:
        decoded = base64.b64decode(secret)
        if decoded:
            secret_keys.append(decoded)
    except Exception:  # noqa: BLE001
        pass

    digests: list[str] = []
    for key in secret_keys:
        # Primary: HMAC-SHA512(raw body) — Safepay Checkout / Payments 2.0
        digests.append(hmac.new(key, raw_body, hashlib.sha512).hexdigest())
        digests.append(hmac.new(key, raw_body, hashlib.sha256).hexdigest())
        if timestamp_header:
            for algo in (hashlib.sha512, hashlib.sha256):
                mac = hmac.new(key, digestmod=algo)
                mac.update(timestamp_header.encode("utf-8"))
                mac.update(b".")
                mac.update(raw_body)
                digests.append(mac.hexdigest())

    for digest in digests:
        if hmac.compare_digest(provided, digest.lower()):
            return True
    logger.warning(
        "SafePay webhook signature mismatch (len_body=%s sig_len=%s has_ts=%s)",
        len(raw_body),
        len(provided),
        bool(timestamp_header),
    )
    return False


def parse_webhook_event(payload: dict[str, Any]) -> dict[str, Any]:
    """Normalize SafePay webhook JSON into {tracker, state, event_type, paid}."""
    notification = payload.get("notification") if isinstance(payload.get("notification"), dict) else {}
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}

    tracker = (
        notification.get("tracker")
        or data.get("tracker")
        or payload.get("tracker")
        or data.get("token")
        or payload.get("token")
    )
    state = str(
        notification.get("state")
        or data.get("state")
        or payload.get("state")
        or ""
    ).upper()
    event_type = str(payload.get("type") or payload.get("event") or "").lower()

    paid_markers = (
        "payment.succeeded",
        "payment.completed",
        "payment:succeeded",
        "payment:completed",
        "payment:paid",
    )
    paid = state in {
        "PAID",
        "COMPLETED",
        "CAPTURED",
        "SETTLED",
        "TRACKER_ENDED",
    } or any(m in event_type for m in paid_markers)
    failed = state in {"FAILED", "CANCELLED", "CANCELED", "REJECTED", "VOIDED"} or any(
        x in event_type for x in ("payment.failed", "payment:failed", "payment.rejected")
    )

    return {
        "tracker": str(tracker) if tracker else None,
        "state": state,
        "event_type": event_type,
        "paid": paid,
        "failed": failed and not paid,
        "raw": payload,
    }
