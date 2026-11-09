"""Helper library cho Robot Framework: tao / chinh sua JWT va chu ky MoMo.

Duoc su dung boi tests/ui-smoke.robot de kiem thu cac truong hop bao mat
(token het han, sai chu ky, sai issuer/audience, chu ky HMAC-SHA256 cua MoMo).
"""

import hashlib
import hmac
import time

import jwt

JWT_KEY = "MotChuoiBimatRatDaiVaKhoDoanChoHeThongKhachSan2026"
JWT_ISSUER = "HotelApi"
JWT_AUDIENCE = "HotelClients"

CLAIM_ID = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
CLAIM_EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
CLAIM_NAME = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
CLAIM_ROLE = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"


def make_token(user_id=1, email="admin@hotel.com", name="Admin", role="Admin",
               expires_in=7200, issuer=JWT_ISSUER, audience=JWT_AUDIENCE):
    """Tao JWT HS256 hop le (mac dinh han 2 gio)."""
    payload = {
        CLAIM_ID: str(user_id),
        CLAIM_EMAIL: email,
        CLAIM_NAME: name,
        CLAIM_ROLE: role,
        "exp": int(time.time()) + int(expires_in),
        "iss": issuer,
        "aud": audience,
    }
    return jwt.encode(payload, JWT_KEY, algorithm="HS256")


def expired_token(user_id=1, email="admin@hotel.com", name="Admin", role="Admin"):
    """Token da het han 1 gio."""
    return make_token(user_id, email, name, role, expires_in=-3600)


def wrong_issuer_token(user_id=1, email="admin@hotel.com", name="Admin", role="Admin"):
    """Token dung chu ky nhung sai issuer."""
    return make_token(user_id, email, name, role, issuer="EvilIssuer")


def wrong_audience_token(user_id=1, email="admin@hotel.com", name="Admin", role="Admin"):
    """Token dung chu ky nhung sai audience."""
    return make_token(user_id, email, name, role, audience="EvilClients")


def tamper_signature(token):
    """Doi 1 ky tu dau tien cua phan Signature de tao token gia mao."""
    parts = token.split(".")
    if len(parts) != 3:
        return token
    sig = parts[2]
    replacement = "A" if sig[0] != "A" else "B"
    parts[2] = replacement + sig[1:]
    return ".".join(parts)


def decode_payload(token):
    """Doc payload ma khong verify chu ky."""
    return jwt.decode(token, options={"verify_signature": False})


def decode_header(token):
    """Doc header (alg, typ) ma khong verify chu ky."""
    return jwt.get_unverified_header(token)


def momo_create_signature(secret_key, fields):
    """Tinh chu ky HMAC-SHA256 cho /api/Momo/create-payment theo thu tu MoMo."""
    order = [
        "accessKey", "amount", "extraData", "ipnUrl", "orderId", "orderInfo",
        "partnerCode", "redirectUrl", "requestId", "requestType",
    ]
    raw = "&".join("{}={}".format(k, fields.get(k, "")) for k in order)
    return hmac.new(secret_key.encode("utf-8"), raw.encode("utf-8"),
                    hashlib.sha256).hexdigest()


def momo_callback_signature(secret_key, payload):
    """Tinh chu ky HMAC-SHA256 cho /api/Momo/callback theo thu tu MoMo."""
    order = [
        "accessKey", "amount", "extraData", "message", "orderId", "orderInfo",
        "orderType", "partnerCode", "payType", "requestId", "responseTime",
        "resultCode", "transId",
    ]
    raw = "&".join("{}={}".format(k, payload.get(k, "")) for k in order)
    return hmac.new(secret_key.encode("utf-8"), raw.encode("utf-8"),
                    hashlib.sha256).hexdigest()


def hmack(secret_key, raw):
    """Tinh HMAC-SHA256 hex cho mot chuoi raw bat ky."""
    return hmac.new(secret_key.encode("utf-8"), raw.encode("utf-8"),
                    hashlib.sha256).hexdigest()
