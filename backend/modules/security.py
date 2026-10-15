# PharmaBid AI - Enterprise Security & Auth Module
import os
import hashlib
import hmac
import secrets
import time
import base64
import json
from typing import Optional, Dict, Any

# Secure persistent key loading
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
SECRET_KEY = os.environ.get("PHARMABID_SECRET_KEY")

if not SECRET_KEY and os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("SECRET_KEY=") and not line.startswith("#"):
                val = line.split("=", 1)[1].strip()
                if val and val != "change-this-to-a-secure-random-secret-key-in-production":
                    SECRET_KEY = val
                break

KEY_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", ".secret_key")
if not SECRET_KEY:
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r", encoding="utf-8") as f:
            SECRET_KEY = f.read().strip()
    else:
        SECRET_KEY = secrets.token_hex(32)
        os.makedirs(os.path.dirname(KEY_FILE), exist_ok=True)
        with open(KEY_FILE, "w", encoding="utf-8") as f:
            f.write(SECRET_KEY)

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations=100_000
    ).hex()
    return pw_hash, salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    pw_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(pw_hash, stored_hash)

def create_access_token(user_data: Dict[str, Any], expires_in_sec: int = 86400) -> str:
    payload = {
        **user_data,
        "exp": int(time.time()) + expires_in_sec,
        "iat": int(time.time()),
        "nonce": secrets.token_hex(8)
    }
    header = {"alg": "HS256", "typ": "JWT"}
    hdr_b64 = base64.urlsafe_b64encode(json.dumps(header).encode('utf-8')).decode('utf-8').rstrip("=")
    pay_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8').rstrip("=")
    signing_input = f"{hdr_b64}.{pay_b64}"
    sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip("=")
    return f"{signing_input}.{sig_b64}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        hdr_b64, pay_b64, sig_b64 = parts
        signing_input = f"{hdr_b64}.{pay_b64}"
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
        
        # pad base64
        rem = len(sig_b64) % 4
        padded_sig = sig_b64 + ("=" * (4 - rem) if rem else "")
        actual_sig = base64.urlsafe_b64decode(padded_sig.encode('utf-8'))
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        rem_pay = len(pay_b64) % 4
        padded_pay = pay_b64 + ("=" * (4 - rem_pay) if rem_pay else "")
        payload = json.loads(base64.urlsafe_b64decode(padded_pay.encode('utf-8')).decode('utf-8'))
        
        if payload.get("exp", 0) < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None
