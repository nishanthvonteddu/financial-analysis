import base64
import hashlib
import hmac
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from src.config import get_settings

ENCRYPTED_PREFIX = "enc:v1:"


def _key_bytes() -> bytes:
    settings = get_settings()
    configured_key = settings.field_encryption_key
    key_material = configured_key or f"development:{settings.jwt_secret_key}"

    if configured_key:
        try:
            decoded = base64.urlsafe_b64decode(configured_key + "=" * (-len(configured_key) % 4))
            if len(decoded) == 32:
                return decoded
        except ValueError:
            pass

    return hashlib.sha256(key_material.encode("utf-8")).digest()


def encrypt_text(value: str | None) -> str | None:
    if value is None or value.startswith(ENCRYPTED_PREFIX):
        return value

    nonce = os.urandom(12)
    encrypted = AESGCM(_key_bytes()).encrypt(nonce, value.encode("utf-8"), None)
    payload = base64.urlsafe_b64encode(nonce + encrypted).decode("ascii").rstrip("=")
    return f"{ENCRYPTED_PREFIX}{payload}"


def decrypt_text(value: str | None) -> str | None:
    if value is None:
        return None
    if not value.startswith(ENCRYPTED_PREFIX):
        return value

    payload = value.removeprefix(ENCRYPTED_PREFIX)
    encrypted = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
    nonce, ciphertext = encrypted[:12], encrypted[12:]
    return AESGCM(_key_bytes()).decrypt(nonce, ciphertext, None).decode("utf-8")


def blind_index(value: str | None) -> str | None:
    if value is None:
        return None
    return hmac.new(_key_bytes(), value.encode("utf-8"), hashlib.sha256).hexdigest()
